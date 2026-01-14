import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { Pincode } from "@/models/Pincode"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const pincode = searchParams.get("pincode")

    if (!pincode || !/^\d{6}$/.test(pincode)) {
      return NextResponse.json({ error: "Valid 6-digit pincode is required" }, { status: 400 })
    }

    await connectDB()

    // First check our database
    const result = await Pincode.checkServiceability(pincode)

    if (result.isServiceable && result.details) {
      return NextResponse.json({
        pincode,
        isServiceable: true,
        city: result.details.city,
        state: result.details.state,
        country: "India",
        codAvailable: result.details.codAvailable,
        delivery: {
          standardDays: result.details.standardDays,
          expressDays: result.details.expressDays,
          deliveryCharge: result.details.deliveryCharge,
          expressCharge: result.details.expressCharge,
          freeDeliveryAbove: result.details.freeDeliveryAbove,
          estimatedDate: new Date(Date.now() + result.details.standardDays * 24 * 60 * 60 * 1000).toLocaleDateString("en-IN", {
            weekday: "short",
            day: "numeric",
            month: "short"
          })
        },
        slots: result.details.slots
      })
    }

    // Fallback to external API for pincode lookup
    const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`)
    const data = await response.json()

    if (!response.ok || data[0]?.Status !== "Success") {
      return NextResponse.json({
        pincode,
        isServiceable: false,
        error: "Delivery not available for this pincode"
      }, { status: 200 })
    }

    const postOffice = data[0]?.PostOffice?.[0]
    if (!postOffice) {
      return NextResponse.json({
        pincode,
        isServiceable: false,
        error: "Pincode details not found"
      }, { status: 200 })
    }

    // Return with default delivery info for areas not in our database
    return NextResponse.json({
      pincode,
      isServiceable: true,
      city: postOffice.District,
      state: postOffice.State,
      country: postOffice.Country,
      area: postOffice.Name,
      codAvailable: true,
      delivery: {
        standardDays: 5,
        expressDays: 3,
        deliveryCharge: 49,
        expressCharge: 99,
        freeDeliveryAbove: 499,
        estimatedDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toLocaleDateString("en-IN", {
          weekday: "short",
          day: "numeric",
          month: "short"
        })
      },
      slots: []
    })
  } catch (error) {
    console.error("Error fetching pincode details:", error)
    return NextResponse.json({ error: "Failed to fetch pincode details" }, { status: 500 })
  }
}