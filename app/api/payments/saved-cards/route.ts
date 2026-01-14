import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { connectDB } from "@/lib/mongodb"
import { SavedCard } from "@/models/SavedCard"
import { resolveUserId } from "@/lib/auth-utils"

// GET: List user's saved payment methods
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        await connectDB()

        const userId = await resolveUserId(session.user.id, session.user.email)

        const cards = await SavedCard.getUserCards(userId)

        return NextResponse.json({ cards })
    } catch (error: any) {
        console.error("Saved cards fetch error:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// POST: Add saved payment method (from payment gateway callback)
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        await connectDB()

        const userId = await resolveUserId(session.user.id, session.user.email)
        const body = await request.json()

        const {
            type,
            cardLast4,
            cardNetwork,
            cardType,
            cardExpiry,
            cardHolderName,
            upiId,
            gatewayToken,
            gateway,
            nickname,
            setAsDefault
        } = body

        if (!type || !gatewayToken || !gateway) {
            return NextResponse.json({
                error: "Type, gateway token, and gateway are required"
            }, { status: 400 })
        }

        // Set as default if it's the first card
        const existingCount = await SavedCard.countDocuments({ user: userId })
        const isDefault = setAsDefault || existingCount === 0

        const savedCard = await SavedCard.create({
            user: userId,
            type,
            cardLast4,
            cardNetwork,
            cardType,
            cardExpiry,
            cardHolderName,
            upiId,
            gatewayToken,
            gateway,
            nickname,
            isDefault
        })

        // Return without sensitive data
        const { gatewayToken: _, ...cardData } = savedCard.toObject()

        return NextResponse.json({
            message: "Payment method saved",
            card: cardData
        }, { status: 201 })
    } catch (error: any) {
        console.error("Save card error:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// DELETE: Remove saved payment method
export async function DELETE(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        await connectDB()

        const userId = await resolveUserId(session.user.id, session.user.email)
        const { searchParams } = new URL(request.url)
        const cardId = searchParams.get("id")

        if (!cardId) {
            return NextResponse.json({ error: "Card ID is required" }, { status: 400 })
        }

        const card = await SavedCard.findOneAndDelete({ _id: cardId, user: userId })

        if (!card) {
            return NextResponse.json({ error: "Card not found" }, { status: 404 })
        }

        // If deleted card was default, set another as default
        if (card.isDefault) {
            const anotherCard = await SavedCard.findOne({ user: userId })
            if (anotherCard) {
                anotherCard.isDefault = true
                await anotherCard.save()
            }
        }

        return NextResponse.json({ message: "Payment method removed" })
    } catch (error: any) {
        console.error("Delete card error:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// PUT: Set default payment method
export async function PUT(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        await connectDB()

        const userId = await resolveUserId(session.user.id, session.user.email)
        const { cardId } = await request.json()

        if (!cardId) {
            return NextResponse.json({ error: "Card ID is required" }, { status: 400 })
        }

        // Verify card belongs to user
        const card = await SavedCard.findOne({ _id: cardId, user: userId })
        if (!card) {
            return NextResponse.json({ error: "Card not found" }, { status: 404 })
        }

        await SavedCard.setDefault(userId, cardId)

        return NextResponse.json({ message: "Default payment method updated" })
    } catch (error: any) {
        console.error("Set default card error:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
