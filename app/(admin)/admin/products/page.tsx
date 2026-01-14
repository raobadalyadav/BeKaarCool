"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Package, Plus, Search, Filter, MoreHorizontal, Edit, Trash2, Eye, Star,
  TrendingUp, ChevronDown, AlertTriangle, X, Upload, ArrowUpDown
} from "lucide-react"
import { getStatusColor } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { ImageUpload } from "@/components/admin/ImageUpload"

interface Product {
  _id: string
  name: string
  description: string
  price: number
  originalPrice?: number
  images: string[]
  category: string
  tags: string[]
  stock: number
  sold: number
  rating: number
  featured: boolean
  isActive: boolean
  variations?: {
    sizes: string[]
    colors: { name: string; code: string }[]
  }
  seller: {
    _id: string
    name: string
    email: string
  }
  createdAt: string
  updatedAt: string
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [stockFilter, setStockFilter] = useState("all")
  const [priceRange, setPriceRange] = useState({ min: "", max: "" })
  const [sortBy, setSortBy] = useState("createdAt")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")

  // Selection state for bulk actions
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [selectAll, setSelectAll] = useState(false)

  // Dialog states
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false)
  const [productToDelete, setProductToDelete] = useState<Product | null>(null)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: 0,
    originalPrice: 0,
    category: "",
    tags: "",
    stock: 0,
    images: [] as string[],
    featured: false,
    isActive: true,
    sizes: [] as string[],
    colors: [] as { name: string; code: string }[],
  })

  const { toast } = useToast()

  const categories = ["T-Shirts", "Hoodies", "Accessories", "Mugs", "Bags", "Stickers"]
  const availableSizes = ["XS", "S", "M", "L", "XL", "XXL", "3XL"]
  const availableColors = [
    { name: "Black", code: "#000000" },
    { name: "White", code: "#FFFFFF" },
    { name: "Navy", code: "#1e3a8a" },
    { name: "Red", code: "#dc2626" },
    { name: "Green", code: "#16a34a" },
    { name: "Yellow", code: "#eab308" },
  ]

  useEffect(() => {
    fetchProducts()
  }, [categoryFilter, statusFilter, stockFilter])

  useEffect(() => {
    if (selectAll) {
      setSelectedProducts(filteredProducts.map(p => p._id))
    } else if (selectedProducts.length === filteredProducts.length && filteredProducts.length > 0) {
      // All were selected, user unchecked selectAll
    }
  }, [selectAll])

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (categoryFilter !== "all") params.append("category", categoryFilter)
      if (statusFilter !== "all") params.append("status", statusFilter)

      const response = await fetch(`/api/admin/products?${params}`)
      const data = await response.json()

      if (response.ok) {
        setProducts(Array.isArray(data) ? data : data.products || [])
      } else {
        throw new Error(data.message || "Failed to fetch products")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch products",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateProduct = async () => {
    try {
      const response = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          tags: formData.tags.split(",").map((tag) => tag.trim()),
          variations: {
            sizes: formData.sizes,
            colors: formData.colors,
          },
        }),
      })

      if (response.ok) {
        await fetchProducts()
        setShowCreateDialog(false)
        resetForm()
        toast({ title: "Success", description: "Product created successfully" })
      } else {
        const error = await response.json()
        throw new Error(error.message || "Failed to create product")
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    }
  }

  const handleUpdateProduct = async () => {
    if (!editingProduct) return

    try {
      const response = await fetch(`/api/admin/products/${editingProduct._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          tags: formData.tags.split(",").map((tag) => tag.trim()),
          variations: {
            sizes: formData.sizes,
            colors: formData.colors,
          },
        }),
      })

      if (response.ok) {
        await fetchProducts()
        setEditingProduct(null)
        setShowCreateDialog(false)
        resetForm()
        toast({ title: "Success", description: "Product updated successfully" })
      } else {
        const error = await response.json()
        throw new Error(error.message || "Failed to update product")
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    }
  }

  const handleDeleteProduct = async () => {
    if (!productToDelete) return

    try {
      const response = await fetch(`/api/admin/products/${productToDelete._id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        await fetchProducts()
        setShowDeleteDialog(false)
        setProductToDelete(null)
        toast({ title: "Success", description: "Product deleted successfully" })
      } else {
        throw new Error("Failed to delete product")
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    }
  }

  const handleBulkDelete = async () => {
    try {
      const promises = selectedProducts.map(id =>
        fetch(`/api/admin/products/${id}`, { method: "DELETE" })
      )
      await Promise.all(promises)
      await fetchProducts()
      setSelectedProducts([])
      setSelectAll(false)
      setShowBulkDeleteDialog(false)
      toast({ title: "Success", description: `${selectedProducts.length} products deleted` })
    } catch (error: any) {
      toast({ title: "Error", description: "Failed to delete products", variant: "destructive" })
    }
  }

  const handleBulkToggleStatus = async (isActive: boolean) => {
    try {
      const promises = selectedProducts.map(id =>
        fetch(`/api/admin/products/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isActive }),
        })
      )
      await Promise.all(promises)
      await fetchProducts()
      setSelectedProducts([])
      setSelectAll(false)
      toast({
        title: "Success",
        description: `${selectedProducts.length} products ${isActive ? "activated" : "deactivated"}`
      })
    } catch (error: any) {
      toast({ title: "Error", description: "Failed to update products", variant: "destructive" })
    }
  }

  const handleToggleStatus = async (product: Product) => {
    try {
      const response = await fetch(`/api/admin/products/${product._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !product.isActive }),
      })

      if (response.ok) {
        await fetchProducts()
        toast({
          title: "Success",
          description: `Product ${!product.isActive ? "activated" : "deactivated"} successfully`,
        })
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    }
  }

  const toggleProductSelection = (productId: string) => {
    setSelectedProducts(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    )
  }

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price: 0,
      originalPrice: 0,
      category: "",
      tags: "",
      stock: 0,
      images: [],
      featured: false,
      isActive: true,
      sizes: [],
      colors: [],
    })
    setEditingProduct(null)
  }

  const openEditDialog = (product: Product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price,
      originalPrice: product.originalPrice || 0,
      category: product.category,
      tags: product.tags.join(", "),
      stock: product.stock,
      images: product.images,
      featured: product.featured,
      isActive: product.isActive,
      sizes: product.variations?.sizes || [],
      colors: product.variations?.colors || [],
    })
    setShowCreateDialog(true)
  }

  const confirmDelete = (product: Product) => {
    setProductToDelete(product)
    setShowDeleteDialog(true)
  }

  // Filtering and sorting
  let filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStock = stockFilter === "all" ||
      (stockFilter === "low" && product.stock <= 10 && product.stock > 0) ||
      (stockFilter === "out" && product.stock === 0) ||
      (stockFilter === "in" && product.stock > 10)
    const matchesPrice =
      (!priceRange.min || product.price >= Number(priceRange.min)) &&
      (!priceRange.max || product.price <= Number(priceRange.max))
    return matchesSearch && matchesStock && matchesPrice
  })

  // Sort products
  filteredProducts = [...filteredProducts].sort((a, b) => {
    let comparison = 0
    switch (sortBy) {
      case "name": comparison = a.name.localeCompare(b.name); break
      case "price": comparison = a.price - b.price; break
      case "stock": comparison = a.stock - b.stock; break
      case "sold": comparison = a.sold - b.sold; break
      case "rating": comparison = a.rating - b.rating; break
      default: comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    }
    return sortOrder === "asc" ? comparison : -comparison
  })

  const activeProducts = products.filter((p) => p.isActive).length
  const featuredProducts = products.filter((p) => p.featured).length
  const lowStockProducts = products.filter((p) => p.stock <= 10 && p.stock > 0).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-600">Manage your product catalog</p>
        </div>
        <div className="flex gap-2">
          {selectedProducts.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  Bulk Actions ({selectedProducts.length})
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handleBulkToggleStatus(true)}>
                  Activate Selected
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleBulkToggleStatus(false)}>
                  Deactivate Selected
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setShowBulkDeleteDialog(true)}
                  className="text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Selected
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="mr-2 h-4 w-4" />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingProduct ? "Edit Product" : "Add New Product"}</DialogTitle>
              </DialogHeader>
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="basic">Basic Info</TabsTrigger>
                  <TabsTrigger value="images">Images</TabsTrigger>
                  <TabsTrigger value="pricing">Pricing & Stock</TabsTrigger>
                  <TabsTrigger value="variants">Variants</TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-4 mt-4">
                  <div>
                    <Label htmlFor="name">Product Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Premium T-Shirt"
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Category *</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData({ ...formData, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>{category}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Product description..."
                      rows={4}
                    />
                  </div>
                  <div>
                    <Label htmlFor="tags">Tags (comma separated)</Label>
                    <Input
                      id="tags"
                      value={formData.tags}
                      onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                      placeholder="cotton, premium, comfortable"
                    />
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="featured"
                        checked={formData.featured}
                        onCheckedChange={(checked) => setFormData({ ...formData, featured: checked })}
                      />
                      <Label htmlFor="featured">Featured Product</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="isActive"
                        checked={formData.isActive}
                        onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                      />
                      <Label htmlFor="isActive">Active</Label>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="images" className="space-y-4 mt-4">
                  <ImageUpload
                    images={formData.images}
                    onChange={(images) => setFormData({ ...formData, images })}
                    maxImages={8}
                    folder="products"
                  />
                </TabsContent>

                <TabsContent value="pricing" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="price">Selling Price (₹) *</Label>
                      <Input
                        id="price"
                        type="number"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                        placeholder="599"
                      />
                    </div>
                    <div>
                      <Label htmlFor="originalPrice">Original Price (₹)</Label>
                      <Input
                        id="originalPrice"
                        type="number"
                        value={formData.originalPrice}
                        onChange={(e) => setFormData({ ...formData, originalPrice: Number(e.target.value) })}
                        placeholder="799"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="stock">Stock Quantity *</Label>
                    <Input
                      id="stock"
                      type="number"
                      value={formData.stock}
                      onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                      placeholder="100"
                    />
                  </div>
                  {formData.originalPrice > formData.price && formData.price > 0 && (
                    <div className="p-3 bg-green-50 rounded-lg">
                      <p className="text-green-700 font-medium">
                        Discount: {Math.round(((formData.originalPrice - formData.price) / formData.originalPrice) * 100)}% off
                      </p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="variants" className="space-y-4 mt-4">
                  <div>
                    <Label>Available Sizes</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {availableSizes.map((size) => (
                        <Button
                          key={size}
                          type="button"
                          variant={formData.sizes.includes(size) ? "default" : "outline"}
                          size="sm"
                          onClick={() => {
                            setFormData({
                              ...formData,
                              sizes: formData.sizes.includes(size)
                                ? formData.sizes.filter(s => s !== size)
                                : [...formData.sizes, size]
                            })
                          }}
                        >
                          {size}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label>Available Colors</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {availableColors.map((color) => (
                        <Button
                          key={color.code}
                          type="button"
                          variant={formData.colors.some(c => c.code === color.code) ? "default" : "outline"}
                          size="sm"
                          onClick={() => {
                            setFormData({
                              ...formData,
                              colors: formData.colors.some(c => c.code === color.code)
                                ? formData.colors.filter(c => c.code !== color.code)
                                : [...formData.colors, color]
                            })
                          }}
                          className="flex items-center gap-2"
                        >
                          <span
                            className="w-4 h-4 rounded-full border"
                            style={{ backgroundColor: color.code }}
                          />
                          {color.name}
                        </Button>
                      ))}
                    </div>
                  </div>
                  {(formData.sizes.length > 0 || formData.colors.length > 0) && (
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-blue-700 text-sm">
                        {formData.sizes.length} sizes and {formData.colors.length} colors selected
                      </p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>

              <DialogFooter className="mt-6">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={editingProduct ? handleUpdateProduct : handleCreateProduct}>
                  {editingProduct ? "Update" : "Create"} Product
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Products</p>
                <p className="text-2xl font-bold">{products.length}</p>
              </div>
              <Package className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Products</p>
                <p className="text-2xl font-bold">{activeProducts}</p>
              </div>
              <Package className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-yellow-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Low Stock</p>
                <p className="text-2xl font-bold">{lowStockProducts}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Featured</p>
                <p className="text-2xl font-bold">{featuredProducts}</p>
              </div>
              <Star className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search products..."
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
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={stockFilter} onValueChange={setStockFilter}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Stock" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stock</SelectItem>
                <SelectItem value="in">In Stock</SelectItem>
                <SelectItem value="low">Low Stock</SelectItem>
                <SelectItem value="out">Out of Stock</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Input
                placeholder="Min ₹"
                className="w-24"
                type="number"
                value={priceRange.min}
                onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
              />
              <Input
                placeholder="Max ₹"
                className="w-24"
                type="number"
                value={priceRange.max}
                onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectAll}
                    onCheckedChange={(checked) => {
                      setSelectAll(!!checked)
                      if (checked) {
                        setSelectedProducts(filteredProducts.map(p => p._id))
                      } else {
                        setSelectedProducts([])
                      }
                    }}
                  />
                </TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="cursor-pointer" onClick={() => {
                  setSortBy("price")
                  setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                }}>
                  <div className="flex items-center gap-1">
                    Price <ArrowUpDown className="h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => {
                  setSortBy("stock")
                  setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                }}>
                  <div className="flex items-center gap-1">
                    Stock <ArrowUpDown className="h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead>Sold</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={9}>
                      <div className="h-12 bg-gray-200 rounded animate-pulse"></div>
                    </TableCell>
                  </TableRow>
                ))
              ) : filteredProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No products found</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredProducts.map((product) => (
                  <TableRow key={product._id} className={selectedProducts.includes(product._id) ? "bg-blue-50" : ""}>
                    <TableCell>
                      <Checkbox
                        checked={selectedProducts.includes(product._id)}
                        onCheckedChange={() => toggleProductSelection(product._id)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-md flex items-center justify-center overflow-hidden">
                          {product.images.length > 0 ? (
                            <img
                              src={product.images[0] || "/placeholder.svg"}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Package className="h-5 w-5 text-gray-400" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-gray-500">{product.seller?.name}</p>
                          {product.featured && (
                            <Badge variant="secondary" className="mt-1">
                              <Star className="h-3 w-3 mr-1" />Featured
                            </Badge>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{product.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">₹{product.price}</p>
                        {product.originalPrice && product.originalPrice > product.price && (
                          <p className="text-sm text-gray-500 line-through">₹{product.originalPrice}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={
                        product.stock === 0 ? "text-red-600 font-medium" :
                          product.stock <= 10 ? "text-yellow-600 font-medium" : ""
                      }>
                        {product.stock}
                      </span>
                    </TableCell>
                    <TableCell>{product.sold}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Star className="h-4 w-4 text-yellow-400 fill-current" />
                        <span>{product.rating.toFixed(1)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={product.isActive}
                          onCheckedChange={() => handleToggleStatus(product)}
                        />
                        <Badge className={getStatusColor(product.isActive ? "active" : "inactive")}>
                          {product.isActive ? "Active" : "Inactive"}
                        </Badge>
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
                          <DropdownMenuItem>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEditDialog(product)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => confirmDelete(product)} className="text-red-600">
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{productToDelete?.name}</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteProduct} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedProducts.length} Products</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedProducts.length} selected products? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete} className="bg-red-600 hover:bg-red-700">
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
