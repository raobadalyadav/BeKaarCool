/**
 * Resend Email Provider
 * Production-ready email sending via Resend API
 */

import { Resend } from "resend"
import { env } from "@/lib/env"

// ============================================
// CONFIGURATION
// ============================================

const resend = new Resend(env.RESEND_API_KEY || "")

const FROM_EMAIL = env.RESEND_FROM_EMAIL || env.EMAIL_FROM || "noreply@baefikra.com"
const REPLY_TO = env.SUPPORT_EMAIL || "support@baefikra.com"

// ============================================
// TYPES
// ============================================

export interface EmailPayload {
    to: string | string[]
    subject: string
    html: string
    replyTo?: string
    tags?: Array<{ name: string; value: string }>
}

export interface EmailResult {
    success: boolean
    messageId?: string
    error?: string
}

// ============================================
// SEND EMAIL
// ============================================

export async function sendEmail(payload: EmailPayload): Promise<EmailResult> {
    try {
        if (!env.RESEND_API_KEY) {
            console.warn("[Email] RESEND_API_KEY not configured, skipping email send")
            return { success: false, error: "RESEND_API_KEY not configured" }
        }

        const { data, error } = await resend.emails.send({
            from: `Baefikra <${FROM_EMAIL}>`,
            to: Array.isArray(payload.to) ? payload.to : [payload.to],
            subject: payload.subject,
            html: payload.html,
            replyTo: payload.replyTo || REPLY_TO,
            tags: payload.tags,
        })

        if (error) {
            console.error("[Email] Resend error:", error)
            return { success: false, error: error.message }
        }

        return { success: true, messageId: data?.id }
    } catch (error: any) {
        console.error("[Email] Send error:", error)
        return { success: false, error: error.message || "Unknown email error" }
    }
}

// ============================================
// SEND BATCH EMAILS (up to 100)
// ============================================

export async function sendBatchEmails(
    emails: EmailPayload[]
): Promise<{ success: boolean; results: EmailResult[] }> {
    try {
        if (!env.RESEND_API_KEY) {
            console.warn("[Email] RESEND_API_KEY not configured")
            return {
                success: false,
                results: emails.map(() => ({ success: false, error: "Not configured" })),
            }
        }

        const { data, error } = await resend.batch.send(
            emails.map((e) => ({
                from: `Baefikra <${FROM_EMAIL}>`,
                to: Array.isArray(e.to) ? e.to : [e.to],
                subject: e.subject,
                html: e.html,
                replyTo: e.replyTo || REPLY_TO,
            }))
        )

        if (error) {
            console.error("[Email] Batch error:", error)
            return {
                success: false,
                results: emails.map(() => ({ success: false, error: error.message })),
            }
        }

        return {
            success: true,
            results: (data?.data || []).map((d: any) => ({
                success: true,
                messageId: d.id,
            })),
        }
    } catch (error: any) {
        console.error("[Email] Batch send error:", error)
        return {
            success: false,
            results: emails.map(() => ({ success: false, error: error.message })),
        }
    }
}
