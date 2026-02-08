import { STORE_NAME, STORE_DESCRIPTION } from "@lib/constants"
import { getBaseURL } from "@lib/util/env"
import { Metadata } from "next"
import { ThemeProvider } from "next-themes"
import { NextIntlClientProvider } from "next-intl"
import { getLocale, getMessages } from "next-intl/server"
import "styles/globals.css"

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
  title: {
    default: `${STORE_NAME} - Next-Gen Electronics`,
    template: `%s | ${STORE_NAME}`,
  },
  description: STORE_DESCRIPTION,
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "48x48" },
      { url: "/logo.svg", type: "image/svg+xml" },
    ],
  },
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const locale = await getLocale()
  const messages = await getMessages()

  return (
    <html lang={locale} suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <NextIntlClientProvider messages={messages}>
            <main className="relative">{props.children}</main>
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
