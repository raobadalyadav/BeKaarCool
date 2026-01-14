/**
 * Coupons API
 * Get available coupons for users
 */

import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { Coupon } from "@/models/Coupon"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

// GET - Get available public coupons
export async function GET(request: NextRequest) {
    try {
        await connectDB()

        const { searchParams } = new URL(request.url)
        const category = searchParams.get("category")

        const now = new Date()

        const query: any = {
            isActive: true,
            isPublic: true,
            $or: [
                { startDate: null },
                { startDate: { $lte: now } }
            ],
            $and: [
                {
                    $or: [
                        { endDate: null },
                        { endDate: { $gte: now } }
                    ]
                }
            ]
        }

        // Filter coupons that haven't reached usage limit
        const coupons = await Coupon.find(query)
            .select("code description discountType discountValue minOrderAmount maxDiscount endDate termsAndConditions")
            .sort({ discountValue: -1 })
            .limit(10)
            .lean()

        // Filter out fully used coupons
        const availableCoupons = coupons.filter((c: any) =>
            !c.usageLimit || c.usedCount < c.usageLimit
        )

        return NextResponse.json(availableCoupons)
    } catch (error) {
        console.error("Error fetching coupons:", error)
        return NextResponse.json(
            { message: "Failed to fetch coupons" },
            { status: 500 }
        )
    }
}

// POST - Create coupon (Admin only)
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session || session.user.role !== "admin") {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
        }

        await connectDB()
        const body = await request.json()

        if (!body.code || !body.discountType || body.discountValue === undefined) {
            return NextResponse.json(
                { message: "Code, discount type and value are required" },
                { status: 400 }
            )
        }

        // Check if code exists
        const existing = await Coupon.findOne({ code: body.code.toUpperCase() })
        if (existing) {
            return NextResponse.json(
                { message: "Coupon code already exists" },
                { status: 400 }
            )
        }

        const coupon = await Coupon.create({
            ...body,
            code: body.code.toUpperCase(),
            createdBy: session.user.id,
            usedCount: 0
        })

        return NextResponse.json(coupon, { status: 201 })
    } catch (error) {
        console.error("Error creating coupon:", error)
        return NextResponse.json(
            { message: "Failed to create coupon" },
            { status: 500 }
        )
    }
}
