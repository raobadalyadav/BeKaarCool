import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { BlogPost } from "@/models/BlogPost"

// GET: List published blog posts with pagination
export async function GET(request: NextRequest) {
    try {
        await connectDB()

        const { searchParams } = new URL(request.url)
        const page = parseInt(searchParams.get("page") || "1")
        const limit = parseInt(searchParams.get("limit") || "9")
        const category = searchParams.get("category")
        const search = searchParams.get("search")

        // Build query
        const query: any = { status: "published" }

        if (category) {
            query.category = category
        }

        if (search) {
            query.$or = [
                { title: { $regex: search, $options: "i" } },
                { content: { $regex: search, $options: "i" } },
                { tags: { $in: [new RegExp(search, "i")] } }
            ]
        }

        const skip = (page - 1) * limit

        const [posts, total] = await Promise.all([
            BlogPost.find(query)
                .sort({ publishedAt: -1 })
                .skip(skip)
                .limit(limit)
                .select("-content") // Don't send full content in list
                .populate("author", "name avatar"),
            BlogPost.countDocuments(query)
        ])

        return NextResponse.json({
            posts,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        })
    } catch (error: any) {
        console.error("Blog list error:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// POST: Create new blog post (admin only)
export async function POST(request: NextRequest) {
    try {
        await connectDB()

        const body = await request.json()

        // Generate slug from title if not provided
        if (!body.slug) {
            body.slug = body.title
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/^-|-$/g, "")
        }

        const post = await BlogPost.create(body)

        return NextResponse.json({
            message: "Blog post created",
            post
        }, { status: 201 })
    } catch (error: any) {
        console.error("Blog create error:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
