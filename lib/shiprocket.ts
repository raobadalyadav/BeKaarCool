interface ShipmentData {
  order_id: string
  order_date: string
  pickup_location: string
  billing_customer_name: string
  billing_last_name: string
  billing_address: string
  billing_city: string
  billing_pincode: string
  billing_state: string
  billing_country: string
  billing_email: string
  billing_phone: string
  shipping_is_billing: boolean
  shipping_customer_name?: string
  shipping_last_name?: string
  shipping_address?: string
  shipping_city?: string
  shipping_pincode?: string
  shipping_state?: string
  shipping_country?: string
  shipping_email?: string
  shipping_phone?: string
  order_items: Array<{
    name: string
    sku: string
    units: number
    selling_price: number
  }>
  payment_method: string
  sub_total: number
  length: number
  breadth: number
  height: number
  weight: number
}

class ShiprocketAPI {
  private baseURL = "https://apiv2.shiprocket.in/v1/external"
  private token: string | null = null

  async authenticate() {
    try {
      const response = await fetch(`${this.baseURL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: process.env.SHIPROCKET_EMAIL,
          password: process.env.SHIPROCKET_PASSWORD,
        }),
      })

      const data = await response.json()

      if (data.token) {
        this.token = data.token
        return this.token
      } else {
        throw new Error("Failed to authenticate with Shiprocket")
      }
    } catch (error) {
      console.error("Shiprocket authentication error:", error)
      throw error
    }
  }

  async createOrder(shipmentData: ShipmentData) {
    if (!this.token) {
      await this.authenticate()
    }

    try {
      const response = await fetch(`${this.baseURL}/orders/create/adhoc`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.token}`,
        },
        body: JSON.stringify(shipmentData),
      })

      const data = await response.json()

      if (response.ok) {
        return data
      } else {
        throw new Error(data.message || "Failed to create shipment")
      }
    } catch (error) {
      console.error("Shiprocket order creation error:", error)
      throw error
    }
  }

  async trackShipment(awbCode: string) {
    if (!this.token) {
      await this.authenticate()
    }

    try {
      const response = await fetch(`${this.baseURL}/courier/track/awb/${awbCode}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      })

      const data = await response.json()

      if (response.ok) {
        return data
      } else {
        throw new Error("Failed to track shipment")
      }
    } catch (error) {
      console.error("Shiprocket tracking error:", error)
      throw error
    }
  }

  async getServiceability(pickupPincode: string, deliveryPincode: string, weight: number) {
    if (!this.token) {
      await this.authenticate()
    }

    try {
      const response = await fetch(
        `${this.baseURL}/courier/serviceability/?pickup_postcode=${pickupPincode}&delivery_postcode=${deliveryPincode}&weight=${weight}&cod=1`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${this.token}`,
          },
        },
      )

      const data = await response.json()

      if (response.ok) {
        return data
      } else {
        throw new Error("Failed to check serviceability")
      }
    } catch (error) {
      console.error("Shiprocket serviceability error:", error)
      throw error
    }
  }
}

const shiprocket = new ShiprocketAPI()

export async function createShipment(order: any, shippingAddress: any) {
  try {
    const shipmentData: ShipmentData = {
      order_id: order.orderNumber,
      order_date: new Date(order.createdAt).toISOString().split("T")[0],
      pickup_location: "Primary", // Configure this in Shiprocket dashboard
      billing_customer_name: shippingAddress.name.split(" ")[0],
      billing_last_name: shippingAddress.name.split(" ").slice(1).join(" ") || "",
      billing_address: shippingAddress.street,
      billing_city: shippingAddress.city,
      billing_pincode: shippingAddress.zipCode,
      billing_state: shippingAddress.state,
      billing_country: shippingAddress.country,
      billing_email: shippingAddress.email || order.user.email,
      billing_phone: shippingAddress.phone,
      shipping_is_billing: true,
      order_items: order.items.map((item: any) => ({
        name: item.product?.name || item.name,
        sku: item.product?._id || item.product,
        units: item.quantity,
        selling_price: item.price / item.quantity,
      })),
      payment_method: order.paymentMethod === "cod" ? "COD" : "Prepaid",
      sub_total: order.total,
      length: 10, // Default dimensions - should be calculated based on products
      breadth: 10,
      height: 10,
      weight: 0.5, // Default weight - should be calculated based on products
    }

    const result = await shiprocket.createOrder(shipmentData)
    return result
  } catch (error) {
    console.error("Error creating shipment:", error)
    throw error
  }
}

export async function trackShipment(awbCode: string) {
  try {
    const result = await shiprocket.trackShipment(awbCode)
    return result
  } catch (error) {
    console.error("Error tracking shipment:", error)
    throw error
  }
}

export async function checkServiceability(pickupPincode: string, deliveryPincode: string, weight = 0.5) {
  try {
    const result = await shiprocket.getServiceability(pickupPincode, deliveryPincode, weight)
    return result
  } catch (error) {
    console.error("Error checking serviceability:", error)
    throw error
  }
}
