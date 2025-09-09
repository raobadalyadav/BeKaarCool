import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const pincode = searchParams.get("pincode")

    if (!pincode || !/^\d{6}$/.test(pincode)) {
      return NextResponse.json({ error: "Valid 6-digit pincode is required" }, { status: 400 })
    }

    const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`)
    const data = await response.json()

    if (!response.ok || data[0]?.Status !== "Success") {
      return NextResponse.json({ error: "Invalid pincode" }, { status: 404 })
    }

    const postOffice = data[0]?.PostOffice?.[0]
    if (!postOffice) {
      return NextResponse.json({ error: "Pincode details not found" }, { status: 404 })
    }

    return NextResponse.json({
      pincode,
      district: postOffice.District,
      state: postOffice.State,
      country: postOffice.Country,
      area: postOffice.Name,
      division: postOffice.Division,
      region: postOffice.Region
    })
  } catch (error) {
    console.error("Error fetching pincode details:", error)
    return NextResponse.json({ error: "Failed to fetch pincode details" }, { status: 500 })
  }
}