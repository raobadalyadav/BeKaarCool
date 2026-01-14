import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { connectDB } from "@/lib/mongodb"
import { Address } from "@/models/Address"
import { User } from "@/models/User"
import { resolveUserId } from "@/lib/auth-utils"

// GET: Fetch user's addresses
export async function GET() {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        await connectDB()

        const userId = await resolveUserId(session.user.id, session.user.email)
        const addresses = await Address.find({ user: userId })
            .sort({ isDefault: -1, createdAt: -1 })
            .lean()

        return NextResponse.json({ addresses })
    } catch (error: any) {
        console.error("Addresses GET error:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// POST: Add new address
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const data = await request.json()

        if (!data.name || !data.phone || !data.address || !data.city || !data.state || !data.pincode) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
        }

        await connectDB()

        const userId = await resolveUserId(session.user.id, session.user.email)

        // If this is the first address, make it default
        const existingCount = await Address.countDocuments({ user: userId })

        const address = await Address.create({
            user: userId,
            name: data.name,
            phone: data.phone,
            alternatePhone: data.alternatePhone,
            address: data.address,
            landmark: data.landmark,
            city: data.city,
            state: data.state,
            pincode: data.pincode,
            country: data.country || "India",
            type: data.type || "home",
            isDefault: existingCount === 0 || data.isDefault
        })

        return NextResponse.json({
            message: "Address added successfully",
            address
        }, { status: 201 })
    } catch (error: any) {
        console.error("Addresses POST error:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// PUT: Update address
export async function PUT(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const addressId = searchParams.get("id")

        if (!addressId) {
            return NextResponse.json({ error: "Address ID required" }, { status: 400 })
        }

        const data = await request.json()

        await connectDB()

        const userId = await resolveUserId(session.user.id, session.user.email)

        // Verify address belongs to user
        const address = await Address.findOne({ _id: addressId, user: userId })
        if (!address) {
            return NextResponse.json({ error: "Address not found" }, { status: 404 })
        }

        // Update address
        const updated = await Address.findByIdAndUpdate(
            addressId,
            {
                name: data.name,
                phone: data.phone,
                alternatePhone: data.alternatePhone,
                address: data.address,
                landmark: data.landmark,
                city: data.city,
                state: data.state,
                pincode: data.pincode,
                country: data.country,
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
        console.error("Addresses PUT error:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// DELETE: Remove address
export async function DELETE(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const addressId = searchParams.get("id")

        if (!addressId) {
            return NextResponse.json({ error: "Address ID required" }, { status: 400 })
        }

        await connectDB()

        const userId = await resolveUserId(session.user.id, session.user.email)

        // Verify address belongs to user
        const address = await Address.findOne({ _id: addressId, user: userId })
        if (!address) {
            return NextResponse.json({ error: "Address not found" }, { status: 404 })
        }

        await Address.findByIdAndDelete(addressId)

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
        console.error("Addresses DELETE error:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
