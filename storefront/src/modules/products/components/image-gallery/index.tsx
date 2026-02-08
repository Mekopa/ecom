"use client"

import { HttpTypes } from "@medusajs/types"
import { Container, clx } from "@medusajs/ui"
import Image from "next/image"
import { useSearchParams } from "next/navigation"
import { useCallback, useEffect, useMemo, useState } from "react"

import PlaceholderImage from "@modules/common/icons/placeholder-image"

type VariantWithImages = HttpTypes.StoreProductVariant & {
  images?: { id: string }[]
}

type ImageGalleryProps = {
  product: HttpTypes.StoreProduct
}

const ImageGallery = ({ product }: ImageGalleryProps) => {
  const searchParams = useSearchParams()
  const selectedVariantId = searchParams.get("v_id")

  const filteredImages = useMemo(() => {
    if (!selectedVariantId || !product.variants) {
      return product.images ?? []
    }

    const variant = (product.variants as VariantWithImages[]).find(
      (v) => v.id === selectedVariantId
    )
    if (!variant || !variant.images?.length) {
      return product.images ?? []
    }

    const variantImageIds = new Set(variant.images.map((i) => i.id))
    const matched = (product.images ?? []).filter((i) => variantImageIds.has(i.id))
    return matched.length > 0 ? matched : product.images ?? []
  }, [product.images, product.variants, selectedVariantId])

  const [selectedIndex, setSelectedIndex] = useState(0)
  const [imageLoaded, setImageLoaded] = useState(false)

  // Reset to first image when filtered set changes
  useEffect(() => {
    setSelectedIndex(0)
    setImageLoaded(false)
  }, [filteredImages])

  const handleImageLoad = useCallback(() => {
    setImageLoaded(true)
  }, [])

  if (filteredImages.length === 0) {
    return (
      <div className="flex items-start relative">
        <div className="flex flex-col flex-1 small:mx-16 gap-y-4">
          <Container className="relative aspect-[29/34] w-full overflow-hidden bg-ui-bg-subtle flex items-center justify-center">
            <PlaceholderImage size="64" />
          </Container>
        </div>
      </div>
    )
  }

  const activeImage = filteredImages[selectedIndex] ?? filteredImages[0]

  return (
    <div className="flex items-start relative">
      <div className="flex flex-col flex-1 small:mx-16 gap-y-4">
        {/* Main Image */}
        <Container className="relative aspect-[29/34] w-full overflow-hidden bg-ui-bg-subtle">
          {activeImage?.url && (
            <Image
              key={activeImage.url}
              src={activeImage.url}
              priority
              className={clx(
                "absolute inset-0 rounded-rounded animate-enter transition-opacity duration-300",
                imageLoaded ? "opacity-100" : "opacity-0"
              )}
              alt={`Product image ${selectedIndex + 1}`}
              fill
              sizes="(max-width: 576px) 280px, (max-width: 768px) 360px, (max-width: 992px) 480px, 800px"
              style={{ objectFit: "cover" }}
              onLoad={handleImageLoad}
            />
          )}
        </Container>

        {/* Thumbnail Strip — only shown when multiple images */}
        {filteredImages.length > 1 && (
          <div className="flex gap-x-2 overflow-x-auto pb-1">
            {filteredImages.map((image, index) => (
              <button
                key={image.id}
                onClick={() => {
                  setSelectedIndex(index)
                  setImageLoaded(false)
                }}
                className={clx(
                  "relative w-16 h-20 flex-shrink-0 overflow-hidden rounded-soft border-2 transition-colors",
                  index === selectedIndex
                    ? "border-ui-fg-base"
                    : "border-transparent hover:border-ui-fg-muted"
                )}
              >
                {image.url && (
                  <Image
                    src={image.url}
                    alt={`Thumbnail ${index + 1}`}
                    fill
                    sizes="64px"
                    style={{ objectFit: "cover" }}
                  />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default ImageGallery
