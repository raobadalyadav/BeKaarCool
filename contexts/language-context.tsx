"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

interface LanguageContextType {
  language: string
  setLanguage: (lang: string) => void
  t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

const translations = {
  en: {
    "nav.home": "Home",
    "nav.products": "Products",
    "nav.about": "About",
    "nav.contact": "Contact",
    "nav.login": "Login",
    "nav.register": "Register",
    "nav.cart": "Cart",
    "nav.profile": "Profile",
    "nav.dashboard": "Dashboard",
    "nav.logout": "Logout",
    "product.addToCart": "Add to Cart",
    "product.buyNow": "Buy Now",
    "product.outOfStock": "Out of Stock",
    "product.inStock": "In Stock",
    "cart.empty": "Your cart is empty",
    "cart.total": "Total",
    "cart.checkout": "Checkout",
    "order.placed": "Order Placed Successfully",
    "order.tracking": "Track Order",
    "common.loading": "Loading...",
    "common.error": "Something went wrong",
    "common.success": "Success",
    "common.cancel": "Cancel",
    "common.save": "Save",
    "common.edit": "Edit",
    "common.delete": "Delete",
    "common.search": "Search",
    "common.filter": "Filter",
    "common.sort": "Sort",
  },
  hi: {
    "nav.home": "होम",
    "nav.products": "उत्पाद",
    "nav.about": "हमारे बारे में",
    "nav.contact": "संपर्क",
    "nav.login": "लॉगिन",
    "nav.register": "रजिस्टर",
    "nav.cart": "कार्ट",
    "nav.profile": "प्रोफाइल",
    "nav.dashboard": "डैशबोर्ड",
    "nav.logout": "लॉगआउट",
    "product.addToCart": "कार्ट में जोड़ें",
    "product.buyNow": "अभी खरीदें",
    "product.outOfStock": "स्टॉक में नहीं",
    "product.inStock": "स्टॉक में",
    "cart.empty": "आपका कार्ट खाली है",
    "cart.total": "कुल",
    "cart.checkout": "चेकआउट",
    "order.placed": "ऑर्डर सफलतापूर्वक दिया गया",
    "order.tracking": "ऑर्डर ट्रैक करें",
    "common.loading": "लोड हो रहा है...",
    "common.error": "कुछ गलत हुआ",
    "common.success": "सफलता",
    "common.cancel": "रद्द करें",
    "common.save": "सेव करें",
    "common.edit": "संपादित करें",
    "common.delete": "हटाएं",
    "common.search": "खोजें",
    "common.filter": "फिल्टर",
    "common.sort": "क्रमबद्ध करें",
  },
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState("en")

  useEffect(() => {
    const savedLanguage = localStorage.getItem("language")
    if (savedLanguage && (savedLanguage === "en" || savedLanguage === "hi")) {
      setLanguage(savedLanguage)
    }
  }, [])

  const handleSetLanguage = (lang: string) => {
    setLanguage(lang)
    localStorage.setItem("language", lang)
  }

  const t = (key: string): string => {
    return translations[language as keyof typeof translations]?.[key as keyof typeof translations.en] || key
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider")
  }
  return context
}
