"use client"

import { useState, useEffect } from "react"
import { useParams, notFound } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
    Calendar, User, Clock, ChevronRight, Home, Share2,
    Facebook, Twitter, Linkedin, ArrowLeft
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface BlogPost {
    _id: string
    title: string
    slug: string
    excerpt: string
    content: string
    coverImage: string
    category: string
    author: {
        name: string
        avatar?: string
    }
    readTime: number
    createdAt: string
    tags: string[]
}

// Static post for demo
const staticPost: BlogPost = {
    _id: "1",
    title: "Summer Fashion Trends 2026: What's Hot This Season",
    slug: "summer-fashion-trends-2026",
    excerpt: "Discover the hottest fashion trends for Summer 2026.",
    content: `
## The Rise of Bold Colors

This summer is all about making a statement with vibrant, bold colors. From electric blues to fiery oranges, don't be afraid to stand out from the crowd.

### Key Colors to Watch:
- **Sunset Orange** - Perfect for evening wear
- **Ocean Blue** - Fresh and versatile
- **Lime Green** - Bold and energetic

## Sustainable Fashion Takes Center Stage

More than ever, consumers are choosing eco-friendly options. Brands are responding with:

1. Recycled materials
2. Organic cotton collections
3. Upcycled vintage pieces

## Comfort Meets Style

The work-from-home era has permanently changed fashion. Comfort is no longer compromised for style:

- Oversized silhouettes remain popular
- Stretch fabrics in formal wear
- Sneakers with everything

## Accessories That Pop

Complete your look with statement accessories:

- Chunky jewelry
- Bold sunglasses
- Structured bags

## Conclusion

Summer 2026 is about expressing yourself boldly while staying comfortable and sustainable. Mix and match these trends to create your unique style!
  `,
    coverImage: "/placeholder.svg",
    category: "Fashion",
    author: { name: "Style Team" },
    readTime: 5,
    createdAt: new Date().toISOString(),
    tags: ["summer", "trends", "fashion", "2026"]
}

export default function BlogArticlePage() {
    const params = useParams()
    const { toast } = useToast()
    const [post, setPost] = useState<BlogPost | null>(null)
    const [loading, setLoading] = useState(true)
    const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([])

    useEffect(() => {
        fetchPost()
    }, [params.slug])

    const fetchPost = async () => {
        try {
            const res = await fetch(`/api/blog/${params.slug}`)
            if (res.ok) {
                const data = await res.json()
                setPost(data.post || staticPost)
                setRelatedPosts(data.relatedPosts || [])
            } else {
                setPost(staticPost)
            }
        } catch (error) {
            setPost(staticPost)
        } finally {
            setLoading(false)
        }
    }

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "long",
            year: "numeric"
        })
    }

    const shareUrl = typeof window !== 'undefined' ? window.location.href : ''

    const shareOnSocial = (platform: string) => {
        const urls: Record<string, string> = {
            facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
            twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(post?.title || '')}`,
            linkedin: `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(post?.title || '')}`
        }
        window.open(urls[platform], '_blank', 'width=600,height=400')
    }

    const copyLink = () => {
        navigator.clipboard.writeText(shareUrl)
        toast({ title: "Link copied to clipboard!" })
    }

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-8 max-w-4xl">
                <Skeleton className="h-8 w-3/4 mb-4" />
                <Skeleton className="h-64 w-full mb-6" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
            </div>
        )
    }

    if (!post) {
        return notFound()
    }

    return (
        <div className="min-h-screen bg-white">
            {/* Breadcrumbs */}
            <div className="bg-gray-50 border-b">
                <div className="container mx-auto px-4 py-3">
                    <nav className="flex items-center gap-2 text-sm text-gray-500">
                        <Link href="/" className="hover:text-yellow-600">
                            <Home className="w-4 h-4" />
                        </Link>
                        <ChevronRight className="w-4 h-4" />
                        <Link href="/blog" className="hover:text-yellow-600">Blog</Link>
                        <ChevronRight className="w-4 h-4" />
                        <span className="text-gray-900 font-medium line-clamp-1">{post.title}</span>
                    </nav>
                </div>
            </div>

            <article className="container mx-auto px-4 py-8 max-w-4xl">
                {/* Back Link */}
                <Link href="/blog" className="inline-flex items-center text-gray-500 hover:text-yellow-600 mb-6">
                    <ArrowLeft className="w-4 h-4 mr-1" /> Back to Blog
                </Link>

                {/* Header */}
                <header className="mb-8">
                    <Badge className="bg-yellow-400 text-black mb-4">{post.category}</Badge>
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{post.title}</h1>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            {post.author.name}
                        </span>
                        <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {formatDate(post.createdAt)}
                        </span>
                        <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {post.readTime} min read
                        </span>
                    </div>
                </header>

                {/* Cover Image */}
                <div className="relative h-64 md:h-96 rounded-lg overflow-hidden mb-8">
                    <Image
                        src={post.coverImage}
                        alt={post.title}
                        fill
                        className="object-cover"
                    />
                </div>

                {/* Content */}
                <div className="prose prose-lg max-w-none mb-8">
                    {post.content.split('\n').map((paragraph, idx) => {
                        if (paragraph.startsWith('## ')) {
                            return <h2 key={idx} className="text-2xl font-bold mt-8 mb-4">{paragraph.slice(3)}</h2>
                        }
                        if (paragraph.startsWith('### ')) {
                            return <h3 key={idx} className="text-xl font-semibold mt-6 mb-3">{paragraph.slice(4)}</h3>
                        }
                        if (paragraph.startsWith('- ')) {
                            return <li key={idx} className="ml-6">{paragraph.slice(2)}</li>
                        }
                        if (paragraph.match(/^\d+\./)) {
                            return <li key={idx} className="ml-6">{paragraph.slice(3)}</li>
                        }
                        if (paragraph.trim()) {
                            return <p key={idx} className="mb-4 text-gray-700">{paragraph}</p>
                        }
                        return null
                    })}
                </div>

                {/* Tags */}
                {post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-8">
                        {post.tags.map(tag => (
                            <Badge key={tag} variant="secondary">#{tag}</Badge>
                        ))}
                    </div>
                )}

                {/* Share */}
                <Card className="mb-8">
                    <CardContent className="py-4 flex flex-wrap items-center justify-between gap-4">
                        <span className="font-semibold flex items-center gap-2">
                            <Share2 className="w-5 h-5" /> Share this article
                        </span>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => shareOnSocial('facebook')}>
                                <Facebook className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => shareOnSocial('twitter')}>
                                <Twitter className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => shareOnSocial('linkedin')}>
                                <Linkedin className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={copyLink}>
                                Copy Link
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Related Posts */}
                {relatedPosts.length > 0 && (
                    <div className="mt-12">
                        <h2 className="text-2xl font-bold mb-6">Related Articles</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {relatedPosts.slice(0, 2).map(related => (
                                <Link key={related._id} href={`/blog/${related.slug}`}>
                                    <Card className="h-full hover:shadow-lg transition-shadow">
                                        <CardContent className="p-4 flex gap-4">
                                            <div className="w-24 h-24 relative flex-shrink-0 rounded overflow-hidden">
                                                <Image
                                                    src={related.coverImage}
                                                    alt={related.title}
                                                    fill
                                                    className="object-cover"
                                                />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold line-clamp-2 hover:text-yellow-600">
                                                    {related.title}
                                                </h3>
                                                <p className="text-sm text-gray-500 mt-1">{related.readTime} min read</p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </article>
        </div>
    )
}
