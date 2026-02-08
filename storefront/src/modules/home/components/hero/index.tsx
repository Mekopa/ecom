import { getTranslations } from "next-intl/server"
import { listCategories } from "@lib/data/categories"
import HeroInteractive from "./hero-interactive"

const Hero = async () => {
  const [t, tCat, productCategories] = await Promise.all([
    getTranslations("home"),
    getTranslations("categories"),
    listCategories(),
  ])

  const topCategories = (productCategories || [])
    .filter((c) => !c.parent_category)
    .slice(0, 6)
    .map((cat) => ({
      id: cat.id,
      handle: cat.handle,
      name: tCat.has(cat.handle) ? tCat(cat.handle) : cat.name,
    }))

  const placeholders = topCategories.map((cat) =>
    t("searchPlaceholder", { category: cat.name })
  )
  if (!placeholders.length) {
    placeholders.push("Search products...")
  }

  return (
    <HeroInteractive
      title={t("heroTitle")}
      subtitle={t("heroSubtitle")}
      placeholders={placeholders}
      noResultsText={t("noResults")}
      viewAllText={t("viewAll")}
      categories={topCategories}
    />
  )
}

export default Hero
