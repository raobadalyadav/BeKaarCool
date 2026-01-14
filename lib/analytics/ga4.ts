/**
 * Google Analytics 4 Integration
 * For event tracking and e-commerce analytics
 */

// ============================================
// CLIENT-SIDE TRACKING (for components)
// ============================================

declare global {
    interface Window {
        gtag: (...args: any[]) => void
        dataLayer: any[]
    }
}

/**
 * Check if gtag is available
 */
export function isGtagAvailable(): boolean {
    return typeof window !== "undefined" && typeof window.gtag === "function"
}

/**
 * Track page view
 */
export function trackPageView(url: string, title?: string): void {
    if (!isGtagAvailable()) return

    window.gtag("config", process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID, {
        page_path: url,
        page_title: title
    })
}

/**
 * Track custom event
 */
export function trackEvent(
    eventName: string,
    parameters?: Record<string, any>
): void {
    if (!isGtagAvailable()) return

    window.gtag("event", eventName, parameters)
}

// ============================================
// E-COMMERCE EVENTS
// ============================================

export interface GA4Product {
    item_id: string
    item_name: string
    item_brand?: string
    item_category?: string
    item_variant?: string
    price: number
    quantity?: number
    index?: number
}

/**
 * Track product view
 */
export function trackViewItem(product: GA4Product): void {
    trackEvent("view_item", {
        currency: "INR",
        value: product.price,
        items: [product]
    })
}

/**
 * Track product list view
 */
export function trackViewItemList(
    listId: string,
    listName: string,
    products: GA4Product[]
): void {
    trackEvent("view_item_list", {
        item_list_id: listId,
        item_list_name: listName,
        items: products
    })
}

/**
 * Track product click from list
 */
export function trackSelectItem(
    listId: string,
    listName: string,
    product: GA4Product
): void {
    trackEvent("select_item", {
        item_list_id: listId,
        item_list_name: listName,
        items: [product]
    })
}

/**
 * Track add to cart
 */
export function trackAddToCart(
    product: GA4Product,
    quantity: number = 1
): void {
    trackEvent("add_to_cart", {
        currency: "INR",
        value: product.price * quantity,
        items: [{ ...product, quantity }]
    })
}

/**
 * Track remove from cart
 */
export function trackRemoveFromCart(
    product: GA4Product,
    quantity: number = 1
): void {
    trackEvent("remove_from_cart", {
        currency: "INR",
        value: product.price * quantity,
        items: [{ ...product, quantity }]
    })
}

/**
 * Track view cart
 */
export function trackViewCart(
    products: GA4Product[],
    totalValue: number
): void {
    trackEvent("view_cart", {
        currency: "INR",
        value: totalValue,
        items: products
    })
}

/**
 * Track begin checkout
 */
export function trackBeginCheckout(
    products: GA4Product[],
    totalValue: number,
    coupon?: string
): void {
    trackEvent("begin_checkout", {
        currency: "INR",
        value: totalValue,
        items: products,
        coupon
    })
}

/**
 * Track add shipping info
 */
export function trackAddShippingInfo(
    products: GA4Product[],
    totalValue: number,
    shippingTier: string
): void {
    trackEvent("add_shipping_info", {
        currency: "INR",
        value: totalValue,
        items: products,
        shipping_tier: shippingTier
    })
}

/**
 * Track add payment info
 */
export function trackAddPaymentInfo(
    products: GA4Product[],
    totalValue: number,
    paymentType: string
): void {
    trackEvent("add_payment_info", {
        currency: "INR",
        value: totalValue,
        items: products,
        payment_type: paymentType
    })
}

/**
 * Track purchase
 */
export function trackPurchase(
    transactionId: string,
    products: GA4Product[],
    totalValue: number,
    shipping: number = 0,
    tax: number = 0,
    coupon?: string
): void {
    trackEvent("purchase", {
        transaction_id: transactionId,
        currency: "INR",
        value: totalValue,
        shipping,
        tax,
        items: products,
        coupon
    })
}

/**
 * Track refund
 */
export function trackRefund(
    transactionId: string,
    totalValue: number,
    products?: GA4Product[]
): void {
    trackEvent("refund", {
        transaction_id: transactionId,
        currency: "INR",
        value: totalValue,
        items: products
    })
}

// ============================================
// USER EVENTS
// ============================================

/**
 * Track search
 */
export function trackSearch(searchTerm: string): void {
    trackEvent("search", {
        search_term: searchTerm
    })
}

/**
 * Track add to wishlist
 */
export function trackAddToWishlist(product: GA4Product): void {
    trackEvent("add_to_wishlist", {
        currency: "INR",
        value: product.price,
        items: [product]
    })
}

/**
 * Track signup
 */
export function trackSignUp(method: string = "email"): void {
    trackEvent("sign_up", {
        method
    })
}

/**
 * Track login
 */
export function trackLogin(method: string = "email"): void {
    trackEvent("login", {
        method
    })
}

/**
 * Track share
 */
export function trackShare(
    method: string,
    contentType: string,
    itemId: string
): void {
    trackEvent("share", {
        method,
        content_type: contentType,
        item_id: itemId
    })
}

// ============================================
// USER PROPERTIES
// ============================================

/**
 * Set user ID (after login)
 */
export function setUserId(userId: string): void {
    if (!isGtagAvailable()) return

    window.gtag("config", process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID, {
        user_id: userId
    })
}

/**
 * Set user properties
 */
export function setUserProperties(properties: Record<string, any>): void {
    if (!isGtagAvailable()) return

    window.gtag("set", "user_properties", properties)
}

// ============================================
// HELPER: Transform product data
// ============================================

export function transformProductForGA4(product: any, index?: number): GA4Product {
    return {
        item_id: product._id?.toString() || product.id,
        item_name: product.name,
        item_brand: product.brand || "BeKaarCool",
        item_category: product.category,
        item_variant: product.selectedSize || product.selectedColor,
        price: product.price,
        quantity: product.quantity || 1,
        index
    }
}
