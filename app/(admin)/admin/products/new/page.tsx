import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { ProductForm } from "../_components/product-form"

export default function NewProductPage() {
  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/products" className="text-gray-400 hover:text-gray-600">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Add Product</h1>
          <p className="text-gray-500 text-sm">Create a new product listing</p>
        </div>
      </div>
      <ProductForm />
    </div>
  )
}
