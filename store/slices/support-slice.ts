import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit"

export interface SupportTicket {
  _id: string
  ticketNumber: string
  userId: string
  subject: string
  description: string
  status: "open" | "in-progress" | "resolved" | "closed"
  priority: "low" | "medium" | "high" | "urgent"
  category: string
  assignedTo?: string
  messages: Array<{
    sender: string
    message: string
    timestamp: string
    isAdmin: boolean
  }>
  createdAt: string
  updatedAt: string
}

interface FAQ {
  _id: string
  question: string
  answer: string
  category: string
  isPublished: boolean
  views: number
  helpful: number
  notHelpful: number
  createdAt: string
  updatedAt: string
}

interface ChatSession {
  _id: string
  user: {
    _id: string
    name: string
    email: string
  }
  agent?: {
    _id: string
    name: string
  }
  status: "waiting" | "active" | "ended"
  messages: Array<{
    _id: string
    sender: {
      _id: string
      name: string
      role: string
    }
    message: string
    type: "text" | "image" | "file"
    createdAt: string
  }>
  startedAt: string
  endedAt?: string
}

interface SupportState {
  tickets: SupportTicket[]
  currentTicket: SupportTicket | null
  faqs: FAQ[]
  chatSessions: ChatSession[]
  currentChatSession: ChatSession | null
  loading: boolean
  error: string | null
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
  filters: {
    status: string
    priority: string
    category: string
    assignedTo: string
  }
  stats: {
    totalTickets: number
    openTickets: number
    resolvedTickets: number
    averageResponseTime: number
    customerSatisfaction: number
  }
}

const initialState: SupportState = {
  tickets: [],
  currentTicket: null,
  faqs: [],
  chatSessions: [],
  currentChatSession: null,
  loading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  },
  filters: {
    status: "all",
    priority: "all",
    category: "all",
    assignedTo: "all",
  },
  stats: {
    totalTickets: 0,
    openTickets: 0,
    resolvedTickets: 0,
    averageResponseTime: 0,
    customerSatisfaction: 0,
  },
}

// Async thunks
export const fetchSupportTickets = createAsyncThunk(
  "support/fetchTickets",
  async (params: {
    page?: number
    limit?: number
    status?: string
    priority?: string
    category?: string
    assignedTo?: string
  }) => {
    const searchParams = new URLSearchParams({
      page: (params.page || 1).toString(),
      limit: (params.limit || 10).toString(),
    })

    if (params.status && params.status !== "all") {
      searchParams.append("status", params.status)
    }
    if (params.priority && params.priority !== "all") {
      searchParams.append("priority", params.priority)
    }
    if (params.category && params.category !== "all") {
      searchParams.append("category", params.category)
    }
    if (params.assignedTo && params.assignedTo !== "all") {
      searchParams.append("assignedTo", params.assignedTo)
    }

    const response = await fetch(`/api/support/tickets?${searchParams}`)
    if (!response.ok) {
      throw new Error("Failed to fetch support tickets")
    }
    return response.json()
  },
)

export const fetchTicketById = createAsyncThunk("support/fetchTicketById", async (ticketId: string) => {
  const response = await fetch(`/api/support/tickets/${ticketId}`)
  if (!response.ok) {
    throw new Error("Failed to fetch ticket")
  }
  return response.json()
})

export const createSupportTicket = createAsyncThunk(
  "support/createTicket",
  async (ticketData: {
    subject: string
    description: string
    category: string
    priority: string
    attachments?: string[]
  }) => {
    const response = await fetch("/api/support/tickets", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(ticketData),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || "Failed to create support ticket")
    }

    return response.json()
  },
)

export const updateTicketStatus = createAsyncThunk(
  "support/updateTicketStatus",
  async ({ ticketId, status, assignedTo }: { ticketId: string; status: string; assignedTo?: string }) => {
    const response = await fetch(`/api/support/tickets/${ticketId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status, assignedTo }),
    })

    if (!response.ok) {
      throw new Error("Failed to update ticket status")
    }

    return response.json()
  },
)

export const addTicketMessage = createAsyncThunk(
  "support/addTicketMessage",
  async ({ ticketId, message, attachments }: { ticketId: string; message: string; attachments?: string[] }) => {
    const response = await fetch(`/api/support/tickets/${ticketId}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message, attachments }),
    })

    if (!response.ok) {
      throw new Error("Failed to add message")
    }

    return response.json()
  },
)

export const fetchFAQs = createAsyncThunk(
  "support/fetchFAQs",
  async (params: { category?: string; published?: boolean }) => {
    const searchParams = new URLSearchParams()

    if (params.category && params.category !== "all") {
      searchParams.append("category", params.category)
    }
    if (params.published !== undefined) {
      searchParams.append("published", params.published.toString())
    }

    const response = await fetch(`/api/support/faqs?${searchParams}`)
    if (!response.ok) {
      throw new Error("Failed to fetch FAQs")
    }
    return response.json()
  },
)

export const createFAQ = createAsyncThunk(
  "support/createFAQ",
  async (faqData: { question: string; answer: string; category: string; isPublished: boolean }) => {
    const response = await fetch("/api/support/faqs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(faqData),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || "Failed to create FAQ")
    }

    return response.json()
  },
)

export const fetchChatSessions = createAsyncThunk(
  "support/fetchChatSessions",
  async (params: { status?: string; page?: number; limit?: number }) => {
    const searchParams = new URLSearchParams({
      page: (params.page || 1).toString(),
      limit: (params.limit || 10).toString(),
    })

    if (params.status && params.status !== "all") {
      searchParams.append("status", params.status)
    }

    const response = await fetch(`/api/support/chat/sessions?${searchParams}`)
    if (!response.ok) {
      throw new Error("Failed to fetch chat sessions")
    }
    return response.json()
  },
)

export const startChatSession = createAsyncThunk("support/startChatSession", async () => {
  const response = await fetch("/api/support/chat/start", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  })

  if (!response.ok) {
    throw new Error("Failed to start chat session")
  }

  return response.json()
})

export const sendChatMessage = createAsyncThunk(
  "support/sendChatMessage",
  async ({ sessionId, message, type }: { sessionId: string; message: string; type: string }) => {
    const response = await fetch(`/api/support/chat/${sessionId}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message, type }),
    })

    if (!response.ok) {
      throw new Error("Failed to send message")
    }

    return response.json()
  },
)

export const fetchSupportStats = createAsyncThunk("support/fetchStats", async () => {
  const response = await fetch("/api/support/stats")
  if (!response.ok) {
    throw new Error("Failed to fetch support stats")
  }
  return response.json()
})

const supportSlice = createSlice({
  name: "support",
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<Partial<SupportState["filters"]>>) => {
      state.filters = { ...state.filters, ...action.payload }
    },
    setPagination: (state, action: PayloadAction<Partial<SupportState["pagination"]>>) => {
      state.pagination = { ...state.pagination, ...action.payload }
    },
    clearCurrentTicket: (state) => {
      state.currentTicket = null
    },
    clearCurrentChatSession: (state) => {
      state.currentChatSession = null
    },
    clearError: (state) => {
      state.error = null
    },
    setCurrentTicket: (state, action) => {
      state.currentTicket = action.payload
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch tickets
      .addCase(fetchSupportTickets.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchSupportTickets.fulfilled, (state, action) => {
        state.loading = false
        state.tickets = action.payload.tickets || action.payload
        if (action.payload.pagination) {
          state.pagination = action.payload.pagination
        }
      })
      .addCase(fetchSupportTickets.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || "Failed to fetch support tickets"
      })
      // Fetch ticket by ID
      .addCase(fetchTicketById.fulfilled, (state, action) => {
        state.currentTicket = action.payload
      })
      // Create ticket
      .addCase(createSupportTicket.fulfilled, (state, action) => {
        state.tickets.unshift(action.payload)
        state.currentTicket = action.payload
      })
      // Update ticket status
      .addCase(updateTicketStatus.fulfilled, (state, action) => {
        const index = state.tickets.findIndex((ticket) => ticket._id === action.payload._id)
        if (index !== -1) {
          state.tickets[index] = action.payload
        }
        if (state.currentTicket?._id === action.payload._id) {
          state.currentTicket = action.payload
        }
      })
      // Add ticket message
      .addCase(addTicketMessage.fulfilled, (state, action) => {
        if (state.currentTicket?._id === action.payload._id) {
          state.currentTicket = action.payload
        }
      })
      // Fetch FAQs
      .addCase(fetchFAQs.fulfilled, (state, action) => {
        state.faqs = action.payload
      })
      // Create FAQ
      .addCase(createFAQ.fulfilled, (state, action) => {
        state.faqs.unshift(action.payload)
      })
      // Fetch chat sessions
      .addCase(fetchChatSessions.fulfilled, (state, action) => {
        state.chatSessions = action.payload.sessions || action.payload
      })
      // Start chat session
      .addCase(startChatSession.fulfilled, (state, action) => {
        state.currentChatSession = action.payload
      })
      // Send chat message
      .addCase(sendChatMessage.fulfilled, (state, action) => {
        if (state.currentChatSession?._id === action.payload._id) {
          state.currentChatSession = action.payload
        }
      })
      // Fetch stats
      .addCase(fetchSupportStats.fulfilled, (state, action) => {
        state.stats = action.payload
      })
  },
})

export const { setFilters, setPagination, clearCurrentTicket, clearCurrentChatSession, clearError, setCurrentTicket } =
  supportSlice.actions
export default supportSlice.reducer
