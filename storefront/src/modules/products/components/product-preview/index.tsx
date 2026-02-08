import { Text } from "@medusajs/ui"
import { getProductPrice } from "@lib/util/get-product-price"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Thumbnail from "../thumbnail"
import PreviewPrice from "./price"
import { getTranslations } from "next-intl/server"

export default async function ProductPreview({
  product,
  isFeatured,
  region,
}: {
  product: HttpTypes.StoreProduct
  isFeatured?: boolean
  region: HttpTypes.StoreRegion
}) {
  const [{ cheapestPrice }, tCat] = await Promise.all([
    Promise.resolve(getProductPrice({ product })),
    getTranslations("categories"),
  ])

  // Extract category info from product categories
  const category = product.categories?.[0]
  const categoryName = category
    ? tCat.has(category.handle) ? tCat(category.handle) : category.name
    : null

  return (
    <LocalizedClientLink href={`/products/${product.handle}`} className="group">
      <div data-testid="product-wrapper" className="flex flex-col">
        <div className="relative">
          <Thumbnail
            thumbnail={product.thumbnail}
            images={product.images}
            size="full"
            isFeatured={isFeatured}
            productName={product.title}
          />
          {/* Category badge */}
          {categoryName && (
            <div className="absolute top-3 left-3 z-10">
              <span className="px-2.5 py-1 bg-white/90 dark:bg-gray-900/90 text-xs font-medium text-gray-700 dark:text-gray-300 rounded-full backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50">
                {categoryName}
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1 mt-4">
          <div className="flex justify-between items-start">
            <Text
              className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1"
              data-testid="product-title"
            >
              {product.title}
            </Text>
          </div>
          <div className="flex items-center gap-x-2">
            {cheapestPrice && <PreviewPrice price={cheapestPrice} />}
          </div>
        </div>
      </div>
    </LocalizedClientLink>
  )
}
