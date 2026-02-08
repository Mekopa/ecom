import LocalizedClientLink from "@modules/common/components/localized-client-link"
import CategoryIcons from "./category-icons"

type CategoryData = {
  id: string
  handle: string
  name: string
  productCountLabel: string
}

const gradients: Record<string, string> = {
  smartphones: "from-blue-100 to-blue-200 dark:from-blue-950 dark:to-blue-900",
  laptops: "from-violet-100 to-violet-200 dark:from-violet-950 dark:to-violet-900",
  audio: "from-amber-100 to-amber-200 dark:from-amber-950 dark:to-amber-900",
  wearables: "from-emerald-100 to-emerald-200 dark:from-emerald-950 dark:to-emerald-900",
  cameras: "from-rose-100 to-rose-200 dark:from-rose-950 dark:to-rose-900",
  accessories: "from-cyan-100 to-cyan-200 dark:from-cyan-950 dark:to-cyan-900",
}

const iconColors: Record<string, string> = {
  smartphones: "text-blue-600 dark:text-blue-400",
  laptops: "text-violet-600 dark:text-violet-400",
  audio: "text-amber-600 dark:text-amber-400",
  wearables: "text-emerald-600 dark:text-emerald-400",
  cameras: "text-rose-600 dark:text-rose-400",
  accessories: "text-cyan-600 dark:text-cyan-400",
}

const defaultGradient = "from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-800"
const defaultIconColor = "text-gray-600 dark:text-gray-400"

/*
  Auto-adjusting bento grid:

  Items are grouped in chunks of 3. Each chunk has 1 featured (row-span-2)
  + 2 normal cards. Featured cards alternate left/right per chunk.
  CSS grid-auto-flow: dense fills gaps automatically.

  Chunk 0 (left):        Chunk 1 (right):
  ┌────────┬──────┐      ┌──────┬────────┐
  │ feat ↕ │ norm │      │ norm │ feat ↕ │
  │        ├──────┤      ├──────┤        │
  │        │ norm │      │ norm │        │
  └────────┴──────┘      └──────┴────────┘

  Works for any count: 3, 4, 5, 6, 7, 8, 9, 12 ...
*/

export default function CategoryGrid({
  categories,
}: {
  categories: CategoryData[]
}) {
  return (
    <div className="grid grid-cols-2 gap-3 small:gap-4 auto-rows-[140px] small:auto-rows-[180px] grid-flow-row-dense">
      {categories.map((category, index) => {
        const chunk = Math.floor(index / 3)
        const posInChunk = index % 3
        const isFeatured = posInChunk === 0
        const featuredOnLeft = chunk % 2 === 0

        const Icon = CategoryIcons[category.handle] || CategoryIcons.accessories
        const gradient = gradients[category.handle] || defaultGradient
        const iconColor = iconColors[category.handle] || defaultIconColor

        const desktopSpan = isFeatured
          ? `small:row-span-2 ${featuredOnLeft ? "small:col-start-1" : "small:col-start-2"}`
          : ""

        return (
          <LocalizedClientLink
            key={category.id}
            href={`/categories/${category.handle}`}
            className={`group relative flex flex-col items-center justify-center rounded-2xl bg-gradient-to-br ${gradient} overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-gray-900/10 dark:hover:shadow-black/30
              ${desktopSpan}
            `}
          >
            {/* Icon — centered on mobile, absolutely positioned on desktop */}
            <Icon
              className={`${iconColor} transition-transform duration-300 group-hover:scale-110
                ${isFeatured ? "w-12 h-12" : "w-10 h-10"}
                ${isFeatured
                  ? "small:absolute small:top-[38%] small:left-1/2 small:-translate-x-1/2 small:-translate-y-1/2 small:w-44 small:h-44 small:opacity-80"
                  : "small:absolute small:top-3 small:right-4 small:w-24 small:h-24 small:opacity-70"
                }
              `}
            />

            {/* Text — centered on mobile, bottom-left on desktop */}
            <div className={`mt-3 text-center px-2
              small:absolute small:bottom-4 small:left-5 small:text-left small:mt-0
            `}>
              <h3
                className={`font-semibold text-gray-800 dark:text-white leading-tight ${
                  isFeatured ? "text-base small:text-xl" : "text-sm small:text-base"
                }`}
              >
                {category.name}
              </h3>
              <p className={`text-xs mt-0.5 ${
                isFeatured
                  ? "text-gray-500 dark:text-gray-400 small:text-gray-600 small:dark:text-gray-300"
                  : "text-gray-500 dark:text-gray-400"
              }`}>
                {category.productCountLabel}
              </p>
            </div>
          </LocalizedClientLink>
        )
      })}
    </div>
  )
}
