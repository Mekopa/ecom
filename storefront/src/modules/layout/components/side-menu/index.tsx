"use client"

import {
  Dialog,
  DialogPanel,
  Transition,
  TransitionChild,
} from "@headlessui/react"
import { ArrowRightMini, XMark } from "@medusajs/icons"
import { Text, clx, useToggleState } from "@medusajs/ui"
import { Fragment } from "react"
import { useTranslations } from "next-intl"

import { STORE_NAME } from "@lib/constants"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import CountrySelect from "../country-select"
import LanguageSelect from "../language-select"
import { HttpTypes } from "@medusajs/types"
import { Locale } from "@lib/data/locales"

type SideMenuProps = {
  regions: HttpTypes.StoreRegion[] | null
  locales: Locale[] | null
  currentLocale: string | null
  isOpen: boolean
  onClose: () => void
}

const SideMenu = ({
  regions,
  locales,
  currentLocale,
  isOpen,
  onClose,
}: SideMenuProps) => {
  const countryToggleState = useToggleState()
  const languageToggleState = useToggleState()
  const t = useTranslations("nav")

  const sideMenuItems = [
    { label: t("home"), href: "/" },
    { label: t("store"), href: "/store" },
    { label: t("account"), href: "/account" },
    { label: t("cart"), href: "/cart" },
  ]

  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[60]" onClose={onClose}>
        {/* Backdrop */}
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-150"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30" />
        </TransitionChild>

        {/* Panel */}
        <div className="fixed inset-0 z-10">
          <TransitionChild
            as={Fragment}
            enter="transition ease-out duration-150"
            enterFrom="opacity-0 -translate-x-full"
            enterTo="opacity-100 translate-x-0"
            leave="transition ease-in duration-150"
            leaveFrom="opacity-100 translate-x-0"
            leaveTo="opacity-0 -translate-x-full"
          >
            <DialogPanel className="flex flex-col w-full pr-4 sm:pr-0 sm:w-1/3 2xl:w-1/4 sm:min-w-min h-[calc(100vh-1rem)] text-sm text-ui-fg-on-color m-2 backdrop-blur-2xl">
              <div
                data-testid="nav-menu-popup"
                className="flex flex-col h-full bg-[rgba(3,7,18,0.5)] rounded-rounded justify-between p-6"
              >
                <div className="flex justify-end" id="xmark">
                  <button
                    data-testid="close-menu-button"
                    onClick={onClose}
                  >
                    <XMark />
                  </button>
                </div>
                <ul className="flex flex-col gap-6 items-start justify-start">
                  {sideMenuItems.map((item) => (
                    <li key={item.href}>
                      <LocalizedClientLink
                        href={item.href}
                        className="text-3xl leading-10 hover:text-ui-fg-disabled"
                        onClick={onClose}
                        data-testid={`${item.label.toLowerCase()}-link`}
                      >
                        {item.label}
                      </LocalizedClientLink>
                    </li>
                  ))}
                </ul>
                <div className="flex flex-col gap-y-6">
                  {!!locales?.length && (
                    <div
                      className="flex justify-between"
                      onMouseEnter={languageToggleState.open}
                      onMouseLeave={languageToggleState.close}
                    >
                      <LanguageSelect
                        toggleState={languageToggleState}
                        locales={locales}
                        currentLocale={currentLocale}
                      />
                      <ArrowRightMini
                        className={clx(
                          "transition-transform duration-150",
                          languageToggleState.state ? "-rotate-90" : ""
                        )}
                      />
                    </div>
                  )}
                  <div
                    className="flex justify-between"
                    onMouseEnter={countryToggleState.open}
                    onMouseLeave={countryToggleState.close}
                  >
                    {regions && (
                      <CountrySelect
                        toggleState={countryToggleState}
                        regions={regions}
                      />
                    )}
                    <ArrowRightMini
                      className={clx(
                        "transition-transform duration-150",
                        countryToggleState.state ? "-rotate-90" : ""
                      )}
                    />
                  </div>
                  <Text className="flex justify-between txt-compact-small">
                    &copy; {new Date().getFullYear()} {STORE_NAME}
                  </Text>
                </div>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </Transition>
  )
}

export default SideMenu
