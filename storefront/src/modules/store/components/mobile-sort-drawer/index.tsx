"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useTranslations } from "next-intl"
import { Funnel, CheckMini, XMark } from "@medusajs/icons"

import { SortOptions } from "@modules/store/components/refinement-list/sort-products"

type MobileSortDrawerProps = {
  sortBy: SortOptions
}

const MobileSortDrawer = ({ sortBy }: MobileSortDrawerProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const sheetRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const t = useTranslations("store")

  const sortOptions: { value: SortOptions; label: string }[] = [
    { value: "created_at", label: t("latestArrivals") },
    { value: "price_asc", label: t("priceLowHigh") },
    { value: "price_desc", label: t("priceHighLow") },
  ]

  const activeLabel = sortOptions.find((o) => o.value === sortBy)?.label ?? t("latestArrivals")

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams)
      params.set(name, value)
      return params.toString()
    },
    [searchParams]
  )

  const handleSort = (value: SortOptions) => {
    const query = createQueryString("sortBy", value)
    router.push(`${pathname}?${query}`)
    setIsOpen(false)
  }

  // Body scroll lock
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [isOpen])

  // Escape key dismiss
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false)
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen])

  // Backdrop click dismiss
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (sheetRef.current && !sheetRef.current.contains(e.target as Node)) {
      setIsOpen(false)
    }
  }

  return (
    <>
      {/* Trigger toolbar — mobile only */}
      <div className="small:hidden mb-4 py-3 border-b border-ui-border-base">
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 text-sm text-ui-fg-subtle hover:text-ui-fg-base transition-colors"
        >
          <Funnel className="w-4 h-4" />
          <span>
            {t("sortBy")} <span className="text-ui-fg-base font-medium">| {activeLabel}</span>
          </span>
        </button>
      </div>

      {/* Bottom sheet overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[75] flex items-end animate-backdrop-fade-in"
          onClick={handleBackdropClick}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50" />

          {/* Sheet */}
          <div
            ref={sheetRef}
            className="relative w-full bg-white dark:bg-gray-900 rounded-t-2xl animate-sheet-slide-up"
            style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
          >
            {/* Handle bar */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 pb-3">
              <h3 className="text-base font-semibold text-ui-fg-base">{t("sortBy")}</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <XMark className="w-5 h-5 text-ui-fg-subtle" />
              </button>
            </div>

            {/* Sort options */}
            <div className="px-3 pb-4">
              {sortOptions.map((option) => {
                const isActive = option.value === sortBy
                return (
                  <button
                    key={option.value}
                    onClick={() => handleSort(option.value)}
                    className={`flex items-center justify-between w-full px-3 py-3.5 rounded-lg text-left transition-colors ${
                      isActive
                        ? "bg-ui-bg-subtle text-ui-fg-base font-medium"
                        : "text-ui-fg-subtle hover:bg-ui-bg-subtle-hover"
                    }`}
                  >
                    <span className="text-sm">{option.label}</span>
                    {isActive && <CheckMini className="w-5 h-5 text-ui-fg-interactive" />}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default MobileSortDrawer
