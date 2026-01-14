import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { BlogPost } from "@/models/BlogPost"

// GET: Get single blog post by slug
export async function GET(
    request: NextRequest,
    { params }: { params: { slug: string } }
) {
    try {
        await connectDB()

        const { slug } = await (params as any)

        const post = await BlogPost.findOne({ slug, status: "published" })
            .populate("author", "name avatar")

        if (!post) {
            return NextResponse.json({ error: "Post not found" }, { status: 404 })
        }

        // Increment views
        await BlogPost.findByIdAndUpdate(post._id, { $inc: { views: 1 } })

        // Get related posts (same category)
        const relatedPosts = await BlogPost.find({
            _id: { $ne: post._id },
            status: "published",
            $or: [
                { category: post.category },
                { tags: { $in: post.tags } }
            ]
        })
            .sort({ publishedAt: -1 })
            .limit(4)
            .select("-content")
            .populate("author", "name avatar")

        return NextResponse.json({ post, relatedPosts })
    } catch (error: any) {
        console.error("Blog post error:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// PUT: Update blog post
export async function PUT(
    request: NextRequest,
    { params }: { params: { slug: string } }
) {
    try {
        await connectDB()

        const { slug } = await (params as any)
        const body = await request.json()

        const post = await BlogPost.findOneAndUpdate(
            { slug },
            { $set: body },
            { new: true }
        )

        if (!post) {
            return NextResponse.json({ error: "Post not found" }, { status: 404 })
        }

        return NextResponse.json({ message: "Post updated", post })
    } catch (error: any) {
        console.error("Blog update error:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// DELETE: Delete blog post
export async function DELETE(
    request: NextRequest,
    { params }: { params: { slug: string } }
) {
    try {
        await connectDB()

        const { slug } = await (params as any)

        const post = await BlogPost.findOneAndDelete({ slug })

        if (!post) {
            return NextResponse.json({ error: "Post not found" }, { status: 404 })
        }

        return NextResponse.json({ message: "Post deleted" })
    } catch (error: any) {
        console.error("Blog delete error:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
