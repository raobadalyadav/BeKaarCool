/**
 * Environment Variable Validation
 * Validates required env vars at startup using Zod.
 * Import this in layout.tsx or a server component to trigger validation.
 */

import { z } from "zod";

const envSchema = z.object({
  // Core
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  NEXTAUTH_URL: z.string().url("NEXTAUTH_URL must be a valid URL"),
  NEXTAUTH_SECRET: z
    .string()
    .min(10, "NEXTAUTH_SECRET must be at least 10 characters"),
  CRON_SECRET: z.string().optional(),

  // Google OAuth (Optional)
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),

  // Database
  MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),

  // Payment - Razorpay
  RAZORPAY_KEY_ID: z.string().min(1, "RAZORPAY_KEY_ID is required"),
  RAZORPAY_KEY_SECRET: z.string().min(1, "RAZORPAY_KEY_SECRET is required"),
  NEXT_PUBLIC_RAZORPAY_KEY_ID: z
    .string()
    .min(1, "NEXT_PUBLIC_RAZORPAY_KEY_ID is required"),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional(),

  // Email (Resend)
  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM_EMAIL: z.string().optional(),
  SUPPORT_EMAIL: z.string().optional(),
  EMAIL_FROM: z.string().optional(),

  // Redis
  REDIS_URL: z.string().optional(),

  // Algolia Search (Optional)
  ALGOLIA_APP_ID: z.string().optional(),
  ALGOLIA_ADMIN_KEY: z.string().optional(),
  ALGOLIA_SEARCH_KEY: z.string().optional(),
  NEXT_PUBLIC_ALGOLIA_APP_ID: z.string().optional(),
  NEXT_PUBLIC_ALGOLIA_SEARCH_KEY: z.string().optional(),

  // AWS Services
  AWS_REGION: z.string().optional(),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_S3_BUCKET: z.string().optional(),
  AWS_CLOUDFRONT_URL: z.string().optional(),

  // Shipping - Delhivery
  DELHIVERY_API_KEY: z.string().optional(),
  DELHIVERY_API_URL: z.string().url().optional().or(z.literal("")),
  DELHIVERY_CLIENT_NAME: z.string().optional(),
  DELHIVERY_PICKUP_LOCATION: z.string().optional(),
  DELHIVERY_RETURN_PHONE: z.string().optional(),

  // Analytics & Monitoring
  NEXT_PUBLIC_GA_MEASUREMENT_ID: z.string().optional(),
});

function getEnvData() {
  return {
    // Core
    NODE_ENV: process.env.NODE_ENV,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    CRON_SECRET: process.env.CRON_SECRET,

    // Google OAuth (Optional)
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,

    // Database
    MONGODB_URI: process.env.MONGODB_URI,

    // Payment - Razorpay
    RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID,
    RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET,
    NEXT_PUBLIC_RAZORPAY_KEY_ID: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    RAZORPAY_WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET,

    // Email (Resend)
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL,
    SUPPORT_EMAIL: process.env.SUPPORT_EMAIL,
    EMAIL_FROM: process.env.EMAIL_FROM,

    // Redis
    REDIS_URL: process.env.REDIS_URL,

    // Algolia Search (Optional)
    ALGOLIA_APP_ID: process.env.ALGOLIA_APP_ID,
    ALGOLIA_ADMIN_KEY: process.env.ALGOLIA_ADMIN_KEY,
    ALGOLIA_SEARCH_KEY: process.env.ALGOLIA_SEARCH_KEY,
    NEXT_PUBLIC_ALGOLIA_APP_ID: process.env.NEXT_PUBLIC_ALGOLIA_APP_ID,
    NEXT_PUBLIC_ALGOLIA_SEARCH_KEY: process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_KEY,

    // AWS Services
    AWS_REGION: process.env.AWS_REGION,
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
    AWS_S3_BUCKET: process.env.AWS_S3_BUCKET,
    AWS_CLOUDFRONT_URL: process.env.AWS_CLOUDFRONT_URL,

    // Shipping - Delhivery
    DELHIVERY_API_KEY: process.env.DELHIVERY_API_KEY,
    DELHIVERY_API_URL: process.env.DELHIVERY_API_URL,
    DELHIVERY_CLIENT_NAME: process.env.DELHIVERY_CLIENT_NAME,
    DELHIVERY_PICKUP_LOCATION: process.env.DELHIVERY_PICKUP_LOCATION,
    DELHIVERY_RETURN_PHONE: process.env.DELHIVERY_RETURN_PHONE,

    // Analytics & Monitoring
    NEXT_PUBLIC_GA_MEASUREMENT_ID: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
  };
}

// Top-level parse with better error handling
const parseEnv = () => {
  try {
    return envSchema.parse(getEnvData());
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missing = error.errors.map(
        (e) => `  ❌ ${e.path.join(".")}: ${e.message}`,
      );
      const message = `\n🚨 Environment validation failed:\n${missing.join("\n")}\n\n💡 Fix: Check your .env.local file or run standalone scripts with '--env-file=.env.local'\n`;

      if (process.env.NODE_ENV === "production") {
        console.error(message);
        throw new Error("Missing required environment variables");
      } else {
        // In development, we log but don't hard crash to allow easier debugging
        console.warn(message);
        // Return partial data to prevent "cannot read property of undefined" but satisfy TS
        return getEnvData() as any as z.infer<typeof envSchema>;
      }
    }
    throw error;
  }
};

export const env = parseEnv();

export type Env = z.infer<typeof envSchema>;

let validated = false;

export function validateEnv(): void {
  if (validated) return;
  parseEnv();
  validated = true;
}

// Auto-validate on import in production
if (process.env.NODE_ENV === "production") {
  validateEnv();
}
