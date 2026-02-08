"use client"

import { useState } from "react"
import { useParams, usePathname } from "next/navigation"
import { useTranslations } from "next-intl"
import { HttpTypes } from "@medusajs/types"
import { Locale } from "@lib/data/locales"

import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Home from "@modules/common/icons/home"
import Search from "@modules/common/icons/search"
import MenuGrid from "@modules/common/icons/menu-grid"
import User from "@modules/common/icons/user"
import ShoppingBag from "@modules/common/icons/shopping-bag"
import SearchModal from "@modules/search/components/search-modal"
import SideMenu from "@modules/layout/components/side-menu"

type BottomNavProps = {
  totalItems: number
  regions: HttpTypes.StoreRegion[] | null
  locales: Locale[] | null
  currentLocale: string | null
}

const BottomNav = ({
  totalItems,
  regions,
  locales,
  currentLocale,
}: BottomNavProps) => {
  const { countryCode } = useParams<{ countryCode: string }>()
  const pathname = usePathname()
  const t = useTranslations("nav")
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  const basePath = `/${countryCode}`
  const isHome = pathname === basePath || pathname === `${basePath}/`
  const isAccount = pathname.startsWith(`${basePath}/account`)
  const isCart = pathname.startsWith(`${basePath}/cart`)

  const activeClass = "text-blue-500 dark:text-blue-400"
  const inactiveClass = "text-gray-500 dark:text-gray-400"

  return (
    <>
      <nav
        className="small:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <div className="flex justify-around items-center h-16">
          {/* Home */}
          <LocalizedClientLink
            href="/"
            className={`flex flex-col items-center justify-center gap-1 flex-1 h-full ${
              isHome ? activeClass : inactiveClass
            }`}
          >
            <Home size="22" />
            <span className="text-[10px] leading-none">{t("home")}</span>
          </LocalizedClientLink>

          {/* Search */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className={`flex flex-col items-center justify-center gap-1 flex-1 h-full ${inactiveClass}`}
          >
            <Search size="22" />
            <span className="text-[10px] leading-none">{t("search")}</span>
          </button>

          {/* Center Menu Button (elevated) */}
          <div className="flex flex-col items-center justify-center flex-1">
            <button
              onClick={() => setIsMenuOpen(true)}
              className="-mt-5 w-14 h-14 rounded-full bg-gray-900 dark:bg-white shadow-lg flex items-center justify-center"
            >
              <MenuGrid
                size="24"
                className="text-white dark:text-gray-900"
              />
            </button>
          </div>

          {/* Account */}
          <LocalizedClientLink
            href="/account"
            className={`flex flex-col items-center justify-center gap-1 flex-1 h-full ${
              isAccount ? activeClass : inactiveClass
            }`}
          >
            <User size="22" />
            <span className="text-[10px] leading-none">{t("account")}</span>
          </LocalizedClientLink>

          {/* Cart */}
          <LocalizedClientLink
            href="/cart"
            className={`flex flex-col items-center justify-center gap-1 flex-1 h-full relative ${
              isCart ? activeClass : inactiveClass
            }`}
          >
            <div className="relative">
              <ShoppingBag size="22" />
              {totalItems > 0 && (
                <span className="absolute -top-1.5 -right-2 min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center px-1 font-medium">
                  {totalItems}
                </span>
              )}
            </div>
            <span className="text-[10px] leading-none">{t("cart")}</span>
          </LocalizedClientLink>
        </div>
      </nav>

      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
      <SideMenu
        regions={regions}
        locales={locales}
        currentLocale={currentLocale}
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
      />
    </>
  )
}

export default BottomNav
