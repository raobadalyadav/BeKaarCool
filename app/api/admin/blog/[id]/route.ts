/**
 * Admin Blog Post API - Single Post Operations
 * GET, PUT, DELETE for individual blog posts
 */
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { connectDB } from "@/lib/mongodb"
import { BlogPost } from "@/models/BlogPost"

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session || session.user?.role !== "admin") {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
        }

        await connectDB()

        const post = await BlogPost.findById(params.id)
            .populate("author", "name email")

        if (!post) {
            return NextResponse.json({ message: "Post not found" }, { status: 404 })
        }

        return NextResponse.json(post)
    } catch (error: any) {
        return NextResponse.json(
            { message: error.message || "Failed to fetch post" },
            { status: 500 }
        )
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session || session.user?.role !== "admin") {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
        }

        await connectDB()

        const data = await request.json()
        const post = await BlogPost.findById(params.id)

        if (!post) {
            return NextResponse.json({ message: "Post not found" }, { status: 404 })
        }

        // Update slug if title changed
        if (data.title && data.title !== post.title) {
            let newSlug = data.title
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/^-|-$/g, "")

            const existingPost = await BlogPost.findOne({ slug: newSlug, _id: { $ne: params.id } })
            if (existingPost) {
                newSlug = `${newSlug}-${Date.now()}`
            }
            data.slug = newSlug
        }

        // Set publishedAt if publishing for first time
        if (data.status === "published" && post.status !== "published") {
            data.isPublished = true
            if (!post.publishedAt) {
                data.publishedAt = new Date()
            }
        }

        const updatedPost = await BlogPost.findByIdAndUpdate(
            params.id,
            { $set: data },
            { new: true, runValidators: true }
        ).populate("author", "name email")

        return NextResponse.json(updatedPost)
    } catch (error: any) {
        return NextResponse.json(
            { message: error.message || "Failed to update post" },
            { status: 500 }
        )
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session || session.user?.role !== "admin") {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
        }

        await connectDB()

        const post = await BlogPost.findByIdAndDelete(params.id)

        if (!post) {
            return NextResponse.json({ message: "Post not found" }, { status: 404 })
        }

        return NextResponse.json({ message: "Post deleted successfully" })
    } catch (error: any) {
        return NextResponse.json(
            { message: error.message || "Failed to delete post" },
            { status: 500 }
        )
    }
}
