/**
 * Image Upload API for Admin
 * Handles file uploads to AWS S3
 */
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { uploadFile, getSignedUploadUrl, type UploadFolder } from "@/lib/storage/s3"

export const runtime = "nodejs"

// Maximum file size: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024

// Allowed file types
const ALLOWED_TYPES = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
]

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session || !["admin", "seller"].includes(session.user?.role || "")) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
        }

        const formData = await request.formData()
        const file = formData.get("file") as File | null
        const folder = (formData.get("folder") as UploadFolder) || "products"

        if (!file) {
            return NextResponse.json({ message: "No file provided" }, { status: 400 })
        }

        // Validate file type
        if (!ALLOWED_TYPES.includes(file.type)) {
            return NextResponse.json(
                { message: "Invalid file type. Allowed: JPEG, PNG, GIF, WebP" },
                { status: 400 }
            )
        }

        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json(
                { message: "File too large. Maximum size: 5MB" },
                { status: 400 }
            )
        }

        // Convert to buffer and upload
        const buffer = Buffer.from(await file.arrayBuffer())
        const result = await uploadFile(buffer, file.name, folder)

        if (!result.success) {
            return NextResponse.json(
                { message: result.error || "Upload failed" },
                { status: 500 }
            )
        }

        return NextResponse.json({
            success: true,
            url: result.cdnUrl || result.url,
            key: result.key,
        })
    } catch (error: any) {
        console.error("Upload error:", error)
        return NextResponse.json(
            { message: error.message || "Upload failed" },
            { status: 500 }
        )
    }
}

// Get signed URL for direct client upload
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session || !["admin", "seller"].includes(session.user?.role || "")) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const filename = searchParams.get("filename")
        const folder = (searchParams.get("folder") as UploadFolder) || "products"

        if (!filename) {
            return NextResponse.json({ message: "Filename required" }, { status: 400 })
        }

        const result = await getSignedUploadUrl(folder, filename)

        if (!result) {
            return NextResponse.json({ message: "Failed to generate upload URL" }, { status: 500 })
        }

        return NextResponse.json({
            uploadUrl: result.url,
            key: result.key,
        })
    } catch (error: any) {
        console.error("Signed URL error:", error)
        return NextResponse.json(
            { message: error.message || "Failed to get upload URL" },
            { status: 500 }
        )
    }
}
