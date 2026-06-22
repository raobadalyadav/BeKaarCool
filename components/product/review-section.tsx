"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Star, ThumbsUp, User, ImageIcon, X } from "lucide-react"
import { useSession } from "next-auth/react"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"
import * as reviewsApi from "@/lib/api/reviews"
import { MediaUploader } from "@/components/ui/media-uploader"

interface ReviewSectionProps {
  productId: string
  reviews: any[]
}

const formatDate = (s?: string | null) => {
  if (!s) return "Recently"
  try { return new Date(s).toLocaleDateString() } catch { return "Recently" }
}

export function ReviewSection({ productId, reviews }: ReviewSectionProps) {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [rating, setRating] = useState(0)
  const [title, setTitle] = useState("")
  const [comment, setComment] = useState("")
  const [uploadedImages, setUploadedImages] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [localReviews, setLocalReviews] = useState<any[]>(reviews ?? [])
  const [votingOn, setVotingOn] = useState<Record<string, boolean>>({})

  const handleVote = async (reviewId: string) => {
    if (!session) {
      toast({ title: "Please login to vote", variant: "destructive" })
      return
    }
    setVotingOn(prev => ({ ...prev, [reviewId]: true }))
    try {
      await reviewsApi.voteReview(reviewId, true)
      setLocalReviews(prev => prev.map(r => r.id === reviewId || r._id === reviewId ? { ...r, helpfulCount: (r.helpfulCount || r.helpful || 0) + 1 } : r))
      toast({ title: "Thanks for your feedback!" })
    } catch (e: any) {
      toast({ title: "Failed to vote", description: e.message, variant: "destructive" })
    } finally {
      setVotingOn(prev => ({ ...prev, [reviewId]: false }))
    }
  }

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!session) {
      toast({
        title: "Please login to submit a review",
        variant: "destructive",
      })
      return
    }

    if (rating === 0 || !title.trim() || !comment.trim()) {
      toast({
        title: "Please fill all fields and select a rating",
        variant: "destructive",
      })
      return
    }

    setSubmitting(true)
    try {
      const created = await reviewsApi.createReview({
        productId,
        rating,
        title: title.trim(),
        body: comment.trim(),
        images: uploadedImages,
      })
      toast({
        title: "Review submitted",
        description:
          created.status === "approved"
            ? "Thanks for your feedback!"
            : "Thanks! It will appear once it passes review.",
      })
      if (created.status === "approved") {
        setLocalReviews((prev) => [
          {
            _id: created.id,
            rating: created.rating,
            title: created.title ?? "",
            comment: created.body ?? "",
            verified: created.verifiedPurchase,
            helpful: 0,
            images: created.images ?? [],
            createdAt: new Date().toISOString(),
            user: { name: session?.user?.name ?? "You" },
          },
          ...prev,
        ])
      }
      setRating(0)
      setTitle("")
      setComment("")
      setUploadedImages([])
    } catch (error) {
      toast({
        title: "Error submitting review",
        description: error instanceof Error ? error.message : "Please try again later",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const safeReviews = localReviews ?? []

  const averageRating =
    safeReviews.length > 0 ? safeReviews.reduce((sum, review) => sum + review.rating, 0) / safeReviews.length : 0

  const ratingDistribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: safeReviews.filter((review) => review.rating === star).length,
    percentage:
      safeReviews.length > 0 ? (safeReviews.filter((review) => review.rating === star).length / safeReviews.length) * 100 : 0,
  }))

  return (
    <div className="space-y-8">
      {/* Rating Summary */}
      <Card>
        <CardContent className="p-6">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-gray-900 mb-2">{averageRating.toFixed(1)}</div>
              <div className="flex items-center justify-center mb-2">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-5 w-5 ${
                      i < Math.floor(averageRating) ? "fill-brand-500 text-brand-500" : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
              <p className="text-gray-600">Based on {safeReviews.length} reviews</p>
            </div>

            <div className="space-y-2">
              {ratingDistribution.map(({ star, count, percentage }) => (
                <div key={star} className="flex items-center gap-2">
                  <span className="text-sm w-8">{star}★</span>
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-brand-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-600 w-8">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Write Review Form */}
      {session && (
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Write a Review</h3>
            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div>
                <Label>Rating</Label>
                <div className="flex items-center gap-1 mt-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button key={star} type="button" onClick={() => setRating(star)} className="p-1">
                      <Star
                        className={`h-6 w-6 transition-colors ${
                          star <= rating ? "fill-brand-500 text-brand-500" : "text-gray-300 hover:text-brand-500"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="review-title">Review Title</Label>
                <Input
                  id="review-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Summarize your review"
                  maxLength={100}
                />
              </div>

              <div>
                <Label htmlFor="review-comment">Your Review</Label>
                <Textarea
                  id="review-comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Tell others about your experience with this product"
                  rows={4}
                  maxLength={1000}
                />
              </div>

              <div>
                <Label>Customer Photos (optional)</Label>
                <div className="mt-2 space-y-4">
                  {uploadedImages.length > 0 && (
                    <div className="flex gap-2 flex-wrap">
                      {uploadedImages.map((url, i) => (
                        <div key={i} className="relative w-20 h-20 border rounded-md overflow-hidden group">
                          <Image src={url} alt={`Upload ${i}`} fill className="object-cover" />
                          <button 
                            type="button" 
                            onClick={() => setUploadedImages(prev => prev.filter((_, idx) => idx !== i))}
                            className="absolute top-1 right-1 bg-black/50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  {uploadedImages.length < 5 && (
                    <MediaUploader 
                      kind="image" 
                      maxFiles={1} 
                      onUploadComplete={(url) => setUploadedImages(prev => [...prev, url])} 
                    />
                  )}
                </div>
              </div>

              <Button type="submit" disabled={submitting}>
                {submitting ? "Submitting..." : "Submit Review"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Customer Reviews</h3>

        {safeReviews.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-gray-600">
              No reviews yet. Be the first to review this product!
            </CardContent>
          </Card>
        ) : (
          safeReviews.map((review) => (
            <Card key={review._id}>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                    {review.user?.avatar ? (
                      <Image
                        src={review.user.avatar || "/placeholder.svg"}
                        alt={review.user.name}
                        width={40}
                        height={40}
                        className="rounded-full"
                      />
                    ) : (
                      <User className="h-5 w-5 text-gray-500" />
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="font-medium">{review.user?.name || "Anonymous"}</span>
                      {review.verified && (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">Verified Purchase</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < review.rating ? "fill-brand-500 text-brand-500" : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-gray-600">{formatDate(review.createdAt)}</span>
                    </div>

                    {review.title && <h4 className="font-medium mb-2">{review.title}</h4>}
                    {review.comment && <p className="text-gray-700 mb-3 whitespace-pre-line">{review.comment}</p>}

                    {/* Customer Photos */}
                    {review.images && review.images.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {review.images.map((img: string, idx: number) => (
                          <div key={idx} className="relative w-16 h-16 border rounded overflow-hidden">
                            <Image src={img} alt={`Review photo ${idx + 1}`} fill className="object-cover" />
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-4">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleVote(review.id || review._id)}
                        disabled={votingOn[review.id || review._id]}
                        className={votingOn[review.id || review._id] ? "opacity-50" : ""}
                      >
                        <ThumbsUp className="h-4 w-4 mr-1" />
                        Helpful ({review.helpfulCount || review.helpful || 0})
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
