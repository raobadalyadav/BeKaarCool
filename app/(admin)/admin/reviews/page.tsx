"use client"

import { useEffect, useState } from "react"
import { Search, RefreshCw, Star, Trash2, CheckCircle, XCircle } from "lucide-react"
import * as adminApi from "@/lib/api/admin"

type Review = {
  id: string
  productId: string
  productTitle: string
  rating: number
  title?: string
  body?: string
  verifiedPurchase: boolean
  status: string
  helpfulCount: number
  notHelpfulCount: number
  createdAt?: string
  reviewerName?: string
}

const STATUS_COLORS: Record<string, string> = {
  approved: "bg-green-100 text-green-700",
  pending: "bg-yellow-100 text-yellow-700",
  rejected: "bg-red-100 text-red-600",
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [acting, setActing] = useState<string | null>(null)

  const fetchReviews = async () => {
    setLoading(true)
    try {
      const result = await adminApi.adminListReviews({ first: 200 })
      setReviews(result)
    } catch (e: any) { alert(e.message) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchReviews() }, [])

  const handleModerate = async (review: Review, status: "approved" | "rejected") => {
    setActing(review.id)
    try {
      await adminApi.adminModerateReview(review.id, status)
      setReviews((prev) => prev.map((r) => r.id === review.id ? { ...r, status } : r))
    } catch (e: any) { alert(e.message) }
    finally { setActing(null) }
  }

  const handleDelete = async (review: Review) => {
    if (!confirm(`Delete this review by ${review.reviewerName || "unknown"}?`)) return
    setActing(review.id)
    try {
      await adminApi.adminDeleteReview(review.id)
      setReviews((prev) => prev.filter((r) => r.id !== review.id))
    } catch (e: any) { alert(e.message) }
    finally { setActing(null) }
  }

  const filtered = reviews.filter((r) => {
    const matchSearch = !search ||
      r.productTitle.toLowerCase().includes(search.toLowerCase()) ||
      (r.reviewerName ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (r.body ?? "").toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === "all" || r.status === statusFilter
    return matchSearch && matchStatus
  })

  const formatDate = (iso?: string) =>
    iso ? new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"

  const renderStars = (rating: number) => (
    <div className="flex">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={`w-3.5 h-3.5 ${i <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />
      ))}
    </div>
  )

  const counts = {
    all: reviews.length,
    pending: reviews.filter((r) => r.status === "pending").length,
    approved: reviews.filter((r) => r.status === "approved").length,
    rejected: reviews.filter((r) => r.status === "rejected").length,
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reviews</h1>
          <p className="text-gray-500 text-sm">
            {counts.all} total · {counts.pending} pending moderation
          </p>
        </div>
        <button onClick={fetchReviews} className="flex items-center gap-2 border px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-1 mb-4">
        {(["all", "pending", "approved", "rejected"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === s
                ? "bg-yellow-400 text-black"
                : "bg-white border text-gray-600 hover:bg-gray-50"
            }`}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)} ({counts[s] ?? 0})
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm mb-6 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by product, reviewer, or review text..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No reviews found</div>
        ) : (
          <div className="divide-y">
            {filtered.map((review) => (
              <div key={review.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      {renderStars(review.rating)}
                      <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${STATUS_COLORS[review.status] ?? "bg-gray-100 text-gray-600"}`}>
                        {review.status}
                      </span>
                      {review.verifiedPurchase && (
                        <span className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-medium">
                          Verified
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mb-1">
                      <span className="font-medium text-gray-700">{review.reviewerName || "Anonymous"}</span>
                      {" · "}
                      <span className="text-blue-600 hover:underline cursor-pointer">{review.productTitle}</span>
                      {" · "}{formatDate(review.createdAt)}
                    </p>
                    {review.title && (
                      <p className="text-sm font-medium text-gray-900 mb-0.5">{review.title}</p>
                    )}
                    {review.body && (
                      <p className="text-sm text-gray-600 line-clamp-3">{review.body}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      Helpful: {review.helpfulCount} · Not helpful: {review.notHelpfulCount}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1.5 flex-shrink-0">
                    {review.status === "pending" && (
                      <>
                        <button
                          onClick={() => handleModerate(review, "approved")}
                          disabled={acting === review.id}
                          className="flex items-center gap-1 text-xs px-2.5 py-1 bg-green-50 border border-green-200 text-green-700 rounded hover:bg-green-100 disabled:opacity-50"
                        >
                          <CheckCircle className="w-3.5 h-3.5" /> Approve
                        </button>
                        <button
                          onClick={() => handleModerate(review, "rejected")}
                          disabled={acting === review.id}
                          className="flex items-center gap-1 text-xs px-2.5 py-1 bg-red-50 border border-red-200 text-red-600 rounded hover:bg-red-100 disabled:opacity-50"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Reject
                        </button>
                      </>
                    )}
                    {review.status === "approved" && (
                      <button
                        onClick={() => handleModerate(review, "rejected")}
                        disabled={acting === review.id}
                        className="flex items-center gap-1 text-xs px-2.5 py-1 border text-gray-500 rounded hover:bg-gray-100 disabled:opacity-50"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Reject
                      </button>
                    )}
                    {review.status === "rejected" && (
                      <button
                        onClick={() => handleModerate(review, "approved")}
                        disabled={acting === review.id}
                        className="flex items-center gap-1 text-xs px-2.5 py-1 border text-gray-500 rounded hover:bg-gray-100 disabled:opacity-50"
                      >
                        <CheckCircle className="w-3.5 h-3.5" /> Approve
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(review)}
                      disabled={acting === review.id}
                      className="flex items-center gap-1 text-xs px-2.5 py-1 text-red-400 hover:text-red-600 rounded hover:bg-red-50 disabled:opacity-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
