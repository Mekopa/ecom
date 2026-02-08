"use client"

import { useRef, useState, useCallback, useEffect } from "react"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import CategoryIcons from "./category-icons"

type CategoryData = {
  id: string
  handle: string
  name: string
  productCountLabel: string
}

const gradients: Record<string, string> = {
  smartphones: "from-blue-100 to-blue-200 dark:from-blue-950 dark:to-blue-900",
  laptops: "from-violet-100 to-violet-200 dark:from-violet-950 dark:to-violet-900",
  audio: "from-amber-100 to-amber-200 dark:from-amber-950 dark:to-amber-900",
  wearables: "from-emerald-100 to-emerald-200 dark:from-emerald-950 dark:to-emerald-900",
  cameras: "from-rose-100 to-rose-200 dark:from-rose-950 dark:to-rose-900",
  accessories: "from-cyan-100 to-cyan-200 dark:from-cyan-950 dark:to-cyan-900",
}

const iconColors: Record<string, string> = {
  smartphones: "text-blue-600 dark:text-blue-400",
  laptops: "text-violet-600 dark:text-violet-400",
  audio: "text-amber-600 dark:text-amber-400",
  wearables: "text-emerald-600 dark:text-emerald-400",
  cameras: "text-rose-600 dark:text-rose-400",
  accessories: "text-cyan-600 dark:text-cyan-400",
}

export default function CategoryCarousel({
  categories,
}: {
  categories: CategoryData[]
}) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  const checkScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 4)
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4)
  }, [])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    checkScroll()
    el.addEventListener("scroll", checkScroll, { passive: true })
    window.addEventListener("resize", checkScroll)
    return () => {
      el.removeEventListener("scroll", checkScroll)
      window.removeEventListener("resize", checkScroll)
    }
  }, [checkScroll])

  const scroll = (direction: "left" | "right") => {
    const el = scrollRef.current
    if (!el) return
    const cardWidth = 296 // 280px card + 16px gap
    el.scrollBy({ left: direction === "left" ? -cardWidth : cardWidth, behavior: "smooth" })
  }

  return (
    <div className="group/carousel relative">
      {/* Scroll container */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto snap-x snap-mandatory no-scrollbar pb-2"
      >
        {categories.map((category) => {
          const Icon = CategoryIcons[category.handle] || CategoryIcons.accessories
          const gradient = gradients[category.handle] || gradients.accessories
          const iconColor = iconColors[category.handle] || iconColors.accessories

          return (
            <LocalizedClientLink
              key={category.id}
              href={`/categories/${category.handle}`}
              className="group flex-shrink-0 snap-start w-[260px] small:w-[280px] rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-gray-900/10 dark:hover:shadow-black/30 hover:border-gray-300 dark:hover:border-gray-700"
            >
              {/* Illustration area */}
              <div className={`aspect-[4/3] bg-gradient-to-br ${gradient} flex items-center justify-center overflow-hidden`}>
                <Icon
                  className={`w-24 h-24 ${iconColor} transition-transform duration-300 group-hover:scale-110`}
                />
              </div>
              {/* Text area */}
              <div className="px-4 py-3.5">
                <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {category.name}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  {category.productCountLabel}
                </p>
              </div>
            </LocalizedClientLink>
          )
        })}
      </div>

      {/* Left arrow */}
      {canScrollLeft && (
        <button
          onClick={() => scroll("left")}
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-10 w-10 h-10 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg flex items-center justify-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-all opacity-0 group-hover/carousel:opacity-100 focus:opacity-100"
          aria-label="Scroll left"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
            <path fillRule="evenodd" d="M11.78 5.22a.75.75 0 0 1 0 1.06L8.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z" clipRule="evenodd" />
          </svg>
        </button>
      )}

      {/* Right arrow */}
      {canScrollRight && (
        <button
          onClick={() => scroll("right")}
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-10 w-10 h-10 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg flex items-center justify-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-all opacity-0 group-hover/carousel:opacity-100 focus:opacity-100"
          aria-label="Scroll right"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
            <path fillRule="evenodd" d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
          </svg>
        </button>
      )}
    </div>
  )
}
