export interface Currency {
  code: string
  symbol: string
  name: string
  rate: number // Rate relative to INR
}

export const SUPPORTED_CURRENCIES: Record<string, Currency> = {
  INR: {
    code: 'INR',
    symbol: '₹',
    name: 'Indian Rupee',
    rate: 1,
  },
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    rate: 0.012, // Approximate rate
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    name: 'Euro',
    rate: 0.011, // Approximate rate
  },
  GBP: {
    code: 'GBP',
    symbol: '£',
    name: 'British Pound',
    rate: 0.0095, // Approximate rate
  },
}

export const currencyUtils = {
  // Convert amount from one currency to another
  convert: (amount: number, fromCurrency: string, toCurrency: string): number => {
    const from = SUPPORTED_CURRENCIES[fromCurrency]
    const to = SUPPORTED_CURRENCIES[toCurrency]
    
    if (!from || !to) {
      throw new Error('Unsupported currency')
    }
    
    // Convert to INR first, then to target currency
    const inrAmount = amount / from.rate
    return inrAmount * to.rate
  },

  // Format amount with currency symbol
  format: (amount: number, currencyCode: string): string => {
    const currency = SUPPORTED_CURRENCIES[currencyCode]
    if (!currency) {
      return amount.toString()
    }

    if (currencyCode === 'INR') {
      return `${currency.symbol}${amount.toLocaleString('en-IN')}`
    }

    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
    }).format(amount)
  },

  // Get currency symbol
  getSymbol: (currencyCode: string): string => {
    return SUPPORTED_CURRENCIES[currencyCode]?.symbol || currencyCode
  },

  // Get currency name
  getName: (currencyCode: string): string => {
    return SUPPORTED_CURRENCIES[currencyCode]?.name || currencyCode
  },

  // Get all supported currencies
  getSupportedCurrencies: (): Currency[] => {
    return Object.values(SUPPORTED_CURRENCIES)
  },

  // Check if currency is supported
  isSupported: (currencyCode: string): boolean => {
    return currencyCode in SUPPORTED_CURRENCIES
  },

  // Calculate tax (GST for India)
  calculateTax: (amount: number, currencyCode: string = 'INR'): number => {
    if (currencyCode === 'INR') {
      return amount * 0.18 // 18% GST
    }
    return amount * 0.1 // 10% for other currencies
  },

  // Calculate shipping cost
  calculateShipping: (amount: number, currencyCode: string = 'INR'): number => {
    if (currencyCode === 'INR') {
      return amount > 500 ? 0 : 50 // Free shipping above ₹500
    }
    
    const inrAmount = currencyUtils.convert(amount, currencyCode, 'INR')
    const shippingInr = inrAmount > 500 ? 0 : 50
    return currencyUtils.convert(shippingInr, 'INR', currencyCode)
  },

  // Round to appropriate decimal places
  round: (amount: number, currencyCode: string = 'INR'): number => {
    if (currencyCode === 'INR') {
      return Math.round(amount) // No decimals for INR
    }
    return Math.round(amount * 100) / 100 // 2 decimal places for others
  },

  // Parse amount from string
  parse: (amountString: string, currencyCode: string = 'INR'): number => {
    const currency = SUPPORTED_CURRENCIES[currencyCode]
    if (!currency) {
      return parseFloat(amountString) || 0
    }

    // Remove currency symbol and commas
    const cleaned = amountString
      .replace(currency.symbol, '')
      .replace(/,/g, '')
      .trim()

    return parseFloat(cleaned) || 0
  },

  // Get exchange rate
  getExchangeRate: (fromCurrency: string, toCurrency: string): number => {
    const from = SUPPORTED_CURRENCIES[fromCurrency]
    const to = SUPPORTED_CURRENCIES[toCurrency]
    
    if (!from || !to) {
      return 1
    }
    
    return to.rate / from.rate
  },

  // Format for display in different contexts
  formatForDisplay: (amount: number, currencyCode: string, context: 'compact' | 'full' = 'full'): string => {
    const currency = SUPPORTED_CURRENCIES[currencyCode]
    if (!currency) {
      return amount.toString()
    }

    if (context === 'compact' && amount >= 1000) {
      if (amount >= 10000000) { // 1 crore
        return `${currency.symbol}${(amount / 10000000).toFixed(1)}Cr`
      } else if (amount >= 100000) { // 1 lakh
        return `${currency.symbol}${(amount / 100000).toFixed(1)}L`
      } else if (amount >= 1000) { // 1 thousand
        return `${currency.symbol}${(amount / 1000).toFixed(1)}K`
      }
    }

    return currencyUtils.format(amount, currencyCode)
  },
}