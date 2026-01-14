"use client"

import { useState, useRef, useEffect } from "react"
import Image from "next/image"

interface Product360ViewerProps {
    images: string[]
    productName: string
}

export function Product360Viewer({ images, productName }: Product360ViewerProps) {
    const [currentFrame, setCurrentFrame] = useState(0)
    const [isDragging, setIsDragging] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [loadedCount, setLoadedCount] = useState(0)
    const containerRef = useRef<HTMLDivElement>(null)
    const lastX = useRef(0)

    const frameCount = images.length

    // Preload all images
    useEffect(() => {
        if (images.length === 0) return

        let loaded = 0
        images.forEach((src) => {
            const img = new window.Image()
            img.onload = () => {
                loaded++
                setLoadedCount(loaded)
                if (loaded === images.length) {
                    setIsLoading(false)
                }
            }
            img.onerror = () => {
                loaded++
                setLoadedCount(loaded)
            }
            img.src = src
        })
    }, [images])

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true)
        lastX.current = e.clientX
    }

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return

        const deltaX = e.clientX - lastX.current
        const sensitivity = 5 // Pixels per frame change

        if (Math.abs(deltaX) > sensitivity) {
            const frameDelta = deltaX > 0 ? 1 : -1
            setCurrentFrame(prev => {
                let next = prev + frameDelta
                if (next < 0) next = frameCount - 1
                if (next >= frameCount) next = 0
                return next
            })
            lastX.current = e.clientX
        }
    }

    const handleMouseUp = () => {
        setIsDragging(false)
    }

    const handleTouchStart = (e: React.TouchEvent) => {
        setIsDragging(true)
        lastX.current = e.touches[0].clientX
    }

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!isDragging) return

        const deltaX = e.touches[0].clientX - lastX.current
        const sensitivity = 5

        if (Math.abs(deltaX) > sensitivity) {
            const frameDelta = deltaX > 0 ? 1 : -1
            setCurrentFrame(prev => {
                let next = prev + frameDelta
                if (next < 0) next = frameCount - 1
                if (next >= frameCount) next = 0
                return next
            })
            lastX.current = e.touches[0].clientX
        }
    }

    const handleTouchEnd = () => {
        setIsDragging(false)
    }

    if (images.length === 0) {
        return (
            <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                No 360° images available
            </div>
        )
    }

    return (
        <div className="relative">
            <div
                ref={containerRef}
                className={`relative aspect-square bg-gray-100 rounded-lg overflow-hidden select-none ${isDragging ? "cursor-grabbing" : "cursor-grab"
                    }`}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                {isLoading ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <div className="w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mb-2" />
                        <p className="text-sm text-gray-500">
                            Loading 360° view ({loadedCount}/{frameCount})
                        </p>
                    </div>
                ) : (
                    <Image
                        src={images[currentFrame]}
                        alt={`${productName} - 360° view`}
                        fill
                        className="object-contain pointer-events-none"
                        priority
                    />
                )}

                {/* 360° Badge */}
                <div className="absolute top-3 left-3 bg-black/70 text-white px-2 py-1 rounded text-xs font-medium">
                    360°
                </div>

                {/* Instructions */}
                <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 bg-black/60 text-white px-3 py-1.5 rounded-full text-xs">
                    Drag to rotate
                </div>
            </div>

            {/* Frame indicator */}
            <div className="mt-2 flex items-center justify-center gap-2">
                <div className="h-1 bg-gray-200 rounded-full flex-1 max-w-xs">
                    <div
                        className="h-1 bg-yellow-400 rounded-full transition-all"
                        style={{ width: `${((currentFrame + 1) / frameCount) * 100}%` }}
                    />
                </div>
                <span className="text-xs text-gray-500">
                    {currentFrame + 1}/{frameCount}
                </span>
            </div>
        </div>
    )
}
