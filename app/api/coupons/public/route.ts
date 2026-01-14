import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { Coupon } from "@/models/Coupon"

// GET: List public/active coupons
export async function GET() {
    try {
        await connectDB()

        const now = new Date()

        const coupons = await Coupon.find({
            isActive: true,
            isPublic: true,
            validFrom: { $lte: now },
            validTo: { $gte: now },
            $or: [
                { usageLimit: { $exists: false } },
                { $expr: { $lt: ["$usedCount", "$usageLimit"] } }
            ]
        })
            .select("code description discountType discountValue minOrderAmount maxDiscountAmount validTo")
            .sort({ discountValue: -1 })

        // Transform for frontend
        const formattedCoupons = coupons.map(c => ({
            _id: c._id,
            code: c.code,
            description: c.description,
            discountType: c.discountType,
            discountValue: c.discountValue,
            minOrderValue: c.minOrderAmount,
            maxDiscount: c.maxDiscountAmount,
            validUntil: c.validTo
        }))

        return NextResponse.json({ coupons: formattedCoupons })
    } catch (error: any) {
        console.error("Public coupons error:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
