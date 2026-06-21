"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Loader2, UploadCloud, X } from "lucide-react"
import Image from "next/image"
import { presignUpload, confirmMediaUpload } from "@/lib/api/media"
import { useToast } from "@/hooks/use-toast"

interface MediaUploaderProps {
  onUploadComplete: (url: string) => void
  kind?: "image" | "video"
  maxFiles?: number
  className?: string
}

export function MediaUploader({ onUploadComplete, kind = "image", maxFiles = 1, className = "" }: MediaUploaderProps) {
  const { toast } = useToast()
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        
        // 1. Get presigned URL
        const presignRes = await presignUpload({
          contentType: file.type,
          bytes: file.size,
          kind,
        })

        // 2. Upload to S3 directly
        const putRes = await fetch(presignRes.uploadUrl, {
          method: "PUT",
          headers: {
            "Content-Type": file.type,
          },
          body: file,
        })

        if (!putRes.ok) {
          throw new Error(`Failed to upload to S3: ${putRes.statusText}`)
        }

        // 3. Confirm with backend
        const confirmed = await confirmMediaUpload({
          s3Key: presignRes.s3Key,
          contentType: file.type,
          bytes: file.size,
          kind,
          altText: file.name,
        })

        onUploadComplete(confirmed.url)
      }
      
      toast({ title: "Upload successful!" })
    } catch (error) {
      console.error("Upload error:", error)
      toast({ 
        title: "Upload failed", 
        description: error instanceof Error ? error.message : "An error occurred during upload",
        variant: "destructive" 
      })
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  return (
    <div className={`border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer relative ${className}`} onClick={() => fileInputRef.current?.click()}>
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileSelect} 
        className="hidden" 
        accept={kind === "image" ? "image/png, image/jpeg, image/webp, image/avif" : "video/mp4, video/quicktime"}
        multiple={maxFiles > 1}
      />
      {uploading ? (
        <div className="flex flex-col items-center">
          <Loader2 className="w-8 h-8 text-gray-400 animate-spin mb-2" />
          <span className="text-sm text-gray-500 font-medium">Uploading...</span>
        </div>
      ) : (
        <div className="flex flex-col items-center">
          <UploadCloud className="w-8 h-8 text-gray-400 mb-2" />
          <span className="text-sm font-medium text-gray-600">Click to upload {kind}</span>
          <span className="text-xs text-gray-400 mt-1">Max file size: {kind === "image" ? "10MB" : "100MB"}</span>
        </div>
      )}
    </div>
  )
}
