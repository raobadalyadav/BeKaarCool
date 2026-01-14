/**
 * Shipping Provider Integrations
 * Supports: Shiprocket, Delhivery, Bluedart, Ecom Express
 */

// ============================================
// COMMON TYPES
// ============================================

export type ShippingProvider = "shiprocket" | "delhivery" | "bluedart" | "ecomexpress"

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
        weight: number // in kg
    }>
    weight: number // total in kg
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
    expectedDelivery?: Date
    events: Array<{
        timestamp: Date
        status: string
        location: string
        remarks?: string
    }>
    error?: string
}

export interface RateCheckResult {
    success: boolean
    provider: ShippingProvider
    available: boolean
    rate: number
    estimatedDays: number
    codAvailable: boolean
    error?: string
}

// ============================================
// SHIPROCKET (Already exists, enhanced)
// ============================================

const SHIPROCKET_EMAIL = process.env.SHIPROCKET_EMAIL || ""
const SHIPROCKET_PASSWORD = process.env.SHIPROCKET_PASSWORD || ""
const SHIPROCKET_API_URL = "https://apiv2.shiprocket.in/v1/external"

let shiprocketToken: string | null = null
let shiprocketTokenExpiry: Date | null = null

async function getShiprocketToken(): Promise<string> {
    if (shiprocketToken && shiprocketTokenExpiry && shiprocketTokenExpiry > new Date()) {
        return shiprocketToken
    }

    const response = await fetch(`${SHIPROCKET_API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            email: SHIPROCKET_EMAIL,
            password: SHIPROCKET_PASSWORD
        })
    })

    const data = await response.json()
    shiprocketToken = data.token
    shiprocketTokenExpiry = new Date(Date.now() + 9 * 24 * 60 * 60 * 1000) // 9 days
    return shiprocketToken!
}

export async function createShiprocketShipment(
    input: ShipmentInput
): Promise<ShipmentResult> {
    try {
        const token = await getShiprocketToken()

        const orderData = {
            order_id: input.orderId,
            order_date: new Date().toISOString().split("T")[0],
            pickup_location: input.pickupLocation,
            billing_customer_name: input.deliveryAddress.name,
            billing_last_name: "",
            billing_address: input.deliveryAddress.address,
            billing_city: input.deliveryAddress.city,
            billing_pincode: input.deliveryAddress.pincode,
            billing_state: input.deliveryAddress.state,
            billing_country: input.deliveryAddress.country || "India",
            billing_phone: input.deliveryAddress.phone,
            shipping_is_billing: true,
            order_items: input.items.map(item => ({
                name: item.name,
                sku: item.sku,
                units: item.quantity,
                selling_price: item.price
            })),
            payment_method: input.paymentMode === "cod" ? "COD" : "Prepaid",
            sub_total: input.items.reduce((sum, item) => sum + item.price * item.quantity, 0),
            length: input.dimensions?.length || 10,
            breadth: input.dimensions?.breadth || 10,
            height: input.dimensions?.height || 10,
            weight: input.weight
        }

        const response = await fetch(`${SHIPROCKET_API_URL}/orders/create/adhoc`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(orderData)
        })

        const data = await response.json()

        if (data.order_id) {
            return {
                success: true,
                provider: "shiprocket",
                orderId: input.orderId,
                shipmentId: data.shipment_id?.toString(),
                awbNumber: data.awb_code
            }
        }

        return {
            success: false,
            provider: "shiprocket",
            orderId: input.orderId,
            error: data.message || "Failed to create shipment"
        }
    } catch (error: any) {
        console.error("Shiprocket createShipment error:", error)
        return {
            success: false,
            provider: "shiprocket",
            orderId: input.orderId,
            error: error.message
        }
    }
}

export async function trackShiprocketShipment(awbNumber: string): Promise<TrackingResult> {
    try {
        const token = await getShiprocketToken()

        const response = await fetch(
            `${SHIPROCKET_API_URL}/courier/track/awb/${awbNumber}`,
            {
                headers: { "Authorization": `Bearer ${token}` }
            }
        )

        const data = await response.json()

        if (data.tracking_data) {
            const tracking = data.tracking_data
            return {
                success: true,
                awbNumber,
                status: tracking.shipment_status_id?.toString() || "unknown",
                statusCode: tracking.shipment_status?.toString() || "",
                currentLocation: tracking.current_status,
                expectedDelivery: tracking.etd ? new Date(tracking.etd) : undefined,
                events: (tracking.shipment_track || []).map((event: any) => ({
                    timestamp: new Date(event.date),
                    status: event.activity,
                    location: event.location,
                    remarks: event.sr_status_label
                }))
            }
        }

        return {
            success: false,
            awbNumber,
            status: "unknown",
            statusCode: "",
            events: [],
            error: "Tracking data not found"
        }
    } catch (error: any) {
        console.error("Shiprocket track error:", error)
        return {
            success: false,
            awbNumber,
            status: "error",
            statusCode: "",
            events: [],
            error: error.message
        }
    }
}

// ============================================
// DELHIVERY
// ============================================

const DELHIVERY_API_KEY = process.env.DELHIVERY_API_KEY || ""
const DELHIVERY_API_URL = process.env.DELHIVERY_API_URL || "https://track.delhivery.com/api"

export async function createDelhiveryShipment(
    input: ShipmentInput
): Promise<ShipmentResult> {
    try {
        const shipmentData = {
            shipments: [{
                name: input.deliveryAddress.name,
                add: input.deliveryAddress.address,
                pin: input.deliveryAddress.pincode,
                city: input.deliveryAddress.city,
                state: input.deliveryAddress.state,
                country: input.deliveryAddress.country || "India",
                phone: input.deliveryAddress.phone,
                order: input.orderNumber,
                payment_mode: input.paymentMode === "cod" ? "COD" : "Prepaid",
                cod_amount: input.codAmount || 0,
                weight: input.weight * 1000, // Convert to grams
                shipment_length: input.dimensions?.length || 10,
                shipment_width: input.dimensions?.breadth || 10,
                shipment_height: input.dimensions?.height || 10,
                seller_name: "BeKaarCool",
                products_desc: input.items.map(i => i.name).join(", ")
            }],
            pickup_location: {
                name: input.pickupLocation
            }
        }

        const response = await fetch(`${DELHIVERY_API_URL}/cmu/create.json`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Token ${DELHIVERY_API_KEY}`
            },
            body: JSON.stringify(shipmentData)
        })

        const data = await response.json()

        if (data.success) {
            return {
                success: true,
                provider: "delhivery",
                orderId: input.orderId,
                awbNumber: data.packages?.[0]?.waybill,
                shipmentId: data.packages?.[0]?.refnum
            }
        }

        return {
            success: false,
            provider: "delhivery",
            orderId: input.orderId,
            error: data.rmk || "Failed to create shipment"
        }
    } catch (error: any) {
        console.error("Delhivery createShipment error:", error)
        return {
            success: false,
            provider: "delhivery",
            orderId: input.orderId,
            error: error.message
        }
    }
}

export async function trackDelhiveryShipment(awbNumber: string): Promise<TrackingResult> {
    try {
        const response = await fetch(
            `${DELHIVERY_API_URL}/v1/packages/json/?waybill=${awbNumber}`,
            {
                headers: { "Authorization": `Token ${DELHIVERY_API_KEY}` }
            }
        )

        const data = await response.json()
        const shipment = data.ShipmentData?.[0]?.Shipment

        if (shipment) {
            return {
                success: true,
                awbNumber,
                status: shipment.Status?.Status || "unknown",
                statusCode: shipment.Status?.StatusCode || "",
                currentLocation: shipment.Status?.StatusLocation,
                expectedDelivery: shipment.ExpectedDeliveryDate
                    ? new Date(shipment.ExpectedDeliveryDate)
                    : undefined,
                events: (shipment.Scans || []).map((scan: any) => ({
                    timestamp: new Date(scan.ScanDetail?.ScanDateTime),
                    status: scan.ScanDetail?.Instructions,
                    location: scan.ScanDetail?.ScannedLocation,
                    remarks: scan.ScanDetail?.StatusCode
                }))
            }
        }

        return {
            success: false,
            awbNumber,
            status: "unknown",
            statusCode: "",
            events: [],
            error: "Shipment not found"
        }
    } catch (error: any) {
        console.error("Delhivery track error:", error)
        return {
            success: false,
            awbNumber,
            status: "error",
            statusCode: "",
            events: [],
            error: error.message
        }
    }
}

export async function checkDelhiveryServiceability(
    pincode: string
): Promise<RateCheckResult> {
    try {
        const response = await fetch(
            `${DELHIVERY_API_URL}/c/api/pin-codes/json/?filter_codes=${pincode}`,
            {
                headers: { "Authorization": `Token ${DELHIVERY_API_KEY}` }
            }
        )

        const data = await response.json()
        const details = data.delivery_codes?.[0]?.postal_code

        if (details) {
            return {
                success: true,
                provider: "delhivery",
                available: true,
                rate: 0, // Rate depends on weight, needs separate call
                estimatedDays: parseInt(details.max_days) || 5,
                codAvailable: details.cod === "Y"
            }
        }

        return {
            success: true,
            provider: "delhivery",
            available: false,
            rate: 0,
            estimatedDays: 0,
            codAvailable: false
        }
    } catch (error: any) {
        return {
            success: false,
            provider: "delhivery",
            available: false,
            rate: 0,
            estimatedDays: 0,
            codAvailable: false,
            error: error.message
        }
    }
}

// ============================================
// BLUEDART
// ============================================

const BLUEDART_LICENSE_KEY = process.env.BLUEDART_LICENSE_KEY || ""
const BLUEDART_LOGIN_ID = process.env.BLUEDART_LOGIN_ID || ""
const BLUEDART_API_URL = process.env.BLUEDART_API_URL || "https://netconnect.bluedart.com/API-Apache/ShippingAPI"

export async function trackBluedartShipment(awbNumber: string): Promise<TrackingResult> {
    try {
        const response = await fetch(
            `${BLUEDART_API_URL}/Tracking/GetTrackingData`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    Profile: {
                        LicenceKey: BLUEDART_LICENSE_KEY,
                        LoginID: BLUEDART_LOGIN_ID,
                        Api_type: "S"
                    },
                    Request: {
                        AWBNo: awbNumber
                    }
                })
            }
        )

        const data = await response.json()

        if (data.TrackingData) {
            return {
                success: true,
                awbNumber,
                status: data.TrackingData.Status || "unknown",
                statusCode: data.TrackingData.StatusCode || "",
                currentLocation: data.TrackingData.CurrentLocation,
                events: (data.TrackingData.ScanDetails || []).map((scan: any) => ({
                    timestamp: new Date(scan.ScanDate),
                    status: scan.ScanStatus,
                    location: scan.ScanLocation
                }))
            }
        }

        return {
            success: false,
            awbNumber,
            status: "unknown",
            statusCode: "",
            events: [],
            error: "Tracking data not found"
        }
    } catch (error: any) {
        console.error("Bluedart track error:", error)
        return {
            success: false,
            awbNumber,
            status: "error",
            statusCode: "",
            events: [],
            error: error.message
        }
    }
}

// ============================================
// ECOM EXPRESS
// ============================================

const ECOMEXPRESS_USERNAME = process.env.ECOMEXPRESS_USERNAME || ""
const ECOMEXPRESS_PASSWORD = process.env.ECOMEXPRESS_PASSWORD || ""
const ECOMEXPRESS_API_URL = process.env.ECOMEXPRESS_API_URL || "https://api.ecomexpress.in/apiv2"

export async function trackEcomExpressShipment(awbNumber: string): Promise<TrackingResult> {
    try {
        const response = await fetch(
            `${ECOMEXPRESS_API_URL}/track_v2/awbs/${awbNumber}/`,
            {
                headers: {
                    "Authorization": `Basic ${Buffer.from(`${ECOMEXPRESS_USERNAME}:${ECOMEXPRESS_PASSWORD}`).toString("base64")}`
                }
            }
        )

        const data = await response.json()

        if (data.awb_data) {
            return {
                success: true,
                awbNumber,
                status: data.awb_data.current_status || "unknown",
                statusCode: data.awb_data.current_status_code || "",
                currentLocation: data.awb_data.current_location,
                expectedDelivery: data.awb_data.expected_date
                    ? new Date(data.awb_data.expected_date)
                    : undefined,
                events: (data.awb_data.scans || []).map((scan: any) => ({
                    timestamp: new Date(scan.scan_datetime),
                    status: scan.status,
                    location: scan.location,
                    remarks: scan.remarks
                }))
            }
        }

        return {
            success: false,
            awbNumber,
            status: "unknown",
            statusCode: "",
            events: [],
            error: "Tracking data not found"
        }
    } catch (error: any) {
        console.error("EcomExpress track error:", error)
        return {
            success: false,
            awbNumber,
            status: "error",
            statusCode: "",
            events: [],
            error: error.message
        }
    }
}

// ============================================
// UNIFIED SHIPPING INTERFACE
// ============================================

export async function createShipment(
    provider: ShippingProvider,
    input: ShipmentInput
): Promise<ShipmentResult> {
    switch (provider) {
        case "shiprocket":
            return createShiprocketShipment(input)
        case "delhivery":
            return createDelhiveryShipment(input)
        default:
            return {
                success: false,
                provider,
                orderId: input.orderId,
                error: "Provider not supported for shipment creation"
            }
    }
}

export async function trackShipment(
    provider: ShippingProvider,
    awbNumber: string
): Promise<TrackingResult> {
    switch (provider) {
        case "shiprocket":
            return trackShiprocketShipment(awbNumber)
        case "delhivery":
            return trackDelhiveryShipment(awbNumber)
        case "bluedart":
            return trackBluedartShipment(awbNumber)
        case "ecomexpress":
            return trackEcomExpressShipment(awbNumber)
        default:
            return {
                success: false,
                awbNumber,
                status: "unknown",
                statusCode: "",
                events: [],
                error: "Unknown shipping provider"
            }
    }
}
