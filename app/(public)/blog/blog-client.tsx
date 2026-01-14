"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import {
    Search, Calendar, User, ChevronRight, ChevronLeft, Home, BookOpen
} from "lucide-react"

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

interface Pagination {
    page: number
    limit: number
    total: number
    pages: number
}

export default function BlogClient() {
    const [posts, setPosts] = useState<BlogPost[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [pagination, setPagination] = useState<Pagination>({
        page: 1,
        limit: 9,
        total: 0,
        pages: 0
    })

    useEffect(() => {
        fetchPosts()
    }, [pagination.page])

    const fetchPosts = async () => {
        setLoading(true)
        try {
            const res = await fetch(`/api/blog?page=${pagination.page}&limit=${pagination.limit}`)
            if (res.ok) {
                const data = await res.json()
                setPosts(data.posts || [])
                setPagination(prev => ({
                    ...prev,
                    total: data.pagination?.total || 0,
                    pages: data.pagination?.pages || 0
                }))
            } else {
                setPosts([])
            }
        } catch (error) {
            console.error("Failed to fetch posts:", error)
            setPosts([])
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

    const filteredPosts = searchQuery
        ? posts.filter(p =>
            p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.excerpt.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : posts

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Breadcrumbs */}
            <div className="bg-white border-b">
                <div className="container mx-auto px-4 py-3">
                    <nav className="flex items-center gap-2 text-sm text-gray-500">
                        <Link href="/" className="hover:text-yellow-600">
                            <Home className="w-4 h-4" />
                        </Link>
                        <ChevronRight className="w-4 h-4" />
                        <span className="text-gray-900 font-medium">Blog</span>
                    </nav>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Our Blog</h1>
                    <p className="text-gray-600">Fashion tips, style guides, and trending topics</p>
                </div>

                {/* Search */}
                <div className="max-w-md mx-auto mb-8">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <Input
                            type="text"
                            placeholder="Search articles..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </div>

                {/* Posts Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <Card key={i} className="overflow-hidden">
                                <Skeleton className="h-48 w-full" />
                                <CardContent className="p-6">
                                    <Skeleton className="h-6 w-3/4 mb-2" />
                                    <Skeleton className="h-4 w-full mb-1" />
                                    <Skeleton className="h-4 w-2/3" />
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : filteredPosts.length === 0 ? (
                    <Card>
                        <CardContent className="py-12 text-center">
                            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-700">No articles found</h3>
                            <p className="text-gray-500 mt-2">Try a different search term</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredPosts.map(post => (
                            <Link key={post._id} href={`/blog/${post.slug}`}>
                                <Card className="overflow-hidden h-full hover:shadow-lg transition-shadow group">
                                    <div className="h-48 relative bg-gray-200">
                                        <Image
                                            src={post.coverImage}
                                            alt={post.title}
                                            fill
                                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                        <Badge className="absolute top-3 left-3 bg-yellow-400 text-black">
                                            {post.category}
                                        </Badge>
                                    </div>
                                    <CardContent className="p-6">
                                        <h2 className="font-bold text-lg text-gray-900 mb-2 line-clamp-2 group-hover:text-yellow-600 transition-colors">
                                            {post.title}
                                        </h2>
                                        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                                            {post.excerpt}
                                        </p>
                                        <div className="flex items-center justify-between text-xs text-gray-500">
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                {formatDate(post.createdAt)}
                                            </span>
                                            <span>{post.readTime} min read</span>
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {pagination.pages > 1 && (
                    <div className="flex items-center justify-center gap-4 mt-8">
                        <Button
                            variant="outline"
                            disabled={pagination.page === 1}
                            onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                        >
                            <ChevronLeft className="w-4 h-4 mr-1" /> Previous
                        </Button>
                        <span className="text-sm text-gray-600">
                            Page {pagination.page} of {pagination.pages}
                        </span>
                        <Button
                            variant="outline"
                            disabled={pagination.page === pagination.pages}
                            onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                        >
                            Next <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                    </div>
                )}
            </div>
        </div>
    )
}
