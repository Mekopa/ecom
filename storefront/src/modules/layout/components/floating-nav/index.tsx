"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"

const SCROLL_THRESHOLD = 20

export default function FloatingNav({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [scrolled, setScrolled] = useState(false)

  // Homepage = /{countryCode} (single path segment)
  const segments = pathname.split("/").filter(Boolean)
  const isHome = segments.length === 1

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > SCROLL_THRESHOLD)
    handleScroll()
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const showPill = scrolled || !isHome

  return (
    <>
      <div className="fixed top-0 inset-x-0 z-50">
        <div
          className={`transition-all duration-300 ${
            showPill ? "mx-3 mt-2 small:mx-4" : "mx-0 mt-0"
          }`}
        >
          <header
            className={`relative h-12 small:h-14 mx-auto transition-all duration-300 ${
              showPill
                ? "bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-lg shadow-gray-900/5 dark:shadow-black/20 rounded-full max-w-[1440px] border border-gray-200/50 dark:border-white/10"
                : "bg-transparent"
            }`}
          >
            {children}
          </header>
        </div>
      </div>

      {/* Spacer to push content below the fixed nav on non-home pages */}
      {!isHome && <div className="h-16 small:h-20" aria-hidden="true" />}
    </>
  )
}
