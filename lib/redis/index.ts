/**
 * Redis Client Configuration
 * For caching, sessions, and rate limiting
 */

import { createClient, RedisClientType } from "redis"

let redisClient: RedisClientType | null = null
let isConnected = false

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379"

/**
 * Get Redis client instance (singleton)
 */
export async function getRedisClient(): Promise<RedisClientType> {
    if (redisClient && isConnected) {
        return redisClient
    }

    redisClient = createClient({
        url: REDIS_URL,
        socket: {
            reconnectStrategy: (retries) => {
                if (retries > 10) {
                    console.error("Redis: Max reconnection attempts reached")
                    return new Error("Max retries reached")
                }
                return Math.min(retries * 100, 3000)
            }
        }
    })

    redisClient.on("error", (err) => {
        console.error("Redis Client Error:", err)
        isConnected = false
    })

    redisClient.on("connect", () => {
        console.log("Redis: Connected")
        isConnected = true
    })

    redisClient.on("disconnect", () => {
        console.log("Redis: Disconnected")
        isConnected = false
    })

    await redisClient.connect()
    return redisClient
}

/**
 * Check if Redis is available
 */
export function isRedisConnected(): boolean {
    return isConnected
}

// ============================================
// CACHE HELPERS
// ============================================

const DEFAULT_TTL = 3600 // 1 hour in seconds

/**
 * Get cached value
 */
export async function getCache<T>(key: string): Promise<T | null> {
    try {
        const client = await getRedisClient()
        const data = await client.get(key)
        return data ? JSON.parse(data) : null
    } catch (error) {
        console.error("Redis getCache error:", error)
        return null
    }
}

/**
 * Set cached value
 */
export async function setCache<T>(
    key: string,
    value: T,
    ttlSeconds: number = DEFAULT_TTL
): Promise<boolean> {
    try {
        const client = await getRedisClient()
        await client.setEx(key, ttlSeconds, JSON.stringify(value))
        return true
    } catch (error) {
        console.error("Redis setCache error:", error)
        return false
    }
}

/**
 * Delete cached value
 */
export async function deleteCache(key: string): Promise<boolean> {
    try {
        const client = await getRedisClient()
        await client.del(key)
        return true
    } catch (error) {
        console.error("Redis deleteCache error:", error)
        return false
    }
}

/**
 * Delete cache by pattern
 */
export async function deleteCachePattern(pattern: string): Promise<number> {
    try {
        const client = await getRedisClient()
        const keys = await client.keys(pattern)
        if (keys.length > 0) {
            await client.del(keys)
        }
        return keys.length
    } catch (error) {
        console.error("Redis deleteCachePattern error:", error)
        return 0
    }
}

// ============================================
// CACHE KEY GENERATORS
// ============================================

export const CacheKeys = {
    product: (id: string) => `product:${id}`,
    productList: (filters: string) => `products:list:${filters}`,
    productFeatured: () => `products:featured`,
    productCategories: () => `products:categories`,

    user: (id: string) => `user:${id}`,
    userWishlist: (id: string) => `user:${id}:wishlist`,

    cart: (userId: string) => `cart:${userId}`,

    order: (id: string) => `order:${id}`,
    orderList: (userId: string, page: number) => `orders:${userId}:${page}`,

    homepage: () => `homepage:data`,
    banners: () => `banners:active`,

    session: (token: string) => `session:${token}`,
    rateLimit: (ip: string, endpoint: string) => `ratelimit:${ip}:${endpoint}`
}

// ============================================
// SESSION MANAGEMENT
// ============================================

const SESSION_TTL = 86400 * 7 // 7 days

export interface SessionData {
    userId: string
    email: string
    role: string
    createdAt: Date
    lastActivity: Date
}

/**
 * Create session
 */
export async function createSession(
    token: string,
    data: SessionData
): Promise<boolean> {
    return setCache(CacheKeys.session(token), data, SESSION_TTL)
}

/**
 * Get session
 */
export async function getSession(token: string): Promise<SessionData | null> {
    return getCache<SessionData>(CacheKeys.session(token))
}

/**
 * Update session last activity
 */
export async function updateSessionActivity(token: string): Promise<boolean> {
    const session = await getSession(token)
    if (!session) return false

    session.lastActivity = new Date()
    return setCache(CacheKeys.session(token), session, SESSION_TTL)
}

/**
 * Delete session
 */
export async function deleteSession(token: string): Promise<boolean> {
    return deleteCache(CacheKeys.session(token))
}

// ============================================
// RATE LIMITING
// ============================================

interface RateLimitResult {
    allowed: boolean
    remaining: number
    resetAt: Date
}

/**
 * Check rate limit using Redis
 */
export async function checkRateLimitRedis(
    identifier: string,
    limit: number = 100,
    windowSeconds: number = 60
): Promise<RateLimitResult> {
    try {
        const client = await getRedisClient()
        const key = `ratelimit:${identifier}`

        const current = await client.incr(key)

        if (current === 1) {
            await client.expire(key, windowSeconds)
        }

        const ttl = await client.ttl(key)

        return {
            allowed: current <= limit,
            remaining: Math.max(0, limit - current),
            resetAt: new Date(Date.now() + ttl * 1000)
        }
    } catch (error) {
        console.error("Rate limit check error:", error)
        // Fail open - allow request if Redis is down
        return { allowed: true, remaining: limit, resetAt: new Date() }
    }
}
