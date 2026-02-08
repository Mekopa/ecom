export function getProductTranslation(
  product: {
    title?: string | null
    description?: string | null
    metadata?: Record<string, any>
  },
  locale: string
): { title: string; description: string } {
  const i18n = product.metadata?.i18n?.[locale]
  return {
    title: i18n?.title || product.title || "",
    description: i18n?.description || product.description || "",
  }
}
