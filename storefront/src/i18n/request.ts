import { getRequestConfig } from "next-intl/server"
import { cookies } from "next/headers"

// Country code → default locale mapping
const countryToLocale: Record<string, string> = {
  us: "en",
  ca: "en",
  gb: "en",
  de: "de",
  fr: "fr",
  nl: "en",
  it: "en",
  es: "en",
  tr: "tr",
  pl: "pl",
  lt: "lt",
  ee: "et",
  lv: "lv",
}

export const supportedLocales = ["en", "tr", "de", "fr", "pl", "lt", "et", "lv"] as const
export type SupportedLocale = (typeof supportedLocales)[number]

export const localeNames: Record<SupportedLocale, string> = {
  en: "English",
  tr: "Türkçe",
  de: "Deutsch",
  fr: "Français",
  pl: "Polski",
  lt: "Lietuvių",
  et: "Eesti",
  lv: "Latviešu",
}

export default getRequestConfig(async () => {
  const cookieStore = await cookies()

  // 1. Check explicit user preference cookie (both names are kept in sync)
  const localeCookie =
    cookieStore.get("NEXT_LOCALE")?.value ||
    cookieStore.get("_medusa_locale")?.value
  if (localeCookie && supportedLocales.includes(localeCookie as SupportedLocale)) {
    return {
      locale: localeCookie,
      messages: (await import(`../messages/${localeCookie}.json`)).default,
    }
  }

  // 2. Derive from country code cookie (set by Medusa middleware)
  const regionCookie = cookieStore.get("_medusa_region")?.value
  // The country code can also be extracted from the URL path via the middleware
  // For now we fall back to the cookie or default
  let countryCode = "us"
  if (regionCookie) {
    try {
      const parsed = JSON.parse(regionCookie)
      countryCode = parsed.countryCode || "us"
    } catch {
      // ignore parse errors
    }
  }

  const locale = countryToLocale[countryCode] || "en"
  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  }
})
