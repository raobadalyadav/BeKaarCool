/**
 * Banner Click Tracking API
 */

import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { Banner } from "@/models/Banner"

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB()
        const { id } = await params

        await Banner.findByIdAndUpdate(id, {
            $inc: { clickCount: 1 }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Error tracking banner click:", error)
        return NextResponse.json(
            { message: "Failed to track click" },
            { status: 500 }
        )
    }
}
