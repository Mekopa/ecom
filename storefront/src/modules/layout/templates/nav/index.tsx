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
import FloatingNav from "@modules/layout/components/floating-nav"

export default async function Nav() {
  const t = await getTranslations("nav")

  return (
    <FloatingNav>
      {/* Desktop nav */}
      <nav className="hidden small:flex items-center justify-between w-full h-full px-6 text-sm text-gray-600 dark:text-gray-300">
        {/* Left: Logo + Store Name */}
        <div className="flex-1 basis-0 flex items-center">
          <LocalizedClientLink
            href="/"
            className="flex items-center gap-2 hover:text-gray-900 dark:hover:text-white transition-colors"
            data-testid="nav-store-link"
          >
            <Logo className="h-8 w-auto text-gray-900 dark:text-white" />
            <span className="text-lg font-bold tracking-tight text-gray-900 dark:text-white">
              {STORE_NAME}
            </span>
          </LocalizedClientLink>
        </div>

        {/* Right: Utilities */}
        <div className="flex items-center gap-x-3 flex-1 basis-0 justify-end">
          <NavSearchButton />
          <LanguageSwitcher />
          <ThemeToggle />
          <LocalizedClientLink
            className="flex items-center gap-1.5 hover:text-gray-900 dark:hover:text-white transition-colors"
            href="/account"
            data-testid="nav-account-link"
          >
            <User size="18" />
            {t("account")}
          </LocalizedClientLink>
          <Suspense
            fallback={
              <LocalizedClientLink
                className="hover:text-gray-900 dark:hover:text-white flex gap-2 transition-colors"
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

      {/* Mobile nav */}
      <nav className="flex small:hidden items-center justify-between w-full h-full px-4 text-gray-600 dark:text-gray-300">
        <LocalizedClientLink
          href="/"
          className="flex items-center gap-2"
        >
          <Logo className="h-7 w-auto text-gray-900 dark:text-white" />
          <span className="text-base font-bold tracking-tight text-gray-900 dark:text-white">
            {STORE_NAME}
          </span>
        </LocalizedClientLink>
        <div className="flex items-center gap-x-2">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </nav>
    </FloatingNav>
  )
}
