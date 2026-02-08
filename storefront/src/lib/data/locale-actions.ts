"use server"

import { revalidateTag } from "next/cache"
import { cookies as nextCookies } from "next/headers"

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
    maxAge: 60 * 60 * 24 * 365,
    httpOnly: false,
    sameSite: "strict" as const,
    secure: process.env.NODE_ENV === "production",
  }
  cookies.set(LOCALE_COOKIE_NAME, locale, opts)
  cookies.set("NEXT_LOCALE", locale, opts)
}

/**
 * Updates the locale preference and revalidates caches.
 */
export const updateLocale = async (localeCode: string): Promise<string> => {
  await setLocaleCookie(localeCode)

  revalidateTag("products")
  revalidateTag("categories")
  revalidateTag("collections")

  return localeCode
}
