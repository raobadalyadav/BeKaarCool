/**
 * Coupon Validation API
 * Validate coupon codes with cart context
 */

import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { Coupon } from "@/models/Coupon"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) {
            return NextResponse.json({ message: "Please login to apply coupon" }, { status: 401 })
        }

        await connectDB()
        const body = await request.json()
        const { code, cartTotal, cartItems } = body

        if (!code) {
            return NextResponse.json(
                { valid: false, message: "Coupon code is required" },
                { status: 400 }
            )
        }

        // Find coupon
        const coupon = await Coupon.findOne({
            code: code.toUpperCase(),
            isActive: true
        })

        if (!coupon) {
            return NextResponse.json({
                valid: false,
                message: "Invalid coupon code"
            })
        }

        // Check validity period
        const now = new Date()
        if (coupon.startDate && coupon.startDate > now) {
            return NextResponse.json({
                valid: false,
                message: "This coupon is not active yet"
            })
        }

        if (coupon.endDate && coupon.endDate < now) {
            return NextResponse.json({
                valid: false,
                message: "This coupon has expired"
            })
        }

        // Check usage limit
        if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
            return NextResponse.json({
                valid: false,
                message: "This coupon has reached its usage limit"
            })
        }

        // Check per-user limit
        if (coupon.perUserLimit) {
            const userUsage = coupon.usageHistory?.filter(
                (u: any) => u.user?.toString() === session.user.id
            ).length || 0

            if (userUsage >= coupon.perUserLimit) {
                return NextResponse.json({
                    valid: false,
                    message: `You have already used this coupon ${coupon.perUserLimit} time(s)`
                })
            }
        }

        // Check minimum order amount
        if (coupon.minOrderAmount && cartTotal < coupon.minOrderAmount) {
            return NextResponse.json({
                valid: false,
                message: `Minimum order amount is ₹${coupon.minOrderAmount}`
            })
        }

        // Check first order only
        if (coupon.firstOrderOnly) {
            // Would need to check user's order history
            // For now, skip this check
        }

        // Calculate discount
        let discount = 0
        if (coupon.discountType === "percentage") {
            discount = Math.round((cartTotal * coupon.discountValue) / 100)
            if (coupon.maxDiscount && discount > coupon.maxDiscount) {
                discount = coupon.maxDiscount
            }
        } else {
            discount = coupon.discountValue
        }

        // Ensure discount doesn't exceed cart total
        if (discount > cartTotal) {
            discount = cartTotal
        }

        return NextResponse.json({
            valid: true,
            coupon: {
                code: coupon.code,
                discountType: coupon.discountType,
                discountValue: coupon.discountValue,
                maxDiscount: coupon.maxDiscount,
                description: coupon.description
            },
            discount,
            message: `Coupon applied! You save ₹${discount}`
        })
    } catch (error) {
        console.error("Error validating coupon:", error)
        return NextResponse.json(
            { valid: false, message: "Failed to validate coupon" },
            { status: 500 }
        )
    }
}
