import { Metadata } from "next"
import { notFound } from "next/navigation"

import { STORE_NAME } from "@lib/constants"
import { listBrandTags, getBrandTagBySlug } from "@lib/data/tags"
import { getBrandDisplayName, getBrandSlug } from "@lib/util/brand-helpers"
import { listRegions } from "@lib/data/regions"
import { StoreRegion } from "@medusajs/types"
import BrandTemplate from "@modules/brands/templates"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"

type Props = {
  params: Promise<{ handle: string; countryCode: string }>
  searchParams: Promise<{
    page?: string
    sortBy?: SortOptions
  }>
}

export async function generateStaticParams() {
  const brands = await listBrandTags()

  if (!brands.length) {
    return []
  }

  const countryCodes = await listRegions().then(
    (regions: StoreRegion[]) =>
      regions
        ?.map((r) => r.countries?.map((c) => c.iso_2))
        .flat()
        .filter(Boolean) as string[]
  )

  const brandSlugs = brands.map((b) => getBrandSlug(b))

  return countryCodes
    .map((countryCode) =>
      brandSlugs.map((handle) => ({ countryCode, handle }))
    )
    .flat()
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
  const brand = await getBrandTagBySlug(params.handle)

  if (!brand) {
    notFound()
  }

  const displayName = getBrandDisplayName(brand)

  return {
    title: `${displayName} | ${STORE_NAME}`,
    description: `Browse ${displayName} products`,
  }
}

export default async function BrandPage(props: Props) {
  const searchParams = await props.searchParams
  const params = await props.params
  const { sortBy, page } = searchParams

  const brand = await getBrandTagBySlug(params.handle)

  if (!brand) {
    notFound()
  }

  return (
    <BrandTemplate
      brand={brand}
      page={page}
      sortBy={sortBy}
      countryCode={params.countryCode}
    />
  )
}
