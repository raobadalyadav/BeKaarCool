import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { connectDB } from "@/lib/mongodb"
import { Coupon } from "@/models/Coupon"

interface RouteParams {
    params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user || (session.user as any).role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
        }

        const { id } = await params
        await connectDB()

        const coupon = await Coupon.findById(id).lean()
        if (!coupon) {
            return NextResponse.json({ error: "Coupon not found" }, { status: 404 })
        }

        return NextResponse.json({ coupon })
    } catch (error) {
        console.error("Admin coupon fetch error:", error)
        return NextResponse.json({ error: "Failed to fetch coupon" }, { status: 500 })
    }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user || (session.user as any).role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
        }

        const { id } = await params
        await connectDB()

        const body = await request.json()

        // Don't allow changing the code
        delete body.code

        const coupon = await Coupon.findByIdAndUpdate(
            id,
            { $set: body },
            { new: true, runValidators: true }
        )

        if (!coupon) {
            return NextResponse.json({ error: "Coupon not found" }, { status: 404 })
        }

        return NextResponse.json({ coupon, message: "Coupon updated successfully" })
    } catch (error) {
        console.error("Admin coupon update error:", error)
        return NextResponse.json({ error: "Failed to update coupon" }, { status: 500 })
    }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user || (session.user as any).role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
        }

        const { id } = await params
        await connectDB()

        const coupon = await Coupon.findByIdAndDelete(id)
        if (!coupon) {
            return NextResponse.json({ error: "Coupon not found" }, { status: 404 })
        }

        return NextResponse.json({ message: "Coupon deleted successfully" })
    } catch (error) {
        console.error("Admin coupon delete error:", error)
        return NextResponse.json({ error: "Failed to delete coupon" }, { status: 500 })
    }
}
