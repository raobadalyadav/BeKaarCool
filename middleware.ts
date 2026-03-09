/**
 * Next.js Root Middleware
 * Route protection, auth guards, and security headers at the edge.
 */

import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"

// ============================================
// PROTECTED ROUTES
// ============================================

const PROTECTED_ROUTES = {
    // Routes requiring any authenticated user
    auth: ["/account", "/checkout", "/orders"],
    // Routes requiring admin role
    admin: ["/admin"],
    // Routes requiring seller or admin role
    seller: ["/seller"],
}

const AUTH_PAGES = ["/auth/login", "/auth/register", "/auth/forgot-password"]

// ============================================
// MIDDLEWARE
// ============================================

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl

    // Get JWT token (works at the edge)
    const token = await getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET,
    })

    const isAuthenticated = !!token
    const userRole = (token?.role as string) || "customer"

    // --- Redirect authenticated users away from auth pages ---
    if (isAuthenticated && AUTH_PAGES.some((page) => pathname.startsWith(page))) {
        return NextResponse.redirect(new URL("/", request.url))
    }

    // --- Admin routes: require admin role ---
    if (PROTECTED_ROUTES.admin.some((route) => pathname.startsWith(route))) {
        if (!isAuthenticated) {
            const loginUrl = new URL("/auth/login", request.url)
            loginUrl.searchParams.set("callbackUrl", pathname)
            return NextResponse.redirect(loginUrl)
        }
        if (userRole !== "admin") {
            return NextResponse.redirect(new URL("/", request.url))
        }
    }

    // --- Seller routes: require seller or admin role ---
    if (PROTECTED_ROUTES.seller.some((route) => pathname.startsWith(route))) {
        if (!isAuthenticated) {
            const loginUrl = new URL("/auth/login", request.url)
            loginUrl.searchParams.set("callbackUrl", pathname)
            return NextResponse.redirect(loginUrl)
        }
        if (!["seller", "admin"].includes(userRole)) {
            return NextResponse.redirect(new URL("/", request.url))
        }
    }

    // --- Auth-required routes: require any authenticated user ---
    if (PROTECTED_ROUTES.auth.some((route) => pathname.startsWith(route))) {
        if (!isAuthenticated) {
            const loginUrl = new URL("/auth/login", request.url)
            loginUrl.searchParams.set("callbackUrl", pathname)
            return NextResponse.redirect(loginUrl)
        }
    }

    return NextResponse.next()
}

// ============================================
// MATCHER — Only run on relevant routes
// ============================================

export const config = {
    matcher: [
        // Protected routes
        "/admin/:path*",
        "/seller/:path*",
        "/account/:path*",
        "/checkout/:path*",
        "/orders/:path*",
        // Auth pages (redirect if already logged in)
        "/auth/:path*",
    ],
}
