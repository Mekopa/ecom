import { sdk } from "@lib/config"
import { getCacheOptions } from "@lib/data/cookies"
import { listBrandTags } from "@lib/data/tags"
import { getBrandDisplayName, getBrandSlug, BrandTag } from "@lib/util/brand-helpers"

export type BrandItem = {
  slug: string
  label: string
  tagId: string
}

export type ResolvedBrandFilter = {
  brandItems: BrandItem[]
  selectedBrandSlugs: string[]
  selectedTagIds: string[]
}

/**
 * Fetches the set of brand tag IDs that appear on products
 * matching the given category or collection filter.
 */
async function getRelevantBrandTagIds(options: {
  categoryId?: string
  collectionId?: string
}): Promise<Set<string>> {
  const next = { ...(await getCacheOptions("products")) }

  const query: Record<string, unknown> = {
    limit: 100,
    fields: "id,tags.id",
  }

  if (options.categoryId) {
    query["category_id"] = [options.categoryId]
  }
  if (options.collectionId) {
    query["collection_id"] = [options.collectionId]
  }

  const { products } = await sdk.client.fetch<{
    products: { id: string; tags?: { id: string }[] }[]
  }>("/store/products", {
    method: "GET",
    query,
    next,
    cache: "force-cache",
  })

  const tagIds = new Set<string>()
  for (const product of products) {
    for (const tag of product.tags ?? []) {
      tagIds.add(tag.id)
    }
  }
  return tagIds
}

/**
 * Resolves the `?brand=apple&brand=samsung` search param into
 * a full brand list + selected tag IDs for API filtering.
 *
 * When `categoryId` or `collectionId` is provided, only brands
 * that have products in that context are returned.
 */
export async function resolveBrandFilter(
  brandParam: string | string[] | undefined,
  options?: { categoryId?: string; collectionId?: string }
): Promise<ResolvedBrandFilter> {
  const [brands, relevantTagIds] = await Promise.all([
    listBrandTags(),
    options?.categoryId || options?.collectionId
      ? getRelevantBrandTagIds(options)
      : null,
  ])

  const filteredBrands = relevantTagIds
    ? brands.filter((b) => relevantTagIds.has(b.id))
    : brands

  const brandItems: BrandItem[] = filteredBrands
    .map((tag) => ({
      slug: getBrandSlug(tag),
      label: getBrandDisplayName(tag),
      tagId: tag.id,
    }))
    .sort((a, b) => a.label.localeCompare(b.label))

  const selectedBrandSlugs = !brandParam
    ? []
    : Array.isArray(brandParam)
      ? brandParam
      : [brandParam]

  const slugToTag = new Map<string, BrandTag>(
    brands.map((t) => [getBrandSlug(t), t])
  )

  const selectedTagIds = selectedBrandSlugs
    .map((slug) => slugToTag.get(slug)?.id)
    .filter(Boolean) as string[]

  return { brandItems, selectedBrandSlugs, selectedTagIds }
}
