export type BrandTag = {
  id: string
  value: string
  metadata: {
    type: "brand"
    display_name: string
    slug: string
  } | null
}

export const getBrandDisplayName = (tag: BrandTag): string => {
  return tag.metadata?.display_name || tag.value.replace("brand:", "")
}

export const getBrandSlug = (tag: BrandTag): string => {
  return tag.metadata?.slug || tag.value.replace("brand:", "").toLowerCase()
}
