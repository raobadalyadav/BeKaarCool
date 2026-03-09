import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { User } from "@/models/User"
import { sendWelcomeEmail } from "@/lib/email"

export async function POST(request: NextRequest) {
  try {
    await connectDB()

    const { token } = await request.json()

    if (!token) {
      return NextResponse.json({ message: "Verification token is required" }, { status: 400 })
    }

    // Find user with valid verification token
    const user = await User.findOne({
      verificationToken: token,
    })

    if (!user) {
      return NextResponse.json({ message: "Invalid or expired verification token" }, { status: 400 })
    }

    // Update user as verified and clear verification token
    await User.findByIdAndUpdate(user._id, {
      isVerified: true,
      verificationToken: undefined,
      verificationTokenExpiry: undefined,
      updatedAt: new Date(),
    })
    
    // Send Welcome Email asynchronously
    sendWelcomeEmail(user.email, user.name).catch((err) => {
      console.error("Failed to send welcome email:", err)
    })

    return NextResponse.json({
      message: "Email verified successfully",
    })
  } catch (error) {
    console.error("Email verification error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}