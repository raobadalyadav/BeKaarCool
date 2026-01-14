"use client"

import { useState, useEffect, Suspense } from "react"
import { signIn, getSession, useSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, Mail, Lock, Loader2, Chrome, CheckCircle } from "lucide-react"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { useToast } from "@/hooks/use-toast"

interface LoginForm {
  email: string
  password: string
}

function LoginForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session } = useSession()
  const { toast } = useToast()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>()

  useEffect(() => {
    if (session) {
      const redirectPath = session.user.role === "admin" ? "/admin" :
        session.user.role === "seller" ? "/seller" : "/"
      router.push(redirectPath)
    }

    const authError = searchParams.get("error")
    if (authError) {
      switch (authError) {
        case "CredentialsSignin":
          setError("Invalid email or password. Please check your credentials.")
          break
        case "OAuthSignin":
        case "OAuthCallback":
        case "OAuthCreateAccount":
          setError("Error with Google sign-in. Please try again.")
          break
        default:
          setError("An authentication error occurred. Please try again.")
      }
    }
  }, [session, router, searchParams])

  const onSubmit = async (data: LoginForm) => {
    setLoading(true)
    setError("")
    setSuccess("")

    try {
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      })

      if (result?.error) {
        setError("Invalid email or password. Please check your credentials.")
        toast({
          title: "Login failed",
          description: "Please check your credentials",
          variant: "destructive"
        })
      } else {
        setSuccess("Login successful! Redirecting...")
        toast({
          title: "Welcome back!",
          description: "You have successfully logged in"
        })

        const session = await getSession()
        const redirectPath = session?.user?.role === "admin" ? "/admin" :
          session?.user?.role === "seller" ? "/seller/dashboard" : "/"

        setTimeout(() => {
          router.push(redirectPath)
        }, 1000)
      }
    } catch (error) {
      setError("An error occurred. Please try again.")
      toast({
        title: "Error",
        description: "An error occurred",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true)
    try {
      await signIn("google", { callbackUrl: "/" })
    } catch (error) {
      toast({
        title: "Error",
        description: "Google sign-in failed",
        variant: "destructive"
      })
    } finally {
      setGoogleLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-yellow-400 items-center justify-center p-12">
        <div className="max-w-md text-center">
          <div className="w-24 h-24 bg-black rounded-2xl flex items-center justify-center mx-auto mb-8">
            <span className="text-yellow-400 font-bold text-4xl">B</span>
          </div>
          <h1 className="text-4xl font-bold text-black mb-4">BeKaarCool</h1>
          <p className="text-xl text-black/80 mb-8">
            India's coolest fashion destination. Login to access exclusive deals, track orders, and more!
          </p>
          <div className="grid grid-cols-2 gap-4 text-left">
            <div className="bg-black/10 p-4 rounded-lg">
              <p className="font-bold text-black">100% Genuine</p>
              <p className="text-sm text-black/70">All products are authentic</p>
            </div>
            <div className="bg-black/10 p-4 rounded-lg">
              <p className="font-bold text-black">Easy Returns</p>
              <p className="text-sm text-black/70">15-day return policy</p>
            </div>
            <div className="bg-black/10 p-4 rounded-lg">
              <p className="font-bold text-black">Fast Delivery</p>
              <p className="text-sm text-black/70">Pan India shipping</p>
            </div>
            <div className="bg-black/10 p-4 rounded-lg">
              <p className="font-bold text-black">Secure Payments</p>
              <p className="text-sm text-black/70">100% secure checkout</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-16 h-16 bg-yellow-400 rounded-xl flex items-center justify-center mx-auto mb-4">
              <span className="text-black font-bold text-2xl">B</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">BeKaarCool</h1>
          </div>

          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Welcome back!</h2>
            <p className="text-gray-600 mt-2">Sign in to continue shopping</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">{success}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700 font-medium">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  className="pl-11 h-12 border-gray-300 focus:border-yellow-400 focus:ring-yellow-400"
                  {...register("email", {
                    required: "Email is required",
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: "Invalid email address",
                    },
                  })}
                />
              </div>
              {errors.email && <p className="text-sm text-red-600">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700 font-medium">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  className="pl-11 pr-11 h-12 border-gray-300 focus:border-yellow-400 focus:ring-yellow-400"
                  {...register("password", {
                    required: "Password is required",
                    minLength: {
                      value: 6,
                      message: "Password must be at least 6 characters",
                    },
                  })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.password && <p className="text-sm text-red-600">{errors.password.message}</p>}
            </div>

            <div className="flex justify-end">
              <Link href="/auth/forgot-password" className="text-sm text-yellow-600 hover:text-yellow-700 font-medium">
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-yellow-400 hover:bg-yellow-500 text-black font-bold text-base"
              disabled={loading || googleLoading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                "LOGIN"
              )}
            </Button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-4 text-gray-500">or continue with</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full h-12 border-gray-300 hover:bg-gray-50"
              onClick={handleGoogleSignIn}
              disabled={loading || googleLoading}
            >
              {googleLoading ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <Chrome className="mr-2 h-5 w-5" />
              )}
              Sign in with Google
            </Button>

            <p className="text-center text-gray-600 mt-6">
              Don't have an account?{" "}
              <Link href="/auth/register" className="text-yellow-600 hover:text-yellow-700 font-semibold">
                Sign up
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-yellow-400" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
