
import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { connectDB } from "@/lib/mongodb"
import { Seller } from "@/models/Seller"
import { User } from "@/models/User"

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.email) {
            return NextResponse.json({ message: "Unauthorized. Please login first." }, { status: 401 })
        }

        await connectDB()

        // Get user from DB to ensure valid ID
        const user = await User.findOne({ email: session.user.email })
        if (!user) {
            return NextResponse.json({ message: "User not found" }, { status: 404 })
        }

        // Check if already a seller
        const existingSeller = await Seller.findOne({ user: user._id })
        if (existingSeller) {
            return NextResponse.json({
                message: "You have already registered as a seller",
                sellerId: existingSeller._id
            }, { status: 400 })
        }

        const body = await request.json()
        const {
            businessName,
            businessType,
            businessEmail,
            businessPhone,
            businessDescription,
            address,
            city,
            state,
            pincode,
            gstNumber,
            panNumber,
            bankAccount,
            ifscCode,
            bankName,
            accountHolderName
        } = body

        // Validation
        if (!businessName || !city || !state || !pincode || !panNumber) {
            return NextResponse.json({ message: "Missing required fields" }, { status: 400 })
        }

        // Create Seller Profile
        const newSeller = await Seller.create({
            user: user._id,
            businessName,
            businessType: businessType || "individual",
            businessEmail: businessEmail || user.email,
            businessPhone: businessPhone || "",
            businessDescription,
            businessAddress: {
                address,
                city,
                state,
                pincode,
                country: "India"
            },
            gstNumber,
            panNumber,
            bankDetails: {
                accountNumber: bankAccount,
                ifscCode,
                bankName: bankName || "Bank", // Should ideally fetch from IFSC API
                accountHolderName: accountHolderName || user.name,
                isVerified: false
            },
            status: "pending",
            statusHistory: [{
                status: "pending",
                timestamp: new Date(),
                reason: "Initial registration"
            }],
            isVerified: false
        })

        // Update User Role to seller (or keep as user and handle via status? 
        // Plan said update to 'seller' but keep status pending.
        // This allows access to seller portal but with restricted view based on status)
        user.role = "seller"
        await user.save()

        return NextResponse.json({
            message: "Seller application submitted successfully",
            seller: newSeller
        }, { status: 201 })

    } catch (error: any) {
        console.error("Seller registration error:", error)
        return NextResponse.json({
            message: error.message || "Failed to submit application"
        }, { status: 500 })
    }
}
