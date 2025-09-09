import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"

export interface InventoryItem {
  _id: string
  productId: string
  productName: string
  sku: string
  currentStock: number
  reservedStock: number
  availableStock: number
  reorderLevel: number
  maxStock: number
  location: string
  lastUpdated: string
}

interface InventoryState {
  items: InventoryItem[]
  stats: {
    totalProducts: number
    lowStockItems: number
    outOfStockItems: number
    totalValue: number
  }
  loading: boolean
  error: string | null
}

const initialState: InventoryState = {
  items: [],
  stats: {
    totalProducts: 0,
    lowStockItems: 0,
    outOfStockItems: 0,
    totalValue: 0,
  },
  loading: false,
  error: null,
}

export const fetchInventory = createAsyncThunk("inventory/fetchInventory", async (_, { rejectWithValue }) => {
  try {
    const response = await fetch("/api/inventory")
    if (!response.ok) throw new Error("Failed to fetch inventory")
    return await response.json()
  } catch (error: any) {
    return rejectWithValue(error.message)
  }
})

export const fetchInventoryStats = createAsyncThunk("inventory/fetchStats", async (_, { rejectWithValue }) => {
  try {
    const response = await fetch("/api/inventory/stats")
    if (!response.ok) throw new Error("Failed to fetch inventory stats")
    return await response.json()
  } catch (error: any) {
    return rejectWithValue(error.message)
  }
})

export const updateStock = createAsyncThunk(
  "inventory/updateStock",
  async (
    { productId, quantity, type }: { productId: string; quantity: number; type: "add" | "remove" },
    { rejectWithValue },
  ) => {
    try {
      const response = await fetch(`/api/inventory/${productId}/stock`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity, type }),
      })
      if (!response.ok) throw new Error("Failed to update stock")
      return await response.json()
    } catch (error: any) {
      return rejectWithValue(error.message)
    }
  },
)

const inventorySlice = createSlice({
  name: "inventory",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchInventory.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchInventory.fulfilled, (state, action) => {
        state.loading = false
        state.items = action.payload
      })
      .addCase(fetchInventory.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      .addCase(fetchInventoryStats.fulfilled, (state, action) => {
        state.stats = action.payload
      })
      .addCase(updateStock.fulfilled, (state, action) => {
        const index = state.items.findIndex((item) => item.productId === action.payload.productId)
        if (index !== -1) {
          state.items[index] = action.payload
        }
      })
  },
})

export const { clearError } = inventorySlice.actions
export default inventorySlice.reducer
