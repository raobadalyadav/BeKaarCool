import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import mongoose from "mongoose"

const newsletterSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  subscribed: {
    type: Boolean,
    default: true,
  },
  subscribedAt: {
    type: Date,
    default: Date.now,
  },
})

const Newsletter = mongoose.models.Newsletter || mongoose.model("Newsletter", newsletterSchema)

export async function POST(request: NextRequest) {
  try {
    await connectDB()

    const { email } = await request.json()

    if (!email || !email.includes("@")) {
      return NextResponse.json({ message: "Invalid email address" }, { status: 400 })
    }

    const existingSubscriber = await Newsletter.findOne({ email })
    if (existingSubscriber) {
      if (existingSubscriber.subscribed) {
        return NextResponse.json({ message: "Already subscribed" }, { status: 400 })
      } else {
        existingSubscriber.subscribed = true
        existingSubscriber.subscribedAt = new Date()
        await existingSubscriber.save()
        return NextResponse.json({ message: "Resubscribed successfully" })
      }
    }

    const subscriber = new Newsletter({ email })
    await subscriber.save()

    return NextResponse.json({ message: "Subscribed successfully" })
  } catch (error) {
    console.error("Error subscribing to newsletter:", error)
    return NextResponse.json({ message: "Failed to subscribe" }, { status: 500 })
  }
}