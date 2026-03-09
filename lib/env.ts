/**
 * Environment Variable Validation
 * Validates required env vars at startup using Zod.
 * Import this in layout.tsx or a server component to trigger validation.
 */

import { z } from "zod"

const envSchema = z.object({
    // Core
    NEXTAUTH_URL: z.string().url("NEXTAUTH_URL must be a valid URL"),
    NEXTAUTH_SECRET: z.string().min(10, "NEXTAUTH_SECRET must be at least 10 characters"),

    // Database
    MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),

    // Payment
    RAZORPAY_KEY_ID: z.string().min(1, "RAZORPAY_KEY_ID is required"),
    RAZORPAY_KEY_SECRET: z.string().min(1, "RAZORPAY_KEY_SECRET is required"),
    NEXT_PUBLIC_RAZORPAY_KEY_ID: z.string().min(1, "NEXT_PUBLIC_RAZORPAY_KEY_ID is required"),

    // Email (Resend)
    RESEND_API_KEY: z.string().optional(),
    RESEND_FROM_EMAIL: z.string().email().optional(),

    // Redis
    REDIS_URL: z.string().optional(),

    // AWS (optional for now)
    AWS_ACCESS_KEY_ID: z.string().optional(),
    AWS_SECRET_ACCESS_KEY: z.string().optional(),
    AWS_S3_BUCKET: z.string().optional(),

    // Shipping
    DELHIVERY_API_KEY: z.string().optional(),
})

export type Env = z.infer<typeof envSchema>

let validated = false

export function validateEnv(): void {
    if (validated) return

    try {
        envSchema.parse(process.env)
        validated = true
    } catch (error) {
        if (error instanceof z.ZodError) {
            const missing = error.errors.map(
                (e) => `  ❌ ${e.path.join(".")}: ${e.message}`
            )
            console.error(
                `\n🚨 Environment validation failed:\n${missing.join("\n")}\n\nPlease check your .env.local file.\n`
            )
            // Don't crash in development, crash in production
            if (process.env.NODE_ENV === "production") {
                throw new Error("Missing required environment variables")
            }
        }
    }
}

// Auto-validate on import in production
if (process.env.NODE_ENV === "production") {
    validateEnv()
}
