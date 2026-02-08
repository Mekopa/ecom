"use client"

import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"

import Search from "@modules/common/icons/search"
import SearchModal from "@modules/search/components/search-modal"

const NavSearchButton = () => {
  const [isOpen, setIsOpen] = useState(false)
  const t = useTranslations("nav")

  // Global Cmd+K / Ctrl+K keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setIsOpen((prev) => !prev)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 hover:text-ui-fg-base dark:hover:text-white transition-colors"
        aria-label={t("search")}
      >
        <Search size="18" />
        {t("search")}
        <kbd className="hidden small:inline-flex items-center ml-1 px-1.5 py-0.5 text-[10px] font-medium text-gray-400 dark:text-gray-500 bg-gray-100/80 dark:bg-white/10 rounded ring-1 ring-gray-200/50 dark:ring-white/10">
          ⌘K
        </kbd>
      </button>
      <SearchModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  )
}

export default NavSearchButton
