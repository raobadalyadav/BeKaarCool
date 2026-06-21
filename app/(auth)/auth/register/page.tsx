"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { Eye, EyeOff, User, Mail, Lock, Phone, Loader2, Chrome, CheckCircle } from "lucide-react"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useToast } from "@/hooks/use-toast"
import { registerAction } from "@/lib/auth-actions"
import { registerSchema, type RegisterFormValues } from "@/lib/validations/auth"

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [passwordStrength, setPasswordStrength] = useState(0)
  const router = useRouter()
  const { toast } = useToast()

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  })

  const password = watch("password")

  const calculatePasswordStrength = (password: string) => {
    let strength = 0
    if (password.length >= 6) strength += 25
    if (/[a-z]/.test(password)) strength += 25
    if (/[A-Z]/.test(password)) strength += 25
    if (/\d/.test(password)) strength += 25
    return strength
  }

  useEffect(() => {
    if (password) {
      setPasswordStrength(calculatePasswordStrength(password))
    }
  }, [password])

  const onSubmit = async (data: RegisterFormValues) => {
    setLoading(true)
    setError("")
    setSuccess("")

    try {
      const [firstName, ...rest] = data.name.trim().split(" ")
      const result = await registerAction({
        email: data.email,
        password: data.password,
        firstName,
        lastName: rest.join(" ") || undefined,
      })
      if (!result.ok) throw new Error(result.error)

      setSuccess("Account created successfully! Redirecting to login...")
      toast({
        title: "Account created!",
        description: "Please login to continue"
      })

      setTimeout(() => {
        router.push("/auth/login")
      }, 2000)
    } catch (error: any) {
      setError(error.message || "An error occurred. Please try again.")
      toast({
        title: "Error",
        description: error.message || "Registration failed",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignUp = () => {
    setGoogleLoading(true)
    const backend = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"
    window.location.href = `${backend}/auth/google`
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#F38508] items-center justify-center p-12">
        <div className="max-w-md text-center">
          <div className="w-24 h-24 bg-black rounded-2xl flex items-center justify-center mx-auto mb-8">
            <span className="text-[#F38508] font-bold text-4xl">B</span>
          </div>
          <h1 className="text-4xl font-bold text-black mb-4">Baefikra</h1>
          <p className="text-xl text-black/80 mb-8">
            Join millions of shoppers and discover the coolest fashion trends at unbeatable prices!
          </p>
          <div className="space-y-4">
            <div className="bg-black/10 p-4 rounded-lg text-left">
              <p className="font-bold text-black flex items-center gap-2">
                <CheckCircle className="h-5 w-5" /> Exclusive member discounts
              </p>
            </div>
            <div className="bg-black/10 p-4 rounded-lg text-left">
              <p className="font-bold text-black flex items-center gap-2">
                <CheckCircle className="h-5 w-5" /> Early access to sales
              </p>
            </div>
            <div className="bg-black/10 p-4 rounded-lg text-left">
              <p className="font-bold text-black flex items-center gap-2">
                <CheckCircle className="h-5 w-5" /> Free shipping on first order
              </p>
            </div>
            <div className="bg-black/10 p-4 rounded-lg text-left">
              <p className="font-bold text-black flex items-center gap-2">
                <CheckCircle className="h-5 w-5" /> Track orders easily
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Register Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white overflow-y-auto">
        <div className="w-full max-w-md py-8">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-16 h-16 bg-[#F38508] rounded-xl flex items-center justify-center mx-auto mb-4">
              <span className="text-black font-bold text-2xl">B</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Baefikra</h1>
          </div>

          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Create Account</h2>
            <p className="text-gray-600 mt-2">Join the coolest fashion community!</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
              <Label htmlFor="name" className="text-gray-700 font-medium">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your full name"
                  className="pl-11 h-12 border-gray-300 focus:border-[#F38508] focus:ring-[#F38508]"
                  {...register("name")}
                />
              </div>
              {errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700 font-medium">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  className="pl-11 h-12 border-gray-300 focus:border-[#F38508] focus:ring-[#F38508]"
                  {...register("email")}
                />
              </div>
              {errors.email && <p className="text-sm text-red-600">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-gray-700 font-medium">Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="Enter your phone number"
                  className="pl-11 h-12 border-gray-300 focus:border-[#F38508] focus:ring-[#F38508]"
                  {...register("phone")}
                />
              </div>
              {errors.phone && <p className="text-sm text-red-600">{errors.phone.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700 font-medium">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a password"
                  className="pl-11 pr-11 h-12 border-gray-300 focus:border-[#F38508] focus:ring-[#F38508]"
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {password && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Password strength</span>
                    <span className={`font-medium ${passwordStrength < 50 ? 'text-red-500' :
                        passwordStrength < 75 ? 'text-[#F38508]' : 'text-green-500'
                      }`}>
                      {passwordStrength < 50 ? 'Weak' : passwordStrength < 75 ? 'Medium' : 'Strong'}
                    </span>
                  </div>
                  <Progress value={passwordStrength} className="h-2" />
                </div>
              )}
              {errors.password && <p className="text-sm text-red-600">{errors.password.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-gray-700 font-medium">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm your password"
                  className="pl-11 pr-11 h-12 border-gray-300 focus:border-[#F38508] focus:ring-[#F38508]"
                  {...register("confirmPassword")}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.confirmPassword && <p className="text-sm text-red-600">{errors.confirmPassword.message}</p>}
            </div>

            <div className="flex items-start space-x-2">
              <Checkbox
                id="agreeToTerms"
                className="mt-1"
                {...register("agreeToTerms")}
              />
              <Label htmlFor="agreeToTerms" className="text-sm text-gray-600 font-normal leading-tight">
                I agree to the{" "}
                <Link href="/terms" className="text-[#F38508] hover:text-[#D97706] font-medium">
                  Terms and Conditions
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="text-[#F38508] hover:text-[#D97706] font-medium">
                  Privacy Policy
                </Link>
              </Label>
            </div>
            {errors.agreeToTerms && <p className="text-sm text-red-600">{errors.agreeToTerms.message}</p>}

            <Button
              type="submit"
              className="w-full h-12 bg-[#F38508] hover:bg-[#D97706] text-black font-bold text-base mt-2"
              disabled={loading || googleLoading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Creating account...
                </>
              ) : (
                "CREATE ACCOUNT"
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
              onClick={handleGoogleSignUp}
              disabled={loading || googleLoading}
            >
              {googleLoading ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <Chrome className="mr-2 h-5 w-5" />
              )}
              Sign up with Google
            </Button>

            <p className="text-center text-gray-600 mt-6">
              Already have an account?{" "}
              <Link href="/auth/login" className="text-[#F38508] hover:text-[#D97706] font-semibold">
                Sign in
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
