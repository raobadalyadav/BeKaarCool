/**
 * Security Utilities
 * Centralized security helpers for the application
 */

import crypto from "crypto"

// ============================================
// TOKEN GENERATION
// ============================================

/**
 * Generate a secure random token
 */
export function generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString("hex")
}

/**
 * Generate a short numeric OTP
 */
export function generateOTP(length: number = 6): string {
    const digits = "0123456789"
    let otp = ""
    for (let i = 0; i < length; i++) {
        otp += digits[Math.floor(Math.random() * digits.length)]
    }
    return otp
}

/**
 * Hash a token for storage
 */
export function hashToken(token: string): string {
    return crypto.createHash("sha256").update(token).digest("hex")
}

/**
 * Compare a plain token with a hashed token
 */
export function compareTokens(plainToken: string, hashedToken: string): boolean {
    const hashedPlain = hashToken(plainToken)
    return crypto.timingSafeEqual(
        Buffer.from(hashedPlain),
        Buffer.from(hashedToken)
    )
}

// ============================================
// INPUT SANITIZATION
// ============================================

/**
 * Sanitize string input - remove potential XSS
 */
export function sanitizeString(input: string): string {
    if (typeof input !== "string") return ""

    return input
        // Remove script tags
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
        // Remove event handlers
        .replace(/on\w+\s*=\s*["'][^"']*["']/gi, "")
        .replace(/on\w+\s*=\s*[^\s>]+/gi, "")
        // Remove javascript: URLs
        .replace(/javascript:/gi, "")
        // Remove data: URLs (potential XSS vector)
        .replace(/data:/gi, "data-blocked:")
        // Remove style expressions (IE)
        .replace(/expression\s*\(/gi, "blocked(")
        // Encode HTML entities
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#x27;")
}

/**
 * Sanitize object recursively
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
    const sanitized = { ...obj }

    for (const key in sanitized) {
        if (typeof sanitized[key] === "string") {
            sanitized[key] = sanitizeString(sanitized[key]) as any
        } else if (typeof sanitized[key] === "object" && sanitized[key] !== null) {
            sanitized[key] = sanitizeObject(sanitized[key])
        }
    }

    return sanitized
}

/**
 * Remove sensitive fields from object
 */
export function removeSensitiveFields<T extends Record<string, any>>(
    obj: T,
    fields: string[] = [
        "password",
        "resetPasswordToken",
        "resetPasswordExpires",
        "emailVerificationToken",
        "emailVerificationExpires",
        "loginAttempts",
        "lockUntil",
        "__v"
    ]
): Partial<T> {
    const sanitized = { ...obj }

    for (const field of fields) {
        delete sanitized[field]
    }

    return sanitized
}

// ============================================
// CSRF PROTECTION
// ============================================

/**
 * Generate CSRF token
 */
export function generateCSRFToken(): string {
    return generateSecureToken(24)
}

/**
 * Validate CSRF token
 */
export function validateCSRFToken(
    sessionToken: string,
    requestToken: string
): boolean {
    if (!sessionToken || !requestToken) return false

    try {
        return crypto.timingSafeEqual(
            Buffer.from(sessionToken),
            Buffer.from(requestToken)
        )
    } catch {
        return false
    }
}

// ============================================
// PASSWORD STRENGTH
// ============================================

export interface PasswordStrengthResult {
    score: number // 0-4
    feedback: string[]
    isStrong: boolean
}

/**
 * Check password strength
 */
export function checkPasswordStrength(password: string): PasswordStrengthResult {
    const feedback: string[] = []
    let score = 0

    if (password.length >= 8) {
        score++
    } else {
        feedback.push("Password should be at least 8 characters")
    }

    if (password.length >= 12) {
        score++
    }

    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) {
        score++
    } else {
        feedback.push("Include both uppercase and lowercase letters")
    }

    if (/[0-9]/.test(password)) {
        score++
    } else {
        feedback.push("Include at least one number")
    }

    if (/[^A-Za-z0-9]/.test(password)) {
        score++
    } else {
        feedback.push("Include at least one special character")
    }

    // Check for common patterns
    const commonPatterns = [
        /^123456/,
        /password/i,
        /qwerty/i,
        /abc123/i,
        /111111/,
        /(.)\1{3,}/ // Repeated characters
    ]

    for (const pattern of commonPatterns) {
        if (pattern.test(password)) {
            score = Math.max(0, score - 1)
            feedback.push("Avoid common patterns and repeated characters")
            break
        }
    }

    return {
        score: Math.min(4, score),
        feedback,
        isStrong: score >= 3
    }
}

// ============================================
// RATE LIMITING HELPERS
// ============================================

interface RateLimitRecord {
    count: number
    resetAt: number
}

const rateLimitStore = new Map<string, RateLimitRecord>()

/**
 * Check and update rate limit
 */
export function checkRateLimit(
    identifier: string,
    limit: number = 100,
    windowMs: number = 60000
): { allowed: boolean; remaining: number; resetAt: Date } {
    const now = Date.now()
    const record = rateLimitStore.get(identifier)

    // Cleanup old records periodically
    if (rateLimitStore.size > 10000) {
        for (const [key, value] of rateLimitStore) {
            if (value.resetAt < now) {
                rateLimitStore.delete(key)
            }
        }
    }

    if (!record || record.resetAt < now) {
        rateLimitStore.set(identifier, { count: 1, resetAt: now + windowMs })
        return { allowed: true, remaining: limit - 1, resetAt: new Date(now + windowMs) }
    }

    if (record.count >= limit) {
        return { allowed: false, remaining: 0, resetAt: new Date(record.resetAt) }
    }

    record.count++
    return { allowed: true, remaining: limit - record.count, resetAt: new Date(record.resetAt) }
}

/**
 * Clear rate limit for an identifier
 */
export function clearRateLimit(identifier: string): void {
    rateLimitStore.delete(identifier)
}

// ============================================
// IP & REQUEST HELPERS
// ============================================

/**
 * Get client IP from request headers
 */
export function getClientIP(headers: Headers): string {
    // Check various headers
    const forwardedFor = headers.get("x-forwarded-for")
    if (forwardedFor) {
        return forwardedFor.split(",")[0].trim()
    }

    const realIP = headers.get("x-real-ip")
    if (realIP) {
        return realIP
    }

    const cfConnectingIP = headers.get("cf-connecting-ip")
    if (cfConnectingIP) {
        return cfConnectingIP
    }

    return "unknown"
}

/**
 * Check if IP is in whitelist
 */
export function isIPWhitelisted(
    ip: string,
    whitelist: string[] = []
): boolean {
    return whitelist.includes(ip) || whitelist.includes("*")
}

// ============================================
// DATA MASKING
// ============================================

/**
 * Mask email address
 */
export function maskEmail(email: string): string {
    const [local, domain] = email.split("@")
    if (!local || !domain) return "***@***.***"

    const maskedLocal = local.length > 2
        ? local[0] + "*".repeat(local.length - 2) + local[local.length - 1]
        : local[0] + "*"

    return `${maskedLocal}@${domain}`
}

/**
 * Mask phone number
 */
export function maskPhone(phone: string): string {
    if (phone.length < 6) return "*".repeat(phone.length)
    return phone.slice(0, 2) + "*".repeat(phone.length - 4) + phone.slice(-2)
}

/**
 * Mask card number
 */
export function maskCardNumber(cardNumber: string): string {
    const cleaned = cardNumber.replace(/\s+/g, "")
    if (cleaned.length < 8) return "*".repeat(cleaned.length)
    return "*".repeat(cleaned.length - 4) + cleaned.slice(-4)
}
