import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { User } from "@/models/User"
import { sendVerificationEmail } from "@/lib/email"
import crypto from "crypto"

export async function POST(request: NextRequest) {
  try {
    await connectDB()

    const { email, token } = await request.json()

    let user
    if (email) {
      user = await User.findOne({ email: email.toLowerCase() })
    } else if (token) {
      user = await User.findOne({ verificationToken: token })
    }

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 })
    }

    if (user.isVerified) {
      return NextResponse.json({ message: "Email is already verified" }, { status: 400 })
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString("hex")

    // Update user with new verification token
    await User.findByIdAndUpdate(user._id, {
      verificationToken,
      updatedAt: new Date(),
    })

    // Send verification email
    try {
      await sendVerificationEmail(user.email, user.name, verificationToken)
    } catch (emailError) {
      console.error("Failed to send verification email:", emailError)
      return NextResponse.json({ message: "Failed to send verification email" }, { status: 500 })
    }

    return NextResponse.json({
      message: "Verification email sent successfully",
    })
  } catch (error) {
    console.error("Resend verification error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}