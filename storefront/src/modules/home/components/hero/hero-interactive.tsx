"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import CategoryIcons from "@modules/home/components/category-showcase/category-icons"
import { searchProducts } from "@lib/data/products"
import { getProductPrice } from "@lib/util/get-product-price"
import { HttpTypes } from "@medusajs/types"

const ROTATE_INTERVAL = 3000

type CategoryData = { id: string; handle: string; name: string }

/* Trust badge icons — order must match the labels array from server */
const TRUST_ICONS = [
  // Free Shipping (truck)
  <svg key="truck" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
  </svg>,
  // 30-Day Returns (refresh)
  <svg key="returns" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
  </svg>,
  // 12-Month Warranty (shield)
  <svg key="shield" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
  </svg>,
  // Secure Checkout (lock)
  <svg key="lock" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
  </svg>,
]

export default function HeroInteractive({
  title,
  subtitle,
  placeholders,
  noResultsText,
  viewAllText,
  categories,
  trustBadges,
}: {
  title: string
  subtitle: string
  placeholders: string[]
  noResultsText: string
  viewAllText: string
  categories: CategoryData[]
  trustBadges: string[]
}) {
  const { countryCode } = useParams<{ countryCode: string }>()
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const [query, setQuery] = useState("")
  const [results, setResults] = useState<HttpTypes.StoreProduct[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const [placeholderIndex, setPlaceholderIndex] = useState(0)

  // Rotating placeholder
  useEffect(() => {
    if (isFocused || query) return
    const interval = setInterval(() => {
      setPlaceholderIndex((i) => (i + 1) % placeholders.length)
    }, ROTATE_INTERVAL)
    return () => clearInterval(interval)
  }, [isFocused, query, placeholders.length])

  // Debounced search
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
          limit: 5,
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
    timerRef.current = setTimeout(() => performSearch(value), 300)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      router.push(`/${countryCode}/results/${encodeURIComponent(query.trim())}`)
      setIsFocused(false)
      inputRef.current?.blur()
    }
  }

  const handleNavigate = (handle: string) => {
    setQuery("")
    setResults([])
    setHasSearched(false)
    setIsFocused(false)
    router.push(`/${countryCode}/products/${handle}`)
  }

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsFocused(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  const showDropdown = isFocused && (hasSearched || isLoading)

  return (
    <div className="relative bg-[var(--bg-primary)]">
      {/* Hero section with curved bottom */}
      <div className="relative overflow-hidden rounded-b-[2.5rem] small:rounded-b-[3.5rem]">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-sky-100 to-blue-50 dark:from-gray-950 dark:via-blue-950 dark:to-gray-950" />

        {/* Circuit pattern — dark for light mode */}
        <div className="absolute inset-0 opacity-[0.12] dark:hidden" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%231e40af' stroke-width='0.5'%3E%3Cpath d='M30 0v15m0 30v15M0 30h15m30 0h15'/%3E%3Ccircle cx='30' cy='30' r='3'/%3E%3Ccircle cx='30' cy='0' r='1.5'/%3E%3Ccircle cx='30' cy='60' r='1.5'/%3E%3Ccircle cx='0' cy='30' r='1.5'/%3E%3Ccircle cx='60' cy='30' r='1.5'/%3E%3C/g%3E%3C/svg%3E")`,
        }} />
        {/* Circuit pattern — light for dark mode */}
        <div className="absolute inset-0 opacity-[0.07] hidden dark:block" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%2360a5fa' stroke-width='0.5'%3E%3Cpath d='M30 0v15m0 30v15M0 30h15m30 0h15'/%3E%3Ccircle cx='30' cy='30' r='3'/%3E%3Ccircle cx='30' cy='0' r='1.5'/%3E%3Ccircle cx='30' cy='60' r='1.5'/%3E%3Ccircle cx='0' cy='30' r='1.5'/%3E%3Ccircle cx='60' cy='30' r='1.5'/%3E%3C/g%3E%3C/svg%3E")`,
        }} />

        {/* Floating blobs — animate on search focus */}
        <div className={`absolute top-10 left-10 w-72 h-72 bg-blue-600/10 dark:bg-blue-500/10 rounded-full blur-3xl transition-all duration-700 ${isFocused ? "scale-150 opacity-60" : ""}`} />
        <div className={`absolute bottom-10 right-10 w-96 h-96 bg-blue-500/10 dark:bg-blue-400/10 rounded-full blur-3xl transition-all duration-700 ${isFocused ? "scale-150 opacity-60" : ""}`} />
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-blue-400/5 dark:bg-blue-400/5 rounded-full blur-3xl transition-all duration-700 ${isFocused ? "scale-[2] opacity-80" : "scale-0 opacity-0"}`} />

        {/* Focus overlay */}
        <div className={`absolute inset-0 bg-black/0 transition-colors duration-500 z-[1] pointer-events-none ${isFocused ? "bg-black/10 dark:bg-black/20" : ""}`} />

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center text-center px-5 pt-20 pb-20 small:pt-28 small:pb-28">
          {/* Title */}
          <h1 className={`text-3xl small:text-5xl leading-tight font-bold text-gray-900 dark:text-white max-w-2xl transition-all duration-500 ${isFocused ? "opacity-40 scale-95 blur-[1px]" : ""}`}>
            {title}
          </h1>

          {/* Subtitle */}
          <p className={`text-base small:text-lg text-blue-900/60 dark:text-blue-100/80 max-w-md font-light mt-4 transition-all duration-500 ${isFocused ? "opacity-0 -translate-y-2" : ""}`}>
            {subtitle}
          </p>

          {/* Category pills */}
          <div className={`flex gap-2 small:gap-3 mt-8 overflow-x-auto no-scrollbar max-w-full px-2 transition-all duration-500 ${isFocused ? "opacity-0 scale-95 -translate-y-2" : ""}`}>
            {categories.map((cat) => {
              const Icon = CategoryIcons[cat.handle] || CategoryIcons.accessories
              return (
                <LocalizedClientLink
                  key={cat.id}
                  href={`/categories/${cat.handle}`}
                  className="flex items-center gap-2 flex-shrink-0 px-3.5 py-2 rounded-full bg-white/70 dark:bg-white/10 border border-gray-200/60 dark:border-white/10 backdrop-blur-sm hover:bg-white dark:hover:bg-white/20 transition-colors"
                >
                  <Icon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-200 whitespace-nowrap">
                    {cat.name}
                  </span>
                </LocalizedClientLink>
              )
            })}
          </div>
        </div>
      </div>

      {/* Unified search + trust card — bridges the curved bottom edge */}
      <div className="relative z-20 -mt-8 small:-mt-10 px-5" ref={dropdownRef}>
        <div className={`max-w-2xl mx-auto bg-white dark:bg-gray-900 rounded-2xl shadow-xl shadow-gray-900/10 dark:shadow-black/30 overflow-hidden transition-all duration-300 ${isFocused ? "shadow-2xl shadow-blue-500/10 dark:shadow-blue-500/10 ring-2 ring-blue-500/30" : ""}`}>
          {/* Search input */}
          <form onSubmit={handleSubmit}>
            <div className={`relative flex items-center transition-all duration-300 ${isFocused ? "scale-[1.0]" : ""}`}>
              {/* Search icon */}
              <svg
                className="absolute left-5 w-5 h-5 text-gray-400 dark:text-gray-500 pointer-events-none z-10"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>

              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => handleInputChange(e.target.value)}
                onFocus={() => setIsFocused(true)}
                placeholder={placeholders[placeholderIndex]}
                className="w-full pl-14 pr-14 py-4 small:py-5 bg-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-base small:text-lg outline-none"
              />

              {/* Loading spinner / submit button */}
              <div className="absolute right-4">
                {isLoading ? (
                  <svg className="w-5 h-5 animate-spin text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : query.trim() ? (
                  <button
                    type="submit"
                    className="p-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </button>
                ) : null}
              </div>
            </div>
          </form>

          {/* Search results dropdown — replaces trust badges when active */}
          {showDropdown && (
            <div className="border-t border-gray-100 dark:border-gray-800">
              {hasSearched && results.length === 0 && !isLoading && (
                <div className="px-5 py-8 text-center text-gray-400 text-sm">
                  {noResultsText}
                </div>
              )}

              {results.length > 0 && (
                <>
                  <ul>
                    {results.map((product) => {
                      const { cheapestPrice } = getProductPrice({ product })

                      return (
                        <li key={product.id}>
                          <button
                            onClick={() => handleNavigate(product.handle!)}
                            className="w-full flex items-center gap-3 px-5 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-left"
                          >
                            <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 flex-shrink-0">
                              {product.thumbnail ? (
                                <Image
                                  src={product.thumbnail}
                                  alt={product.title || ""}
                                  fill
                                  className="object-cover"
                                  sizes="40px"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-300 dark:text-gray-600">
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
                                  </svg>
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                {product.title}
                              </p>
                              {cheapestPrice && (
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {cheapestPrice.calculated_price}
                                </p>
                              )}
                            </div>
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                  <button
                    onClick={handleSubmit as any}
                    className="w-full px-5 py-3 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors border-t border-gray-100 dark:border-gray-800"
                  >
                    {viewAllText} &rarr;
                  </button>
                </>
              )}
            </div>
          )}

          {/* Trust badges — resting state below search */}
          {!showDropdown && (
            <div className="border-t border-gray-100 dark:border-gray-800">
              <div className="grid grid-cols-2 small:grid-cols-4 gap-x-4 gap-y-2 px-5 py-3">
                {trustBadges.map((label, i) => (
                  <div
                    key={label}
                    className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400"
                  >
                    <span className="text-blue-600 dark:text-blue-400 flex-shrink-0">
                      {TRUST_ICONS[i]}
                    </span>
                    <span className="text-xs font-medium truncate">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
