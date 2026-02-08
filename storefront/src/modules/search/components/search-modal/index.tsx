"use client"

import { ArrowRightMini, XMark } from "@medusajs/icons"
import { useCallback, useEffect, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import Image from "next/image"

import { searchProducts } from "@lib/data/products"
import { searchBrandTags } from "@lib/data/tags"
import { getBrandDisplayName, getBrandSlug, BrandTag } from "@lib/util/brand-helpers"
import { getProductPrice } from "@lib/util/get-product-price"
import { HttpTypes } from "@medusajs/types"
import Search from "@modules/common/icons/search"
import Spinner from "@modules/common/icons/spinner"

type SearchModalProps = {
  isOpen: boolean
  onClose: () => void
}

const SearchModal = ({ isOpen, onClose }: SearchModalProps) => {
  const { countryCode } = useParams<{ countryCode: string }>()
  const router = useRouter()
  const t = useTranslations("nav")
  const inputRef = useRef<HTMLInputElement>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  const [query, setQuery] = useState("")
  const [results, setResults] = useState<HttpTypes.StoreProduct[]>([])
  const [brandResults, setBrandResults] = useState<BrandTag[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  // Two-phase animation state
  const [isVisible, setIsVisible] = useState(false)
  const [isClosing, setIsClosing] = useState(false)

  const ANIMATION_DURATION = 220

  // Mount/unmount with animation phases
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true)
      setIsClosing(false)
    }
  }, [isOpen])

  const handleClose = useCallback(() => {
    setIsClosing(true)
    setTimeout(() => {
      setIsVisible(false)
      setIsClosing(false)
      onClose()
    }, ANIMATION_DURATION)
  }, [onClose])

  const performSearch = useCallback(
    async (searchQuery: string) => {
      if (!searchQuery.trim()) {
        setResults([])
        setBrandResults([])
        setHasSearched(false)
        return
      }

      setIsLoading(true)
      try {
        const [{ products }, brands] = await Promise.all([
          searchProducts({ query: searchQuery, countryCode }),
          searchBrandTags(searchQuery),
        ])
        setResults(products)
        setBrandResults(brands)
        setHasSearched(true)
      } catch {
        setResults([])
        setBrandResults([])
        setHasSearched(true)
      } finally {
        setIsLoading(false)
      }
    },
    [countryCode]
  )

  const handleInputChange = (value: string) => {
    setQuery(value)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      performSearch(value)
    }, 300)
  }

  const handleNavigate = (path: string) => {
    handleClose()
    setTimeout(() => {
      setQuery("")
      setResults([])
      setBrandResults([])
      setHasSearched(false)
      router.push(`/${countryCode}${path}`)
    }, ANIMATION_DURATION)
  }

  // Reset state when fully closed
  useEffect(() => {
    if (!isVisible) {
      setQuery("")
      setResults([])
      setBrandResults([])
      setHasSearched(false)
    } else {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isVisible])

  // Cleanup debounce timer
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  // Close on Escape key
  useEffect(() => {
    if (!isVisible || isClosing) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose()
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isVisible, isClosing, handleClose])

  // Close on backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
      handleClose()
    }
  }

  // Lock body scroll when open
  useEffect(() => {
    if (isVisible) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [isVisible])

  if (!isVisible) return null

  const hasResults = results.length > 0 || brandResults.length > 0

  return (
    <div className="fixed inset-0 z-[60]">
      {/* Frosted backdrop */}
      <div
        className={`fixed inset-0 bg-black/30 backdrop-blur-md ${
          isClosing ? "animate-backdrop-fade-out" : "animate-backdrop-fade-in"
        }`}
        onClick={handleBackdropClick}
      >
        {/* Responsive container */}
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-end small:items-start small:justify-center small:pt-[12vh]">
            {/* Modal panel — mobile bottom sheet / desktop spotlight */}
            <div
              ref={panelRef}
              className={`
                w-full flex flex-col overflow-hidden
                max-h-[85vh] rounded-t-[1.5rem]
                small:max-w-2xl small:rounded-2xl small:max-h-[70vh]
                bg-white/80 dark:bg-gray-900/80
                backdrop-blur-xl
                ring-1 ring-black/5 dark:ring-white/10
                border border-gray-200/50 dark:border-white/10
                shadow-2xl
                ${
                  isClosing
                    ? "animate-sheet-slide-down small:animate-search-leave"
                    : "animate-sheet-slide-up small:animate-search-enter"
                }
              `}
            >
              {/* Search header */}
              <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-200/50 dark:border-white/10">
                <Search size="20" className="text-gray-400 flex-shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => handleInputChange(e.target.value)}
                  placeholder={t("searchPlaceholder")}
                  className="flex-1 bg-transparent text-gray-900 dark:text-white placeholder-gray-400 text-lg outline-none"
                  style={{ backgroundColor: "transparent" }}
                />
                {isLoading && (
                  <Spinner
                    size="20"
                    className="animate-spin text-gray-400 flex-shrink-0"
                  />
                )}
                {/* ESC badge — desktop only */}
                <kbd className="hidden small:inline-flex items-center px-2 py-0.5 text-[11px] font-medium text-gray-400 dark:text-gray-500 bg-gray-100/80 dark:bg-white/10 rounded-md ring-1 ring-gray-200/50 dark:ring-white/10">
                  ESC
                </kbd>
                {/* Close X — mobile only */}
                <button
                  onClick={handleClose}
                  className="small:hidden p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                >
                  <XMark />
                </button>
              </div>

              {/* Results area */}
              <div className="flex-1 overflow-y-auto overscroll-contain">
                {/* Empty state — initial */}
                {!hasSearched && !isLoading && (
                  <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                    <div className="w-12 h-12 rounded-2xl bg-gray-100/80 dark:bg-white/10 flex items-center justify-center mb-4">
                      <Search size="20" className="opacity-60" />
                    </div>
                    <p className="text-sm">{t("searchPlaceholder")}</p>
                  </div>
                )}

                {/* No results */}
                {hasSearched && !hasResults && !isLoading && (
                  <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                    <div className="w-12 h-12 rounded-2xl bg-gray-100/80 dark:bg-white/10 flex items-center justify-center mb-4">
                      <Search size="20" className="opacity-60" />
                    </div>
                    <p className="text-sm">{t("noResults")}</p>
                  </div>
                )}

                {/* Brand results */}
                {brandResults.length > 0 && (
                  <div className="py-2">
                    <p className="px-5 py-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      {t("brands")}
                    </p>
                    <ul>
                      {brandResults.map((brand) => (
                        <li key={brand.id}>
                          <button
                            onClick={() =>
                              handleNavigate(`/brands/${getBrandSlug(brand)}`)
                            }
                            className="group w-full flex items-center gap-4 px-5 py-3 hover:bg-gray-100/50 dark:hover:bg-white/5 transition-colors text-left"
                          >
                            <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 flex-shrink-0 ring-1 ring-black/5 dark:ring-white/10 flex items-center justify-center">
                              <span className="text-sm font-bold text-gray-500 dark:text-gray-400">
                                {getBrandDisplayName(brand).charAt(0)}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                {getBrandDisplayName(brand)}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {t("viewBrand")}
                              </p>
                            </div>
                            <ArrowRightMini className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Product results */}
                {results.length > 0 && (
                  <div className="py-2">
                    <p className="px-5 py-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      {t("searchResults")}
                    </p>
                    <ul>
                      {results.map((product) => {
                        const { cheapestPrice } = getProductPrice({
                          product,
                        })

                        return (
                          <li key={product.id}>
                            <button
                              onClick={() =>
                                handleNavigate(`/products/${product.handle!}`)
                              }
                              className="group w-full flex items-center gap-4 px-5 py-3 hover:bg-gray-100/50 dark:hover:bg-white/5 transition-colors text-left"
                            >
                              {/* Thumbnail */}
                              <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 flex-shrink-0 ring-1 ring-black/5 dark:ring-white/10">
                                {product.thumbnail ? (
                                  <Image
                                    src={product.thumbnail}
                                    alt={product.title || ""}
                                    fill
                                    className="object-cover"
                                    sizes="48px"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-gray-300">
                                    <Search size="16" />
                                  </div>
                                )}
                              </div>

                              {/* Product info */}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                  {product.title}
                                </p>
                                {cheapestPrice && (
                                  <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {cheapestPrice.calculated_price}
                                  </p>
                                )}
                              </div>

                              {/* Hover arrow */}
                              <ArrowRightMini className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                            </button>
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SearchModal
