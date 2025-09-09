"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Chrome, Github, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface SocialAuthProps {
  mode?: "signin" | "signup"
  disabled?: boolean
}

export function SocialAuth({ mode = "signin", disabled = false }: SocialAuthProps) {
  const [googleLoading, setGoogleLoading] = useState(false)
  const [githubLoading, setGithubLoading] = useState(false)

  const handleGoogleAuth = async () => {
    setGoogleLoading(true)
    try {
      await signIn("google", { callbackUrl: "/" })
    } catch (error) {
      toast.error(`Google ${mode} failed`)
    } finally {
      setGoogleLoading(false)
    }
  }

  const handleGithubAuth = async () => {
    setGithubLoading(true)
    try {
      await signIn("github", { callbackUrl: "/" })
    } catch (error) {
      toast.error(`GitHub ${mode} failed`)
    } finally {
      setGithubLoading(false)
    }
  }

  const isLoading = googleLoading || githubLoading

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

        <Button
          type="button"
          variant="outline"
          onClick={handleGithubAuth}
          disabled={disabled || isLoading}
          className="w-full"
        >
          {githubLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Github className="mr-2 h-4 w-4" />
          )}
          {mode === "signin" ? "Sign in" : "Sign up"} with GitHub
        </Button>
      </div>
    </>
  )
}