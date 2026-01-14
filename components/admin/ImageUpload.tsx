"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, X, Image as ImageIcon, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ImageUploadProps {
    images: string[]
    onChange: (images: string[]) => void
    maxImages?: number
    folder?: "products" | "users" | "banners" | "reviews" | "documents"
}

export function ImageUpload({
    images,
    onChange,
    maxImages = 5,
    folder = "products"
}: ImageUploadProps) {
    const [uploading, setUploading] = useState(false)
    const [dragActive, setDragActive] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)
    const { toast } = useToast()

    const uploadFiles = async (files: FileList) => {
        const filesToUpload = Array.from(files).slice(0, maxImages - images.length)
        if (filesToUpload.length === 0) {
            toast({
                title: "Maximum images reached",
                description: `You can only upload up to ${maxImages} images`,
                variant: "destructive",
            })
            return
        }

        setUploading(true)
        const newImages: string[] = []

        for (const file of filesToUpload) {
            // Validate file type
            if (!file.type.startsWith("image/")) {
                toast({
                    title: "Invalid file type",
                    description: `${file.name} is not an image`,
                    variant: "destructive",
                })
                continue
            }

            // Validate file size (5MB)
            if (file.size > 5 * 1024 * 1024) {
                toast({
                    title: "File too large",
                    description: `${file.name} exceeds 5MB limit`,
                    variant: "destructive",
                })
                continue
            }

            try {
                const formData = new FormData()
                formData.append("file", file)
                formData.append("folder", folder)

                const response = await fetch("/api/admin/upload", {
                    method: "POST",
                    body: formData,
                })

                const result = await response.json()

                if (response.ok && result.url) {
                    newImages.push(result.url)
                } else {
                    throw new Error(result.message || "Upload failed")
                }
            } catch (error: any) {
                toast({
                    title: "Upload failed",
                    description: error.message || `Failed to upload ${file.name}`,
                    variant: "destructive",
                })
            }
        }

        if (newImages.length > 0) {
            onChange([...images, ...newImages])
            toast({
                title: "Upload complete",
                description: `${newImages.length} image(s) uploaded successfully`,
            })
        }

        setUploading(false)
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setDragActive(false)
        if (e.dataTransfer.files) {
            uploadFiles(e.dataTransfer.files)
        }
    }

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true)
        } else if (e.type === "dragleave") {
            setDragActive(false)
        }
    }

    const removeImage = (index: number) => {
        const newImages = [...images]
        newImages.splice(index, 1)
        onChange(newImages)
    }

    return (
        <div className="space-y-4">
            <Label>Product Images ({images.length}/{maxImages})</Label>

            {/* Image Preview Grid */}
            {images.length > 0 && (
                <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                    {images.map((image, index) => (
                        <div key={index} className="relative group aspect-square">
                            <img
                                src={image}
                                alt={`Product ${index + 1}`}
                                className="w-full h-full object-cover rounded-lg border"
                            />
                            <button
                                type="button"
                                onClick={() => removeImage(index)}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <X className="h-4 w-4" />
                            </button>
                            {index === 0 && (
                                <span className="absolute bottom-1 left-1 bg-blue-600 text-white text-xs px-2 py-0.5 rounded">
                                    Primary
                                </span>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Upload Area */}
            {images.length < maxImages && (
                <div
                    className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${dragActive
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-300 hover:border-gray-400"
                        }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                >
                    <input
                        ref={inputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(e) => e.target.files && uploadFiles(e.target.files)}
                    />

                    {uploading ? (
                        <div className="flex flex-col items-center gap-2">
                            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                            <p className="text-sm text-gray-600">Uploading...</p>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-2">
                            <Upload className="h-8 w-8 text-gray-400" />
                            <p className="text-sm text-gray-600">
                                Drag and drop images here, or{" "}
                                <button
                                    type="button"
                                    onClick={() => inputRef.current?.click()}
                                    className="text-blue-600 hover:underline"
                                >
                                    browse
                                </button>
                            </p>
                            <p className="text-xs text-gray-400">
                                Max {maxImages} images, 5MB each. JPEG, PNG, GIF, WebP
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* URL Input (fallback) */}
            <div className="flex gap-2">
                <Input
                    placeholder="Or paste image URL..."
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            const input = e.target as HTMLInputElement
                            const url = input.value.trim()
                            if (url && images.length < maxImages) {
                                onChange([...images, url])
                                input.value = ""
                            }
                        }
                    }}
                />
            </div>
        </div>
    )
}

export default ImageUpload
