/**
 * Categories API
 * Full CRUD for product categories with hierarchy support
 */

import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { Category } from "@/models/Category"
import { Product } from "@/models/Product"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

// GET - Fetch all categories with product counts
export async function GET(request: NextRequest) {
    try {
        await connectDB()

        const { searchParams } = new URL(request.url)
        const withCount = searchParams.get("withCount") === "true"
        const parentOnly = searchParams.get("parentOnly") === "true"
        const featured = searchParams.get("featured") === "true"

        // Build query
        const query: any = { isActive: true }

        if (parentOnly) {
            query.parent = null
        }

        if (featured) {
            query.featured = true
        }

        let categories = await Category.find(query)
            .populate("parent", "name slug")
            .sort({ displayOrder: 1, name: 1 })
            .lean()

        // Add product counts if requested
        if (withCount) {
            const counts = await Product.aggregate([
                { $match: { isActive: true } },
                { $group: { _id: "$category", count: { $sum: 1 } } }
            ])

            const countMap = new Map(counts.map((c: any) => [c._id, c.count]))

            categories = categories.map((cat: any) => ({
                ...cat,
                productCount: countMap.get(cat.name) || countMap.get(cat.slug) || 0
            }))
        }

        return NextResponse.json(categories)
    } catch (error) {
        console.error("Error fetching categories:", error)
        return NextResponse.json(
            { message: "Failed to fetch categories" },
            { status: 500 }
        )
    }
}

// POST - Create category (Admin only)
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session || session.user.role !== "admin") {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
        }

        await connectDB()
        const body = await request.json()

        if (!body.name) {
            return NextResponse.json(
                { message: "Category name is required" },
                { status: 400 }
            )
        }

        // Generate slug
        const slug = body.slug || body.name
            .toLowerCase()
            .replace(/\s+/g, "-")
            .replace(/[^a-z0-9-]/g, "")

        // Check if slug exists
        const existing = await Category.findOne({ slug })
        if (existing) {
            return NextResponse.json(
                { message: "Category with this name already exists" },
                { status: 400 }
            )
        }

        const category = await Category.create({
            ...body,
            slug,
            productCount: 0
        })

        return NextResponse.json(category, { status: 201 })
    } catch (error) {
        console.error("Error creating category:", error)
        return NextResponse.json(
            { message: "Failed to create category" },
            { status: 500 }
        )
    }
}
