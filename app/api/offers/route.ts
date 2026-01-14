import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { Offer } from "@/models/Offer"

// GET: List active offers
export async function GET(request: NextRequest) {
    try {
        await connectDB()

        const { searchParams } = new URL(request.url)
        const flashOnly = searchParams.get("flash") === "true"

        const now = new Date()
        const query: any = {
            isActive: true,
            validFrom: { $lte: now },
            validTo: { $gte: now }
        }

        if (flashOnly) {
            query.isFlashSale = true
        }

        const offers = await Offer.find(query)
            .sort({ priority: -1, validTo: 1 }) // Priority first, then ending soon

        return NextResponse.json({ offers })
    } catch (error: any) {
        console.error("Offers list error:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// POST: Create new offer (admin only)
export async function POST(request: NextRequest) {
    try {
        await connectDB()

        const body = await request.json()

        const offer = await Offer.create(body)

        return NextResponse.json({
            message: "Offer created",
            offer
        }, { status: 201 })
    } catch (error: any) {
        console.error("Offer create error:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
