"use client"

import { HttpTypes } from "@medusajs/types"
import { Container, clx } from "@medusajs/ui"
import Image from "next/image"
import { useSearchParams } from "next/navigation"
import { useEffect, useMemo, useRef, useState } from "react"

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
  const selectedColor = searchParams.get("color")

  // Helper: collect image IDs for all variants matching a given color value
  const getImagesForColor = useMemo(() => {
    const allImages = product.images ?? []
    const variants = (product.variants ?? []) as VariantWithImages[]
    const colorOption = product.options?.find(
      (o) => o.title?.toLowerCase() === "color"
    )

    return (color: string): typeof allImages | null => {
      if (!colorOption || variants.length === 0) return null
      const colorVariants = variants.filter((v) =>
        v.options?.some(
          (o) =>
            (o as any).option_id === colorOption.id && o.value === color
        )
      )
      const imageIds = new Set<string>()
      for (const v of colorVariants) {
        for (const img of v.images ?? []) {
          imageIds.add(img.id)
        }
      }
      if (imageIds.size === 0) return null
      const matched = allImages.filter((i) => imageIds.has(i.id))
      return matched.length > 0 ? matched : null
    }
  }, [product.images, product.variants, product.options])

  const filteredImages = useMemo(() => {
    const allImages = product.images ?? []
    const variants = (product.variants ?? []) as VariantWithImages[]

    // If a specific variant is selected, use its images
    if (selectedVariantId) {
      const variant = variants.find((v) => v.id === selectedVariantId)
      if (variant?.images?.length) {
        const variantImageIds = new Set(variant.images.map((i) => i.id))
        const matched = allImages.filter((i) => variantImageIds.has(i.id))
        if (matched.length > 0) return matched
      }
    }

    // Use the color from URL, or default to the first color value
    const effectiveColor =
      selectedColor ??
      product.options
        ?.find((o) => o.title?.toLowerCase() === "color")
        ?.values?.[0]?.value ??
      null

    if (effectiveColor) {
      const matched = getImagesForColor(effectiveColor)
      if (matched) return matched
    }

    return allImages
  }, [product.images, product.variants, selectedVariantId, selectedColor, getImagesForColor])

  const [selectedIndex, setSelectedIndex] = useState(0)
  const prevImagesRef = useRef(filteredImages)

  // Reset to first image only when the actual image set changes
  useEffect(() => {
    const prevIds = prevImagesRef.current.map((i) => i.id).join(",")
    const nextIds = filteredImages.map((i) => i.id).join(",")
    if (prevIds !== nextIds) {
      setSelectedIndex(0)
    }
    prevImagesRef.current = filteredImages
  }, [filteredImages])

  if (filteredImages.length === 0) {
    return (
      <div className="flex items-start relative">
        <div className="flex flex-col flex-1 gap-y-4">
          <Container className="relative aspect-[4/3] w-full overflow-hidden bg-ui-bg-subtle dark:bg-gray-800 flex items-center justify-center p-0">
            <PlaceholderImage size="64" />
          </Container>
        </div>
      </div>
    )
  }

  const activeImage = filteredImages[selectedIndex] ?? filteredImages[0]

  return (
    <div className="flex items-start relative">
      <div className="flex flex-col flex-1 gap-y-4">
        {/* Main Image */}
        <Container className="relative aspect-[4/3] w-full overflow-hidden bg-ui-bg-subtle p-0">
          {activeImage?.url && (
            <Image
              key={activeImage.url}
              src={activeImage.url}
              priority
              className="absolute inset-0 rounded-rounded"
              alt={`Product image ${selectedIndex + 1}`}
              fill
              sizes="(max-width: 576px) 280px, (max-width: 768px) 360px, (max-width: 992px) 480px, 800px"
              style={{ objectFit: "cover" }}
            />
          )}
        </Container>

        {/* Thumbnail Strip — only shown when multiple images */}
        {filteredImages.length > 1 && (
          <div className="flex gap-x-2 overflow-x-auto pb-1">
            {filteredImages.map((image, index) => (
              <button
                key={image.id}
                onClick={() => setSelectedIndex(index)}
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
