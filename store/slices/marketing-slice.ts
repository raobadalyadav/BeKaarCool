import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit"

interface Coupon {
  _id: string
  code: string
  description: string
  discountType: "percentage" | "fixed"
  discountValue: number
  maxDiscountAmount?: number
  minOrderAmount: number
  usageLimit?: number
  usedCount: number
  validFrom: string
  validTo: string
  isActive: boolean
  applicableCategories: string[]
  applicableProducts: string[]
}

interface Campaign {
  _id: string
  name: string
  type: "email" | "sms" | "push" | "banner"
  status: "draft" | "scheduled" | "active" | "paused" | "completed"
  subject?: string
  content: string
  targetAudience: {
    type: "all" | "segment" | "custom"
    criteria?: any
  }
  scheduledAt?: string
  sentAt?: string
  metrics: {
    sent: number
    delivered: number
    opened: number
    clicked: number
    converted: number
    revenue: number
  }
  createdAt: string
  updatedAt: string
}

interface Newsletter {
  _id: string
  email: string
  isActive: boolean
  preferences: {
    promotions: boolean
    newProducts: boolean
    orderUpdates: boolean
  }
  subscribedAt: string
}

interface AffiliateProgram {
  _id: string
  user: {
    _id: string
    name: string
    email: string
  }
  affiliateCode: string
  commissionRate: number
  totalEarnings: number
  pendingEarnings: number
  paidEarnings: number
  totalReferrals: number
  activeReferrals: number
  isActive: boolean
  joinedAt: string
}

interface MarketingState {
  coupons: Coupon[]
  campaigns: Campaign[]
  newsletters: Newsletter[]
  affiliates: AffiliateProgram[]
  loading: boolean
  error: string | null
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
  stats: {
    totalCoupons: number
    activeCoupons: number
    totalCampaigns: number
    activeCampaigns: number
    newsletterSubscribers: number
    totalAffiliates: number
    activeAffiliates: number
  }
}

const initialState: MarketingState = {
  coupons: [],
  campaigns: [],
  newsletters: [],
  affiliates: [],
  loading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  },
  stats: {
    totalCoupons: 0,
    activeCoupons: 0,
    totalCampaigns: 0,
    activeCampaigns: 0,
    newsletterSubscribers: 0,
    totalAffiliates: 0,
    activeAffiliates: 0,
  },
}

// Async thunks
export const fetchCoupons = createAsyncThunk("marketing/fetchCoupons", async (_, { rejectWithValue }) => {
  try {
    const response = await fetch("/api/marketing/coupons")
    if (!response.ok) throw new Error("Failed to fetch coupons")
    return await response.json()
  } catch (error: any) {
    return rejectWithValue(error.message)
  }
})

export const createCoupon = createAsyncThunk("marketing/createCoupon", async (couponData: Partial<Coupon>) => {
  const response = await fetch("/api/marketing/coupons", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(couponData),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || "Failed to create coupon")
  }

  return response.json()
})

export const updateCoupon = createAsyncThunk(
  "marketing/updateCoupon",
  async ({ id, data }: { id: string; data: Partial<Coupon> }) => {
    const response = await fetch(`/api/marketing/coupons/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      throw new Error("Failed to update coupon")
    }

    return response.json()
  },
)

export const deleteCoupon = createAsyncThunk("marketing/deleteCoupon", async (id: string) => {
  const response = await fetch(`/api/marketing/coupons/${id}`, {
    method: "DELETE",
  })

  if (!response.ok) {
    throw new Error("Failed to delete coupon")
  }

  return { id }
})

export const fetchCampaigns = createAsyncThunk(
  "marketing/fetchCampaigns",
  async (params: { page?: number; limit?: number; type?: string; status?: string }) => {
    const searchParams = new URLSearchParams({
      page: (params.page || 1).toString(),
      limit: (params.limit || 10).toString(),
    })

    if (params.type && params.type !== "all") {
      searchParams.append("type", params.type)
    }
    if (params.status && params.status !== "all") {
      searchParams.append("status", params.status)
    }

    const response = await fetch(`/api/marketing/campaigns?${searchParams}`)
    if (!response.ok) {
      throw new Error("Failed to fetch campaigns")
    }
    return response.json()
  },
)

export const createCampaign = createAsyncThunk("marketing/createCampaign", async (campaignData: Partial<Campaign>) => {
  const response = await fetch("/api/marketing/campaigns", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(campaignData),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || "Failed to create campaign")
  }

  return response.json()
})

export const fetchNewsletterSubscribers = createAsyncThunk(
  "marketing/fetchNewsletterSubscribers",
  async (params: { page?: number; limit?: number }) => {
    const searchParams = new URLSearchParams({
      page: (params.page || 1).toString(),
      limit: (params.limit || 10).toString(),
    })

    const response = await fetch(`/api/marketing/newsletter?${searchParams}`)
    if (!response.ok) {
      throw new Error("Failed to fetch newsletter subscribers")
    }
    return response.json()
  },
)

export const fetchAffiliates = createAsyncThunk(
  "marketing/fetchAffiliates",
  async (params: { page?: number; limit?: number; status?: string }) => {
    const searchParams = new URLSearchParams({
      page: (params.page || 1).toString(),
      limit: (params.limit || 10).toString(),
    })

    if (params.status && params.status !== "all") {
      searchParams.append("status", params.status)
    }

    const response = await fetch(`/api/marketing/affiliates?${searchParams}`)
    if (!response.ok) {
      throw new Error("Failed to fetch affiliates")
    }
    return response.json()
  },
)

export const fetchMarketingStats = createAsyncThunk("marketing/fetchStats", async () => {
  const response = await fetch("/api/marketing/stats")
  if (!response.ok) {
    throw new Error("Failed to fetch marketing stats")
  }
  return response.json()
})

export const applyCoupon = createAsyncThunk("marketing/applyCoupon", async (code: string, { rejectWithValue }) => {
  try {
    const response = await fetch("/api/cart/coupon", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    })
    if (!response.ok) throw new Error("Invalid coupon code")
    return await response.json()
  } catch (error: any) {
    return rejectWithValue(error.message)
  }
})

const marketingSlice = createSlice({
  name: "marketing",
  initialState,
  reducers: {
    setPagination: (state, action: PayloadAction<Partial<MarketingState["pagination"]>>) => {
      state.pagination = { ...state.pagination, ...action.payload }
    },
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch coupons
      .addCase(fetchCoupons.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchCoupons.fulfilled, (state, action) => {
        state.loading = false
        state.coupons = action.payload.coupons || action.payload
        if (action.payload.pagination) {
          state.pagination = action.payload.pagination
        }
      })
      .addCase(fetchCoupons.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      // Create coupon
      .addCase(createCoupon.fulfilled, (state, action) => {
        state.coupons.unshift(action.payload)
      })
      // Update coupon
      .addCase(updateCoupon.fulfilled, (state, action) => {
        const index = state.coupons.findIndex((coupon) => coupon._id === action.payload._id)
        if (index !== -1) {
          state.coupons[index] = action.payload
        }
      })
      // Delete coupon
      .addCase(deleteCoupon.fulfilled, (state, action) => {
        state.coupons = state.coupons.filter((coupon) => coupon._id !== action.payload.id)
      })
      // Fetch campaigns
      .addCase(fetchCampaigns.fulfilled, (state, action) => {
        state.campaigns = action.payload.campaigns || action.payload
      })
      // Create campaign
      .addCase(createCampaign.fulfilled, (state, action) => {
        state.campaigns.unshift(action.payload)
      })
      // Fetch newsletter subscribers
      .addCase(fetchNewsletterSubscribers.fulfilled, (state, action) => {
        state.newsletters = action.payload.subscribers || action.payload
      })
      // Fetch affiliates
      .addCase(fetchAffiliates.fulfilled, (state, action) => {
        state.affiliates = action.payload.affiliates || action.payload
      })
      // Fetch stats
      .addCase(fetchMarketingStats.fulfilled, (state, action) => {
        state.stats = action.payload
      })
      // Apply coupon
      .addCase(applyCoupon.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(applyCoupon.fulfilled, (state, action) => {
        state.loading = false
      })
      .addCase(applyCoupon.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
  },
})

export const { setPagination, clearError } = marketingSlice.actions
export default marketingSlice.reducer
