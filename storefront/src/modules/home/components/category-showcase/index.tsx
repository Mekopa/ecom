import { listCategories } from "@lib/data/categories"
import { getTranslations } from "next-intl/server"
import CategoryCarousel from "./category-carousel"

export default async function CategoryShowcase() {
  const [productCategories, t, tCat] = await Promise.all([
    listCategories(),
    getTranslations("home"),
    getTranslations("categories"),
  ])

  if (!productCategories?.length) return null

  const topCategories = productCategories
    .filter((c) => !c.parent_category)
    .slice(0, 6)

  const categories = topCategories.map((cat) => {
    const count = cat.products?.length ?? 0
    return {
      id: cat.id,
      handle: cat.handle,
      name: tCat.has(cat.handle) ? tCat(cat.handle) : cat.name,
      productCountLabel: t("categoryProductCount", { count }),
    }
  })

  return (
    <div className="py-16 bg-[var(--bg-primary)]">
      <div className="content-container">
        <div className="flex flex-col items-center mb-10">
          <h2 className="text-2xl small:text-3xl font-bold text-gray-900 dark:text-white">
            {t("categoriesTitle")}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            {t("categoriesSubtitle")}
          </p>
        </div>

        <CategoryCarousel categories={categories} />
      </div>
    </div>
  )
}
