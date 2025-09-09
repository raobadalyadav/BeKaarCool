"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

interface Currency {
  code: string
  symbol: string
  rate: number
}

interface CurrencyContextType {
  currency: Currency
  setCurrency: (currency: Currency) => void
  formatPrice: (price: number) => string
  convertPrice: (price: number) => number
}

const currencies: Currency[] = [
  { code: "INR", symbol: "₹", rate: 1 },
  { code: "USD", symbol: "$", rate: 0.012 },
  { code: "EUR", symbol: "€", rate: 0.011 },
  { code: "GBP", symbol: "£", rate: 0.0095 },
]

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined)

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrency] = useState<Currency>(currencies[0])

  useEffect(() => {
    const savedCurrency = localStorage.getItem("currency")
    if (savedCurrency) {
      const found = currencies.find((c) => c.code === savedCurrency)
      if (found) {
        setCurrency(found)
      }
    }
  }, [])

  const handleSetCurrency = (newCurrency: Currency) => {
    setCurrency(newCurrency)
    localStorage.setItem("currency", newCurrency.code)
  }

  const convertPrice = (price: number): number => {
    return price * currency.rate
  }

  const formatPrice = (price: number): string => {
    const convertedPrice = convertPrice(price)
    return `${currency.symbol}${convertedPrice.toFixed(2)}`
  }

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency: handleSetCurrency, formatPrice, convertPrice }}>
      {children}
    </CurrencyContext.Provider>
  )
}

export function useCurrency() {
  const context = useContext(CurrencyContext)
  if (context === undefined) {
    throw new Error("useCurrency must be used within a CurrencyProvider")
  }
  return context
}
