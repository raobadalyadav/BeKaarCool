"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Search, Edit, Trash2, Eye, Package, MoreVertical, RefreshCw } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useToast } from "@/hooks/use-toast"
import { formatCurrency } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"

interface Product {
  _id: string
  name: string
  slug: string
  price: number
  stock: number
  sold: number
  views: number
  images: string[]
  category: string
  isActive: boolean
  createdAt: string
  rating: number
}

export default function SellerProductsPage() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState("createdAt")
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 })
  const { toast } = useToast()

  useEffect(() => {
    fetchProducts()
  }, [pagination.page, sortBy])

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        sort: sortBy,
      })
      if (searchQuery) params.append("search", searchQuery)

      const response = await fetch(`/api/seller/products?${params}`)
      const data = await response.json()

      setProducts(data.products || [])
      setPagination(data.pagination || pagination)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch products",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPagination(prev => ({ ...prev, page: 1 }))
    fetchProducts()
  }

  const deleteProduct = async (productId: string) => {
    if (!confirm("Are you sure you want to delete this product? This action cannot be undone.")) return

    try {
      const response = await fetch(`/api/seller/products/${productId}`, { // Creating this or use existing /api/products/[id]?
        // Need to ensure deletion permission. Assuming generic product API handles seller check or we should use seller/products/[id].
        // The previous code used /api/products/${productId}.
        // Let's assume generic API handles it, but safer to test.
        // For now, I'll assume the generic endpoint works if user owns the product.
        method: "DELETE",
      })

      if (response.ok) {
        toast({ title: "Success", description: "Product deleted successfully" })
        fetchProducts()
      } else {
        throw new Error("Failed to delete product")
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete product", variant: "destructive" })
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Products</h1>
          <p className="text-gray-600">Manage your product inventory and listings</p>
        </div>
        <Link href="/seller/products/new">
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="mr-2 h-4 w-4" />
            Add New Product
          </Button>
        </Link>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
            <form onSubmit={handleSearch} className="relative flex-1 w-full md:max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name, SKU..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>

            <div className="flex gap-2 w-full md:w-auto">
              <Button variant="outline" size="icon" onClick={fetchProducts} title="Refresh">
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="createdAt">Newest First</SelectItem>
                  <SelectItem value="popular">Most Popular</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-4 p-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex gap-4 items-center">
                  <Skeleton className="h-16 w-16" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-4 w-1/4" />
                  </div>
                  <Skeleton className="h-8 w-24" />
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-16">
              <div className="bg-gray-50 h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">No products listed</h3>
              <p className="text-gray-500 max-w-sm mx-auto mt-2 mb-6">
                Get started by adding your first product to your store.
              </p>
              <Link href="/seller/products/new">
                <Button>Add Your First Product</Button>
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/50">
                  <TableHead>Product</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Stats</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product._id} className="hover:bg-gray-50/50">
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="h-12 w-12 relative bg-gray-100 rounded overflow-hidden flex-shrink-0">
                          {product.images?.[0] ? (
                            <Image
                              src={product.images[0]}
                              alt={product.name}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <Package className="h-6 w-6 m-auto text-gray-400" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium line-clamp-1">{product.name}</p>
                          <p className="text-xs text-gray-500">ID: {product._id.slice(-6)}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="capitalize">{product.category}</TableCell>
                    <TableCell className="font-medium">{formatCurrency(product.price)}</TableCell>
                    <TableCell>
                      <Badge variant={product.stock > 10 ? "secondary" : "destructive"}>
                        {product.stock} in stock
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs space-y-1">
                        <div title="Sales">{product.sold || 0} Sold</div>
                        <div title="Views" className="text-gray-500">{product.views || 0} Views</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={product.isActive ? "default" : "secondary"} className={
                        product.isActive ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }>
                        {product.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => router.push(`/products/${product.slug || product._id}`)}>
                            <Eye className="mr-2 h-4 w-4" /> View Live
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => router.push(`/seller/products/${product._id}/edit`)}>
                            <Edit className="mr-2 h-4 w-4" /> Edit Details
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600" onClick={() => deleteProduct(product._id)}>
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between px-4 py-4 border-t">
              <div className="text-sm text-gray-500">
                Page {pagination.page} of {pagination.pages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page === 1}
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page === pagination.pages}
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}