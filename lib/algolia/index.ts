/**
 * Algolia Search Configuration
 * For fast, typo-tolerant product search
 */

import { algoliasearch } from "algoliasearch"

// Environment variables
const ALGOLIA_APP_ID = process.env.ALGOLIA_APP_ID || ""
const ALGOLIA_ADMIN_KEY = process.env.ALGOLIA_ADMIN_KEY || ""
const ALGOLIA_SEARCH_KEY = process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_KEY || ""

// Index names
export const ALGOLIA_INDEXES = {
    PRODUCTS: "products",
    PRODUCTS_PRICE_ASC: "products_price_asc",
    PRODUCTS_PRICE_DESC: "products_price_desc",
    PRODUCTS_RATING: "products_rating"
}

// Singleton clients
let adminClient: ReturnType<typeof algoliasearch> | null = null
let searchClient: ReturnType<typeof algoliasearch> | null = null

/**
 * Get Algolia admin client (for indexing)
 */
export function getAlgoliaAdminClient() {
    if (!adminClient) {
        if (!ALGOLIA_APP_ID || !ALGOLIA_ADMIN_KEY) {
            throw new Error("Algolia admin credentials not configured")
        }
        adminClient = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_ADMIN_KEY)
    }
    return adminClient
}

/**
 * Get Algolia search client (for frontend queries)
 */
export function getAlgoliaSearchClient() {
    if (!searchClient) {
        if (!ALGOLIA_APP_ID || !ALGOLIA_SEARCH_KEY) {
            throw new Error("Algolia search credentials not configured")
        }
        searchClient = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_SEARCH_KEY)
    }
    return searchClient
}

// ============================================
// PRODUCT INDEXING
// ============================================

export interface AlgoliaProduct {
    objectID: string
    name: string
    slug: string
    description: string
    price: number
    originalPrice?: number
    discountPercentage?: number
    images: string[]
    category: string
    subcategory?: string
    brand?: string
    tags: string[]
    rating: number
    reviewCount: number
    stock: number
    inStock: boolean
    featured: boolean
    sold: number
    createdAt: number
    [key: string]: unknown // Index signature for Algolia compatibility
}

/**
 * Transform database product to Algolia format
 */
export function transformProductForAlgolia(product: any): AlgoliaProduct {
    const discountPercentage = product.originalPrice && product.originalPrice > product.price
        ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
        : 0

    return {
        objectID: product._id.toString(),
        name: product.name,
        slug: product.slug,
        description: product.description?.substring(0, 500) || "",
        price: product.price,
        originalPrice: product.originalPrice,
        discountPercentage,
        images: product.images || [],
        category: typeof product.category === 'object' ? product.category.name : product.category,
        subcategory: product.subcategory,
        brand: product.brand,
        tags: product.tags || [],
        rating: product.rating || 0,
        reviewCount: product.reviewCount || 0,
        stock: product.stock || 0,
        inStock: (product.stock || 0) > 0,
        featured: product.featured || false,
        sold: product.sold || 0,
        createdAt: new Date(product.createdAt).getTime()
    }
}

/**
 * Index a single product
 */
export async function indexProduct(product: any): Promise<void> {
    try {
        const client = getAlgoliaAdminClient()
        const algoliaProduct = transformProductForAlgolia(product)
        await client.saveObject({
            indexName: ALGOLIA_INDEXES.PRODUCTS,
            body: algoliaProduct
        })
        console.log(`Algolia: Indexed product ${product._id}`)
    } catch (error) {
        console.error("Algolia indexProduct error:", error)
    }
}

/**
 * Index multiple products
 */
export async function indexProducts(products: any[]): Promise<void> {
    try {
        const client = getAlgoliaAdminClient()
        const algoliaProducts = products.map(transformProductForAlgolia)
        await client.saveObjects({
            indexName: ALGOLIA_INDEXES.PRODUCTS,
            objects: algoliaProducts as unknown as Record<string, unknown>[]
        })
        console.log(`Algolia: Indexed ${products.length} products`)
    } catch (error) {
        console.error("Algolia indexProducts error:", error)
    }
}

/**
 * Delete product from index
 */
export async function deleteProductFromIndex(productId: string): Promise<void> {
    try {
        const client = getAlgoliaAdminClient()
        await client.deleteObject({
            indexName: ALGOLIA_INDEXES.PRODUCTS,
            objectID: productId
        })
        console.log(`Algolia: Deleted product ${productId}`)
    } catch (error) {
        console.error("Algolia deleteProduct error:", error)
    }
}

// ============================================
// SEARCH
// ============================================

export interface SearchOptions {
    query: string
    page?: number
    hitsPerPage?: number
    filters?: string
    facetFilters?: string[][]
    sortBy?: "relevance" | "price_asc" | "price_desc" | "rating"
}

export interface SearchResult {
    hits: AlgoliaProduct[]
    nbHits: number
    page: number
    nbPages: number
    hitsPerPage: number
    facets?: Record<string, Record<string, number>>
}

/**
 * Search products
 */
export async function searchProducts(options: SearchOptions): Promise<SearchResult> {
    try {
        const client = getAlgoliaSearchClient()

        // Select index based on sort
        let indexName = ALGOLIA_INDEXES.PRODUCTS
        if (options.sortBy === "price_asc") {
            indexName = ALGOLIA_INDEXES.PRODUCTS_PRICE_ASC
        } else if (options.sortBy === "price_desc") {
            indexName = ALGOLIA_INDEXES.PRODUCTS_PRICE_DESC
        } else if (options.sortBy === "rating") {
            indexName = ALGOLIA_INDEXES.PRODUCTS_RATING
        }

        const result = await client.searchSingleIndex<AlgoliaProduct>({
            indexName,
            searchParams: {
                query: options.query,
                page: options.page || 0,
                hitsPerPage: options.hitsPerPage || 20,
                filters: options.filters,
                facetFilters: options.facetFilters,
                facets: ["category", "brand", "tags", "inStock"]
            }
        })

        return {
            hits: result.hits,
            nbHits: result.nbHits ?? 0,
            page: result.page ?? 0,
            nbPages: result.nbPages ?? 0,
            hitsPerPage: result.hitsPerPage ?? 20,
            facets: result.facets
        }
    } catch (error) {
        console.error("Algolia search error:", error)
        return {
            hits: [],
            nbHits: 0,
            page: 0,
            nbPages: 0,
            hitsPerPage: 20
        }
    }
}

// ============================================
// INDEX CONFIGURATION
// ============================================

/**
 * Configure Algolia index settings (run once on setup)
 */
export async function configureAlgoliaIndex(): Promise<void> {
    try {
        const client = getAlgoliaAdminClient()

        await client.setSettings({
            indexName: ALGOLIA_INDEXES.PRODUCTS,
            indexSettings: {
                searchableAttributes: [
                    "name",
                    "brand",
                    "category",
                    "subcategory",
                    "tags",
                    "description"
                ],
                attributesForFaceting: [
                    "filterOnly(objectID)",
                    "searchable(category)",
                    "searchable(brand)",
                    "searchable(tags)",
                    "inStock",
                    "featured"
                ],
                customRanking: [
                    "desc(sold)",
                    "desc(rating)",
                    "desc(createdAt)"
                ],
                ranking: [
                    "typo",
                    "geo",
                    "words",
                    "filters",
                    "proximity",
                    "attribute",
                    "exact",
                    "custom"
                ],
                highlightPreTag: "<mark>",
                highlightPostTag: "</mark>",
                snippetEllipsisText: "...",
                minWordSizefor1Typo: 4,
                minWordSizefor2Typos: 8
            }
        })

        console.log("Algolia: Index configured successfully")
    } catch (error) {
        console.error("Algolia configureIndex error:", error)
    }
}

// ============================================
// SYNC UTILITIES
// ============================================

/**
 * Sync all products to Algolia
 */
export async function syncAllProducts(): Promise<{ success: boolean; count: number }> {
    try {
        // Import Product model dynamically to avoid circular deps
        const { Product } = await import("@/models")
        const products = await Product.find({ isActive: true }).lean()

        await indexProducts(products)

        return { success: true, count: products.length }
    } catch (error) {
        console.error("Algolia sync error:", error)
        return { success: false, count: 0 }
    }
}

/**
 * Clear entire index
 */
export async function clearIndex(): Promise<void> {
    try {
        const client = getAlgoliaAdminClient()
        await client.clearObjects({ indexName: ALGOLIA_INDEXES.PRODUCTS })
        console.log("Algolia: Index cleared")
    } catch (error) {
        console.error("Algolia clear error:", error)
    }
}
