import { Suspense } from "react"

import SkeletonProductGrid from "@modules/skeletons/templates/skeleton-product-grid"
import RefinementList from "@modules/store/components/refinement-list"
import MobileSortDrawer from "@modules/store/components/mobile-sort-drawer"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import PaginatedProducts from "@modules/store/templates/paginated-products"
import { BrandTag, getBrandDisplayName } from "@lib/util/brand-helpers"

export default function BrandTemplate({
  sortBy,
  brand,
  page,
  countryCode,
}: {
  sortBy?: SortOptions
  brand: BrandTag
  page?: string
  countryCode: string
}) {
  const pageNumber = page ? parseInt(page) : 1
  const sort = sortBy || "created_at"
  const displayName = getBrandDisplayName(brand)

  return (
    <div className="flex flex-col small:flex-row small:items-start py-6 pb-16 small:pb-24 content-container">
      <RefinementList sortBy={sort} />
      <div className="w-full">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-ui-fg-base">
            {displayName}
          </h1>
          <p className="text-ui-fg-subtle text-base mt-2">
            Browse all {displayName} products
          </p>
        </div>
        <MobileSortDrawer sortBy={sort} />
        <Suspense fallback={<SkeletonProductGrid />}>
          <PaginatedProducts
            sortBy={sort}
            page={pageNumber}
            countryCode={countryCode}
            tagIds={[brand.id]}
          />
        </Suspense>
      </div>
    </div>
  )
}
