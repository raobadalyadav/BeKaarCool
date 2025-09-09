import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { Review } from "@/models/Review"

export async function GET(request: NextRequest) {
  try {
    await connectDB()

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get("limit") || "10")

    const testimonials = await Review.find({ rating: { $gte: 4 } })
      .populate("user", "name avatar")
      .populate("product", "name")
      .sort({ createdAt: -1 })
      .limit(limit)

    const formattedTestimonials = testimonials.map(review => ({
      _id: review._id,
      name: review.user?.name || "Anonymous",
      avatar: review.user?.avatar || "/placeholder-user.jpg",
      rating: review.rating,
      comment: review.comment,
      product: review.product?.name || "Product",
    }))

    return NextResponse.json({ testimonials: formattedTestimonials })
  } catch (error) {
    console.error("Error fetching testimonials:", error)
    return NextResponse.json({ testimonials: [] })
  }
}