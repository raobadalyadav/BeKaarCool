import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { connectDB } from "@/lib/mongodb"
import { Coupon } from "@/models/Coupon"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || (session.user.role !== "seller" && session.user.role !== "admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    const coupons = await Coupon.find({ createdBy: session.user.id })
      .sort({ createdAt: -1 })
      .select('code discountType discountValue minOrderAmount usageLimit usedCount validTo isActive')
      .lean()
    
    // Transform to match frontend interface
    const transformedCoupons = coupons.map(coupon => ({
      _id: coupon._id,
      code: coupon.code,
      type: coupon.discountType,
      value: coupon.discountValue,
      minOrder: coupon.minOrderAmount,
      usageLimit: coupon.usageLimit,
      usedCount: coupon.usedCount,
      expiryDate: coupon.validTo,
      status: coupon.isActive && new Date(coupon.validTo) > new Date() ? 'active' : 'expired'
    }))

    return NextResponse.json({ coupons: transformedCoupons })
  } catch (error) {
    console.error("Error fetching coupons:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || (session.user.role !== "seller" && session.user.role !== "admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { code, type, value, minOrder, maxDiscount, usageLimit, expiryDate } = body

    if (!code || !type || !value || !usageLimit || !expiryDate) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    await connectDB()

    // Check if coupon code already exists
    const existingCoupon = await Coupon.findOne({ code: code.toUpperCase() })
    if (existingCoupon) {
      return NextResponse.json({ error: "Coupon code already exists" }, { status: 400 })
    }

    const coupon = new Coupon({
      code: code.toUpperCase(),
      description: `${value}${type === 'percentage' ? '%' : '₹'} discount coupon`,
      discountType: type,
      discountValue: value,
      minOrderAmount: minOrder || 0,
      maxDiscountAmount: type === "percentage" ? maxDiscount : undefined,
      usageLimit,
      validFrom: new Date(),
      validTo: new Date(expiryDate),
      createdBy: session.user.id
    })

    await coupon.save()

    return NextResponse.json({ coupon }, { status: 201 })
  } catch (error) {
    console.error("Error creating coupon:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}