"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"

type BrandItem = {
  slug: string
  label: string
  tagId: string
}

type BrandPillsProps = {
  brands: BrandItem[]
  selectedBrands: string[]
}

const BrandPills = ({ brands, selectedBrands }: BrandPillsProps) => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const handleToggle = (slug: string) => {
    const params = new URLSearchParams(searchParams)
    params.delete("brand")
    params.delete("page")

    const updated = selectedBrands.includes(slug)
      ? selectedBrands.filter((b) => b !== slug)
      : [...selectedBrands, slug]

    updated.forEach((b) => params.append("brand", b))

    const qs = params.toString()
    router.push(qs ? `${pathname}?${qs}` : pathname)
  }

  if (!brands.length) return null

  return (
    <div className="flex flex-wrap gap-2">
      {brands.map((brand) => {
        const isActive = selectedBrands.includes(brand.slug)
        return (
          <button
            key={brand.slug}
            type="button"
            onClick={() => handleToggle(brand.slug)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              isActive
                ? "bg-ui-fg-base text-white border-ui-fg-base dark:bg-white dark:text-gray-900 dark:border-white"
                : "bg-ui-bg-subtle text-ui-fg-base border-ui-border-base hover:bg-ui-bg-subtle-hover"
            }`}
          >
            {brand.label}
          </button>
        )
      })}
    </div>
  )
}

export default BrandPills
