/**
 * Banners API
 * Get banners by placement for homepage, category pages, etc.
 */

import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { Banner } from "@/models/Banner"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

// GET - Fetch banners by placement
export async function GET(request: NextRequest) {
    try {
        await connectDB()

        const { searchParams } = new URL(request.url)
        const placement = searchParams.get("placement") || "homepage"
        const type = searchParams.get("type")
        const limit = parseInt(searchParams.get("limit") || "10")

        const now = new Date()

        // Build query
        const query: any = {
            isActive: true,
            placement,
            $and: [
                {
                    $or: [
                        { startDate: { $exists: false } },
                        { startDate: null },
                        { startDate: { $lte: now } }
                    ]
                },
                {
                    $or: [
                        { endDate: { $exists: false } },
                        { endDate: null },
                        { endDate: { $gte: now } }
                    ]
                }
            ]
        }

        if (type) {
            query.type = type
        }

        const banners = await Banner.find(query)
            .sort({ position: 1, createdAt: -1 })
            .limit(limit)
            .lean()

        // Increment impression count (fire and forget)
        const bannerIds = banners.map(b => b._id)
        Banner.updateMany(
            { _id: { $in: bannerIds } },
            { $inc: { impressionCount: 1 } }
        ).exec()

        return NextResponse.json(banners)
    } catch (error) {
        console.error("Error fetching banners:", error)
        return NextResponse.json(
            { message: "Failed to fetch banners" },
            { status: 500 }
        )
    }
}

// POST - Create banner (Admin only)
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session || session.user.role !== "admin") {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
        }

        await connectDB()
        const body = await request.json()

        // Validate required fields
        if (!body.title || !body.image) {
            return NextResponse.json(
                { message: "Title and image are required" },
                { status: 400 }
            )
        }

        const banner = await Banner.create({
            ...body,
            createdBy: session.user.id,
            clickCount: 0,
            impressionCount: 0
        })

        return NextResponse.json(banner, { status: 201 })
    } catch (error) {
        console.error("Error creating banner:", error)
        return NextResponse.json(
            { message: "Failed to create banner" },
            { status: 500 }
        )
    }
}
