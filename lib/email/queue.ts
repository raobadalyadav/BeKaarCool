/**
 * Email Queue - Redis Backed
 * Reliable, non-blocking email delivery using Redis FIFO queue
 */

import { getRedisClient, isRedisConnected } from "@/lib/redis"
import { sendEmail, type EmailPayload } from "./resend"

// ============================================
// TYPES
// ============================================

export interface EmailJob {
    id: string
    to: string | string[]
    subject: string
    html: string
    templateName: string
    metadata?: Record<string, any>
    retryCount: number
    maxRetries: number
    createdAt: string
    lastAttemptAt?: string
    error?: string
}

// ============================================
// QUEUE KEYS
// ============================================

const QUEUE_KEY = "email:queue"
const FAILED_KEY = "email:failed"
const PROCESSING_KEY = "email:processing"

// ============================================
// ENQUEUE EMAIL
// ============================================

export async function enqueueEmail(
    payload: EmailPayload & { templateName?: string; metadata?: Record<string, any> }
): Promise<{ queued: boolean; jobId?: string; error?: string }> {
    try {
        // If Redis is not available, send immediately (fallback)
        if (!isRedisConnected()) {
            console.warn("[EmailQueue] Redis not connected, sending immediately")
            const result = await sendEmail(payload)
            return { queued: result.success, jobId: result.messageId, error: result.error }
        }

        const client = await getRedisClient()

        const job: EmailJob = {
            id: `email_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
            to: payload.to,
            subject: payload.subject,
            html: payload.html,
            templateName: payload.templateName || "unknown",
            metadata: payload.metadata,
            retryCount: 0,
            maxRetries: 3,
            createdAt: new Date().toISOString(),
        }

        await client.lPush(QUEUE_KEY, JSON.stringify(job))

        return { queued: true, jobId: job.id }
    } catch (error: any) {
        console.error("[EmailQueue] Enqueue error:", error)

        // Fallback: send immediately on queue failure
        try {
            const result = await sendEmail(payload)
            return { queued: result.success, jobId: result.messageId, error: result.error }
        } catch (sendError: any) {
            return { queued: false, error: sendError.message }
        }
    }
}

// ============================================
// PROCESS QUEUE
// ============================================

export async function processEmailQueue(
    batchSize: number = 10
): Promise<{
    processed: number
    failed: number
    remaining: number
}> {
    let processed = 0
    let failed = 0

    try {
        if (!isRedisConnected()) {
            return { processed: 0, failed: 0, remaining: 0 }
        }

        const client = await getRedisClient()

        for (let i = 0; i < batchSize; i++) {
            // Pop from the right (FIFO)
            const jobData = await client.rPop(QUEUE_KEY)
            if (!jobData) break

            let job: EmailJob

            try {
                job = JSON.parse(jobData)
            } catch {
                console.error("[EmailQueue] Invalid job data:", jobData)
                failed++
                continue
            }

            // Move to processing
            await client.lPush(PROCESSING_KEY, jobData)

            try {
                const result = await sendEmail({
                    to: job.to,
                    subject: job.subject,
                    html: job.html,
                })

                if (result.success) {
                    processed++
                    // Remove from processing
                    await client.lRem(PROCESSING_KEY, 1, jobData)
                } else {
                    throw new Error(result.error || "Send failed")
                }
            } catch (sendError: any) {
                // Remove from processing
                await client.lRem(PROCESSING_KEY, 1, jobData)

                job.retryCount++
                job.lastAttemptAt = new Date().toISOString()
                job.error = sendError.message

                if (job.retryCount >= job.maxRetries) {
                    // Move to dead-letter queue
                    await client.lPush(FAILED_KEY, JSON.stringify(job))
                    failed++
                    console.error(`[EmailQueue] Email permanently failed after ${job.maxRetries} retries:`, job.id)
                } else {
                    // Re-queue for retry
                    await client.lPush(QUEUE_KEY, JSON.stringify(job))
                }
            }
        }

        const remaining = await client.lLen(QUEUE_KEY)
        return { processed, failed, remaining }
    } catch (error) {
        console.error("[EmailQueue] Process error:", error)
        return { processed, failed, remaining: -1 }
    }
}

// ============================================
// QUEUE STATS
// ============================================

export async function getQueueStats(): Promise<{
    pending: number
    processing: number
    failed: number
}> {
    try {
        if (!isRedisConnected()) {
            return { pending: 0, processing: 0, failed: 0 }
        }

        const client = await getRedisClient()

        const [pending, processing, failedCount] = await Promise.all([
            client.lLen(QUEUE_KEY),
            client.lLen(PROCESSING_KEY),
            client.lLen(FAILED_KEY),
        ])

        return { pending, processing, failed: failedCount }
    } catch {
        return { pending: 0, processing: 0, failed: 0 }
    }
}

// ============================================
// RETRY FAILED EMAILS
// ============================================

export async function retryFailedEmails(limit: number = 10): Promise<number> {
    try {
        if (!isRedisConnected()) return 0

        const client = await getRedisClient()
        let retried = 0

        for (let i = 0; i < limit; i++) {
            const jobData = await client.rPop(FAILED_KEY)
            if (!jobData) break

            const job: EmailJob = JSON.parse(jobData)
            job.retryCount = 0
            job.error = undefined

            await client.lPush(QUEUE_KEY, JSON.stringify(job))
            retried++
        }

        return retried
    } catch {
        return 0
    }
}
