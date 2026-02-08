import { Suspense } from "react"
import { getTranslations } from "next-intl/server"

import SkeletonProductGrid from "@modules/skeletons/templates/skeleton-product-grid"
import RefinementList from "@modules/store/components/refinement-list"
import MobileSortDrawer from "@modules/store/components/mobile-sort-drawer"
import BrandPills from "@modules/store/components/brand-pills"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import { resolveBrandFilter } from "@lib/util/resolve-brand-tags"

import PaginatedProducts from "./paginated-products"

const StoreTemplate = async ({
  sortBy,
  page,
  countryCode,
  brand,
}: {
  sortBy?: SortOptions
  page?: string
  countryCode: string
  brand?: string | string[]
}) => {
  const t = await getTranslations("store")
  const pageNumber = page ? parseInt(page) : 1
  const sort = sortBy || "created_at"

  const { brandItems, selectedBrandSlugs, selectedTagIds } =
    await resolveBrandFilter(brand)

  return (
    <div
      className="flex flex-col small:flex-row small:items-start py-6 pb-16 small:pb-24 content-container"
      data-testid="category-container"
    >
      <RefinementList sortBy={sort} />
      <div className="w-full">
        <div className="mb-8 text-2xl-semi">
          <h1 data-testid="store-page-title">{t("allProducts")}</h1>
        </div>
        {brandItems.length > 0 && (
          <div className="mb-8">
            <BrandPills brands={brandItems} selectedBrands={selectedBrandSlugs} />
          </div>
        )}
        <MobileSortDrawer sortBy={sort} />
        <Suspense fallback={<SkeletonProductGrid />}>
          <PaginatedProducts
            sortBy={sort}
            page={pageNumber}
            countryCode={countryCode}
            tagIds={selectedTagIds}
          />
        </Suspense>
      </div>
    </div>
  )
}

export default StoreTemplate
