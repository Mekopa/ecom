"use server"

export type Locale = {
  code: string
  name: string
}

/**
 * Supported storefront locales.
 * Edit this list to add/remove languages — no backend endpoint needed.
 */
const SUPPORTED_LOCALES: Locale[] = [
  { code: "en", name: "English" },
  { code: "tr", name: "Türkçe" },
  { code: "de", name: "Deutsch" },
  { code: "fr", name: "Français" },
  { code: "pl", name: "Polski" },
  { code: "lt", name: "Lietuvių" },
  { code: "et", name: "Eesti" },
  { code: "lv", name: "Latviešu" },
]

export const listLocales = async (): Promise<Locale[] | null> => {
  return SUPPORTED_LOCALES
}
