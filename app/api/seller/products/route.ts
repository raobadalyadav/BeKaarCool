import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { Product } from "@/models/Product"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { resolveUserId } from "@/lib/auth-utils"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== "seller") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    await connectDB()
    const sellerId = await resolveUserId(session.user.id, session.user.email)

    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const sort = searchParams.get("sort") || "createdAt"

    const skip = (page - 1) * limit

    let sortObj: any = { createdAt: -1 }
    if (sort === "popular") sortObj = { views: -1, sold: -1 }
    if (sort === "price-high") sortObj = { price: -1 }
    if (sort === "price-low") sortObj = { price: 1 }

    const products = await Product.find({ seller: sellerId })
      .sort(sortObj)
      .skip(skip)
      .limit(limit)

    const total = await Product.countDocuments({ seller: sellerId })

    return NextResponse.json({
      products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching seller products:", error)
    return NextResponse.json({ message: "Failed to fetch products" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== "seller") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    await connectDB()
    const sellerId = await resolveUserId(session.user.id, session.user.email)

    const body = await request.json()
    const { name, description, price, originalPrice, category, tags, variations, stock, images } = body

    if (!name || !description || !price || !category || !stock) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 })
    }

    const slug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")

    const product = new Product({
      name,
      description,
      price,
      originalPrice,
      images: images || ["/placeholder.svg"],
      category,
      tags: tags || [],
      variations: variations || { sizes: [], colors: [] },
      stock,
      seller: sellerId,
      slug,
      seo: {
        title: name,
        description: description.substring(0, 160),
        keywords: tags || [],
      },
    })

    await product.save()
    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    console.error("Error creating product:", error)
    return NextResponse.json({ message: "Failed to create product" }, { status: 500 })
  }
}