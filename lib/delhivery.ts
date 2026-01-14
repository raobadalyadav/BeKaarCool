/**
 * Delhivery Shipping Integration - Production Ready
 * Single courier partner for BeKaarCool
 */

// ============================================
// CONFIGURATION
// ============================================

const DELHIVERY_API_KEY = process.env.DELHIVERY_API_KEY || ""
const DELHIVERY_API_URL = process.env.DELHIVERY_API_URL || "https://track.delhivery.com/api"
const DELHIVERY_CLIENT_NAME = process.env.DELHIVERY_CLIENT_NAME || "BeKaarCool"
const DELHIVERY_PICKUP_LOCATION = process.env.DELHIVERY_PICKUP_LOCATION || "BeKaarCool Warehouse"

// ============================================
// TYPES
// ============================================

export interface DelhiveryShipmentInput {
    orderId: string
    orderNumber: string
    customer: {
        name: string
        phone: string
        email?: string
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
    }>
    totalWeight: number // in kg
    dimensions?: {
        length: number
        breadth: number
        height: number
    }
    paymentMode: "prepaid" | "cod"
    codAmount?: number
    invoiceValue: number
}

export interface DelhiveryShipmentResult {
    success: boolean
    orderId: string
    awbNumber?: string
    refNumber?: string
    label?: string
    error?: string
}

export interface DelhiveryTrackingResult {
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

export interface DelhiveryServiceabilityResult {
    success: boolean
    pincode: string
    serviceable: boolean
    prepaidAllowed: boolean
    codAllowed: boolean
    estimatedDays: number
    error?: string
}

// ============================================
// SHIPMENT CREATION
// ============================================

export async function createShipment(
    input: DelhiveryShipmentInput
): Promise<DelhiveryShipmentResult> {
    try {
        if (!DELHIVERY_API_KEY) {
            throw new Error("Delhivery API key not configured")
        }

        // Delhivery format payload
        const shipmentPayload = {
            shipments: [{
                name: input.customer.name,
                add: input.customer.address,
                pin: input.customer.pincode,
                city: input.customer.city,
                state: input.customer.state,
                country: input.customer.country || "India",
                phone: input.customer.phone,
                order: input.orderNumber,
                payment_mode: input.paymentMode.toUpperCase(),
                cod_amount: input.paymentMode === "cod" ? input.codAmount : 0,
                total_amount: input.invoiceValue,
                weight: Math.ceil(input.totalWeight * 1000), // grams
                shipment_length: input.dimensions?.length || 20,
                shipment_width: input.dimensions?.breadth || 15,
                shipment_height: input.dimensions?.height || 10,
                seller_name: DELHIVERY_CLIENT_NAME,
                products_desc: input.items.map(i => `${i.name} x${i.quantity}`).join(", "),
                client: DELHIVERY_CLIENT_NAME,
                return_name: DELHIVERY_CLIENT_NAME,
                return_add: DELHIVERY_PICKUP_LOCATION,
                return_city: "Mumbai",
                return_pin: "400001",
                return_state: "Maharashtra",
                return_country: "India",
                return_phone: process.env.DELHIVERY_RETURN_PHONE || "9999999999"
            }],
            pickup_location: {
                name: DELHIVERY_PICKUP_LOCATION
            }
        }

        const response = await fetch(`${DELHIVERY_API_URL}/cmu/create.json`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Token ${DELHIVERY_API_KEY}`
            },
            body: JSON.stringify(shipmentPayload)
        })

        const data = await response.json()

        if (data.success || data.packages?.[0]?.waybill) {
            return {
                success: true,
                orderId: input.orderId,
                awbNumber: data.packages?.[0]?.waybill,
                refNumber: data.packages?.[0]?.refnum
            }
        }

        return {
            success: false,
            orderId: input.orderId,
            error: data.rmk || data.packages?.[0]?.remarks || "Failed to create shipment"
        }
    } catch (error: any) {
        console.error("Delhivery createShipment error:", error)
        return {
            success: false,
            orderId: input.orderId,
            error: error.message
        }
    }
}

// ============================================
// TRACKING
// ============================================

export async function trackShipment(
    awbNumber: string
): Promise<DelhiveryTrackingResult> {
    try {
        if (!DELHIVERY_API_KEY) {
            throw new Error("Delhivery API key not configured")
        }

        const response = await fetch(
            `${DELHIVERY_API_URL}/v1/packages/json/?waybill=${awbNumber}`,
            {
                headers: { "Authorization": `Token ${DELHIVERY_API_KEY}` }
            }
        )

        const data = await response.json()
        const shipment = data.ShipmentData?.[0]?.Shipment

        if (shipment) {
            const scans = shipment.Scans || []

            return {
                success: true,
                awbNumber,
                status: shipment.Status?.Status || "In Transit",
                statusCode: shipment.Status?.StatusCode || "",
                currentLocation: shipment.Status?.StatusLocation,
                expectedDelivery: shipment.ExpectedDeliveryDate,
                events: scans.map((scan: any) => ({
                    timestamp: scan.ScanDetail?.ScanDateTime || new Date().toISOString(),
                    status: scan.ScanDetail?.Instructions || scan.ScanDetail?.Scan || "",
                    location: scan.ScanDetail?.ScannedLocation || "",
                    remarks: scan.ScanDetail?.StatusCode || ""
                })).reverse()
            }
        }

        return {
            success: false,
            awbNumber,
            status: "Not Found",
            statusCode: "",
            events: [],
            error: "Shipment tracking data not available"
        }
    } catch (error: any) {
        console.error("Delhivery trackShipment error:", error)
        return {
            success: false,
            awbNumber,
            status: "Error",
            statusCode: "",
            events: [],
            error: error.message
        }
    }
}

// ============================================
// SERVICEABILITY CHECK
// ============================================

export async function checkServiceability(
    pincode: string
): Promise<DelhiveryServiceabilityResult> {
    try {
        if (!DELHIVERY_API_KEY) {
            throw new Error("Delhivery API key not configured")
        }

        const response = await fetch(
            `${DELHIVERY_API_URL}/c/api/pin-codes/json/?filter_codes=${pincode}`,
            {
                headers: { "Authorization": `Token ${DELHIVERY_API_KEY}` }
            }
        )

        const data = await response.json()
        const pincodeData = data.delivery_codes?.[0]?.postal_code

        if (pincodeData) {
            return {
                success: true,
                pincode,
                serviceable: true,
                prepaidAllowed: pincodeData.pre_paid === "Y",
                codAllowed: pincodeData.cod === "Y",
                estimatedDays: parseInt(pincodeData.max_days) || 5
            }
        }

        return {
            success: true,
            pincode,
            serviceable: false,
            prepaidAllowed: false,
            codAllowed: false,
            estimatedDays: 0,
            error: "Pincode not serviceable by Delhivery"
        }
    } catch (error: any) {
        console.error("Delhivery serviceability error:", error)
        return {
            success: false,
            pincode,
            serviceable: false,
            prepaidAllowed: false,
            codAllowed: false,
            estimatedDays: 0,
            error: error.message
        }
    }
}

// ============================================
// GENERATE SHIPPING LABEL
// ============================================

export async function generateLabel(
    awbNumber: string
): Promise<{ success: boolean; labelUrl?: string; error?: string }> {
    try {
        if (!DELHIVERY_API_KEY) {
            throw new Error("Delhivery API key not configured")
        }

        const response = await fetch(
            `${DELHIVERY_API_URL}/p/packing_slip?wbns=${awbNumber}&pdf=true`,
            {
                headers: { "Authorization": `Token ${DELHIVERY_API_KEY}` }
            }
        )

        if (response.ok) {
            // The response is PDF binary
            const labelUrl = `${DELHIVERY_API_URL}/p/packing_slip?wbns=${awbNumber}&pdf=true`
            return { success: true, labelUrl }
        }

        return { success: false, error: "Failed to generate label" }
    } catch (error: any) {
        console.error("Delhivery generateLabel error:", error)
        return { success: false, error: error.message }
    }
}

// ============================================
// CANCEL SHIPMENT
// ============================================

export async function cancelShipment(
    awbNumber: string,
    cancellationReason: string = "Order cancelled by customer"
): Promise<{ success: boolean; error?: string }> {
    try {
        if (!DELHIVERY_API_KEY) {
            throw new Error("Delhivery API key not configured")
        }

        const response = await fetch(`${DELHIVERY_API_URL}/p/edit`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Token ${DELHIVERY_API_KEY}`
            },
            body: JSON.stringify({
                waybill: awbNumber,
                cancellation: "true"
            })
        })

        const data = await response.json()

        if (data.status) {
            return { success: true }
        }

        return { success: false, error: data.error || "Failed to cancel shipment" }
    } catch (error: any) {
        console.error("Delhivery cancelShipment error:", error)
        return { success: false, error: error.message }
    }
}

// ============================================
// TRACKING URL GENERATOR
// ============================================

export function getTrackingUrl(awbNumber: string): string {
    return `https://www.delhivery.com/track/package/${awbNumber}`
}

// ============================================
// EXPORT DEFAULT SERVICE
// ============================================

const DelhiveryService = {
    createShipment,
    trackShipment,
    checkServiceability,
    generateLabel,
    cancelShipment,
    getTrackingUrl
}

export default DelhiveryService
