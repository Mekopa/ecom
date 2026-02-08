import { Suspense } from "react"

import { listRegions } from "@lib/data/regions"
import { StoreRegion } from "@medusajs/types"
import { getTranslations } from "next-intl/server"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import User from "@modules/common/icons/user"
import CartButton from "@modules/layout/components/cart-button"
import SideMenu from "@modules/layout/components/side-menu"
import ThemeToggle from "@modules/common/components/theme-toggle"
import LanguageSwitcher from "@modules/common/components/language-switcher"
import NavSearchButton from "@modules/layout/components/nav-search-button"

export default async function Nav() {
  const regions = await listRegions().then((regions: StoreRegion[]) => regions)
  const t = await getTranslations("nav")

  return (
    <div className="sticky top-0 inset-x-0 z-50 group">
      <header className="relative h-16 mx-auto border-b duration-200 bg-white dark:bg-gray-950 border-ui-border-base dark:border-gray-800 backdrop-blur-md bg-opacity-90 dark:bg-opacity-90">
        <nav className="content-container txt-xsmall-plus text-ui-fg-subtle dark:text-gray-300 flex items-center justify-between w-full h-full text-small-regular">
          {/* Left: Side Menu + Store Name */}
          <div className="flex-1 basis-0 h-full flex items-center gap-x-2">
            <div className="h-full small:hidden">
              <SideMenu regions={regions} />
            </div>
            <LocalizedClientLink
              href="/"
              className="txt-compact-xlarge-plus hover:text-ui-fg-base dark:hover:text-white uppercase font-bold tracking-tight text-gray-900 dark:text-white"
              data-testid="nav-store-link"
            >
              Medusa Store
            </LocalizedClientLink>
          </div>

          {/* Center: Navigation Links */}
          <div className="hidden small:flex items-center gap-x-6 h-full">
            <LocalizedClientLink
              className="hover:text-ui-fg-base dark:hover:text-white"
              href="/store"
              data-testid="nav-store-products-link"
            >
              {t("store")}
            </LocalizedClientLink>
            <LocalizedClientLink
              className="hover:text-ui-fg-base dark:hover:text-white"
              href="/categories"
            >
              {t("categories")}
            </LocalizedClientLink>
          </div>

          {/* Right: Utilities */}
          <div className="flex items-center gap-x-4 h-full flex-1 basis-0 justify-end">
            <div className="hidden small:flex items-center gap-x-4">
              <NavSearchButton />
              <LanguageSwitcher />
              <ThemeToggle />
              <LocalizedClientLink
                className="flex items-center gap-1.5 hover:text-ui-fg-base dark:hover:text-white"
                href="/account"
                data-testid="nav-account-link"
              >
                <User size="18" />
                {t("account")}
              </LocalizedClientLink>
            </div>
            <Suspense
              fallback={
                <LocalizedClientLink
                  className="hover:text-ui-fg-base dark:hover:text-white flex gap-2"
                  href="/cart"
                  data-testid="nav-cart-link"
                >
                  {t("cart")} (0)
                </LocalizedClientLink>
              }
            >
              <CartButton />
            </Suspense>
          </div>
        </nav>
      </header>
    </div>
  )
}
