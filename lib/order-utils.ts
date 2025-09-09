export const ORDER_STATUSES = {
  PENDING: "pending",
  CONFIRMED: "confirmed", 
  PROCESSING: "processing",
  SHIPPED: "shipped",
  DELIVERED: "delivered",
  CANCELLED: "cancelled",
  REFUNDED: "refunded"
} as const

export const PAYMENT_STATUSES = {
  PENDING: "pending",
  COMPLETED: "completed",
  FAILED: "failed",
  REFUNDED: "refunded"
} as const

export const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case ORDER_STATUSES.PENDING:
      return "bg-yellow-100 text-yellow-800"
    case ORDER_STATUSES.CONFIRMED:
      return "bg-blue-100 text-blue-800"
    case ORDER_STATUSES.PROCESSING:
      return "bg-purple-100 text-purple-800"
    case ORDER_STATUSES.SHIPPED:
      return "bg-indigo-100 text-indigo-800"
    case ORDER_STATUSES.DELIVERED:
      return "bg-green-100 text-green-800"
    case ORDER_STATUSES.CANCELLED:
      return "bg-red-100 text-red-800"
    case ORDER_STATUSES.REFUNDED:
      return "bg-gray-100 text-gray-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

export const getPaymentStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case PAYMENT_STATUSES.PENDING:
      return "bg-yellow-100 text-yellow-800"
    case PAYMENT_STATUSES.COMPLETED:
      return "bg-green-100 text-green-800"
    case PAYMENT_STATUSES.FAILED:
      return "bg-red-100 text-red-800"
    case PAYMENT_STATUSES.REFUNDED:
      return "bg-gray-100 text-gray-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

export const canCancelOrder = (status: string) => {
  return [ORDER_STATUSES.PENDING, ORDER_STATUSES.CONFIRMED].includes(status as any)
}

export const canRefundOrder = (status: string, paymentStatus: string) => {
  return status === ORDER_STATUSES.DELIVERED && paymentStatus === PAYMENT_STATUSES.COMPLETED
}

export const generateOrderNumber = () => {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substr(2, 9).toUpperCase()
  return `ORD-${timestamp}-${random}`
}

export const calculateOrderTotals = (items: any[], shipping = 0, tax = 0, discount = 0) => {
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const total = subtotal + shipping + tax - discount
  
  return {
    subtotal,
    shipping,
    tax,
    discount,
    total: Math.max(0, total) // Ensure total is never negative
  }
}

export const getEstimatedDelivery = (shippingMethod = "standard") => {
  const now = new Date()
  let days = 7 // Default 7 days
  
  switch (shippingMethod) {
    case "express":
      days = 3
      break
    case "overnight":
      days = 1
      break
    case "standard":
    default:
      days = 7
      break
  }
  
  return new Date(now.getTime() + days * 24 * 60 * 60 * 1000)
}