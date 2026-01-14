import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { connectDB } from "@/lib/mongodb"
import { Coupon } from "@/models/Coupon"

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user || (session.user as any).role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
        }

        await connectDB()

        const { searchParams } = new URL(request.url)
        const page = parseInt(searchParams.get("page") || "1")
        const limit = parseInt(searchParams.get("limit") || "20")
        const status = searchParams.get("status") // active, expired, all
        const search = searchParams.get("search")

        const query: any = {}

        if (status === "active") {
            query.isActive = true
            query.endDate = { $gte: new Date() }
        } else if (status === "expired") {
            query.$or = [
                { isActive: false },
                { endDate: { $lt: new Date() } }
            ]
        }

        if (search) {
            query.$or = [
                { code: { $regex: search, $options: "i" } },
                { description: { $regex: search, $options: "i" } }
            ]
        }

        const [coupons, total] = await Promise.all([
            Coupon.find(query)
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .lean(),
            Coupon.countDocuments(query)
        ])

        return NextResponse.json({
            coupons,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        })
    } catch (error) {
        console.error("Admin coupons fetch error:", error)
        return NextResponse.json({ error: "Failed to fetch coupons" }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user || (session.user as any).role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
        }

        await connectDB()

        const body = await request.json()
        const {
            code,
            description,
            discountType,
            discountValue,
            minOrderAmount,
            maxDiscount,
            usageLimit,
            perUserLimit,
            startDate,
            endDate,
            applicableCategories,
            applicableProducts,
            isActive
        } = body

        // Validate required fields
        if (!code || !discountType || !discountValue) {
            return NextResponse.json({ error: "Code, discount type, and value are required" }, { status: 400 })
        }

        // Check if code already exists
        const existing = await Coupon.findOne({ code: code.toUpperCase() })
        if (existing) {
            return NextResponse.json({ error: "Coupon code already exists" }, { status: 409 })
        }

        const coupon = await Coupon.create({
            code: code.toUpperCase(),
            description,
            discountType,
            discountValue,
            minOrderAmount: minOrderAmount || 0,
            maxDiscount: maxDiscount || null,
            usageLimit: usageLimit || null,
            perUserLimit: perUserLimit || 1,
            startDate: startDate ? new Date(startDate) : new Date(),
            endDate: endDate ? new Date(endDate) : null,
            applicableCategories: applicableCategories || [],
            applicableProducts: applicableProducts || [],
            isActive: isActive !== false
        })

        return NextResponse.json({ coupon, message: "Coupon created successfully" }, { status: 201 })
    } catch (error) {
        console.error("Admin coupon create error:", error)
        return NextResponse.json({ error: "Failed to create coupon" }, { status: 500 })
    }
}
