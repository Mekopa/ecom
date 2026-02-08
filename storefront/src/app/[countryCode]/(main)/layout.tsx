import { Metadata } from "next"

import { listCartOptions, retrieveCart } from "@lib/data/cart"
import { retrieveCustomer } from "@lib/data/customer"
import { getBaseURL } from "@lib/util/env"
import { listRegions } from "@lib/data/regions"
import { listLocales } from "@lib/data/locales"
import { getLocale } from "@lib/data/locale-actions"
import { StoreCartShippingOption } from "@medusajs/types"
import CartMismatchBanner from "@modules/layout/components/cart-mismatch-banner"
import Footer from "@modules/layout/templates/footer"
import Nav from "@modules/layout/templates/nav"
import MobileHeader from "@modules/layout/components/mobile-header"
import BottomNav from "@modules/layout/components/bottom-nav"
import FreeShippingPriceNudge from "@modules/shipping/components/free-shipping-price-nudge"

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
}

export default async function PageLayout(props: { children: React.ReactNode }) {
  const [customer, cart, regions, locales, currentLocale] = await Promise.all([
    retrieveCustomer(),
    retrieveCart(),
    listRegions(),
    listLocales(),
    getLocale(),
  ])

  let shippingOptions: StoreCartShippingOption[] = []

  if (cart) {
    const { shipping_options } = await listCartOptions()
    shippingOptions = shipping_options
  }

  const totalItems =
    cart?.items?.reduce((acc, item) => acc + item.quantity, 0) || 0

  return (
    <>
      <Nav />
      <MobileHeader />
      {customer && cart && (
        <CartMismatchBanner customer={customer} cart={cart} />
      )}

      {cart && (
        <FreeShippingPriceNudge
          variant="popup"
          cart={cart}
          shippingOptions={shippingOptions}
        />
      )}
      <div className="pb-20 small:pb-0">{props.children}</div>
      <Footer />
      <BottomNav
        totalItems={totalItems}
        regions={regions}
        locales={locales}
        currentLocale={currentLocale}
      />
    </>
  )
}
