import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { connectDB } from "@/lib/mongodb"
import { Product } from "@/models/Product"
import { SearchHistory } from "@/models/SearchHistory"
import { Category } from "@/models/Category"
import { resolveUserId } from "@/lib/auth-utils"

// GET: Search products with suggestions
export async function GET(request: NextRequest) {
    try {
        await connectDB()

        const { searchParams } = new URL(request.url)
        const query = searchParams.get("q") || ""
        const type = searchParams.get("type") || "results" // results, suggestions, popular, recent
        const page = parseInt(searchParams.get("page") || "1")
        const limit = parseInt(searchParams.get("limit") || "20")

        // Get user if logged in
        const session = await getServerSession(authOptions)
        const userId = session?.user?.id ? await resolveUserId(session.user.id, session.user.email) : null

        // Popular searches
        if (type === "popular") {
            const popular = await SearchHistory.getPopularSearches(10)
            return NextResponse.json({ searches: popular.map((p: { query: string; count: number }) => p.query) })
        }

        // Recent searches (user-specific)
        if (type === "recent") {
            if (!userId) {
                return NextResponse.json({ searches: [] })
            }
            const recent = await SearchHistory.getRecentSearches(userId, 10)
            return NextResponse.json({ searches: recent })
        }

        // Instant suggestions (autocomplete)
        if (type === "suggestions") {
            if (!query || query.length < 2) {
                return NextResponse.json({ suggestions: [] })
            }

            // Get product name suggestions
            const products = await Product.find({
                $or: [
                    { name: { $regex: query, $options: "i" } },
                    { tags: { $in: [new RegExp(query, "i")] } }
                ],
                isActive: true
            })
                .select("name slug category")
                .limit(5)

            // Get category suggestions
            const categories = await Category.find({
                name: { $regex: query, $options: "i" },
                isActive: true
            })
                .select("name slug")
                .limit(3)

            const suggestions = [
                ...products.map(p => ({ type: "product", text: p.name, slug: p.slug })),
                ...categories.map(c => ({ type: "category", text: c.name, slug: c.slug }))
            ]

            return NextResponse.json({ suggestions })
        }

        // Full search results
        if (!query) {
            return NextResponse.json({ products: [], total: 0 })
        }

        const skip = (page - 1) * limit

        // Build search query with fuzzy matching
        const searchQuery: any = {
            isActive: true,
            $or: [
                { name: { $regex: query, $options: "i" } },
                { description: { $regex: query, $options: "i" } },
                { tags: { $in: [new RegExp(query, "i")] } },
                { "category.name": { $regex: query, $options: "i" } }
            ]
        }

        const [products, total] = await Promise.all([
            Product.find(searchQuery)
                .populate("category", "name slug")
                .sort({ soldCount: -1, rating: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Product.countDocuments(searchQuery)
        ])

        // Record search (non-blocking)
        if (query.length >= 3) {
            SearchHistory.recordSearch(query, userId || undefined, total).catch(console.error)
        }

        return NextResponse.json({
            products,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            },
            query
        })
    } catch (error: any) {
        console.error("Search error:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// POST: Clear recent searches
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        await connectDB()

        const userId = await resolveUserId(session.user.id, session.user.email)
        const { action } = await request.json()

        if (action === "clear") {
            await SearchHistory.deleteMany({ user: userId })
            return NextResponse.json({ message: "Search history cleared" })
        }

        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    } catch (error: any) {
        console.error("Search POST error:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
