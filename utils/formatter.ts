export const formatters = {
  // Currency formatting
  currency: (amount: number, currency: string = 'INR'): string => {
    if (currency === 'INR') {
      return `₹${amount.toLocaleString('en-IN')}`
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount)
  },

  // Number formatting
  number: (num: number): string => {
    return num.toLocaleString('en-IN')
  },

  // Percentage formatting
  percentage: (value: number, decimals: number = 1): string => {
    return `${value.toFixed(decimals)}%`
  },

  // Date formatting
  date: (date: string | Date, format: 'short' | 'long' | 'relative' = 'short'): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date

    if (format === 'relative') {
      return formatRelativeTime(dateObj)
    }

    const options: Intl.DateTimeFormatOptions = 
      format === 'long' 
        ? { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }
        : { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
          }

    return dateObj.toLocaleDateString('en-IN', options)
  },

  // Time formatting
  time: (date: string | Date): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return dateObj.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  },

  // Phone number formatting
  phone: (phone: string): string => {
    // Remove any non-digit characters
    const cleaned = phone.replace(/\D/g, '')
    
    // Format as +91 XXXXX XXXXX
    if (cleaned.length === 10) {
      return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`
    }
    
    // If already has country code
    if (cleaned.length === 12 && cleaned.startsWith('91')) {
      return `+91 ${cleaned.slice(2, 7)} ${cleaned.slice(7)}`
    }
    
    return phone // Return original if can't format
  },

  // File size formatting
  fileSize: (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  },

  // Text truncation
  truncate: (text: string, length: number = 100, suffix: string = '...'): string => {
    if (text.length <= length) return text
    return text.substring(0, length).trim() + suffix
  },

  // Capitalize first letter
  capitalize: (text: string): string => {
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
  },

  // Title case
  titleCase: (text: string): string => {
    return text.replace(/\w\S*/g, (txt) => 
      txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    )
  },

  // Slug generation
  slug: (text: string): string => {
    return text
      .toLowerCase()
      .replace(/[^\w ]+/g, '')
      .replace(/ +/g, '-')
  },

  // Order number formatting
  orderNumber: (orderNumber: string): string => {
    // Format: ORD-1234567890123-ABC123DEF -> ORD-***-ABC123DEF
    const parts = orderNumber.split('-')
    if (parts.length === 3) {
      return `${parts[0]}-***-${parts[2]}`
    }
    return orderNumber
  },

  // Mask sensitive data
  maskEmail: (email: string): string => {
    const [username, domain] = email.split('@')
    if (username.length <= 2) return email
    
    const maskedUsername = username.charAt(0) + '*'.repeat(username.length - 2) + username.charAt(username.length - 1)
    return `${maskedUsername}@${domain}`
  },

  maskPhone: (phone: string): string => {
    const cleaned = phone.replace(/\D/g, '')
    if (cleaned.length === 10) {
      return `${cleaned.slice(0, 2)}****${cleaned.slice(-2)}`
    }
    return phone
  },

  // Address formatting
  address: (address: {
    street?: string
    city?: string
    state?: string
    pincode?: string
    country?: string
  }): string => {
    const parts = [
      address.street,
      address.city,
      address.state,
      address.pincode,
      address.country
    ].filter(Boolean)
    
    return parts.join(', ')
  },

  // Rating formatting
  rating: (rating: number, maxRating: number = 5): string => {
    const stars = '★'.repeat(Math.floor(rating)) + '☆'.repeat(maxRating - Math.floor(rating))
    return `${stars} (${rating.toFixed(1)})`
  },

  // Discount formatting
  discount: (originalPrice: number, discountedPrice: number): string => {
    const discountAmount = originalPrice - discountedPrice
    const discountPercentage = (discountAmount / originalPrice) * 100
    return `${discountPercentage.toFixed(0)}% OFF`
  },
}

// Helper function for relative time formatting
function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) {
    return 'Just now'
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`
  }

  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`
  }

  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 7) {
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`
  }

  const diffInWeeks = Math.floor(diffInDays / 7)
  if (diffInWeeks < 4) {
    return `${diffInWeeks} week${diffInWeeks > 1 ? 's' : ''} ago`
  }

  const diffInMonths = Math.floor(diffInDays / 30)
  if (diffInMonths < 12) {
    return `${diffInMonths} month${diffInMonths > 1 ? 's' : ''} ago`
  }

  const diffInYears = Math.floor(diffInDays / 365)
  return `${diffInYears} year${diffInYears > 1 ? 's' : ''} ago`
}