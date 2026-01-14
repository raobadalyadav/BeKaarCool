import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { connectDB } from "@/lib/mongodb"
import { User } from "@/models/User"

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

        const seller = await User.findById(id).lean()
        if (!seller) {
            return NextResponse.json({ error: "Seller not found" }, { status: 404 })
        }

        return NextResponse.json(seller)
    } catch (error) {
        console.error("Admin seller fetch error:", error)
        return NextResponse.json({ error: "Failed to fetch seller" }, { status: 500 })
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
        const { isActive, status } = body

        const updateData: any = {}
        if (typeof isActive === "boolean") updateData.isActive = isActive
        if (status) updateData.sellerStatus = status

        const seller = await User.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true }
        )

        if (!seller) {
            return NextResponse.json({ error: "Seller not found" }, { status: 404 })
        }

        return NextResponse.json({ seller, message: "Seller updated" })
    } catch (error) {
        console.error("Admin seller update error:", error)
        return NextResponse.json({ error: "Failed to update seller" }, { status: 500 })
    }
}
