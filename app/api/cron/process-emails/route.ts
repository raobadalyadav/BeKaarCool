/**
 * Email Queue Processor — Cron Endpoint
 * Processes queued emails from Redis via Resend.
 * Call this endpoint every 30s from Vercel Cron or an external scheduler.
 * Protected by CRON_SECRET header.
 */

import { NextRequest, NextResponse } from "next/server"
import { processEmailQueue, getQueueStats } from "@/lib/email"

export const dynamic = "force-dynamic"
export const maxDuration = 30

export async function GET(request: NextRequest) {
    try {
        // Verify cron secret
        const cronSecret = request.headers.get("x-cron-secret") || request.nextUrl.searchParams.get("secret")
        const expectedSecret = process.env.CRON_SECRET

        if (expectedSecret && cronSecret !== expectedSecret) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // Process the queue
        const result = await processEmailQueue(50)

        // Get current stats
        const stats = await getQueueStats()

        return NextResponse.json({
            success: true,
            processed: result.processed,
            failed: result.failed,
            remaining: result.remaining,
            stats,
            timestamp: new Date().toISOString(),
        })
    } catch (error: any) {
        console.error("[Cron] Email queue processing error:", error)
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        )
    }
}
