import { Heading } from "@medusajs/ui"
import { getTranslations } from "next-intl/server"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

const Hero = async () => {
  const t = await getTranslations("home")

  return (
    <div className="relative w-full border-b border-ui-border-base dark:border-gray-800 overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-sky-100 to-blue-50 dark:from-gray-950 dark:via-blue-950 dark:to-gray-950" />

      {/* Circuit pattern overlay — dark strokes for light mode */}
      <div className="absolute inset-0 opacity-[0.12] dark:hidden" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%231e40af' stroke-width='0.5'%3E%3Cpath d='M30 0v15m0 30v15M0 30h15m30 0h15'/%3E%3Ccircle cx='30' cy='30' r='3'/%3E%3Ccircle cx='30' cy='0' r='1.5'/%3E%3Ccircle cx='30' cy='60' r='1.5'/%3E%3Ccircle cx='0' cy='30' r='1.5'/%3E%3Ccircle cx='60' cy='30' r='1.5'/%3E%3C/g%3E%3C/svg%3E")`,
      }} />
      {/* Circuit pattern overlay — light strokes for dark mode */}
      <div className="absolute inset-0 opacity-[0.07] hidden dark:block" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%2360a5fa' stroke-width='0.5'%3E%3Cpath d='M30 0v15m0 30v15M0 30h15m30 0h15'/%3E%3Ccircle cx='30' cy='30' r='3'/%3E%3Ccircle cx='30' cy='0' r='1.5'/%3E%3Ccircle cx='30' cy='60' r='1.5'/%3E%3Ccircle cx='0' cy='30' r='1.5'/%3E%3Ccircle cx='60' cy='30' r='1.5'/%3E%3C/g%3E%3C/svg%3E")`,
      }} />

      {/* Floating decorative elements */}
      <div className="absolute top-10 left-10 w-72 h-72 bg-blue-600/10 dark:bg-blue-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-blue-500/10 dark:bg-blue-400/10 rounded-full blur-3xl" />

      {/* Content */}
      <div className="relative z-10 content-container py-16 small:py-24">
        <div className="flex items-center gap-12">
          {/* Text column */}
          <div className="flex flex-col items-center small:items-start text-center small:text-left gap-6 flex-1">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-600/10 border border-blue-600/20 text-blue-700 dark:bg-blue-500/20 dark:border-blue-500/30 dark:text-blue-300 rounded-full text-sm font-medium backdrop-blur-sm">
              <span className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full animate-pulse" />
              {t("newArrivals")}
            </div>

            <Heading
              level="h1"
              className="text-3xl small:text-5xl leading-tight font-bold text-gray-900 dark:text-white max-w-xl"
            >
              {t("heroTitle")}
            </Heading>

            <p className="text-lg text-blue-900/60 dark:text-blue-100/80 max-w-md font-light">
              {t("heroSubtitle")}
            </p>

            <div className="flex gap-4 mt-2">
              <LocalizedClientLink
                href="/store"
                className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition-all duration-200 shadow-lg shadow-blue-600/25 hover:shadow-blue-500/40 hover:-translate-y-0.5"
              >
                {t("heroCta")}
              </LocalizedClientLink>
              <LocalizedClientLink
                href="/categories"
                className="px-8 py-3 bg-blue-900/10 hover:bg-blue-900/15 text-blue-900 border border-blue-900/20 dark:bg-white/10 dark:hover:bg-white/20 dark:text-white dark:border-white/20 font-medium rounded-lg transition-all duration-200 backdrop-blur-sm"
              >
                {t("browseCategories")}
              </LocalizedClientLink>
            </div>
          </div>

          {/* Decorative SVG — hidden on mobile */}
          <div className="hidden small:flex items-center justify-center flex-1">
            <div className="animate-float">
              <svg
                viewBox="0 0 400 400"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-80 h-80 text-blue-700/30 dark:text-blue-400/30"
              >
                {/* Outer ring */}
                <circle cx="200" cy="200" r="180" stroke="currentColor" strokeWidth="1" opacity="0.3" />
                <circle cx="200" cy="200" r="150" stroke="currentColor" strokeWidth="0.5" opacity="0.2" strokeDasharray="8 6" />

                {/* Phone outline */}
                <rect x="155" y="90" width="90" height="160" rx="16" stroke="currentColor" strokeWidth="2" opacity="0.8" />
                <rect x="163" y="106" width="74" height="124" rx="4" stroke="currentColor" strokeWidth="1" opacity="0.3" />
                <rect x="185" y="94" width="30" height="6" rx="3" stroke="currentColor" strokeWidth="1" opacity="0.4" />

                {/* Laptop outline */}
                <rect x="60" y="230" width="120" height="75" rx="8" stroke="currentColor" strokeWidth="2" opacity="0.6" />
                <path d="M45 309h150l-8 18H53l-8-18z" stroke="currentColor" strokeWidth="1.5" opacity="0.5" strokeLinejoin="round" />
                <line x1="76" y1="314" x2="164" y2="314" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />

                {/* Headphones */}
                <path d="M280 260c0-24 12-44 30-44s30 20 30 44" stroke="currentColor" strokeWidth="2" opacity="0.6" strokeLinecap="round" />
                <rect x="270" y="258" width="20" height="30" rx="10" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
                <rect x="330" y="258" width="20" height="30" rx="10" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />

                {/* Watch */}
                <circle cx="320" cy="150" r="22" stroke="currentColor" strokeWidth="1.5" opacity="0.6" />
                <line x1="320" y1="150" x2="320" y2="136" stroke="currentColor" strokeWidth="1.5" opacity="0.5" strokeLinecap="round" />
                <line x1="320" y1="150" x2="330" y2="146" stroke="currentColor" strokeWidth="1" opacity="0.4" strokeLinecap="round" />
                <path d="M308 128v-14h24v14" stroke="currentColor" strokeWidth="1" opacity="0.3" />
                <path d="M308 172v14h24v-14" stroke="currentColor" strokeWidth="1" opacity="0.3" />

                {/* Decorative dots */}
                <circle cx="100" cy="160" r="3" fill="currentColor" opacity="0.4" />
                <circle cx="80" cy="200" r="2" fill="currentColor" opacity="0.3" />
                <circle cx="340" cy="200" r="3" fill="currentColor" opacity="0.4" />
                <circle cx="200" cy="370" r="2" fill="currentColor" opacity="0.3" />

                {/* Connection lines */}
                <line x1="200" y1="250" x2="120" y2="265" stroke="currentColor" strokeWidth="0.5" opacity="0.2" strokeDasharray="4 4" />
                <line x1="245" y1="170" x2="298" y2="150" stroke="currentColor" strokeWidth="0.5" opacity="0.2" strokeDasharray="4 4" />
                <line x1="200" y1="250" x2="290" y2="260" stroke="currentColor" strokeWidth="0.5" opacity="0.2" strokeDasharray="4 4" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Hero
