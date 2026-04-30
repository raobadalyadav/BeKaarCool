/**
 * Environment Variable Validation
 *
 * After backend integration, the frontend is a pure consumer of the NestJS
 * backend (Razorpay, S3, Algolia/Meili, Delhivery, Resend, MongoDB no longer
 * live here — the backend owns them). All the frontend needs is the backend
 * URL and OAuth/session secrets.
 */

import { z } from "zod";

const envSchema = z.object({
  // ── Core ────────────────────────────────────────
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  NEXTAUTH_URL: z.string().url("NEXTAUTH_URL must be a valid URL"),
  NEXTAUTH_SECRET: z
    .string()
    .min(10, "NEXTAUTH_SECRET must be at least 10 characters"),

  // ── Backend integration ────────────────────────
  /** Server-side URL the Next.js process uses to reach the NestJS API. */
  BACKEND_URL: z
    .string()
    .url("BACKEND_URL must be a valid URL")
    .default("http://localhost:4000"),
  /** Browser-visible URL — usually the same as BACKEND_URL behind a CDN. */
  NEXT_PUBLIC_API_URL: z.string().url().default("http://localhost:4000"),

  // ── Razorpay (publishable key only — secret stays in backend) ────
  NEXT_PUBLIC_RAZORPAY_KEY_ID: z.string().optional(),

  // ── Analytics ──────────────────────────────────
  NEXT_PUBLIC_GA_MEASUREMENT_ID: z.string().optional(),

  // ── Optional: Cloudflare Turnstile (CAPTCHA) site key ───────────
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: z.string().optional(),

  // ── Optional: CDN host for images (CloudFront in front of S3) ───
  NEXT_PUBLIC_CDN_URL: z.string().url().optional().or(z.literal("")),
});

function getEnvData() {
  return {
    NODE_ENV: process.env.NODE_ENV,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,

    BACKEND_URL: process.env.BACKEND_URL,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,

    NEXT_PUBLIC_RAZORPAY_KEY_ID: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    NEXT_PUBLIC_GA_MEASUREMENT_ID: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
    NEXT_PUBLIC_CDN_URL: process.env.NEXT_PUBLIC_CDN_URL,
  };
}

const parseEnv = () => {
  try {
    return envSchema.parse(getEnvData());
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missing = error.errors.map(
        (e) => `  ❌ ${e.path.join(".")}: ${e.message}`
      );
      const message = `\n🚨 Environment validation failed:\n${missing.join(
        "\n"
      )}\n\n💡 Copy env.template to .env.local and fill in values\n`;

      if (process.env.NODE_ENV === "production") {
        console.error(message);
        throw new Error("Missing required environment variables");
      } else {
        console.warn(message);
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

if (process.env.NODE_ENV === "production") {
  validateEnv();
}
