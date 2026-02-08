import { Suspense } from "react"

import { STORE_NAME } from "@lib/constants"
import { getTranslations } from "next-intl/server"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Logo from "@modules/common/icons/logo"
import User from "@modules/common/icons/user"
import CartButton from "@modules/layout/components/cart-button"
import ThemeToggle from "@modules/common/components/theme-toggle"
import LanguageSwitcher from "@modules/common/components/language-switcher"
import NavSearchButton from "@modules/layout/components/nav-search-button"

export default async function Nav() {
  const t = await getTranslations("nav")

  return (
    <div className="hidden small:block sticky top-0 inset-x-0 z-50 group">
      <header className="relative h-16 mx-auto border-b duration-200 bg-white dark:bg-gray-950 border-ui-border-base dark:border-gray-800 backdrop-blur-md bg-opacity-90 dark:bg-opacity-90">
        <nav className="content-container txt-xsmall-plus text-ui-fg-subtle dark:text-gray-300 flex items-center justify-between w-full h-full text-small-regular">
          {/* Left: Logo + Store Name */}
          <div className="flex-1 basis-0 h-full flex items-center">
            <LocalizedClientLink
              href="/"
              className="flex items-center gap-2 hover:text-ui-fg-base dark:hover:text-white transition-colors"
              data-testid="nav-store-link"
            >
              <Logo className="h-8 w-auto text-gray-900 dark:text-white" />
              <span className="text-lg font-bold tracking-tight text-gray-900 dark:text-white">
                {STORE_NAME}
              </span>
            </LocalizedClientLink>
          </div>

          {/* Center: Navigation Links */}
          <div className="flex items-center gap-x-6 h-full">
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
