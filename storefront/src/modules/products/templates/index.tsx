import { Suspense } from "react"

import ImageGallery from "@modules/products/components/image-gallery"
import ProductActions from "@modules/products/components/product-actions"
import ProductTabs from "@modules/products/components/product-tabs"
import RelatedProducts from "@modules/products/components/related-products"
import ProductInfo from "@modules/products/templates/product-info"
import SkeletonRelatedProducts from "@modules/skeletons/templates/skeleton-related-products"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { notFound } from "next/navigation"
import { HttpTypes } from "@medusajs/types"
import { getTranslations, getLocale } from "next-intl/server"
import { getProductTranslation } from "@lib/util/product-i18n"

import ProductActionsWrapper from "./product-actions-wrapper"

type ProductTemplateProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  countryCode: string
}

export default async function ProductTemplate({
  product,
  region,
  countryCode,
}: ProductTemplateProps) {
  if (!product || !product.id) {
    return notFound()
  }

  const locale = await getLocale()
  const tCat = await getTranslations("categories")
  const tNav = await getTranslations("nav")
  const translateCat = (c: { handle: string; name: string }) =>
    tCat.has(c.handle) ? tCat(c.handle) : c.name
  const translated = getProductTranslation(product, locale)

  const category = (product as any).categories?.[0] as
    | { id: string; handle: string; name: string }
    | undefined

  return (
    <>
      <div
        className="content-container py-6"
        data-testid="product-container"
      >
        {category && (
          <nav className="flex items-center gap-1.5 text-sm text-ui-fg-subtle mb-4">
            <LocalizedClientLink
              href="/"
              className="hover:text-ui-fg-base transition-colors"
            >
              {tNav("home")}
            </LocalizedClientLink>
            <span>/</span>
            <LocalizedClientLink
              href={`/categories/${category.handle}`}
              className="hover:text-ui-fg-base transition-colors"
            >
              {translateCat(category)}
            </LocalizedClientLink>
            <span>/</span>
            <span className="text-ui-fg-base line-clamp-1">
              {translated.title}
            </span>
          </nav>
        )}

        <div className="flex flex-col small:flex-row small:items-start small:gap-x-10 medium:gap-x-16">
          {/* LEFT — Gallery (first in DOM = first on mobile) */}
          <div className="w-full small:w-[55%] medium:w-[60%]">
            <div className="small:sticky small:top-48">
              <Suspense
                fallback={
                  <div className="relative aspect-[4/3] w-full bg-ui-bg-subtle" />
                }
              >
                <ImageGallery product={product} />
              </Suspense>
            </div>
          </div>

          {/* RIGHT — Info + Actions + Tabs */}
          <div className="w-full small:w-[45%] medium:w-[40%] flex flex-col gap-y-6 py-6 small:py-0">
            <ProductInfo product={product} />
            <Suspense
              fallback={
                <ProductActions
                  disabled={true}
                  product={product}
                  region={region}
                />
              }
            >
              <ProductActionsWrapper id={product.id} region={region} />
            </Suspense>
            <ProductTabs product={product} />
          </div>
        </div>
      </div>
      <div
        className="content-container my-16 small:my-32"
        data-testid="related-products-container"
      >
        <Suspense fallback={<SkeletonRelatedProducts />}>
          <RelatedProducts product={product} countryCode={countryCode} />
        </Suspense>
      </div>
    </>
  )
}
