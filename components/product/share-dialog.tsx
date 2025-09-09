"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Facebook, Twitter, Instagram, Copy, Check } from "lucide-react"

interface ShareDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: any
  onShare: (platform: string) => void
  copied: boolean
}

export function ShareDialog({ open, onOpenChange, product, onShare, copied }: ShareDialogProps) {
  const shareUrl = typeof window !== "undefined" ? window.location.href : ""

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share {product.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Input value={shareUrl} readOnly />
            <Button size="sm" onClick={() => onShare("copy")} className="shrink-0">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <Button variant="outline" onClick={() => onShare("facebook")} className="flex items-center gap-2">
              <Facebook className="h-4 w-4" />
              Facebook
            </Button>

            <Button variant="outline" onClick={() => onShare("twitter")} className="flex items-center gap-2">
              <Twitter className="h-4 w-4" />
              Twitter
            </Button>

            <Button variant="outline" onClick={() => onShare("instagram")} className="flex items-center gap-2">
              <Instagram className="h-4 w-4" />
              Instagram
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
