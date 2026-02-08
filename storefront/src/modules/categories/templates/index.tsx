import { notFound } from "next/navigation"
import { Suspense } from "react"

import SkeletonProductGrid from "@modules/skeletons/templates/skeleton-product-grid"
import RefinementList from "@modules/store/components/refinement-list"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import PaginatedProducts from "@modules/store/templates/paginated-products"
import MobileSortDrawer from "@modules/store/components/mobile-sort-drawer"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { HttpTypes } from "@medusajs/types"
import { getTranslations } from "next-intl/server"

export default async function CategoryTemplate({
  category,
  sortBy,
  page,
  countryCode,
}: {
  category: HttpTypes.StoreProductCategory
  sortBy?: SortOptions
  page?: string
  countryCode: string
}) {
  const pageNumber = page ? parseInt(page) : 1
  const sort = sortBy || "created_at"

  if (!category || !countryCode) notFound()

  const tCat = await getTranslations("categories")
  const translateCat = (c: { handle: string; name: string }) =>
    tCat.has(c.handle) ? tCat(c.handle) : c.name

  const parents = [] as HttpTypes.StoreProductCategory[]

  const getParents = (category: HttpTypes.StoreProductCategory) => {
    if (category.parent_category) {
      parents.push(category.parent_category)
      getParents(category.parent_category)
    }
  }

  getParents(category)

  return (
    <div
      className="flex flex-col small:flex-row small:items-start py-6 pb-16 small:pb-24 content-container"
      data-testid="category-container"
    >
      <RefinementList sortBy={sort} data-testid="sort-by-container" />
      <div className="w-full">
        {/* Breadcrumbs */}
        {parents.length > 0 && (
          <nav className="flex items-center gap-1.5 text-sm text-ui-fg-subtle mb-4">
            {parents.reverse().map((parent, idx) => (
              <span key={parent.id} className="flex items-center gap-1.5">
                {idx > 0 && <span>/</span>}
                <LocalizedClientLink
                  className="hover:text-ui-fg-base transition-colors"
                  href={`/categories/${parent.handle}`}
                  data-testid="sort-by-link"
                >
                  {translateCat(parent)}
                </LocalizedClientLink>
              </span>
            ))}
            <span>/</span>
            <span className="text-ui-fg-base">{translateCat(category)}</span>
          </nav>
        )}

        {/* Category Title */}
        <h1
          className="text-2xl font-semibold text-ui-fg-base mb-4"
          data-testid="category-page-title"
        >
          {translateCat(category)}
        </h1>

        {/* Description */}
        {category.description && (
          <p className="text-ui-fg-subtle text-base mb-6">
            {category.description}
          </p>
        )}

        {/* Subcategory Pills */}
        {category.category_children && category.category_children.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            {category.category_children.map((c) => (
              <LocalizedClientLink
                key={c.id}
                href={`/categories/${c.handle}`}
                className="px-3 py-1.5 rounded-full text-sm font-medium border bg-ui-bg-subtle text-ui-fg-base border-ui-border-base hover:bg-ui-bg-subtle-hover transition-colors"
              >
                {translateCat(c)}
              </LocalizedClientLink>
            ))}
          </div>
        )}
        <MobileSortDrawer sortBy={sort} />
        <Suspense
          fallback={
            <SkeletonProductGrid
              numberOfProducts={category.products?.length ?? 8}
            />
          }
        >
          <PaginatedProducts
            sortBy={sort}
            page={pageNumber}
            categoryId={category.id}
            countryCode={countryCode}
          />
        </Suspense>
      </div>
    </div>
  )
}
