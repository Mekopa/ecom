import { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import { listBrandTags } from "@lib/data/tags"
import { getBrandDisplayName, getBrandSlug } from "@lib/util/brand-helpers"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

export const metadata: Metadata = {
  title: "Brands",
  description: "Browse all brands.",
}

export default async function BrandsPage() {
  const t = await getTranslations("brands")
  const brands = await listBrandTags()

  const sorted = brands
    .map((tag) => ({
      slug: getBrandSlug(tag),
      name: getBrandDisplayName(tag),
    }))
    .sort((a, b) => a.name.localeCompare(b.name))

  return (
    <div className="py-6 pb-16 small:pb-24 content-container">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-ui-fg-base">
          {t("title")}
        </h1>
        <p className="text-ui-fg-subtle text-base mt-2">
          {t("subtitle")}
        </p>
      </div>
      <div className="grid grid-cols-2 small:grid-cols-3 medium:grid-cols-4 gap-4">
        {sorted.map((brand) => (
          <LocalizedClientLink
            key={brand.slug}
            href={`/brands/${brand.slug}`}
            className="group flex items-center justify-center p-6 rounded-xl border border-ui-border-base bg-ui-bg-subtle hover:bg-ui-bg-subtle-hover hover:border-ui-border-strong transition-all text-center"
          >
            <span className="text-base font-medium text-ui-fg-base group-hover:text-ui-fg-interactive transition-colors">
              {brand.name}
            </span>
          </LocalizedClientLink>
        ))}
      </div>
    </div>
  )
}
