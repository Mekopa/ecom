"use server"

import { revalidateTag } from "next/cache"
import { cookies as nextCookies } from "next/headers"
import { getCacheTag, getCartId } from "./cookies"

const LOCALE_COOKIE_NAME = "_medusa_locale"

/**
 * Gets the current locale from cookies
 */
export const getLocale = async (): Promise<string | null> => {
  try {
    const cookies = await nextCookies()
    return cookies.get(LOCALE_COOKIE_NAME)?.value ?? null
  } catch {
    return null
  }
}

/**
 * Sets both locale cookies so that:
 * - _medusa_locale: used by Medusa SDK / cart
 * - NEXT_LOCALE: used by next-intl for translations
 */
export const setLocaleCookie = async (locale: string) => {
  const cookies = await nextCookies()
  const opts = {
    maxAge: 60 * 60 * 24 * 365, // 1 year
    httpOnly: false, // Allow client-side access
    sameSite: "strict" as const,
    secure: process.env.NODE_ENV === "production",
  }
  cookies.set(LOCALE_COOKIE_NAME, locale, opts)
  cookies.set("NEXT_LOCALE", locale, opts)
}

/**
 * Updates the locale preference via SDK and stores in cookie.
 * Also updates the cart with the new locale if one exists.
 */
export const updateLocale = async (localeCode: string): Promise<string> => {
  await setLocaleCookie(localeCode)

  // Revalidate cart cache so it picks up locale-dependent content
  const cartId = await getCartId()
  if (cartId) {
    const cartCacheTag = await getCacheTag("carts")
    if (cartCacheTag) {
      revalidateTag(cartCacheTag)
    }
  }

  // Revalidate relevant caches to refresh content
  const productsCacheTag = await getCacheTag("products")
  if (productsCacheTag) {
    revalidateTag(productsCacheTag)
  }

  const categoriesCacheTag = await getCacheTag("categories")
  if (categoriesCacheTag) {
    revalidateTag(categoriesCacheTag)
  }

  const collectionsCacheTag = await getCacheTag("collections")
  if (collectionsCacheTag) {
    revalidateTag(collectionsCacheTag)
  }

  return localeCode
}
