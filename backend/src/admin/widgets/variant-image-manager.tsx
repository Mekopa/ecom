import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Text, Button, Badge, clx, toast } from "@medusajs/ui"
import { useState, useEffect, useCallback, useMemo } from "react"

type ProductImage = {
  id: string
  url: string
  rank?: number
}

type VariantOption = {
  id: string
  value: string
  option?: {
    id: string
    title: string
  }
  option_id?: string
}

type Variant = {
  id: string
  title: string
  options: VariantOption[]
  images?: ProductImage[]
}

type Product = {
  id: string
  title: string
  images: ProductImage[]
  options: { id: string; title: string; values: { id: string; value: string }[] }[]
  variants: Variant[]
}

type WidgetProps = {
  data: { id: string }
}

const BACKOFF_BASE = 500

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries = 3
): Promise<Response> {
  for (let attempt = 0; attempt < retries; attempt++) {
    const res = await fetch(url, options)
    if (res.status === 429 && attempt < retries - 1) {
      await new Promise((r) => setTimeout(r, BACKOFF_BASE * 2 ** attempt))
      continue
    }
    return res
  }
  throw new Error("Max retries reached")
}

const VariantImageManager = ({ data }: WidgetProps) => {
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedColor, setSelectedColor] = useState<string>("")
  const [imageSelection, setImageSelection] = useState<Set<string>>(new Set())
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)

  const fetchProduct = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch(
        `/admin/products/${data.id}?fields=+images,*variants,*variants.options,*variants.images,*options,*options.values`,
        { credentials: "include" }
      )
      if (!res.ok) throw new Error(`Failed to fetch product: ${res.status}`)
      const json = await res.json()
      setProduct(json.product)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [data.id])

  useEffect(() => {
    fetchProduct()
  }, [fetchProduct])

  // Find the "Color" option and extract unique color values
  const colorOption = useMemo(() => {
    if (!product) return null
    return product.options.find(
      (o) => o.title.toLowerCase() === "color"
    ) ?? null
  }, [product])

  const colorValues = useMemo(() => {
    if (!colorOption) return []
    return colorOption.values.map((v) => v.value)
  }, [colorOption])

  // Auto-select first color when product loads
  useEffect(() => {
    if (colorValues.length > 0 && !selectedColor) {
      setSelectedColor(colorValues[0])
    }
  }, [colorValues, selectedColor])

  // Get variants for the selected color
  const variantsForColor = useMemo(() => {
    if (!product || !selectedColor) return []
    return product.variants.filter((v) =>
      v.options.some(
        (o) =>
          (o.option?.title?.toLowerCase() === "color" ||
            product.options.find((po) => po.id === o.option_id)?.title.toLowerCase() === "color") &&
          o.value === selectedColor
      )
    )
  }, [product, selectedColor])

  // Compute the initial image selection for the current color
  const initialSelection = useMemo(() => {
    const ids = new Set<string>()
    for (const v of variantsForColor) {
      if (v.images) {
        for (const img of v.images) {
          ids.add(img.id)
        }
      }
    }
    return ids
  }, [variantsForColor])

  // Sync image selection when color tab changes
  useEffect(() => {
    setImageSelection(new Set(initialSelection))
    setDirty(false)
  }, [initialSelection])

  const toggleImage = (imageId: string) => {
    setImageSelection((prev) => {
      const next = new Set(prev)
      if (next.has(imageId)) {
        next.delete(imageId)
      } else {
        next.add(imageId)
      }
      // Check if selection differs from initial
      const isDirty =
        next.size !== initialSelection.size ||
        [...next].some((id) => !initialSelection.has(id))
      setDirty(isDirty)
      return next
    })
  }

  const handleSave = async () => {
    if (!product || variantsForColor.length === 0) return
    setSaving(true)
    try {
      const selectedIds = [...imageSelection]
      const results = await Promise.all(
        variantsForColor.map(async (variant) => {
          const currentIds = new Set(
            (variant.images ?? []).map((img) => img.id)
          )
          const add = selectedIds
            .filter((id) => !currentIds.has(id))
            .map((id) => ({ id }))
          const remove = [...currentIds]
            .filter((id) => !imageSelection.has(id))
            .map((id) => ({ id }))

          if (add.length === 0 && remove.length === 0) return true

          const res = await fetchWithRetry(
            `/admin/products/${product.id}/variants/${variant.id}/images/batch`,
            {
              method: "POST",
              credentials: "include",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ add, remove }),
            }
          )
          if (!res.ok) {
            const body = await res.text()
            throw new Error(
              `Variant ${variant.title}: ${res.status} - ${body}`
            )
          }
          return true
        })
      )

      toast.success(`Images updated for ${selectedColor}`)
      await fetchProduct()
    } catch (err: any) {
      toast.error(`Failed to save: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  // --- Render ---

  if (loading) {
    return (
      <Container className="divide-y p-0">
        <div className="flex items-center justify-between px-6 py-4">
          <Heading level="h2">Variant Images</Heading>
        </div>
        <div className="flex items-center justify-center px-6 py-12">
          <Text className="text-ui-fg-muted">Loading...</Text>
        </div>
      </Container>
    )
  }

  if (error) {
    return (
      <Container className="divide-y p-0">
        <div className="flex items-center justify-between px-6 py-4">
          <Heading level="h2">Variant Images</Heading>
        </div>
        <div className="px-6 py-8">
          <Text className="text-ui-fg-error">Error: {error}</Text>
        </div>
      </Container>
    )
  }

  if (!product) return null

  if (!colorOption || colorValues.length === 0) {
    return (
      <Container className="divide-y p-0">
        <div className="flex items-center justify-between px-6 py-4">
          <Heading level="h2">Variant Images</Heading>
        </div>
        <div className="px-6 py-8">
          <Text className="text-ui-fg-muted">
            No color option found on this product. Add a "Color" option to
            manage variant-specific images.
          </Text>
        </div>
      </Container>
    )
  }

  if (!product.images || product.images.length === 0) {
    return (
      <Container className="divide-y p-0">
        <div className="flex items-center justify-between px-6 py-4">
          <Heading level="h2">Variant Images</Heading>
        </div>
        <div className="px-6 py-8">
          <Text className="text-ui-fg-muted">
            Upload product images first, then assign them to color variants
            here.
          </Text>
        </div>
      </Container>
    )
  }

  return (
    <Container className="divide-y p-0">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-x-3">
          <Heading level="h2">Variant Images</Heading>
          <Badge size="small" color="grey">
            {selectedColor}
          </Badge>
        </div>
        <Text className="text-ui-fg-muted text-small">
          {variantsForColor.length} variant{variantsForColor.length !== 1 ? "s" : ""}
        </Text>
      </div>

      {/* Color Tabs */}
      <div className="flex flex-wrap gap-2 px-6 py-3">
        {colorValues.map((color) => (
          <button
            key={color}
            onClick={() => setSelectedColor(color)}
            className={clx(
              "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
              selectedColor === color
                ? "bg-ui-bg-base-pressed text-ui-fg-base shadow-borders-base"
                : "bg-ui-bg-subtle text-ui-fg-muted hover:bg-ui-bg-subtle-hover"
            )}
          >
            {color}
          </button>
        ))}
      </div>

      {/* Image Grid */}
      <div className="grid grid-cols-3 gap-4 px-6 py-4 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
        {product.images.map((image) => {
          const isSelected = imageSelection.has(image.id)
          return (
            <button
              key={image.id}
              onClick={() => toggleImage(image.id)}
              className={clx(
                "group relative overflow-hidden rounded-lg border-2 transition-all",
                isSelected
                  ? "border-ui-fg-interactive shadow-borders-interactive-with-focus"
                  : "border-ui-border-base hover:border-ui-border-strong"
              )}
            >
              <img
                src={image.url}
                alt=""
                className="aspect-square w-full object-cover"
              />
              <div
                className={clx(
                  "absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded",
                  isSelected ? "bg-ui-fg-interactive" : "bg-ui-bg-base shadow-borders-base"
                )}
              >
                {isSelected && (
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    fill="none"
                    className="text-ui-fg-on-color"
                  >
                    <path
                      d="M10 3L4.5 8.5L2 6"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </div>
            </button>
          )
        })}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-x-2 px-6 py-4">
        <Text className="text-ui-fg-muted text-small mr-auto">
          {imageSelection.size} of {product.images.length} image{product.images.length !== 1 ? "s" : ""} selected
        </Text>
        <Button
          variant="primary"
          size="small"
          disabled={!dirty || saving}
          isLoading={saving}
          onClick={handleSave}
        >
          Save
        </Button>
      </div>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "product.details.after",
})

export default VariantImageManager
