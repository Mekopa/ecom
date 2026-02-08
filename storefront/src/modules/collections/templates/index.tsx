import { Suspense } from "react"

import SkeletonProductGrid from "@modules/skeletons/templates/skeleton-product-grid"
import RefinementList from "@modules/store/components/refinement-list"
import MobileSortDrawer from "@modules/store/components/mobile-sort-drawer"
import BrandPills from "@modules/store/components/brand-pills"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import PaginatedProducts from "@modules/store/templates/paginated-products"
import { HttpTypes } from "@medusajs/types"
import { resolveBrandFilter } from "@lib/util/resolve-brand-tags"

export default async function CollectionTemplate({
  sortBy,
  collection,
  page,
  countryCode,
  brand,
}: {
  sortBy?: SortOptions
  collection: HttpTypes.StoreCollection
  page?: string
  countryCode: string
  brand?: string | string[]
}) {
  const pageNumber = page ? parseInt(page) : 1
  const sort = sortBy || "created_at"

  const { brandItems, selectedBrandSlugs, selectedTagIds } =
    await resolveBrandFilter(brand, { collectionId: collection.id })

  return (
    <div className="flex flex-col small:flex-row small:items-start py-6 content-container">
      <RefinementList sortBy={sort} />
      <div className="w-full">
        <div className="mb-8 text-2xl-semi">
          <h1>{collection.title}</h1>
        </div>
        {brandItems.length > 0 && (
          <div className="mb-8">
            <BrandPills brands={brandItems} selectedBrands={selectedBrandSlugs} />
          </div>
        )}
        <MobileSortDrawer sortBy={sort} />
        <Suspense
          fallback={
            <SkeletonProductGrid
              numberOfProducts={collection.products?.length}
            />
          }
        >
          <PaginatedProducts
            sortBy={sort}
            page={pageNumber}
            collectionId={collection.id}
            countryCode={countryCode}
            tagIds={selectedTagIds}
          />
        </Suspense>
      </div>
    </div>
  )
}
