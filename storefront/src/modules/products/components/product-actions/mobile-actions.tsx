"use client"

import { Button, clx } from "@medusajs/ui"
import { XMark } from "@medusajs/icons"
import React, { useEffect, useMemo, useRef, useState } from "react"

import ChevronDown from "@modules/common/icons/chevron-down"

import { getProductPrice } from "@lib/util/get-product-price"
import OptionSelect from "./option-select"
import { HttpTypes } from "@medusajs/types"
import { isSimpleProduct } from "@lib/util/product"
import { useTranslations } from "next-intl"

type MobileActionsProps = {
  product: HttpTypes.StoreProduct
  variant?: HttpTypes.StoreProductVariant
  options: Record<string, string | undefined>
  updateOptions: (title: string, value: string) => void
  inStock?: boolean
  handleAddToCart: () => void
  isAdding?: boolean
  show: boolean
  optionsDisabled: boolean
}

const MobileActions: React.FC<MobileActionsProps> = ({
  product,
  variant,
  options,
  updateOptions,
  inStock,
  handleAddToCart,
  isAdding,
  show,
  optionsDisabled,
}) => {
  const t = useTranslations("product")
  const [isOpen, setIsOpen] = useState(false)
  const sheetRef = useRef<HTMLDivElement>(null)

  const price = getProductPrice({
    product: product,
    variantId: variant?.id,
  })

  const selectedPrice = useMemo(() => {
    if (!price) {
      return null
    }
    const { variantPrice, cheapestPrice } = price

    return variantPrice || cheapestPrice || null
  }, [price])

  const isSimple = isSimpleProduct(product)

  // Body scroll lock
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [isOpen])

  // Escape key dismiss
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false)
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen])

  // Backdrop click dismiss
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (sheetRef.current && !sheetRef.current.contains(e.target as Node)) {
      setIsOpen(false)
    }
  }

  return (
    <>
      {/* Sticky bar */}
      <div
        className={clx("small:hidden inset-x-0 bottom-0 fixed z-[55]", {
          "pointer-events-none": !show,
        })}
      >
        <div
          className={clx(
            "bg-white dark:bg-gray-950 flex flex-col gap-y-3 justify-center items-center text-large-regular p-4 h-full w-full border-t border-gray-200 dark:border-gray-800 transition-opacity duration-300",
            {
              "opacity-100": show,
              "opacity-0": !show,
            }
          )}
          style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
          data-testid="mobile-actions"
        >
          <div className="flex items-center gap-x-2">
            <span data-testid="mobile-title">{product.title}</span>
            <span>—</span>
            {selectedPrice ? (
              <div className="flex items-end gap-x-2 text-ui-fg-base">
                {selectedPrice.price_type === "sale" && (
                  <p>
                    <span className="line-through text-small-regular">
                      {selectedPrice.original_price}
                    </span>
                  </p>
                )}
                <span
                  className={clx({
                    "text-ui-fg-interactive":
                      selectedPrice.price_type === "sale",
                  })}
                >
                  {selectedPrice.calculated_price}
                </span>
              </div>
            ) : (
              <div></div>
            )}
          </div>
          <div
            className={clx("grid grid-cols-2 w-full gap-x-4", {
              "!grid-cols-1": isSimple,
            })}
          >
            {!isSimple && (
              <Button
                onClick={() => setIsOpen(true)}
                variant="secondary"
                className="w-full"
                data-testid="mobile-actions-button"
              >
                <div className="flex items-center justify-between w-full">
                  <span>
                    {variant
                      ? Object.values(options).join(" / ")
                      : t("selectOptions")}
                  </span>
                  <ChevronDown />
                </div>
              </Button>
            )}
            <Button
              onClick={handleAddToCart}
              disabled={!inStock || !variant}
              className="w-full"
              isLoading={isAdding}
              data-testid="mobile-cart-button"
            >
              {!variant
                ? t("selectVariantBtn")
                : !inStock
                ? t("outOfStock")
                : t("addToCart")}
            </Button>
          </div>
        </div>
      </div>

      {/* Bottom sheet overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[75] flex items-end animate-backdrop-fade-in"
          onClick={handleBackdropClick}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50" />

          {/* Sheet */}
          <div
            ref={sheetRef}
            className="relative w-full bg-white dark:bg-gray-900 rounded-t-2xl animate-sheet-slide-up"
            style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
            data-testid="mobile-actions-modal"
          >
            {/* Handle bar */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 pb-3">
              <h3 className="text-base font-semibold text-ui-fg-base">
                {t("selectOptions")}
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                data-testid="close-modal-button"
              >
                <XMark className="w-5 h-5 text-ui-fg-subtle" />
              </button>
            </div>

            {/* Options */}
            <div className="px-5 pb-6">
              {(product.variants?.length ?? 0) > 1 && (
                <div className="flex flex-col gap-y-6">
                  {(product.options || []).map((option) => (
                    <div key={option.id}>
                      <OptionSelect
                        option={option}
                        current={options[option.id]}
                        updateOption={updateOptions}
                        title={option.title ?? ""}
                        disabled={optionsDisabled}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default MobileActions
