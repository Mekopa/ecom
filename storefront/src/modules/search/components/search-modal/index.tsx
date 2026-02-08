"use client"

import { XMark } from "@medusajs/icons"
import { useCallback, useEffect, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import Image from "next/image"

import { searchProducts } from "@lib/data/products"
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
  const [isLoading, setIsLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  const performSearch = useCallback(
    async (searchQuery: string) => {
      if (!searchQuery.trim()) {
        setResults([])
        setHasSearched(false)
        return
      }

      setIsLoading(true)
      try {
        const { products } = await searchProducts({
          query: searchQuery,
          countryCode,
        })
        setResults(products)
        setHasSearched(true)
      } catch {
        setResults([])
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

  const handleNavigate = (handle: string) => {
    onClose()
    setQuery("")
    setResults([])
    setHasSearched(false)
    router.push(`/${countryCode}/products/${handle}`)
  }

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setQuery("")
      setResults([])
      setHasSearched(false)
    } else {
      // Focus input when modal opens
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  // Cleanup debounce timer
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, onClose])

  // Close on backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
      onClose()
    }
  }

  // Lock body scroll when open
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

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[60]">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 animate-[fadeIn_200ms_ease-out]"
        onClick={handleBackdropClick}
      >
        {/* Modal */}
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-start small:items-center small:justify-center small:p-4">
            <div
              ref={panelRef}
              className="w-full h-screen small:h-auto small:max-h-[80vh] small:max-w-2xl small:rounded-xl bg-white dark:bg-gray-900 shadow-xl flex flex-col overflow-hidden animate-[slideUp_200ms_ease-out]"
            >
              {/* Header with search input */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                <Search size="20" className="text-gray-400 flex-shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => handleInputChange(e.target.value)}
                  placeholder={t("searchPlaceholder")}
                  className="flex-1 bg-transparent text-gray-900 dark:text-white placeholder-gray-400 text-base outline-none"
                />
                {isLoading && (
                  <Spinner
                    size="20"
                    className="animate-spin text-gray-400 flex-shrink-0"
                  />
                )}
                <button
                  onClick={onClose}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <XMark />
                </button>
              </div>

              {/* Results */}
              <div className="flex-1 overflow-y-auto">
                {hasSearched && results.length === 0 && !isLoading && (
                  <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                    <Search size="48" className="mb-4 opacity-50" />
                    <p className="text-sm">{t("noResults")}</p>
                  </div>
                )}

                {results.length > 0 && (
                  <div className="py-2">
                    <p className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
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
                                handleNavigate(product.handle!)
                              }
                              className="w-full flex items-center gap-4 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
                            >
                              {/* Product image */}
                              <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 flex-shrink-0">
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
                            </button>
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                )}

                {!hasSearched && !isLoading && (
                  <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                    <Search size="48" className="mb-4 opacity-50" />
                    <p className="text-sm">{t("searchPlaceholder")}</p>
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
