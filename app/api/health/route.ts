/**
 * Health Check API Endpoint
 * Used by Docker and load balancers
 */

import { NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"

export async function GET() {
    const health: Record<string, any> = {
        status: "healthy",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV
    }

    // Check MongoDB connection
    try {
        await connectDB()
        health.mongodb = "connected"
    } catch {
        health.mongodb = "disconnected"
        health.status = "degraded"
    }

    // Check Redis connection (optional)
    try {
        const { isRedisConnected } = await import("@/lib/redis")
        health.redis = isRedisConnected() ? "connected" : "disconnected"
    } catch {
        health.redis = "not configured"
    }

    // Return appropriate status code
    const statusCode = health.status === "healthy" ? 200 : 503

    return NextResponse.json(health, { status: statusCode })
}
