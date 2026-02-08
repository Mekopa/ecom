import { STORE_NAME } from "@lib/constants"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Logo from "@modules/common/icons/logo"
import LanguageSwitcher from "@modules/common/components/language-switcher"
import ThemeToggle from "@modules/common/components/theme-toggle"

export default function MobileHeader() {
  return (
    <div className="small:hidden">
      <header className="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800">
        <LocalizedClientLink
          href="/"
          className="flex items-center gap-2"
        >
          <Logo className="h-6 w-auto text-gray-900 dark:text-white" />
          <span className="text-sm font-bold tracking-tight text-gray-900 dark:text-white">
            {STORE_NAME}
          </span>
        </LocalizedClientLink>
        <div className="flex items-center gap-x-2">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </header>
    </div>
  )
}
