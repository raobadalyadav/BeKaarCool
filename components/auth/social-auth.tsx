"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Chrome, Loader2 } from "lucide-react"

interface SocialAuthProps {
  mode?: "signin" | "signup"
  disabled?: boolean
}

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"

export function SocialAuth({ mode = "signin", disabled = false }: SocialAuthProps) {
  const [googleLoading, setGoogleLoading] = useState(false)

  const handleGoogleAuth = () => {
    setGoogleLoading(true)
    window.location.href = `${BACKEND_URL}/auth/google`
  }

  const isLoading = googleLoading

  return (
    <>
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <Separator className="w-full" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-muted-foreground">
            Or continue with
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={handleGoogleAuth}
          disabled={disabled || isLoading}
          className="w-full"
        >
          {googleLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Chrome className="mr-2 h-4 w-4" />
          )}
          {mode === "signin" ? "Sign in" : "Sign up"} with Google
        </Button>
      </div>
    </>
  )
}