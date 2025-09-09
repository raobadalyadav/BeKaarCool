import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"

interface AnalyticsData {
  revenue: {
    total: number
    thisMonth: number
    lastMonth: number
    growth: number
  }
  orders: {
    total: number
    thisMonth: number
    pending: number
    completed: number
  }
  customers: {
    total: number
    new: number
    returning: number
  }
  products: {
    total: number
    lowStock: number
    outOfStock: number
  }
  topProducts: Array<{
    id: string
    name: string
    sales: number
    revenue: number
  }>
  salesChart: Array<{
    date: string
    sales: number
    revenue: number
  }>
}

interface AnalyticsState {
  data: AnalyticsData | null
  loading: boolean
  error: string | null
}

const initialState: AnalyticsState = {
  data: null,
  loading: false,
  error: null,
}

export const fetchAnalytics = createAsyncThunk("analytics/fetchAnalytics", async (_, { rejectWithValue }) => {
  try {
    const response = await fetch("/api/analytics/dashboard")
    if (!response.ok) throw new Error("Failed to fetch analytics")
    return await response.json()
  } catch (error: any) {
    return rejectWithValue(error.message)
  }
})

const analyticsSlice = createSlice({
  name: "analytics",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAnalytics.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchAnalytics.fulfilled, (state, action) => {
        state.loading = false
        state.data = action.payload
      })
      .addCase(fetchAnalytics.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
  },
})

export const { clearError } = analyticsSlice.actions
export default analyticsSlice.reducer
