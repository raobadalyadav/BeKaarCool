import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { connectDB } from "@/lib/mongodb"
import mongoose from "mongoose"

// Campaign model
const campaignSchema = new mongoose.Schema({
  seller: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  name: { type: String, required: true },
  type: { type: String, enum: ["email", "discount", "social", "ads"], required: true },
  description: { type: String, default: "" },
  status: { type: String, enum: ["active", "paused", "completed"], default: "active" },
  reach: { type: Number, default: 0 },
  engagement: { type: Number, default: 0 },
  conversions: { type: Number, default: 0 },
  budget: { type: Number, required: true },
  spent: { type: Number, default: 0 },
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
})

const Campaign = mongoose.models.Campaign || mongoose.model("Campaign", campaignSchema)

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || (session.user.role !== "seller" && session.user.role !== "admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    const campaigns = await Campaign.find({ seller: session.user.id })
      .sort({ createdAt: -1 })

    return NextResponse.json({ campaigns })
  } catch (error) {
    console.error("Error fetching campaigns:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || (session.user.role !== "seller" && session.user.role !== "admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, type, description, budget, endDate } = body

    if (!name || !type || !budget) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    await connectDB()

    const campaign = new Campaign({
      seller: session.user.id,
      name,
      type,
      description: description || "",
      budget,
      endDate: endDate ? new Date(endDate) : undefined,
      // Mock initial data
      reach: Math.floor(Math.random() * 1000),
      engagement: Math.floor(Math.random() * 20),
      conversions: Math.floor(Math.random() * 50)
    })

    await campaign.save()

    return NextResponse.json({ campaign }, { status: 201 })
  } catch (error) {
    console.error("Error creating campaign:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}