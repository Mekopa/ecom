"use client"

import { Button, Heading, Text } from "@medusajs/ui"
import { useTranslations } from "next-intl"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

const SignInPrompt = () => {
  const t = useTranslations("cart")

  return (
    <div className="bg-white dark:bg-gray-950 flex items-center justify-between">
      <div>
        <Heading level="h2" className="txt-xlarge">
          {t("alreadyHaveAccount")}
        </Heading>
        <Text className="txt-medium text-ui-fg-subtle mt-2">
          {t("signInBetter")}
        </Text>
      </div>
      <div>
        <LocalizedClientLink href="/account">
          <Button variant="secondary" className="h-10" data-testid="sign-in-button">
            {t("signIn")}
          </Button>
        </LocalizedClientLink>
      </div>
    </div>
  )
}

export default SignInPrompt
