import { REGEX_PATTERNS, VALIDATION_MESSAGES } from '@/constants/regex'

export interface ValidationResult {
  isValid: boolean
  message?: string
}

export const validators = {
  email: (value: string): ValidationResult => {
    if (!value) return { isValid: false, message: VALIDATION_MESSAGES.REQUIRED }
    if (!REGEX_PATTERNS.EMAIL.test(value)) {
      return { isValid: false, message: VALIDATION_MESSAGES.EMAIL }
    }
    return { isValid: true }
  },

  phone: (value: string): ValidationResult => {
    if (!value) return { isValid: false, message: VALIDATION_MESSAGES.REQUIRED }
    if (!REGEX_PATTERNS.PHONE.test(value)) {
      return { isValid: false, message: VALIDATION_MESSAGES.PHONE }
    }
    return { isValid: true }
  },

  password: (value: string): ValidationResult => {
    if (!value) return { isValid: false, message: VALIDATION_MESSAGES.REQUIRED }
    if (!REGEX_PATTERNS.PASSWORD.test(value)) {
      return { isValid: false, message: VALIDATION_MESSAGES.PASSWORD }
    }
    return { isValid: true }
  },

  name: (value: string): ValidationResult => {
    if (!value) return { isValid: false, message: VALIDATION_MESSAGES.REQUIRED }
    if (!REGEX_PATTERNS.NAME.test(value)) {
      return { isValid: false, message: VALIDATION_MESSAGES.NAME }
    }
    return { isValid: true }
  },

  pincode: (value: string): ValidationResult => {
    if (!value) return { isValid: false, message: VALIDATION_MESSAGES.REQUIRED }
    if (!REGEX_PATTERNS.PINCODE.test(value)) {
      return { isValid: false, message: VALIDATION_MESSAGES.PINCODE }
    }
    return { isValid: true }
  },

  required: (value: any): ValidationResult => {
    if (!value || (typeof value === 'string' && !value.trim())) {
      return { isValid: false, message: VALIDATION_MESSAGES.REQUIRED }
    }
    return { isValid: true }
  },

  minLength: (value: string, min: number): ValidationResult => {
    if (!value) return { isValid: false, message: VALIDATION_MESSAGES.REQUIRED }
    if (value.length < min) {
      return { isValid: false, message: VALIDATION_MESSAGES.MIN_LENGTH(min) }
    }
    return { isValid: true }
  },

  maxLength: (value: string, max: number): ValidationResult => {
    if (value && value.length > max) {
      return { isValid: false, message: VALIDATION_MESSAGES.MAX_LENGTH(max) }
    }
    return { isValid: true }
  },

  numeric: (value: string): ValidationResult => {
    if (!value) return { isValid: false, message: VALIDATION_MESSAGES.REQUIRED }
    if (isNaN(Number(value))) {
      return { isValid: false, message: VALIDATION_MESSAGES.NUMERIC }
    }
    return { isValid: true }
  },

  positiveNumber: (value: string | number): ValidationResult => {
    const num = typeof value === 'string' ? Number(value) : value
    if (isNaN(num) || num <= 0) {
      return { isValid: false, message: VALIDATION_MESSAGES.POSITIVE_NUMBER }
    }
    return { isValid: true }
  },

  url: (value: string): ValidationResult => {
    if (!value) return { isValid: false, message: VALIDATION_MESSAGES.REQUIRED }
    if (!REGEX_PATTERNS.URL.test(value)) {
      return { isValid: false, message: VALIDATION_MESSAGES.URL }
    }
    return { isValid: true }
  },

  sku: (value: string): ValidationResult => {
    if (!value) return { isValid: false, message: VALIDATION_MESSAGES.REQUIRED }
    if (!REGEX_PATTERNS.SKU.test(value)) {
      return { isValid: false, message: VALIDATION_MESSAGES.SKU }
    }
    return { isValid: true }
  },

  couponCode: (value: string): ValidationResult => {
    if (!value) return { isValid: false, message: VALIDATION_MESSAGES.REQUIRED }
    if (!REGEX_PATTERNS.COUPON_CODE.test(value)) {
      return { isValid: false, message: VALIDATION_MESSAGES.COUPON_CODE }
    }
    return { isValid: true }
  },

  gstNumber: (value: string): ValidationResult => {
    if (!value) return { isValid: false, message: VALIDATION_MESSAGES.REQUIRED }
    if (!REGEX_PATTERNS.GST_NUMBER.test(value)) {
      return { isValid: false, message: VALIDATION_MESSAGES.GST_NUMBER }
    }
    return { isValid: true }
  },

  panNumber: (value: string): ValidationResult => {
    if (!value) return { isValid: false, message: VALIDATION_MESSAGES.REQUIRED }
    if (!REGEX_PATTERNS.PAN_NUMBER.test(value)) {
      return { isValid: false, message: VALIDATION_MESSAGES.PAN_NUMBER }
    }
    return { isValid: true }
  },
}

export const validateForm = (data: Record<string, any>, rules: Record<string, Array<(value: any) => ValidationResult>>): { isValid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {}
  let isValid = true

  for (const [field, fieldRules] of Object.entries(rules)) {
    const value = data[field]
    
    for (const rule of fieldRules) {
      const result = rule(value)
      if (!result.isValid) {
        errors[field] = result.message || 'Invalid value'
        isValid = false
        break // Stop at first error for this field
      }
    }
  }

  return { isValid, errors }
}

// Common validation rule sets
export const commonRules = {
  email: [validators.required, validators.email],
  phone: [validators.required, validators.phone],
  password: [validators.required, validators.password],
  name: [validators.required, validators.name],
  pincode: [validators.required, validators.pincode],
  required: [validators.required],
  positiveNumber: [validators.required, validators.numeric, validators.positiveNumber],
}