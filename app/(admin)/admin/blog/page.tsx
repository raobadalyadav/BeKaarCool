"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import {
    FileText, Plus, Search, MoreHorizontal, Edit, Trash2,
    Clock, TrendingUp, Send, Save, ExternalLink, Globe,
    ArrowLeft, Eye, Loader2
} from "lucide-react"
import { formatDate, getStatusColor } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { RichTextEditor } from "@/components/admin/RichTextEditor"
import { ImageUpload } from "@/components/admin/ImageUpload"

interface BlogPost {
    _id: string
    title: string
    slug: string
    excerpt: string
    content: string
    coverImage: string
    category: string
    authorName: string
    readTime: number
    tags: string[]
    status: "draft" | "published" | "archived"
    isPublished: boolean
    views: number
    likes: number
    seo?: {
        metaTitle?: string
        metaDescription?: string
        focusKeyword?: string
        canonicalUrl?: string
        ogImage?: string
        noIndex?: boolean
    }
    publishedAt?: string
    createdAt: string
    updatedAt: string
}

const CATEGORIES = ["Fashion", "Style Guide", "Trends", "Sustainability", "Tips", "News"]

export default function AdminBlogPage() {
    const [posts, setPosts] = useState<BlogPost[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [categoryFilter, setCategoryFilter] = useState("all")
    const [statusFilter, setStatusFilter] = useState("all")

    const [showEditor, setShowEditor] = useState(false)
    const [editingPost, setEditingPost] = useState<BlogPost | null>(null)
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)
    const [postToDelete, setPostToDelete] = useState<BlogPost | null>(null)
    const [saving, setSaving] = useState(false)
    const [activeTab, setActiveTab] = useState("content")

    const [formData, setFormData] = useState({
        title: "",
        slug: "",
        excerpt: "",
        content: "",
        coverImage: "",
        category: "Fashion",
        tags: "",
        status: "draft" as "draft" | "published" | "archived",
        featured: false,
        // SEO Fields
        seo: {
            metaTitle: "",
            metaDescription: "",
            focusKeyword: "",
            canonicalUrl: "",
            ogImage: "",
            noIndex: false,
        }
    })

    const { toast } = useToast()

    useEffect(() => {
        fetchPosts()
    }, [categoryFilter, statusFilter])

    const fetchPosts = async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams()
            if (categoryFilter !== "all") params.append("category", categoryFilter)
            if (statusFilter !== "all") params.append("status", statusFilter)

            const response = await fetch(`/api/admin/blog?${params}`)
            const data = await response.json()

            if (response.ok) {
                setPosts(Array.isArray(data) ? data : data.posts || [])
            } else {
                throw new Error(data.message || "Failed to fetch posts")
            }
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" })
        } finally {
            setLoading(false)
        }
    }

    const generateSlug = (title: string) => {
        return title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "")
    }

    const handleSavePost = async (publish = false) => {
        if (!formData.title || !formData.content) {
            toast({ title: "Error", description: "Title and content are required", variant: "destructive" })
            return
        }

        if (!formData.excerpt) {
            toast({ title: "Error", description: "Excerpt is required for SEO", variant: "destructive" })
            return
        }

        setSaving(true)
        try {
            const postData = {
                ...formData,
                slug: formData.slug || generateSlug(formData.title),
                tags: formData.tags.split(",").map(t => t.trim()).filter(Boolean),
                status: publish ? "published" : formData.status,
                seo: {
                    ...formData.seo,
                    metaTitle: formData.seo.metaTitle || formData.title,
                    metaDescription: formData.seo.metaDescription || formData.excerpt,
                    ogImage: formData.seo.ogImage || formData.coverImage,
                }
            }

            const url = editingPost
                ? `/api/admin/blog/${editingPost._id}`
                : "/api/admin/blog"

            const response = await fetch(url, {
                method: editingPost ? "PUT" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(postData),
            })

            if (response.ok) {
                await fetchPosts()
                resetForm()
                setShowEditor(false)
                toast({
                    title: "Success",
                    description: publish ? "Post published successfully" : "Post saved successfully"
                })
            } else {
                const error = await response.json()
                throw new Error(error.message || "Failed to save post")
            }
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" })
        } finally {
            setSaving(false)
        }
    }

    const handleDeletePost = async () => {
        if (!postToDelete) return

        try {
            const response = await fetch(`/api/admin/blog/${postToDelete._id}`, {
                method: "DELETE",
            })

            if (response.ok) {
                await fetchPosts()
                setShowDeleteDialog(false)
                setPostToDelete(null)
                toast({ title: "Success", description: "Post deleted successfully" })
            } else {
                throw new Error("Failed to delete post")
            }
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" })
        }
    }

    const resetForm = () => {
        setFormData({
            title: "",
            slug: "",
            excerpt: "",
            content: "",
            coverImage: "",
            category: "Fashion",
            tags: "",
            status: "draft",
            featured: false,
            seo: {
                metaTitle: "",
                metaDescription: "",
                focusKeyword: "",
                canonicalUrl: "",
                ogImage: "",
                noIndex: false,
            }
        })
        setEditingPost(null)
        setActiveTab("content")
    }

    const openEditor = (post?: BlogPost) => {
        if (post) {
            setEditingPost(post)
            setFormData({
                title: post.title,
                slug: post.slug,
                excerpt: post.excerpt,
                content: post.content,
                coverImage: post.coverImage,
                category: post.category,
                tags: post.tags.join(", "),
                status: post.status,
                featured: false,
                seo: {
                    metaTitle: post.seo?.metaTitle || "",
                    metaDescription: post.seo?.metaDescription || "",
                    focusKeyword: post.seo?.focusKeyword || "",
                    canonicalUrl: post.seo?.canonicalUrl || "",
                    ogImage: post.seo?.ogImage || "",
                    noIndex: post.seo?.noIndex || false,
                }
            })
        } else {
            resetForm()
        }
        setShowEditor(true)
    }

    const filteredPosts = posts.filter(post =>
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.excerpt.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const publishedCount = posts.filter(p => p.status === "published").length
    const draftCount = posts.filter(p => p.status === "draft").length
    const totalViews = posts.reduce((sum, p) => sum + p.views, 0)

    // SEO Score Calculation
    const calculateSeoScore = () => {
        let score = 0
        const checks = []

        // Title checks
        if (formData.title.length > 0) score += 10
        if (formData.title.length >= 30 && formData.title.length <= 60) {
            score += 15
            checks.push({ pass: true, text: "Title length is optimal (30-60 chars)" })
        } else if (formData.title.length > 0) {
            checks.push({ pass: false, text: `Title length: ${formData.title.length} chars (aim for 30-60)` })
        }

        // Meta description
        const metaDesc = formData.seo.metaDescription || formData.excerpt
        if (metaDesc.length >= 120 && metaDesc.length <= 160) {
            score += 15
            checks.push({ pass: true, text: "Meta description length is optimal" })
        } else if (metaDesc.length > 0) {
            score += 5
            checks.push({ pass: false, text: `Meta description: ${metaDesc.length} chars (aim for 120-160)` })
        }

        // Focus keyword
        if (formData.seo.focusKeyword) {
            score += 10
            const keyword = formData.seo.focusKeyword.toLowerCase()
            if (formData.title.toLowerCase().includes(keyword)) {
                score += 10
                checks.push({ pass: true, text: "Focus keyword in title" })
            } else {
                checks.push({ pass: false, text: "Add focus keyword to title" })
            }
            if (formData.excerpt.toLowerCase().includes(keyword)) {
                score += 10
                checks.push({ pass: true, text: "Focus keyword in excerpt" })
            }
        } else {
            checks.push({ pass: false, text: "Set a focus keyword" })
        }

        // Cover image & OG image
        if (formData.coverImage) {
            score += 10
            checks.push({ pass: true, text: "Cover image set" })
        } else {
            checks.push({ pass: false, text: "Add a cover image" })
        }

        // Content length
        const wordCount = formData.content.split(/\s+/).filter(Boolean).length
        if (wordCount >= 300) {
            score += 20
            checks.push({ pass: true, text: `Content length: ${wordCount} words (good!)` })
        } else if (wordCount > 0) {
            score += 5
            checks.push({ pass: false, text: `Content: ${wordCount} words (aim for 300+)` })
        }

        return { score: Math.min(100, score), checks }
    }

    const seoAnalysis = showEditor ? calculateSeoScore() : { score: 0, checks: [] }

    // Editor View
    if (showEditor) {
        return (
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="sm" onClick={() => setShowEditor(false)}>
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">
                                {editingPost ? "Edit Post" : "New Post"}
                            </h1>
                            <p className="text-sm text-gray-500">
                                {editingPost ? `Editing: ${editingPost.title}` : "Create a new blog post"}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => handleSavePost(false)} disabled={saving}>
                            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            Save Draft
                        </Button>
                        <Button onClick={() => handleSavePost(true)} disabled={saving}>
                            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                            {formData.status === "published" ? "Update" : "Publish"}
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Main Editor - 3 columns */}
                    <div className="lg:col-span-3 space-y-4">
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                            <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="content">Content</TabsTrigger>
                                <TabsTrigger value="media">Media</TabsTrigger>
                                <TabsTrigger value="seo" className="flex items-center gap-2">
                                    <Globe className="h-4 w-4" />
                                    SEO
                                    <Badge variant={seoAnalysis.score >= 70 ? "default" : "destructive"} className="ml-1">
                                        {seoAnalysis.score}%
                                    </Badge>
                                </TabsTrigger>
                            </TabsList>

                            {/* Content Tab */}
                            <TabsContent value="content" className="space-y-4 mt-4">
                                <Card>
                                    <CardContent className="p-4 space-y-4">
                                        <div>
                                            <Label htmlFor="title">Title *</Label>
                                            <Input
                                                id="title"
                                                value={formData.title}
                                                onChange={(e) => {
                                                    setFormData({
                                                        ...formData,
                                                        title: e.target.value,
                                                        slug: formData.slug || generateSlug(e.target.value)
                                                    })
                                                }}
                                                placeholder="Enter post title..."
                                                className="text-lg font-semibold"
                                            />
                                            <p className="text-xs text-gray-500 mt-1">
                                                {formData.title.length} characters
                                                {formData.title.length > 60 && " (consider shortening)"}
                                            </p>
                                        </div>
                                        <div>
                                            <Label htmlFor="slug">URL Slug</Label>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm text-gray-500">/blog/</span>
                                                <Input
                                                    id="slug"
                                                    value={formData.slug}
                                                    onChange={(e) => setFormData({ ...formData, slug: generateSlug(e.target.value) })}
                                                    placeholder="post-url-slug"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <Label htmlFor="excerpt">Excerpt * (used as meta description)</Label>
                                            <Textarea
                                                id="excerpt"
                                                value={formData.excerpt}
                                                onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                                                placeholder="Brief description of the post..."
                                                rows={3}
                                            />
                                            <p className="text-xs text-gray-500 mt-1">
                                                {formData.excerpt.length}/160 characters
                                                {formData.excerpt.length > 160 && " (too long)"}
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="py-3">
                                        <CardTitle className="text-base">Content</CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        <RichTextEditor
                                            content={formData.content}
                                            onChange={(content) => setFormData({ ...formData, content })}
                                            placeholder="Start writing your blog post..."
                                        />
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* Media Tab */}
                            <TabsContent value="media" className="space-y-4 mt-4">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Cover Image</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <ImageUpload
                                            images={formData.coverImage ? [formData.coverImage] : []}
                                            onChange={(images) => setFormData({ ...formData, coverImage: images[0] || "" })}
                                            maxImages={1}
                                            folder="banners"
                                        />
                                        <p className="text-xs text-gray-500 mt-2">
                                            Recommended: 1200x630px for optimal social sharing
                                        </p>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* SEO Tab */}
                            <TabsContent value="seo" className="space-y-4 mt-4">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center justify-between">
                                            SEO Settings
                                            <Badge variant={seoAnalysis.score >= 70 ? "default" : seoAnalysis.score >= 40 ? "secondary" : "destructive"}>
                                                Score: {seoAnalysis.score}%
                                            </Badge>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div>
                                            <Label>Focus Keyword</Label>
                                            <Input
                                                value={formData.seo.focusKeyword}
                                                onChange={(e) => setFormData({
                                                    ...formData,
                                                    seo: { ...formData.seo, focusKeyword: e.target.value }
                                                })}
                                                placeholder="e.g., summer fashion trends"
                                            />
                                            <p className="text-xs text-gray-500 mt-1">
                                                The main keyword you want this post to rank for
                                            </p>
                                        </div>
                                        <div>
                                            <Label>Meta Title</Label>
                                            <Input
                                                value={formData.seo.metaTitle}
                                                onChange={(e) => setFormData({
                                                    ...formData,
                                                    seo: { ...formData.seo, metaTitle: e.target.value }
                                                })}
                                                placeholder={formData.title || "Leave empty to use post title"}
                                            />
                                            <p className="text-xs text-gray-500 mt-1">
                                                {(formData.seo.metaTitle || formData.title).length}/60 characters
                                            </p>
                                        </div>
                                        <div>
                                            <Label>Meta Description</Label>
                                            <Textarea
                                                value={formData.seo.metaDescription}
                                                onChange={(e) => setFormData({
                                                    ...formData,
                                                    seo: { ...formData.seo, metaDescription: e.target.value }
                                                })}
                                                placeholder={formData.excerpt || "Leave empty to use excerpt"}
                                                rows={3}
                                            />
                                            <p className="text-xs text-gray-500 mt-1">
                                                {(formData.seo.metaDescription || formData.excerpt).length}/160 characters
                                            </p>
                                        </div>
                                        <div>
                                            <Label>Canonical URL (optional)</Label>
                                            <Input
                                                value={formData.seo.canonicalUrl}
                                                onChange={(e) => setFormData({
                                                    ...formData,
                                                    seo: { ...formData.seo, canonicalUrl: e.target.value }
                                                })}
                                                placeholder="https://example.com/original-post"
                                            />
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Switch
                                                id="noIndex"
                                                checked={formData.seo.noIndex}
                                                onCheckedChange={(checked) => setFormData({
                                                    ...formData,
                                                    seo: { ...formData.seo, noIndex: checked }
                                                })}
                                            />
                                            <Label htmlFor="noIndex">No Index (hide from search engines)</Label>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* SEO Analysis */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle>SEO Analysis</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-2">
                                            {seoAnalysis.checks.map((check, i) => (
                                                <div key={i} className={`flex items-center gap-2 text-sm ${check.pass ? "text-green-600" : "text-amber-600"}`}>
                                                    <div className={`w-2 h-2 rounded-full ${check.pass ? "bg-green-500" : "bg-amber-500"}`} />
                                                    {check.text}
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Preview */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Google Preview</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="p-4 bg-white rounded border">
                                            <p className="text-blue-800 text-lg hover:underline cursor-pointer truncate">
                                                {formData.seo.metaTitle || formData.title || "Post Title"}
                                            </p>
                                            <p className="text-green-700 text-sm truncate">
                                                bekaarcool.com/blog/{formData.slug || "post-slug"}
                                            </p>
                                            <p className="text-gray-600 text-sm mt-1 line-clamp-2">
                                                {formData.seo.metaDescription || formData.excerpt || "Post description will appear here..."}
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    </div>

                    {/* Sidebar - 1 column */}
                    <div className="space-y-4">
                        <Card>
                            <CardHeader className="py-3">
                                <CardTitle className="text-base">Settings</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <Label>Status</Label>
                                    <Select
                                        value={formData.status}
                                        onValueChange={(value: "draft" | "published" | "archived") =>
                                            setFormData({ ...formData, status: value })
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="draft">Draft</SelectItem>
                                            <SelectItem value="published">Published</SelectItem>
                                            <SelectItem value="archived">Archived</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label>Category</Label>
                                    <Select
                                        value={formData.category}
                                        onValueChange={(value) => setFormData({ ...formData, category: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {CATEGORIES.map((cat) => (
                                                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label>Tags</Label>
                                    <Input
                                        value={formData.tags}
                                        onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                                        placeholder="fashion, style, tips"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Comma separated</p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Quick Stats for existing posts */}
                        {editingPost && (
                            <Card>
                                <CardHeader className="py-3">
                                    <CardTitle className="text-base">Stats</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Views</span>
                                        <span className="font-medium">{editingPost.views.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Likes</span>
                                        <span className="font-medium">{editingPost.likes}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Read Time</span>
                                        <span className="font-medium">{editingPost.readTime} min</span>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        )
    }

    // List View
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Blog Posts</h1>
                    <p className="text-gray-600">Manage your blog content with SEO optimization</p>
                </div>
                <Button onClick={() => openEditor()}>
                    <Plus className="mr-2 h-4 w-4" />
                    New Post
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="border-l-4 border-l-blue-500">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Posts</p>
                                <p className="text-2xl font-bold">{posts.length}</p>
                            </div>
                            <FileText className="h-8 w-8 text-blue-600" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-green-500">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Published</p>
                                <p className="text-2xl font-bold">{publishedCount}</p>
                            </div>
                            <Send className="h-8 w-8 text-green-600" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-yellow-500">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Drafts</p>
                                <p className="text-2xl font-bold">{draftCount}</p>
                            </div>
                            <Save className="h-8 w-8 text-yellow-600" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-purple-500">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Views</p>
                                <p className="text-2xl font-bold">{totalViews.toLocaleString()}</p>
                            </div>
                            <TrendingUp className="h-8 w-8 text-purple-600" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Search posts..."
                                    className="pl-10"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>
                        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                            <SelectTrigger className="w-40">
                                <SelectValue placeholder="Category" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Categories</SelectItem>
                                {CATEGORIES.map((cat) => (
                                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-32">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="draft">Draft</SelectItem>
                                <SelectItem value="published">Published</SelectItem>
                                <SelectItem value="archived">Archived</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Posts Table */}
            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Post</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Views</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell colSpan={6}>
                                            <div className="h-16 bg-gray-200 rounded animate-pulse"></div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : filteredPosts.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8">
                                        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                        <p className="text-gray-500">No posts found</p>
                                        <Button variant="outline" className="mt-4" onClick={() => openEditor()}>
                                            Create your first post
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredPosts.map((post) => (
                                    <TableRow key={post._id}>
                                        <TableCell>
                                            <div className="flex items-center space-x-3">
                                                <div className="w-16 h-12 bg-gray-200 rounded overflow-hidden flex-shrink-0">
                                                    {post.coverImage && (
                                                        <img
                                                            src={post.coverImage}
                                                            alt={post.title}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-medium truncate">{post.title}</p>
                                                    <p className="text-sm text-gray-500 truncate max-w-[300px]">{post.excerpt}</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <Clock className="h-3 w-3 text-gray-400" />
                                                        <span className="text-xs text-gray-500">{post.readTime} min read</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{post.category}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={
                                                post.status === "published" ? "bg-green-100 text-green-800" :
                                                    post.status === "draft" ? "bg-yellow-100 text-yellow-800" :
                                                        "bg-gray-100 text-gray-800"
                                            }>
                                                {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1">
                                                <Eye className="h-4 w-4 text-gray-400" />
                                                <span className="font-medium">{post.views.toLocaleString()}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-sm">
                                                <p>{formatDate(post.createdAt)}</p>
                                                {post.publishedAt && (
                                                    <p className="text-xs text-gray-500">
                                                        Published: {formatDate(post.publishedAt)}
                                                    </p>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="sm">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => openEditor(post)}>
                                                        <Edit className="mr-2 h-4 w-4" />
                                                        Edit
                                                    </DropdownMenuItem>
                                                    {post.status === "published" && (
                                                        <DropdownMenuItem asChild>
                                                            <a href={`/blog/${post.slug}`} target="_blank" rel="noopener noreferrer">
                                                                <ExternalLink className="mr-2 h-4 w-4" />
                                                                View Post
                                                            </a>
                                                        </DropdownMenuItem>
                                                    )}
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        onClick={() => {
                                                            setPostToDelete(post)
                                                            setShowDeleteDialog(true)
                                                        }}
                                                        className="text-red-600"
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Delete Dialog */}
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Post</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete "{postToDelete?.title}"? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeletePost} className="bg-red-600 hover:bg-red-700">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
