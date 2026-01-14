/**
 * Shipping Provider - Delhivery Only
 * Production-ready single shipping partner
 */

// Re-export everything from delhivery module
export * from "../delhivery"
export { default as DelhiveryService } from "../delhivery"

// Type for backward compatibility
export type ShippingProvider = "delhivery"

// Unified interfaces
export interface ShipmentInput {
    orderId: string
    orderNumber: string
    pickupLocation: string
    deliveryAddress: {
        name: string
        phone: string
        address: string
        city: string
        state: string
        pincode: string
        country?: string
    }
    items: Array<{
        name: string
        sku: string
        quantity: number
        price: number
        weight: number
    }>
    weight: number
    dimensions?: {
        length: number
        breadth: number
        height: number
    }
    paymentMode: "prepaid" | "cod"
    codAmount?: number
}

export interface ShipmentResult {
    success: boolean
    provider: ShippingProvider
    orderId: string
    awbNumber?: string
    shipmentId?: string
    label?: string
    error?: string
}

export interface TrackingResult {
    success: boolean
    awbNumber: string
    status: string
    statusCode: string
    currentLocation?: string
    expectedDelivery?: string
    events: Array<{
        timestamp: string
        status: string
        location: string
        remarks?: string
    }>
    error?: string
}

// Re-export for backward compatibility
import DelhiveryService, {
    createShipment as delhiveryCreateShipment,
    trackShipment as delhiveryTrackShipment,
    checkServiceability,
    cancelShipment,
    generateLabel,
    getTrackingUrl
} from "../delhivery"

export async function createShipment(
    provider: ShippingProvider,
    input: ShipmentInput
): Promise<ShipmentResult> {
    // Only Delhivery supported
    const result = await delhiveryCreateShipment({
        orderId: input.orderId,
        orderNumber: input.orderNumber,
        customer: {
            name: input.deliveryAddress.name,
            phone: input.deliveryAddress.phone,
            address: input.deliveryAddress.address,
            city: input.deliveryAddress.city,
            state: input.deliveryAddress.state,
            pincode: input.deliveryAddress.pincode,
            country: input.deliveryAddress.country
        },
        items: input.items,
        totalWeight: input.weight,
        dimensions: input.dimensions,
        paymentMode: input.paymentMode,
        codAmount: input.codAmount,
        invoiceValue: input.items.reduce((sum, i) => sum + i.price * i.quantity, 0)
    })

    return {
        success: result.success,
        provider: "delhivery",
        orderId: input.orderId,
        awbNumber: result.awbNumber,
        shipmentId: result.refNumber,
        error: result.error
    }
}

export async function trackShipment(
    provider: ShippingProvider,
    awbNumber: string
): Promise<TrackingResult> {
    return delhiveryTrackShipment(awbNumber)
}

export { createShipment as createDelhiveryShipment }
export { trackShipment as trackDelhiveryShipment }
export { checkServiceability }
export { cancelShipment }
export { generateLabel }
export { getTrackingUrl }

export default DelhiveryService
