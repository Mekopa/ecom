import { HttpTypes } from "@medusajs/types"
import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL
const PUBLISHABLE_API_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
const DEFAULT_REGION = process.env.NEXT_PUBLIC_DEFAULT_REGION || "us"

// Country code → default locale mapping for auto-detection
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

// Language code → most likely country code mapping
// Used when Accept-Language has no region subtag (e.g., "tr" instead of "tr-TR")
const langToCountry: Record<string, string> = {
  tr: "tr",
  de: "de",
  fr: "fr",
  en: "us",
  nl: "nl",
  it: "it",
  es: "es",
  pl: "pl",
  lt: "lt",
  et: "ee",
  lv: "lv",
}

const regionMapCache = {
  regionMap: new Map<string, HttpTypes.StoreRegion>(),
  regionMapUpdated: Date.now(),
}

async function getRegionMap(cacheId: string) {
  const { regionMap, regionMapUpdated } = regionMapCache

  if (
    !regionMap.keys().next().value ||
    regionMapUpdated < Date.now() - 3600 * 1000
  ) {
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
 * Parses Accept-Language header to detect user's country.
 */
function getCountryFromAcceptLanguage(
  acceptLanguage: string | null,
  regionMap: Map<string, HttpTypes.StoreRegion | number>
): string | undefined {
  if (!acceptLanguage) return undefined

  const locales = acceptLanguage
    .split(",")
    .map((part) => {
      const [locale, q] = part.trim().split(";q=")
      return { locale: locale.trim(), quality: q ? parseFloat(q) : 1.0 }
    })
    .sort((a, b) => b.quality - a.quality)

  for (const { locale } of locales) {
    const parts = locale.toLowerCase().split("-")
    if (parts.length >= 2) {
      const regionCode = parts[1]
      if (regionMap.has(regionCode)) {
        return regionCode
      }
    }
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

    const savedCountry = request.cookies.get("_medusa_country")?.value?.toLowerCase()

    if (urlCountryCode && regionMap.has(urlCountryCode)) {
      countryCode = urlCountryCode
    } else if (savedCountry && regionMap.has(savedCountry)) {
      countryCode = savedCountry
    } else if (vercelCountryCode && regionMap.has(vercelCountryCode)) {
      countryCode = vercelCountryCode
    } else if (cfCountryCode && regionMap.has(cfCountryCode)) {
      countryCode = cfCountryCode
    } else {
      const acceptLangCountry = getCountryFromAcceptLanguage(
        request.headers.get("accept-language"),
        regionMap
      )
      if (acceptLangCountry) {
        countryCode = acceptLangCountry
      } else if (regionMap.has(DEFAULT_REGION)) {
        countryCode = DEFAULT_REGION
      } else if (regionMap.keys().next().value) {
        countryCode = regionMap.keys().next().value
      }
    }

    return countryCode
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error(
        "Middleware.ts: Error getting the country code. Did you set up regions in your Medusa Admin and define a NEXT_PUBLIC_MEDUSA_BACKEND_URL environment variable?"
      )
    }
  }
}

/**
 * Middleware to handle region selection, locale detection, and onboarding status.
 */
export async function middleware(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const isOnboarding = searchParams.get("onboarding") === "true"
  const cartId = searchParams.get("cart_id")
  const checkoutStep = searchParams.get("step")
  const onboardingCookie = request.cookies.get("_medusa_onboarding")
  const cartIdCookie = request.cookies.get("_medusa_cart_id")

  let cacheIdCookie = request.cookies.get("_medusa_cache_id")
  let cacheId = cacheIdCookie?.value || crypto.randomUUID()

  const regionMap = await getRegionMap(cacheId)

  const countryCode = regionMap && (await getCountryCode(request, regionMap))

  const urlHasCountryCode =
    countryCode && request.nextUrl.pathname.split("/")[1].includes(countryCode)

  // URL has country code, cache is set, and no special params — auto-detect locale if needed
  if (
    urlHasCountryCode &&
    cacheIdCookie &&
    (!isOnboarding || onboardingCookie) &&
    (!cartId || cartIdCookie)
  ) {
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

  // URL has country code but no cache — first visit, set cache + locale cookies
  if (urlHasCountryCode && !cacheIdCookie) {
    let redirectUrl = request.nextUrl.href
    let response = NextResponse.redirect(redirectUrl, 307)

    response.cookies.set("_medusa_cache_id", cacheId, {
      maxAge: 60 * 60 * 24,
    })

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

    // Handle onboarding and cart params
    if (isOnboarding) {
      response.cookies.set("_medusa_onboarding", "true", { maxAge: 60 * 60 * 24 })
    }
    if (cartId && !checkoutStep) {
      redirectUrl = `${redirectUrl}&step=address`
      response = NextResponse.redirect(`${redirectUrl}`, 307)
      response.cookies.set("_medusa_cart_id", cartId, { maxAge: 60 * 60 * 24 })
    }

    return response
  }

  // Static asset check
  if (request.nextUrl.pathname.includes(".")) {
    return NextResponse.next()
  }

  const redirectPath =
    request.nextUrl.pathname === "/" ? "" : request.nextUrl.pathname

  const queryString = request.nextUrl.search ? request.nextUrl.search : ""

  let redirectUrl = request.nextUrl.href
  let response = NextResponse.redirect(redirectUrl, 307)

  // No country code in URL — redirect to detected region
  if (!urlHasCountryCode && countryCode) {
    redirectUrl = `${request.nextUrl.origin}/${countryCode}${redirectPath}${queryString}`
    response = NextResponse.redirect(`${redirectUrl}`, 307)
  } else if (!urlHasCountryCode && !countryCode) {
    return new NextResponse(
      "No valid regions configured. Please set up regions with countries in your Medusa Admin.",
      { status: 500 }
    )
  }

  // Handle onboarding and cart params on redirect
  if (cartId && !checkoutStep) {
    redirectUrl = `${redirectUrl}&step=address`
    response = NextResponse.redirect(`${redirectUrl}`, 307)
    response.cookies.set("_medusa_cart_id", cartId, { maxAge: 60 * 60 * 24 })
  }

  if (isOnboarding) {
    response.cookies.set("_medusa_onboarding", "true", { maxAge: 60 * 60 * 24 })
  }

  return response
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|images|assets|png|svg|jpg|jpeg|gif|webp).*)",
  ],
}
