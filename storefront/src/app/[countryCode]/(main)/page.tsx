import { Metadata } from "next"
import { STORE_NAME, STORE_DESCRIPTION } from "@lib/constants"

import FeaturedProducts from "@modules/home/components/featured-products"
import Hero from "@modules/home/components/hero"
import CategoryShowcase from "@modules/home/components/category-showcase"
import { listCollections } from "@lib/data/collections"
import { getRegion } from "@lib/data/regions"

export const metadata: Metadata = {
  title: `${STORE_NAME} - Next-Gen Electronics`,
  description: STORE_DESCRIPTION,
}

export default async function Home(props: {
  params: Promise<{ countryCode: string }>
}) {
  const params = await props.params

  const { countryCode } = params

  const region = await getRegion(countryCode)

  const { collections } = await listCollections({
    fields: "id, handle, title",
  })

  if (!collections || !region) {
    return null
  }

  return (
    <>
      <Hero />
      <CategoryShowcase />
      <div className="py-12 bg-[var(--bg-primary)]">
        <ul className="flex flex-col gap-x-6">
          <FeaturedProducts collections={collections.slice(0, 2)} region={region} />
        </ul>
      </div>
    </>
  )
}
