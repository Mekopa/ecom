"use client"

import { createContext } from "react"

export const StripeContext = createContext(false)

// Stripe removed — manual payment only. Kept for import compatibility.
const StripeWrapper: React.FC<{ children: React.ReactNode; [key: string]: any }> = ({
  children,
}) => {
  return (
    <StripeContext.Provider value={false}>
      {children}
    </StripeContext.Provider>
  )
}

export default StripeWrapper
