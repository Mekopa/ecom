import { HttpTypes } from "@medusajs/types"
import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || process.env.MEDUSA_BACKEND_URL
const PUBLISHABLE_API_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
const DEFAULT_REGION = process.env.NEXT_PUBLIC_DEFAULT_REGION || "us"

// Country code → default locale mapping for auto-detection
const countryToLocale: Record<string, string> = {
  // EU countries
  at: "de",  // Austria → German
  be: "fr",  // Belgium → French
  bg: "en",  // Bulgaria
  hr: "en",  // Croatia
  cy: "en",  // Cyprus
  cz: "en",  // Czech Republic
  dk: "en",  // Denmark
  ee: "et",  // Estonia → Estonian
  fi: "en",  // Finland
  fr: "fr",  // France → French
  de: "de",  // Germany → German
  gr: "en",  // Greece
  hu: "en",  // Hungary
  ie: "en",  // Ireland → English
  it: "en",  // Italy
  lv: "lv",  // Latvia → Latvian
  lt: "lt",  // Lithuania → Lithuanian
  lu: "fr",  // Luxembourg → French
  mt: "en",  // Malta → English
  nl: "en",  // Netherlands
  pl: "pl",  // Poland → Polish
  pt: "en",  // Portugal
  ro: "en",  // Romania
  sk: "en",  // Slovakia
  si: "en",  // Slovenia
  es: "en",  // Spain
  se: "en",  // Sweden
  // Non-EU
  gb: "en",  // United Kingdom → English
  us: "en",  // United States → English
  ca: "en",  // Canada → English
  tr: "tr",  // Turkey → Turkish
}

// Language code → most likely country code mapping
// Used when Accept-Language has no region subtag (e.g., "tr" instead of "tr-TR")
const langToCountry: Record<string, string> = {
  en: "us",
  de: "de",
  fr: "fr",
  nl: "nl",
  it: "it",
  es: "es",
  tr: "tr",
  pl: "pl",
  lt: "lt",
  et: "ee",
  lv: "lv",
  da: "dk",
  fi: "fi",
  el: "gr",
  hu: "hu",
  cs: "cz",
  sk: "sk",
  sl: "si",
  hr: "hr",
  bg: "bg",
  ro: "ro",
  pt: "pt",
  sv: "se",
  ga: "ie",
}

const regionMapCache = {
  regionMap: new Map<string, HttpTypes.StoreRegion>(),
  regionMapUpdated: Date.now(),
}

async function getRegionMap(cacheId: string) {
  const { regionMap, regionMapUpdated } = regionMapCache

  if (!BACKEND_URL) {
    throw new Error(
      "Middleware.ts: Error fetching regions. Did you set up regions in your Medusa Admin and define a MEDUSA_BACKEND_URL environment variable? Note that the variable is no longer named NEXT_PUBLIC_MEDUSA_BACKEND_URL."
    )
  }

  if (
    !regionMap.keys().next().value ||
    regionMapUpdated < Date.now() - 3600 * 1000
  ) {
    // Fetch regions from Medusa. We can't use the JS client here because middleware is running on Edge and the client needs a Node environment.
    const { regions } = await fetch(`${BACKEND_URL}/store/regions`, {
      headers: {
        "x-publishable-api-key": PUBLISHABLE_API_KEY!,
      },
      next: {
        revalidate: 3600,
        tags: [`regions-${cacheId}`],
      },
      cache: "force-cache",
    }).then(async (response) => {
      const json = await response.json()

      if (!response.ok) {
        throw new Error(json.message)
      }

      return json
    })

    if (!regions?.length) {
      throw new Error(
        "No regions found. Please set up regions in your Medusa Admin."
      )
    }

    // Create a map of country codes to regions.
    regions.forEach((region: HttpTypes.StoreRegion) => {
      region.countries?.forEach((c) => {
        regionMapCache.regionMap.set(c.iso_2 ?? "", region)
      })
    })

    regionMapCache.regionMapUpdated = Date.now()
  }

  return regionMapCache.regionMap
}

/**
 * Looks up country code from IP address using geojs.io.
 * Only called on first visit (no cookie). Returns 2-letter country code or undefined.
 * Has a 1.5s timeout to avoid blocking page loads if the service is slow.
 */
async function getCountryFromIP(
  request: NextRequest
): Promise<string | undefined> {
  const ip =
    request.headers.get("x-envoy-external-address") ||
    request.headers.get("x-real-ip") ||
    request.headers.get("x-forwarded-for")?.split(",").pop()?.trim()

  if (!ip || ip === "unknown" || ip === "127.0.0.1" || ip === "::1") {
    return undefined
  }

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 1500)

    const res = await fetch(`https://get.geojs.io/v1/ip/country/${ip}`, {
      signal: controller.signal,
      cache: "no-store",
    })

    clearTimeout(timeout)

    if (!res.ok) return undefined

    const country = (await res.text()).trim().toLowerCase()
    return country.length === 2 ? country : undefined
  } catch {
    // Timeout or network error — silently fall through
    return undefined
  }
}

/**
 * Parses Accept-Language header to detect user's country.
 * Examples:
 *   "tr-TR,tr;q=0.9,en-US;q=0.8" → "tr"
 *   "de-DE,de;q=0.9,en;q=0.8"    → "de"
 *   "fr;q=0.9,en;q=0.8"          → "fr"
 */
function getCountryFromAcceptLanguage(
  acceptLanguage: string | null,
  regionMap: Map<string, HttpTypes.StoreRegion | number>
): string | undefined {
  if (!acceptLanguage) return undefined

  // Parse and sort by quality factor
  const locales = acceptLanguage
    .split(",")
    .map((part) => {
      const [locale, q] = part.trim().split(";q=")
      return { locale: locale.trim(), quality: q ? parseFloat(q) : 1.0 }
    })
    .sort((a, b) => b.quality - a.quality)

  for (const { locale } of locales) {
    // Try region subtag first: "tr-TR" → "tr", "de-AT" → "at", "en-GB" → "gb"
    const parts = locale.toLowerCase().split("-")
    if (parts.length >= 2) {
      const regionCode = parts[1]
      if (regionMap.has(regionCode)) {
        return regionCode
      }
    }
    // Try language-to-country mapping: "tr" → "tr", "de" → "de"
    const langCode = parts[0]
    const mappedCountry = langToCountry[langCode]
    if (mappedCountry && regionMap.has(mappedCountry)) {
      return mappedCountry
    }
  }

  return undefined
}

async function getCountryCode(
  request: NextRequest,
  regionMap: Map<string, HttpTypes.StoreRegion | number>
) {
  try {
    let countryCode

    const vercelCountryCode = request.headers
      .get("x-vercel-ip-country")
      ?.toLowerCase()

    const cfCountryCode = request.headers
      .get("cf-ipcountry")
      ?.toLowerCase()

    const urlCountryCode = request.nextUrl.pathname.split("/")[1]?.toLowerCase()

    // Check if user has a saved country preference (from CountrySelect)
    const savedCountry = request.cookies.get("_medusa_country")?.value?.toLowerCase()

    if (urlCountryCode && regionMap.has(urlCountryCode)) {
      // 1. URL already has a valid country code
      countryCode = urlCountryCode
    } else if (savedCountry && regionMap.has(savedCountry)) {
      // 2. Explicit country preference (set via CountrySelect)
      countryCode = savedCountry
    } else if (vercelCountryCode && regionMap.has(vercelCountryCode)) {
      // 3. Vercel geo-IP header
      countryCode = vercelCountryCode
    } else if (cfCountryCode && regionMap.has(cfCountryCode)) {
      // 4. Cloudflare geo-IP header
      countryCode = cfCountryCode
    } else {
      // 5. IP-based geo-lookup (Railway/generic hosting — only when no cookie exists)
      const hasCountryCookie = !!request.cookies.get("_medusa_country")?.value
      const ipCountry = hasCountryCookie ? undefined : await getCountryFromIP(request)
      if (ipCountry && regionMap.has(ipCountry)) {
        countryCode = ipCountry
      } else {
        // 6. Browser Accept-Language header
        const acceptLangCountry = getCountryFromAcceptLanguage(
          request.headers.get("accept-language"),
          regionMap
        )
        if (acceptLangCountry) {
          countryCode = acceptLangCountry
        } else if (regionMap.has(DEFAULT_REGION)) {
          // 7. Default region fallback
          countryCode = DEFAULT_REGION
        } else if (regionMap.keys().next().value) {
          countryCode = regionMap.keys().next().value
        }
      }
    }

    return countryCode
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error(
        "Middleware.ts: Error getting the country code. Did you set up regions in your Medusa Admin and define a MEDUSA_BACKEND_URL environment variable? Note that the variable is no longer named NEXT_PUBLIC_MEDUSA_BACKEND_URL."
      )
    }
  }
}

/**
 * Middleware to handle region selection and onboarding status.
 */
export async function middleware(request: NextRequest) {
  let redirectUrl = request.nextUrl.href

  let response = NextResponse.redirect(redirectUrl, 307)

  let cacheIdCookie = request.cookies.get("_medusa_cache_id")

  let cacheId = cacheIdCookie?.value || crypto.randomUUID()

  const regionMap = await getRegionMap(cacheId)

  const countryCode = regionMap && (await getCountryCode(request, regionMap))

  const urlHasCountryCode =
    countryCode && request.nextUrl.pathname.split("/")[1].includes(countryCode)

  // if one of the country codes is in the url and the cache id is set, auto-detect locale if needed
  if (urlHasCountryCode && cacheIdCookie) {
    const hasLocaleCookie = request.cookies.get("NEXT_LOCALE")?.value
    const hasCountryCookie = request.cookies.get("_medusa_country")?.value
    const needsUpdate = (!hasLocaleCookie && countryCode) || (!hasCountryCookie && countryCode)

    if (needsUpdate) {
      const response = NextResponse.next()
      if (!hasLocaleCookie && countryCode) {
        const detectedLocale = countryToLocale[countryCode] || "en"
        response.cookies.set("NEXT_LOCALE", detectedLocale, {
          maxAge: 60 * 60 * 24 * 365,
        })
        response.cookies.set("_medusa_locale", detectedLocale, {
          maxAge: 60 * 60 * 24 * 365,
        })
      }
      if (!hasCountryCookie && countryCode) {
        response.cookies.set("_medusa_country", countryCode, {
          maxAge: 60 * 60 * 24 * 365,
        })
      }
      return response
    }
    return NextResponse.next()
  }

  // if one of the country codes is in the url and the cache id is not set, set the cache id + locale and redirect
  if (urlHasCountryCode && !cacheIdCookie) {
    response.cookies.set("_medusa_cache_id", cacheId, {
      maxAge: 60 * 60 * 24,
    })

    // Auto-detect locale and country on first visit
    if (countryCode) {
      const detectedLocale = countryToLocale[countryCode] || "en"
      response.cookies.set("NEXT_LOCALE", detectedLocale, {
        maxAge: 60 * 60 * 24 * 365,
      })
      response.cookies.set("_medusa_locale", detectedLocale, {
        maxAge: 60 * 60 * 24 * 365,
      })
      response.cookies.set("_medusa_country", countryCode, {
        maxAge: 60 * 60 * 24 * 365,
      })
    }

    return response
  }

  // check if the url is a static asset
  if (request.nextUrl.pathname.includes(".")) {
    return NextResponse.next()
  }

  const redirectPath =
    request.nextUrl.pathname === "/" ? "" : request.nextUrl.pathname

  const queryString = request.nextUrl.search ? request.nextUrl.search : ""

  // If no country code is set, we redirect to the relevant region.
  if (!urlHasCountryCode && countryCode) {
    redirectUrl = `${request.nextUrl.origin}/${countryCode}${redirectPath}${queryString}`
    response = NextResponse.redirect(`${redirectUrl}`, 307)
  } else if (!urlHasCountryCode && !countryCode) {
    // Handle case where no valid country code exists (empty regions)
    return new NextResponse(
      "No valid regions configured. Please set up regions with countries in your Medusa Admin.",
      { status: 500 }
    )
  }

  return response
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|images|assets|png|svg|jpg|jpeg|gif|webp).*)",
  ],
}
