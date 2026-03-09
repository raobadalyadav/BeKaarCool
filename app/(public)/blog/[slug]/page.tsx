import { Metadata } from "next"
import { notFound } from "next/navigation"
import { generateMetadata as generateSEOMetadata } from "@/lib/seo"
import BlogDetailClient, { staticPost, BlogPost } from "./blog-detail-client"

interface Props {
    params: Promise<{ slug: string }>
}

async function getPostData(slug: string): Promise<{ post: BlogPost | null, relatedPosts: BlogPost[] }> {
    try {
        if (!slug || slug === 'undefined' || slug === 'null') {
            return { post: null, relatedPosts: [] }
        }

        const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
        const response = await fetch(`${baseUrl}/api/blog/${slug}`, {
            cache: 'no-store'
        })

        if (!response.ok) {
            return { post: null, relatedPosts: [] }
        }

        const data = await response.json()
        return { post: data.post, relatedPosts: data.relatedPosts || [] }
    } catch (error) {
        console.error('Error fetching blog post:', error)
        return { post: null, relatedPosts: [] }
    }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params
    let { post } = await getPostData(slug)
    
    // Fallback to static post for demo purposes
    if (!post && slug === 'summer-fashion-trends-2026') {
        post = staticPost
    }

    if (!post) {
        return generateSEOMetadata({
            title: "Article Not Found | Baefikra",
            description: "The article you're looking for doesn't exist.",
            noIndex: true
        })
    }

    return generateSEOMetadata({
        title: `${post.title} | Baefikra Blog`,
        description: post.excerpt || post.content?.substring(0, 160) || `Read ${post.title} on Baefikra Blog`,
        keywords: [post.category, ...(post.tags || [])].filter(Boolean),
        image: post.coverImage,
        url: `${process.env.NEXTAUTH_URL}/blog/${post.slug}`,
        type: "article"
    })
}

export default async function BlogPostPage({ params }: Props) {
    const { slug } = await params
    let { post, relatedPosts } = await getPostData(slug)

    // Fallback to static post for demo purposes
    if (!post) {
        if (slug === 'summer-fashion-trends-2026') {
            post = staticPost
        } else {
            notFound()
        }
    }
    
    return <BlogDetailClient post={post} relatedPosts={relatedPosts} />
}
