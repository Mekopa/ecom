import { Heading } from "@medusajs/ui"
import { getTranslations } from "next-intl/server"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

const Hero = async () => {
  const t = await getTranslations("home")

  return (
    <div className="relative h-[75vh] w-full border-b border-ui-border-base dark:border-gray-800 overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-blue-950 to-gray-900 dark:from-gray-950 dark:via-blue-950 dark:to-gray-950" />

      {/* Subtle pattern overlay */}
      <div className="absolute inset-0 opacity-10" style={{
        backgroundImage: "radial-gradient(circle at 25% 25%, rgba(96, 165, 250, 0.3) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(59, 130, 246, 0.2) 0%, transparent 50%)"
      }} />

      {/* Floating decorative elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl" />

      {/* Content */}
      <div className="absolute inset-0 z-10 flex flex-col justify-center items-center text-center px-6 small:px-32 gap-6">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-500/20 border border-blue-500/30 rounded-full text-blue-300 text-sm font-medium backdrop-blur-sm">
          <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
          {t("newArrivals")}
        </div>

        <Heading
          level="h1"
          className="text-4xl small:text-6xl leading-tight font-bold text-white max-w-3xl"
        >
          {t("heroTitle")}
        </Heading>

        <p className="text-lg small:text-xl text-blue-100/80 max-w-xl font-light">
          {t("heroSubtitle")}
        </p>

        <div className="flex gap-4 mt-4">
          <LocalizedClientLink
            href="/store"
            className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition-all duration-200 shadow-lg shadow-blue-600/25 hover:shadow-blue-500/40 hover:-translate-y-0.5"
          >
            {t("heroCta")}
          </LocalizedClientLink>
          <LocalizedClientLink
            href="/categories"
            className="px-8 py-3 bg-white/10 hover:bg-white/20 text-white font-medium rounded-lg transition-all duration-200 border border-white/20 backdrop-blur-sm"
          >
            {t("browseCategories")}
          </LocalizedClientLink>
        </div>

        {/* Trust badges */}
        <div className="flex items-center gap-8 mt-8 text-blue-200/60 text-sm">
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path fillRule="evenodd" d="M16.403 12.652a3 3 0 000-5.304 3 3 0 00-3.75-3.751 3 3 0 00-5.305 0 3 3 0 00-3.751 3.75 3 3 0 000 5.305 3 3 0 003.75 3.751 3 3 0 005.305 0 3 3 0 003.751-3.75zm-2.546-4.46a.75.75 0 00-1.214-.883l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
            </svg>
            {t("freeShipping")}
          </div>
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
            </svg>
            {t("secureCheckout")}
          </div>
          <div className="hidden small:flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path fillRule="evenodd" d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H4.68a.75.75 0 00-.75.75v3.552a.75.75 0 001.5 0v-2.29l.312.31a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39zm1.23-3.723a.75.75 0 00.14-.878A7 7 0 005.258 3.676l-.312-.311V5.8a.75.75 0 01-1.5 0V2.25a.75.75 0 01.75-.75h3.552a.75.75 0 010 1.5H5.314l.312.311a5.5 5.5 0 019.201 2.466.75.75 0 001.414.124z" clipRule="evenodd" />
            </svg>
            {t("returns")}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Hero
