"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"

import Search from "@modules/common/icons/search"
import SearchModal from "@modules/search/components/search-modal"

const NavSearchButton = () => {
  const [isOpen, setIsOpen] = useState(false)
  const t = useTranslations("nav")

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 hover:text-ui-fg-base dark:hover:text-white transition-colors"
        aria-label={t("search")}
      >
        <Search size="18" />
        {t("search")}
      </button>
      <SearchModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  )
}

export default NavSearchButton
