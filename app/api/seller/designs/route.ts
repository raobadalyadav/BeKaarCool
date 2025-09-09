import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { connectDB } from "@/lib/mongodb"
import mongoose from "mongoose"

// Design model schema
const designSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, required: true },
  image: { type: String, required: true },
  seller: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  downloads: { type: Number, default: 0 },
  revenue: { type: Number, default: 0 },
  status: { type: String, enum: ["active", "inactive"], default: "active" },
  tags: [String],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
})

const Design = mongoose.models.Design || mongoose.model("Design", designSchema)

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || (session.user.role !== "seller" && session.user.role !== "admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    const designs = await Design.find({ seller: session.user.id })
      .sort({ createdAt: -1 })

    return NextResponse.json({ designs })
  } catch (error) {
    console.error("Error fetching designs:", error)
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
    const { name, category, image, tags } = body

    if (!name || !category || !image) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    await connectDB()

    const design = new Design({
      name,
      category,
      image,
      tags: tags || [],
      seller: session.user.id
    })

    await design.save()

    return NextResponse.json({ design }, { status: 201 })
  } catch (error) {
    console.error("Error creating design:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}