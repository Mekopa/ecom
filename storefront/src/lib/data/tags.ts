"use server"

import { sdk } from "@lib/config"
import { getCacheOptions } from "./cookies"

import type { BrandTag } from "@lib/util/brand-helpers"

type ProductTagResponse = {
  product_tags: BrandTag[]
  count: number
}

export const listBrandTags = async (): Promise<BrandTag[]> => {
  const next = {
    ...(await getCacheOptions("product_tags")),
  }

  const { product_tags } = await sdk.client.fetch<ProductTagResponse>(
    "/store/product-tags",
    {
      query: { limit: 100 },
      next,
      cache: "force-cache",
    }
  )

  return product_tags.filter(
    (tag) => tag.metadata?.type === "brand"
  )
}

export const getBrandTagBySlug = async (
  slug: string
): Promise<BrandTag | undefined> => {
  const brands = await listBrandTags()
  return brands.find((b) => b.metadata?.slug === slug)
}

export const searchBrandTags = async (
  query: string
): Promise<BrandTag[]> => {
  const brands = await listBrandTags()
  const lower = query.toLowerCase()
  return brands.filter(
    (b) =>
      b.metadata?.display_name?.toLowerCase().includes(lower) ||
      b.value.toLowerCase().includes(lower)
  )
}
