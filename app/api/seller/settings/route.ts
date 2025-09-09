import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { connectDB } from "@/lib/mongodb"
import { User } from "@/models/User"
import mongoose from "mongoose"

// Seller Settings model
const sellerSettingsSchema = new mongoose.Schema({
  seller: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  store: {
    name: { type: String, default: "" },
    description: { type: String, default: "" },
    logo: { type: String, default: "" },
    address: { type: String, default: "" },
    city: { type: String, default: "" },
    state: { type: String, default: "" },
    pincode: { type: String, default: "" },
    gst: { type: String, default: "" },
    pan: { type: String, default: "" }
  },
  notifications: {
    orderNotifications: { type: Boolean, default: true },
    emailMarketing: { type: Boolean, default: true },
    smsNotifications: { type: Boolean, default: false },
    pushNotifications: { type: Boolean, default: true }
  },
  payment: {
    bankName: { type: String, default: "" },
    accountNumber: { type: String, default: "" },
    ifscCode: { type: String, default: "" },
    upiId: { type: String, default: "" }
  },
  shipping: {
    freeShippingThreshold: { type: Number, default: 500 },
    shippingCharge: { type: Number, default: 50 },
    processingTime: { type: Number, default: 2 },
    returnPolicy: { type: String, default: "" }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
})

const SellerSettings = mongoose.models.SellerSettings || mongoose.model("SellerSettings", sellerSettingsSchema)

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || (session.user.role !== "seller" && session.user.role !== "admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    // Get user profile
    const user = await User.findById(session.user.id).select("name email phone avatar")
    
    // Get or create seller settings
    let sellerSettings = await SellerSettings.findOne({ seller: session.user.id })
    
    if (!sellerSettings) {
      sellerSettings = new SellerSettings({ seller: session.user.id })
      await sellerSettings.save()
    }

    const settings = {
      profile: {
        name: user?.name || "",
        email: user?.email || "",
        phone: user?.phone || "",
        avatar: user?.avatar || "",
        bio: "" // Add bio field to User model if needed
      },
      store: sellerSettings.store,
      notifications: sellerSettings.notifications,
      payment: sellerSettings.payment,
      shipping: sellerSettings.shipping
    }

    return NextResponse.json({ settings })
  } catch (error) {
    console.error("Error fetching settings:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || (session.user.role !== "seller" && session.user.role !== "admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { profile, store, notifications, payment, shipping } = body

    await connectDB()

    // Update user profile
    if (profile) {
      await User.findByIdAndUpdate(session.user.id, {
        name: profile.name,
        phone: profile.phone,
        avatar: profile.avatar
      })
    }

    // Update seller settings
    const updateData = {
      ...(store && { store }),
      ...(notifications && { notifications }),
      ...(payment && { payment }),
      ...(shipping && { shipping }),
      updatedAt: new Date()
    }

    await SellerSettings.findOneAndUpdate(
      { seller: session.user.id },
      updateData,
      { upsert: true, new: true }
    )

    return NextResponse.json({ message: "Settings updated successfully" })
  } catch (error) {
    console.error("Error updating settings:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}