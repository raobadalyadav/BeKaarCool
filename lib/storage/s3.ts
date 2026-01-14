/**
 * AWS S3 Storage Integration
 * For product images, user uploads, and static assets
 */

import {
    S3Client,
    PutObjectCommand,
    DeleteObjectCommand,
    GetObjectCommand,
    ListObjectsV2Command,
    HeadObjectCommand
} from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import crypto from "crypto"

// Configuration
const AWS_REGION = process.env.AWS_REGION || "ap-south-1"
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID || ""
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY || ""
const AWS_S3_BUCKET = process.env.AWS_S3_BUCKET || ""
const AWS_CLOUDFRONT_URL = process.env.AWS_CLOUDFRONT_URL || ""

// S3 Client singleton
const s3Client = new S3Client({
    region: AWS_REGION,
    credentials: {
        accessKeyId: AWS_ACCESS_KEY_ID,
        secretAccessKey: AWS_SECRET_ACCESS_KEY
    }
})

// ============================================
// UPLOAD FUNCTIONS
// ============================================

export interface UploadResult {
    success: boolean
    key?: string
    url?: string
    cdnUrl?: string
    error?: string
}

export type UploadFolder = "products" | "users" | "banners" | "reviews" | "documents"

/**
 * Generate unique file key
 */
function generateFileKey(folder: UploadFolder, filename: string): string {
    const ext = filename.split(".").pop()?.toLowerCase() || "jpg"
    const hash = crypto.randomBytes(16).toString("hex")
    const date = new Date().toISOString().split("T")[0].replace(/-/g, "/")
    return `${folder}/${date}/${hash}.${ext}`
}

/**
 * Get content type from extension
 */
function getContentType(filename: string): string {
    const ext = filename.split(".").pop()?.toLowerCase()
    const types: Record<string, string> = {
        jpg: "image/jpeg",
        jpeg: "image/jpeg",
        png: "image/png",
        gif: "image/gif",
        webp: "image/webp",
        svg: "image/svg+xml",
        pdf: "application/pdf",
        mp4: "video/mp4",
        webm: "video/webm"
    }
    return types[ext || ""] || "application/octet-stream"
}

/**
 * Upload file to S3
 */
export async function uploadFile(
    file: Buffer,
    filename: string,
    folder: UploadFolder,
    options?: {
        customKey?: string
        isPublic?: boolean
        cacheControl?: string
    }
): Promise<UploadResult> {
    try {
        const key = options?.customKey || generateFileKey(folder, filename)
        const contentType = getContentType(filename)

        const command = new PutObjectCommand({
            Bucket: AWS_S3_BUCKET,
            Key: key,
            Body: file,
            ContentType: contentType,
            ACL: options?.isPublic !== false ? "public-read" : "private",
            CacheControl: options?.cacheControl || "max-age=31536000" // 1 year
        })

        await s3Client.send(command)

        const url = `https://${AWS_S3_BUCKET}.s3.${AWS_REGION}.amazonaws.com/${key}`
        const cdnUrl = AWS_CLOUDFRONT_URL ? `${AWS_CLOUDFRONT_URL}/${key}` : url

        return {
            success: true,
            key,
            url,
            cdnUrl
        }
    } catch (error: any) {
        console.error("S3 upload error:", error)
        return {
            success: false,
            error: error.message
        }
    }
}

/**
 * Upload base64 image
 */
export async function uploadBase64Image(
    base64Data: string,
    folder: UploadFolder,
    filename?: string
): Promise<UploadResult> {
    try {
        // Extract content type and data
        const matches = base64Data.match(/^data:(.+);base64,(.+)$/)
        if (!matches) {
            return { success: false, error: "Invalid base64 format" }
        }

        const contentType = matches[1]
        const data = Buffer.from(matches[2], "base64")
        const ext = contentType.split("/")[1] || "jpg"
        const name = filename || `image.${ext}`

        return uploadFile(data, name, folder)
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

// ============================================
// DELETE FUNCTIONS
// ============================================

/**
 * Delete file from S3
 */
export async function deleteFile(key: string): Promise<boolean> {
    try {
        const command = new DeleteObjectCommand({
            Bucket: AWS_S3_BUCKET,
            Key: key
        })

        await s3Client.send(command)
        return true
    } catch (error) {
        console.error("S3 delete error:", error)
        return false
    }
}

/**
 * Delete multiple files
 */
export async function deleteFiles(keys: string[]): Promise<number> {
    let deleted = 0
    for (const key of keys) {
        if (await deleteFile(key)) {
            deleted++
        }
    }
    return deleted
}

// ============================================
// SIGNED URLS (for private files)
// ============================================

/**
 * Get signed URL for private file access
 */
export async function getSignedDownloadUrl(
    key: string,
    expiresIn: number = 3600
): Promise<string | null> {
    try {
        const command = new GetObjectCommand({
            Bucket: AWS_S3_BUCKET,
            Key: key
        })

        return await getSignedUrl(s3Client, command, { expiresIn })
    } catch (error) {
        console.error("S3 signed URL error:", error)
        return null
    }
}

/**
 * Get signed URL for file upload (direct from client)
 */
export async function getSignedUploadUrl(
    folder: UploadFolder,
    filename: string,
    expiresIn: number = 300
): Promise<{ url: string; key: string } | null> {
    try {
        const key = generateFileKey(folder, filename)
        const contentType = getContentType(filename)

        const command = new PutObjectCommand({
            Bucket: AWS_S3_BUCKET,
            Key: key,
            ContentType: contentType,
            ACL: "public-read"
        })

        const url = await getSignedUrl(s3Client, command, { expiresIn })

        return { url, key }
    } catch (error) {
        console.error("S3 signed upload URL error:", error)
        return null
    }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Check if file exists
 */
export async function fileExists(key: string): Promise<boolean> {
    try {
        const command = new HeadObjectCommand({
            Bucket: AWS_S3_BUCKET,
            Key: key
        })
        await s3Client.send(command)
        return true
    } catch {
        return false
    }
}

/**
 * List files in folder
 */
export async function listFiles(
    folder: string,
    maxKeys: number = 100
): Promise<string[]> {
    try {
        const command = new ListObjectsV2Command({
            Bucket: AWS_S3_BUCKET,
            Prefix: folder,
            MaxKeys: maxKeys
        })

        const result = await s3Client.send(command)
        return (result.Contents || []).map(obj => obj.Key || "").filter(Boolean)
    } catch (error) {
        console.error("S3 list error:", error)
        return []
    }
}

/**
 * Get public URL for a key
 */
export function getPublicUrl(key: string): string {
    if (AWS_CLOUDFRONT_URL) {
        return `${AWS_CLOUDFRONT_URL}/${key}`
    }
    return `https://${AWS_S3_BUCKET}.s3.${AWS_REGION}.amazonaws.com/${key}`
}

/**
 * Extract key from S3/CloudFront URL
 */
export function extractKeyFromUrl(url: string): string | null {
    try {
        const urlObj = new URL(url)

        // CloudFront URL
        if (AWS_CLOUDFRONT_URL && url.startsWith(AWS_CLOUDFRONT_URL)) {
            return urlObj.pathname.slice(1) // Remove leading slash
        }

        // S3 URL
        if (urlObj.hostname.includes("s3")) {
            return urlObj.pathname.slice(1)
        }

        return null
    } catch {
        return null
    }
}
