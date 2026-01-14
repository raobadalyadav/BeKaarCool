/**
 * Admin Blog Posts API
 * Full CRUD operations for blog management
 */
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { connectDB } from "@/lib/mongodb"
import { BlogPost } from "@/models/BlogPost"

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session || session.user?.role !== "admin") {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
        }

        await connectDB()

        const { searchParams } = new URL(request.url)
        const category = searchParams.get("category")
        const status = searchParams.get("status")
        const page = parseInt(searchParams.get("page") || "1")
        const limit = parseInt(searchParams.get("limit") || "20")

        const query: any = {}
        if (category && category !== "all") query.category = category
        if (status && status !== "all") query.status = status

        const [posts, total] = await Promise.all([
            BlogPost.find(query)
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .populate("author", "name email")
                .lean(),
            BlogPost.countDocuments(query),
        ])

        return NextResponse.json({
            posts,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        })
    } catch (error: any) {
        console.error("Blog fetch error:", error)
        return NextResponse.json(
            { message: error.message || "Failed to fetch posts" },
            { status: 500 }
        )
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session || session.user?.role !== "admin") {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
        }

        await connectDB()

        const data = await request.json()

        // Generate slug from title
        let slug = data.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "")

        // Check for duplicate slug
        const existingPost = await BlogPost.findOne({ slug })
        if (existingPost) {
            slug = `${slug}-${Date.now()}`
        }

        const post = await BlogPost.create({
            ...data,
            slug,
            author: session.user.id,
            authorName: session.user.name || "Admin",
            isPublished: data.status === "published",
            publishedAt: data.status === "published" ? new Date() : undefined,
        })

        return NextResponse.json(post, { status: 201 })
    } catch (error: any) {
        console.error("Blog create error:", error)
        return NextResponse.json(
            { message: error.message || "Failed to create post" },
            { status: 500 }
        )
    }
}
