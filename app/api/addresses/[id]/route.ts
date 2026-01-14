import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { connectDB } from "@/lib/mongodb"
import { Address } from "@/models/Address"
import { resolveUserId } from "@/lib/auth-utils"

// GET: Fetch single address
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        await connectDB()

        const userId = await resolveUserId(session.user.id, session.user.email)
        const address = await Address.findOne({ _id: params.id, user: userId }).lean()

        if (!address) {
            return NextResponse.json({ error: "Address not found" }, { status: 404 })
        }

        return NextResponse.json(address)
    } catch (error: any) {
        console.error("Address GET error:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// PUT: Update address
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const data = await request.json()

        await connectDB()

        const userId = await resolveUserId(session.user.id, session.user.email)

        // Verify address belongs to user
        const address = await Address.findOne({ _id: params.id, user: userId })
        if (!address) {
            return NextResponse.json({ error: "Address not found" }, { status: 404 })
        }

        // If setting as default, unset other defaults first
        if (data.isDefault) {
            await Address.updateMany(
                { user: userId, _id: { $ne: params.id } },
                { isDefault: false }
            )
        }

        // Update address
        const updated = await Address.findByIdAndUpdate(
            params.id,
            {
                name: data.name,
                phone: data.phone,
                alternatePhone: data.alternatePhone,
                addressLine1: data.addressLine1,
                addressLine2: data.addressLine2,
                address: data.addressLine1, // Backwards compatibility
                landmark: data.landmark,
                city: data.city,
                state: data.state,
                pincode: data.pincode,
                country: data.country || "India",
                type: data.type,
                isDefault: data.isDefault
            },
            { new: true, runValidators: true }
        )

        return NextResponse.json({
            message: "Address updated successfully",
            address: updated
        })
    } catch (error: any) {
        console.error("Address PUT error:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// DELETE: Remove address
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        await connectDB()

        const userId = await resolveUserId(session.user.id, session.user.email)

        // Verify address belongs to user
        const address = await Address.findOne({ _id: params.id, user: userId })
        if (!address) {
            return NextResponse.json({ error: "Address not found" }, { status: 404 })
        }

        await Address.findByIdAndDelete(params.id)

        // If deleted address was default, make another one default
        if (address.isDefault) {
            const nextAddress = await Address.findOne({ user: userId })
            if (nextAddress) {
                nextAddress.isDefault = true
                await nextAddress.save()
            }
        }

        return NextResponse.json({ message: "Address deleted successfully" })
    } catch (error: any) {
        console.error("Address DELETE error:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
