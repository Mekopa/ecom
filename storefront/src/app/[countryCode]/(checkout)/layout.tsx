import { STORE_NAME } from "@lib/constants"
import { getTranslations } from "next-intl/server"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import ChevronDown from "@modules/common/icons/chevron-down"
import Logo from "@modules/common/icons/logo"

export default async function CheckoutLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const t = await getTranslations("checkout")

  return (
    <div className="w-full bg-white relative small:min-h-screen">
      <div className="h-16 bg-white border-b">
        <nav className="flex h-full items-center content-container justify-between">
          <LocalizedClientLink
            href="/cart"
            className="text-small-semi text-ui-fg-base flex items-center gap-x-2 uppercase flex-1 basis-0"
            data-testid="back-to-cart-link"
          >
            <ChevronDown className="rotate-90" size={16} />
            <span className="mt-px hidden small:block txt-compact-plus text-ui-fg-subtle hover:text-ui-fg-base ">
              {t("backToCart")}
            </span>
            <span className="mt-px block small:hidden txt-compact-plus text-ui-fg-subtle hover:text-ui-fg-base">
              {t("back")}
            </span>
          </LocalizedClientLink>
          <LocalizedClientLink
            href="/"
            className="flex items-center gap-2 text-ui-fg-subtle hover:text-ui-fg-base"
            data-testid="store-link"
          >
            <Logo className="h-7 w-auto text-gray-900 dark:text-white" />
            <span className="txt-compact-xlarge-plus uppercase">{STORE_NAME}</span>
          </LocalizedClientLink>
          <div className="flex-1 basis-0" />
        </nav>
      </div>
      <div className="relative" data-testid="checkout-container">{children}</div>
      <div className="py-4 w-full flex items-center justify-center">
        <span className="txt-compact-small text-ui-fg-muted">Powered by {STORE_NAME}</span>
      </div>
    </div>
  )
}
