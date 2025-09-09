import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"

interface Product {
  id: string
  name: string
  description: string
  price: number
  originalPrice?: number
  images: string[]
  videos?: string[]
  category: string
  tags: string[]
  variations: {
    sizes: string[]
    colors: string[]
    priceModifiers?: { [key: string]: number }
  }
  stock: number
  sold: number
  rating: number
  reviews: number
  featured: boolean
  isActive: boolean
  seller: {
    id: string
    name: string
    avatar?: string
  }
  seo: {
    title: string
    description: string
    keywords: string[]
  }
  customizable: boolean
  qrCode?: string
}

interface ProductState {
  products: Product[]
  currentProduct: Product | null
  categories: string[]
  loading: boolean
  error: string | null
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
  filters: {
    category: string
    search: string
    minPrice: number
    maxPrice: number
    sort: string
  }
}

const initialState: ProductState = {
  products: [],
  currentProduct: null,
  categories: [],
  loading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 12,
    total: 0,
    pages: 0,
  },
  filters: {
    category: "all",
    search: "",
    minPrice: 0,
    maxPrice: 10000,
    sort: "newest",
  },
}

export const fetchProducts = createAsyncThunk(
  "products/fetchProducts",
  async (params: {
    page?: number
    limit?: number
    category?: string
    search?: string
    minPrice?: number
    maxPrice?: number
    sort?: string
  }) => {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) searchParams.append(key, value.toString())
    })

    const response = await fetch(`/api/products?${searchParams}`)
    if (!response.ok) throw new Error("Failed to fetch products")
    return response.json()
  },
)

export const fetchProduct = createAsyncThunk("products/fetchProduct", async (id: string) => {
  const response = await fetch(`/api/products/${id}`)
  if (!response.ok) throw new Error("Failed to fetch product")
  return response.json()
})

export const createProduct = createAsyncThunk("products/createProduct", async (productData: any) => {
  const response = await fetch("/api/products", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(productData),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || "Failed to create product")
  }
  return response.json()
})

export const updateProduct = createAsyncThunk(
  "products/updateProduct",
  async ({ id, data }: { id: string; data: any }) => {
    const response = await fetch(`/api/products/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (!response.ok) throw new Error("Failed to update product")
    return response.json()
  },
)

export const deleteProduct = createAsyncThunk("products/deleteProduct", async (id: string) => {
  const response = await fetch(`/api/products/${id}`, {
    method: "DELETE",
  })
  if (!response.ok) throw new Error("Failed to delete product")
  return { id }
})

export const fetchCategories = createAsyncThunk("products/fetchCategories", async () => {
  const response = await fetch("/api/products/categories")
  if (!response.ok) throw new Error("Failed to fetch categories")
  return response.json()
})

const productSlice = createSlice({
  name: "products",
  initialState,
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload }
    },
    clearCurrentProduct: (state) => {
      state.currentProduct = null
    },
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false
        state.products = action.payload.products
        state.pagination = action.payload.pagination
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || "Failed to fetch products"
      })
      .addCase(fetchProduct.fulfilled, (state, action) => {
        state.currentProduct = action.payload
      })
      .addCase(createProduct.fulfilled, (state, action) => {
        state.products.unshift(action.payload)
      })
      .addCase(updateProduct.fulfilled, (state, action) => {
        const index = state.products.findIndex((p) => p.id === action.payload.id)
        if (index !== -1) {
          state.products[index] = action.payload
        }
        if (state.currentProduct?.id === action.payload.id) {
          state.currentProduct = action.payload
        }
      })
      .addCase(deleteProduct.fulfilled, (state, action) => {
        state.products = state.products.filter((p) => p.id !== action.payload.id)
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.categories = action.payload
      })
  },
})

export const { setFilters, clearCurrentProduct, clearError } = productSlice.actions
export default productSlice.reducer
