/**
 * API Middleware Utilities
 * Centralized request handling, validation, and error management
 */

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { ZodSchema, ZodError } from "zod"
import { IApiResponse } from "@/lib/types/entities"
import { connectDB } from "@/lib/mongodb"

// ============================================
// ERROR CLASSES
// ============================================

export class ApiError extends Error {
    statusCode: number
    code?: string

    constructor(message: string, statusCode: number = 500, code?: string) {
        super(message)
        this.statusCode = statusCode
        this.code = code
        this.name = "ApiError"
    }
}

export class ValidationError extends ApiError {
    errors: Record<string, string[]>

    constructor(errors: Record<string, string[]>) {
        super("Validation failed", 400, "VALIDATION_ERROR")
        this.errors = errors
        this.name = "ValidationError"
    }
}

export class AuthenticationError extends ApiError {
    constructor(message: string = "Authentication required") {
        super(message, 401, "UNAUTHENTICATED")
        this.name = "AuthenticationError"
    }
}

export class AuthorizationError extends ApiError {
    constructor(message: string = "Access denied") {
        super(message, 403, "UNAUTHORIZED")
        this.name = "AuthorizationError"
    }
}

export class NotFoundError extends ApiError {
    constructor(resource: string = "Resource") {
        super(`${resource} not found`, 404, "NOT_FOUND")
        this.name = "NotFoundError"
    }
}

export class ConflictError extends ApiError {
    constructor(message: string = "Resource already exists") {
        super(message, 409, "CONFLICT")
        this.name = "ConflictError"
    }
}

export class RateLimitError extends ApiError {
    constructor(message: string = "Too many requests") {
        super(message, 429, "RATE_LIMITED")
        this.name = "RateLimitError"
    }
}

// ============================================
// RESPONSE HELPERS
// ============================================

export function successResponse<T>(data: T, message?: string): NextResponse<IApiResponse<T>> {
    return NextResponse.json({
        success: true,
        data,
        message
    })
}

export function errorResponse(
    error: string | Error,
    statusCode: number = 500
): NextResponse<IApiResponse> {
    const message = error instanceof Error ? error.message : error
    const code = error instanceof ApiError ? error.code : undefined

    console.error(`[API Error] ${statusCode}: ${message}`)

    return NextResponse.json(
        {
            success: false,
            error: message,
            ...(code && { code })
        },
        { status: statusCode }
    )
}

export function validationErrorResponse(
    errors: Record<string, string[]>
): NextResponse<IApiResponse> {
    return NextResponse.json(
        {
            success: false,
            error: "Validation failed",
            errors
        },
        { status: 400 }
    )
}

// ============================================
// VALIDATION HELPERS
// ============================================

export async function validateRequest<T>(
    request: NextRequest,
    schema: ZodSchema<T>
): Promise<T> {
    try {
        const body = await request.json()
        return schema.parse(body)
    } catch (error) {
        if (error instanceof ZodError) {
            const formattedErrors: Record<string, string[]> = {}
            error.errors.forEach((err) => {
                const path = err.path.join(".")
                if (!formattedErrors[path]) {
                    formattedErrors[path] = []
                }
                formattedErrors[path].push(err.message)
            })
            throw new ValidationError(formattedErrors)
        }
        throw new ApiError("Invalid JSON body", 400)
    }
}

export function validateQuery<T>(
    searchParams: URLSearchParams,
    schema: ZodSchema<T>
): T {
    const params = Object.fromEntries(searchParams.entries())
    try {
        return schema.parse(params)
    } catch (error) {
        if (error instanceof ZodError) {
            const formattedErrors: Record<string, string[]> = {}
            error.errors.forEach((err) => {
                const path = err.path.join(".")
                if (!formattedErrors[path]) {
                    formattedErrors[path] = []
                }
                formattedErrors[path].push(err.message)
            })
            throw new ValidationError(formattedErrors)
        }
        throw error
    }
}

// ============================================
// AUTH MIDDLEWARE
// ============================================

export interface AuthContext {
    user: {
        id: string
        email: string
        name: string
        role: string
    }
}

export async function requireAuth(): Promise<AuthContext> {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
        throw new AuthenticationError()
    }

    return {
        user: {
            id: (session.user as any).id || session.user.email,
            email: session.user.email,
            name: session.user.name || "",
            role: (session.user as any).role || "customer"
        }
    }
}

export async function requireRole(
    allowedRoles: string[]
): Promise<AuthContext> {
    const context = await requireAuth()

    if (!allowedRoles.includes(context.user.role)) {
        throw new AuthorizationError(
            `This action requires one of these roles: ${allowedRoles.join(", ")}`
        )
    }

    return context
}

export async function requireAdmin(): Promise<AuthContext> {
    return requireRole(["admin"])
}

export async function requireSeller(): Promise<AuthContext> {
    return requireRole(["seller", "admin"])
}

// ============================================
// API HANDLER WRAPPER
// ============================================

type ApiHandler = (
    request: NextRequest,
    context?: any
) => Promise<NextResponse>

export function withErrorHandler(handler: ApiHandler): ApiHandler {
    return async (request: NextRequest, context?: any) => {
        try {
            // Connect to database
            await connectDB()

            // Execute handler
            return await handler(request, context)
        } catch (error) {
            console.error("[API Handler Error]", error)

            if (error instanceof ValidationError) {
                return validationErrorResponse(error.errors)
            }

            if (error instanceof ApiError) {
                return errorResponse(error, error.statusCode)
            }

            // MongoDB duplicate key error
            if ((error as any).code === 11000) {
                return errorResponse("Resource already exists", 409)
            }

            // MongoDB validation error
            if ((error as any).name === "ValidationError") {
                const mongoErrors = (error as any).errors
                const formattedErrors: Record<string, string[]> = {}
                for (const field in mongoErrors) {
                    formattedErrors[field] = [mongoErrors[field].message]
                }
                return validationErrorResponse(formattedErrors)
            }

            // Generic error
            return errorResponse(
                process.env.NODE_ENV === "production"
                    ? "Internal server error"
                    : (error as Error).message,
                500
            )
        }
    }
}

// ============================================
// RATE LIMITING (Simple in-memory implementation)
// ============================================

const rateLimitStore = new Map<string, { count: number; resetAt: number }>()

export function checkRateLimit(
    identifier: string,
    limit: number = 100,
    windowMs: number = 60000
): void {
    const now = Date.now()
    const record = rateLimitStore.get(identifier)

    if (!record || record.resetAt < now) {
        rateLimitStore.set(identifier, { count: 1, resetAt: now + windowMs })
        return
    }

    if (record.count >= limit) {
        throw new RateLimitError()
    }

    record.count++
}

// ============================================
// SANITIZATION HELPERS
// ============================================

export function sanitizeOutput<T extends Record<string, any>>(
    obj: T,
    fieldsToRemove: string[] = ["password", "resetPasswordToken", "emailVerificationToken"]
): Partial<T> {
    const sanitized = { ...obj }
    for (const field of fieldsToRemove) {
        delete sanitized[field]
    }
    return sanitized
}

export function sanitizeHtml(html: string): string {
    // Basic XSS prevention - remove script tags and event handlers
    return html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
        .replace(/on\w+="[^"]*"/gi, "")
        .replace(/on\w+='[^']*'/gi, "")
}
