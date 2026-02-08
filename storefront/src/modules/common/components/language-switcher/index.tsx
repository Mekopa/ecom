"use client"

import { useEffect, useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { updateLocale } from "@lib/data/locale-actions"

const localeOptions = [
  { code: "en", label: "English", flag: "\u{1F1FA}\u{1F1F8}" },
  { code: "tr", label: "T\u00FCrk\u00E7e", flag: "\u{1F1F9}\u{1F1F7}" },
  { code: "de", label: "Deutsch", flag: "\u{1F1E9}\u{1F1EA}" },
  { code: "fr", label: "Fran\u00E7ais", flag: "\u{1F1EB}\u{1F1F7}" },
  { code: "pl", label: "Polski", flag: "\u{1F1F5}\u{1F1F1}" },
  { code: "lt", label: "Lietuvi\u0173", flag: "\u{1F1F1}\u{1F1F9}" },
  { code: "et", label: "Eesti", flag: "\u{1F1EA}\u{1F1EA}" },
  { code: "lv", label: "Latvie\u0161u", flag: "\u{1F1F1}\u{1F1FB}" },
] as const

export default function LanguageSwitcher() {
  const [isOpen, setIsOpen] = useState(false)
  const [currentLocale, setCurrentLocale] = useState("en")
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Read current locale from either cookie (they are kept in sync)
    const cookie = document.cookie
      .split("; ")
      .find((row) => row.startsWith("NEXT_LOCALE=") || row.startsWith("_medusa_locale="))
    if (cookie) {
      setCurrentLocale(cookie.split("=")[1])
    }
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleLocaleChange = (locale: string) => {
    setCurrentLocale(locale)
    setIsOpen(false)
    startTransition(async () => {
      await updateLocale(locale)
      router.refresh()
    })
  }

  const current = localeOptions.find((l) => l.code === currentLocale) || localeOptions[0]

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 text-sm hover:text-ui-fg-base transition-colors px-2 py-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
        aria-label="Change language"
      >
        <span className="text-base">{current.flag}</span>
        <span className="hidden small:inline">{current.code.toUpperCase()}</span>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 min-w-[160px] z-50">
          {localeOptions.map((option) => (
            <button
              key={option.code}
              onClick={() => handleLocaleChange(option.code)}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                option.code === currentLocale
                  ? "text-blue-600 dark:text-blue-400 font-medium"
                  : "text-gray-700 dark:text-gray-300"
              }`}
              disabled={isPending}
            >
              <span className="text-base">{option.flag}</span>
              <span>{option.label}</span>
              {option.code === currentLocale && (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 ml-auto">
                  <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
