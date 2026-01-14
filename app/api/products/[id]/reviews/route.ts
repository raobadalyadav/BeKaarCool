/**
 * Product Reviews API
 * CRUD for product reviews
 */

import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { Review } from "@/models/Review"
import { Product } from "@/models/Product"
import { Order } from "@/models/Order"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

// GET - Fetch reviews for a product
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB()
        const { id: productId } = await params

        const { searchParams } = new URL(request.url)
        const page = parseInt(searchParams.get("page") || "1")
        const limit = parseInt(searchParams.get("limit") || "10")
        const sort = searchParams.get("sort") || "-createdAt"
        const rating = searchParams.get("rating")

        const query: any = {
            product: productId,
            status: "approved"
        }

        if (rating) {
            query.rating = parseInt(rating)
        }

        const skip = (page - 1) * limit

        const [reviews, total, stats] = await Promise.all([
            Review.find(query)
                .populate("user", "name avatar")
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .lean(),
            Review.countDocuments(query),
            Review.aggregate([
                { $match: { product: productId, status: "approved" } },
                {
                    $group: {
                        _id: null,
                        avgRating: { $avg: "$rating" },
                        totalReviews: { $sum: 1 },
                        fiveStars: { $sum: { $cond: [{ $eq: ["$rating", 5] }, 1, 0] } },
                        fourStars: { $sum: { $cond: [{ $eq: ["$rating", 4] }, 1, 0] } },
                        threeStars: { $sum: { $cond: [{ $eq: ["$rating", 3] }, 1, 0] } },
                        twoStars: { $sum: { $cond: [{ $eq: ["$rating", 2] }, 1, 0] } },
                        oneStar: { $sum: { $cond: [{ $eq: ["$rating", 1] }, 1, 0] } },
                        withImages: { $sum: { $cond: [{ $gt: [{ $size: { $ifNull: ["$images", []] } }, 0] }, 1, 0] } }
                    }
                }
            ])
        ])

        return NextResponse.json({
            reviews,
            stats: stats[0] || {
                avgRating: 0,
                totalReviews: 0,
                fiveStars: 0,
                fourStars: 0,
                threeStars: 0,
                twoStars: 0,
                oneStar: 0,
                withImages: 0
            },
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        })
    } catch (error) {
        console.error("Error fetching reviews:", error)
        return NextResponse.json(
            { message: "Failed to fetch reviews" },
            { status: 500 }
        )
    }
}

// POST - Create a review
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) {
            return NextResponse.json({ message: "Please login to review" }, { status: 401 })
        }

        await connectDB()
        const { id: productId } = await params
        const body = await request.json()

        // Check if user already reviewed
        const existingReview = await Review.findOne({
            user: session.user.id,
            product: productId
        })

        if (existingReview) {
            return NextResponse.json(
                { message: "You have already reviewed this product" },
                { status: 400 }
            )
        }

        // Check if user purchased this product
        const order = await Order.findOne({
            customer: session.user.id,
            status: "delivered",
            "items.product": productId
        })

        if (!order) {
            return NextResponse.json(
                { message: "You can only review products you have purchased" },
                { status: 400 }
            )
        }

        // Create review
        const review = await Review.create({
            user: session.user.id,
            product: productId,
            order: order._id,
            rating: body.rating,
            title: body.title,
            comment: body.comment,
            images: body.images || [],
            pros: body.pros || [],
            cons: body.cons || [],
            fitRating: body.fitRating,
            qualityRating: body.qualityRating,
            valueRating: body.valueRating,
            recommendProduct: body.recommendProduct ?? true,
            verified: true,
            status: "approved" // Auto-approve verified purchases
        })

        // Update product rating
        const stats = await Review.aggregate([
            { $match: { product: productId, status: "approved" } },
            {
                $group: {
                    _id: null,
                    avgRating: { $avg: "$rating" },
                    count: { $sum: 1 }
                }
            }
        ])

        if (stats[0]) {
            await Product.findByIdAndUpdate(productId, {
                rating: Math.round(stats[0].avgRating * 10) / 10,
                reviewCount: stats[0].count
            })
        }

        await review.populate("user", "name avatar")

        return NextResponse.json(review, { status: 201 })
    } catch (error) {
        console.error("Error creating review:", error)
        return NextResponse.json(
            { message: "Failed to create review" },
            { status: 500 }
        )
    }
}
