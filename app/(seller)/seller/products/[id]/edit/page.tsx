"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Upload, X, Plus, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

const categories = ["clothing", "accessories", "home-decor", "electronics"]
const sizes = ["XS", "S", "M", "L", "XL", "XXL"]
const colors = ["White", "Black", "Red", "Blue", "Green"]

export default function EditProductPage() {
    const router = useRouter()
    const params = useParams()
    const { toast } = useToast()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    const [formData, setFormData] = useState({
        name: "",
        description: "",
        price: "",
        originalPrice: "",
        category: "",
        stock: "",
        tags: [] as string[],
        variations: { sizes: [] as string[], colors: [] as string[] },
        customizable: false,
        featured: false,
        seoTitle: "",
        seoDescription: "",
        seoKeywords: [] as string[]
    })

    const [newTag, setNewTag] = useState("")

    useEffect(() => {
        if (params.id) fetchProduct()
    }, [params.id])

    const fetchProduct = async () => {
        try {
            const res = await fetch(`/api/seller/products/${params.id}`)
            if (!res.ok) throw new Error("Failed to load")
            const data = await res.json()
            const p = data.product

            setFormData({
                name: p.name,
                description: p.description,
                price: p.price,
                originalPrice: p.originalPrice || "",
                category: p.category,
                stock: p.stock,
                tags: p.tags || [],
                variations: p.variations || { sizes: [], colors: [] },
                customizable: p.customizable || false,
                featured: p.featured || false,
                seoTitle: p.seo?.title || "",
                seoDescription: p.seo?.description || "",
                seoKeywords: p.seo?.keywords || []
            })
        } catch (error) {
            toast({ title: "Error", description: "Product not found", variant: "destructive" })
            router.push("/seller/products")
        } finally {
            setLoading(false)
        }
    }

    const handleInputChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    const addTag = () => {
        if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
            setFormData(prev => ({ ...prev, tags: [...prev.tags, newTag.trim()] }))
            setNewTag("")
        }
    }

    const removeTag = (tagToRemove: string) => {
        setFormData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tagToRemove) }))
    }

    const toggleVariation = (type: "sizes" | "colors", value: string) => {
        setFormData(prev => ({
            ...prev,
            variations: {
                ...prev.variations,
                [type]: prev.variations[type].includes(value)
                    ? prev.variations[type].filter(v => v !== value)
                    : [...prev.variations[type], value]
            }
        }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!formData.name || !formData.description || !formData.price || !formData.category) {
            toast({
                title: "Error",
                description: "Please fill in all required fields",
                variant: "destructive"
            })
            return
        }

        setSaving(true)
        try {
            const response = await fetch(`/api/seller/products/${params.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...formData,
                    price: parseFloat(formData.price),
                    originalPrice: formData.originalPrice ? parseFloat(formData.originalPrice) : undefined,
                    stock: parseInt(formData.stock)
                })
            })

            if (response.ok) {
                toast({ title: "Success", description: "Product updated successfully" })
                router.push("/seller/products")
            } else {
                throw new Error("Failed to update product")
            }
        } catch (error) {
            toast({ title: "Error", description: "Failed to update product", variant: "destructive" })
        } finally {
            setSaving(false)
        }
    }

    if (loading) return <div className="p-8 text-center text-gray-500">Loading product details...</div>

    return (
        <div className="space-y-6">
            <div className="flex items-center space-x-4">
                <Button variant="ghost" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                </Button>
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Edit Product</h1>
                    <p className="text-gray-600">Update product details</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Product Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label htmlFor="name">Product Name *</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => handleInputChange("name", e.target.value)}
                                    placeholder="Enter product name"
                                    required
                                />
                            </div>

                            <div>
                                <Label htmlFor="description">Description *</Label>
                                <Textarea
                                    id="description"
                                    value={formData.description}
                                    onChange={(e) => handleInputChange("description", e.target.value)}
                                    placeholder="Describe your product"
                                    rows={4}
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="price">Price (₹) *</Label>
                                    <Input
                                        id="price"
                                        type="number"
                                        value={formData.price}
                                        onChange={(e) => handleInputChange("price", e.target.value)}
                                        required
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="originalPrice">Original Price (₹)</Label>
                                    <Input
                                        id="originalPrice"
                                        type="number"
                                        value={formData.originalPrice}
                                        onChange={(e) => handleInputChange("originalPrice", e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="category">Category *</Label>
                                    <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {categories.map(category => (
                                                <SelectItem key={category} value={category}>
                                                    {category.charAt(0).toUpperCase() + category.slice(1).replace("-", " ")}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label htmlFor="stock">Stock *</Label>
                                    <Input
                                        id="stock"
                                        type="number"
                                        value={formData.stock}
                                        onChange={(e) => handleInputChange("stock", e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <Label>Tags</Label>
                                <div className="flex space-x-2 mb-2">
                                    <Input
                                        value={newTag}
                                        onChange={(e) => setNewTag(e.target.value)}
                                        placeholder="Add tag"
                                        onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                                    />
                                    <Button type="button" onClick={addTag}>
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {formData.tags?.map(tag => (
                                        <Badge key={tag} variant="secondary" className="pr-1">
                                            {tag}
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="h-3 w-3 p-0 ml-1 hover:bg-transparent text-gray-500 hover:text-red-500"
                                                onClick={() => removeTag(tag)}
                                            >
                                                <X className="h-3 w-3" />
                                            </Button>
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Variations</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label>Sizes</Label>
                                <div className="grid grid-cols-3 gap-2 mt-2">
                                    {sizes.map(size => (
                                        <div key={size} className="flex items-center space-x-2">
                                            <Checkbox
                                                checked={formData.variations?.sizes?.includes(size)}
                                                onCheckedChange={() => toggleVariation("sizes", size)}
                                            />
                                            <Label className="text-sm">{size}</Label>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <Label>Colors</Label>
                                <div className="grid grid-cols-3 gap-2 mt-2">
                                    {colors.map(color => (
                                        <div key={color} className="flex items-center space-x-2">
                                            <Checkbox
                                                checked={formData.variations?.colors?.includes(color)}
                                                onCheckedChange={() => toggleVariation("colors", color)}
                                            />
                                            <Label className="text-sm">{color}</Label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Settings</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    checked={formData.customizable}
                                    onCheckedChange={(checked) => handleInputChange("customizable", checked)}
                                />
                                <Label>Allow Customization</Label>
                            </div>

                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    checked={formData.featured}
                                    onCheckedChange={(checked) => handleInputChange("featured", checked)}
                                />
                                <Label>Featured Product</Label>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="space-y-3">
                                <Button type="submit" className="w-full" disabled={saving}>
                                    {saving ? "Saving..." : "Save Changes"}
                                </Button>
                                <Button type="button" variant="outline" className="w-full" onClick={() => router.back()}>
                                    Cancel
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </form>
        </div>
    )
}
