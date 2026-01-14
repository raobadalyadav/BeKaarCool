import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { connectDB } from "@/lib/mongodb"
import mongoose from "mongoose"

// Settings Schema (inline for simplicity)
const settingsSchema = new mongoose.Schema({
    key: { type: String, required: true, unique: true },
    value: mongoose.Schema.Types.Mixed,
    updatedAt: { type: Date, default: Date.now },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true })

const Settings = mongoose.models.Settings || mongoose.model("Settings", settingsSchema)

// Default settings
const defaultSettings = {
    store: {
        name: "BeKaarCool",
        email: "support@bekaarcool.com",
        phone: "+91-XXXXXXXXXX",
        currency: "INR",
        timezone: "Asia/Kolkata"
    },
    shipping: {
        freeShippingThreshold: 599,
        standardShippingRate: 49,
        expressShippingRate: 99,
        processingDays: 2
    },
    tax: {
        gstRate: 18,
        includeInPrice: true
    },
    orders: {
        minOrderAmount: 0,
        maxOrderAmount: 100000,
        returnWindowDays: 7,
        cancellationWindowHours: 24
    },
    notifications: {
        orderConfirmation: true,
        shippingUpdates: true,
        promotionalEmails: true
    }
}

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user || (session.user as any).role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
        }

        await connectDB()

        const settings = await Settings.find().lean()

        // Merge with defaults
        const result: any = { ...defaultSettings }
        settings.forEach((s: any) => {
            const keys = s.key.split(".")
            let current = result
            for (let i = 0; i < keys.length - 1; i++) {
                if (!current[keys[i]]) current[keys[i]] = {}
                current = current[keys[i]]
            }
            current[keys[keys.length - 1]] = s.value
        })

        return NextResponse.json({ settings: result })
    } catch (error) {
        console.error("Admin settings fetch error:", error)
        return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 })
    }
}

export async function PUT(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user || (session.user as any).role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
        }

        await connectDB()

        const body = await request.json()
        const { settings } = body

        if (!settings || typeof settings !== "object") {
            return NextResponse.json({ error: "Settings object required" }, { status: 400 })
        }

        // Flatten nested settings and save
        const flattenSettings = (obj: any, prefix = ""): Array<{ key: string, value: any }> => {
            const result: Array<{ key: string, value: any }> = []
            for (const key in obj) {
                const fullKey = prefix ? `${prefix}.${key}` : key
                if (typeof obj[key] === "object" && obj[key] !== null && !Array.isArray(obj[key])) {
                    result.push(...flattenSettings(obj[key], fullKey))
                } else {
                    result.push({ key: fullKey, value: obj[key] })
                }
            }
            return result
        }

        const settingsToSave = flattenSettings(settings)

        const bulkOps = settingsToSave.map(({ key, value }) => ({
            updateOne: {
                filter: { key },
                update: {
                    $set: {
                        value,
                        updatedAt: new Date(),
                        updatedBy: (session.user as any).id
                    }
                },
                upsert: true
            }
        }))

        await Settings.bulkWrite(bulkOps)

        return NextResponse.json({ message: "Settings updated successfully" })
    } catch (error) {
        console.error("Admin settings update error:", error)
        return NextResponse.json({ error: "Failed to update settings" }, { status: 500 })
    }
}
