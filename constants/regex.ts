export const REGEX_PATTERNS = {
  // Email validation
  EMAIL: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  
  // Phone number validation (Indian format)
  PHONE: /^[6-9]\d{9}$/,
  PHONE_WITH_CODE: /^(\+91|91)?[6-9]\d{9}$/,
  
  // Password validation (at least 8 chars, 1 uppercase, 1 lowercase, 1 number)
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/,
  
  // Name validation (only letters and spaces)
  NAME: /^[a-zA-Z\s]{2,50}$/,
  
  // Pincode validation (Indian 6-digit)
  PINCODE: /^[1-9][0-9]{5}$/,
  
  // Product SKU
  SKU: /^[A-Z0-9]{3,20}$/,
  
  // Order number
  ORDER_NUMBER: /^ORD-\d{13}-[A-Z0-9]{9}$/,
  
  // Coupon code
  COUPON_CODE: /^[A-Z0-9]{4,20}$/,
  
  // URL validation
  URL: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
  
  // Image file extensions
  IMAGE_FILE: /\.(jpg|jpeg|png|gif|webp)$/i,
  
  // MongoDB ObjectId
  OBJECT_ID: /^[0-9a-fA-F]{24}$/,
  
  // Tracking number (generic)
  TRACKING_NUMBER: /^[A-Z0-9]{10,20}$/,
  
  // GST number (Indian)
  GST_NUMBER: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
  
  // PAN number (Indian)
  PAN_NUMBER: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
  
  // Bank account number
  BANK_ACCOUNT: /^[0-9]{9,18}$/,
  
  // IFSC code (Indian)
  IFSC_CODE: /^[A-Z]{4}0[A-Z0-9]{6}$/,
}

export const VALIDATION_MESSAGES = {
  EMAIL: 'Please enter a valid email address',
  PHONE: 'Please enter a valid 10-digit phone number',
  PASSWORD: 'Password must be at least 8 characters with uppercase, lowercase, and number',
  NAME: 'Name should only contain letters and spaces (2-50 characters)',
  PINCODE: 'Please enter a valid 6-digit pincode',
  SKU: 'SKU should be 3-20 characters with letters and numbers only',
  COUPON_CODE: 'Coupon code should be 4-20 characters with letters and numbers only',
  URL: 'Please enter a valid URL',
  REQUIRED: 'This field is required',
  MIN_LENGTH: (min: number) => `Minimum ${min} characters required`,
  MAX_LENGTH: (max: number) => `Maximum ${max} characters allowed`,
  NUMERIC: 'Please enter a valid number',
  POSITIVE_NUMBER: 'Please enter a positive number',
  GST_NUMBER: 'Please enter a valid GST number',
  PAN_NUMBER: 'Please enter a valid PAN number',
  BANK_ACCOUNT: 'Please enter a valid bank account number',
  IFSC_CODE: 'Please enter a valid IFSC code',
}