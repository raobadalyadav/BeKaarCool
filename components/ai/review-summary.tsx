"use client"

import { useEffect, useState } from "react"
import { Sparkles } from "lucide-react"
import { aiReviewSummary } from "@/lib/api/ai"

export function ReviewSummary({ productId }: { productId: string }) {
  const [summary, setSummary] = useState<string | null>(null)

  useEffect(() => {
    if (!productId) return
    aiReviewSummary(productId).then((s) => setSummary(s)).catch(() => setSummary(""))
  }, [productId])

  if (summary === null) {
    return (
      <div className="h-8 bg-amber-50 border border-amber-100 rounded-full animate-pulse w-64 mb-4" />
    )
  }

  if (!summary) return null

  return (
    <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2 mb-4">
      <Sparkles className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
      <p className="text-xs text-amber-800 leading-relaxed">
        <span className="font-semibold">AI Summary: </span>{summary}
      </p>
    </div>
  )
}
