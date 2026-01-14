"use client"

import { useState } from "react"
import { signIn, getSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, Mail, Lock, Loader2, Store, CheckCircle } from "lucide-react"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { useToast } from "@/hooks/use-toast"

interface LoginForm {
    email: string
    password: string
}

export default function SellerLoginPage() {
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [success, setSuccess] = useState("")
    const router = useRouter()
    const { toast } = useToast()

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginForm>()

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
                setError("Invalid credentials. Please check email and password.")
                toast({
                    title: "Login failed",
                    description: "Invalid credentials",
                    variant: "destructive"
                })
            } else {
                // Check if user is seller
                const session = await getSession()
                if (session?.user?.role !== "seller") {
                    setError("Access denied. This login is for sellers only. If you want to become a seller, please register.")
                    toast({
                        title: "Access Denied",
                        description: "You are not registered as a seller",
                        variant: "destructive"
                    })
                    return
                }

                setSuccess("Login successful! Redirecting to Seller Dashboard...")
                toast({
                    title: "Welcome Seller!",
                    description: "Redirecting to your dashboard..."
                })

                setTimeout(() => {
                    router.push("/seller")
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

    return (
        <div className="min-h-screen flex">
            {/* Left Side - Branding */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 items-center justify-center p-12">
                <div className="max-w-md text-center">
                    <div className="w-24 h-24 bg-white rounded-2xl flex items-center justify-center mx-auto mb-8">
                        <Store className="w-12 h-12 text-purple-600" />
                    </div>
                    <h1 className="text-4xl font-bold text-white mb-4">Seller Portal</h1>
                    <p className="text-xl text-purple-100 mb-8">
                        Grow your business with BeKaarCool's marketplace
                    </p>
                    <div className="space-y-4 text-left">
                        <div className="flex items-center gap-3 bg-white/10 p-4 rounded-lg">
                            <CheckCircle className="w-5 h-5 text-yellow-300" />
                            <span className="text-white">List unlimited products</span>
                        </div>
                        <div className="flex items-center gap-3 bg-white/10 p-4 rounded-lg">
                            <CheckCircle className="w-5 h-5 text-yellow-300" />
                            <span className="text-white">Track orders in real-time</span>
                        </div>
                        <div className="flex items-center gap-3 bg-white/10 p-4 rounded-lg">
                            <CheckCircle className="w-5 h-5 text-yellow-300" />
                            <span className="text-white">Powerful analytics dashboard</span>
                        </div>
                        <div className="flex items-center gap-3 bg-white/10 p-4 rounded-lg">
                            <CheckCircle className="w-5 h-5 text-yellow-300" />
                            <span className="text-white">Secure payment processing</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50">
                <div className="w-full max-w-md">
                    {/* Mobile Logo */}
                    <div className="lg:hidden text-center mb-8">
                        <div className="w-16 h-16 bg-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                            <Store className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900">Seller Portal</h1>
                    </div>

                    <div className="text-center mb-8">
                        <h2 className="text-3xl font-bold text-gray-900">Seller Login</h2>
                        <p className="text-gray-600 mt-2">Sign in to manage your store</p>
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
                            <Label htmlFor="email" className="text-gray-700 font-medium">Seller Email</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="seller@example.com"
                                    className="pl-11 h-12 border-gray-300 focus:border-purple-600 focus:ring-purple-600"
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
                                    className="pl-11 pr-11 h-12 border-gray-300 focus:border-purple-600 focus:ring-purple-600"
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
                            <Link href="/auth/forgot-password" className="text-sm text-purple-600 hover:text-purple-700 font-medium">
                                Forgot password?
                            </Link>
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-12 bg-purple-600 hover:bg-purple-700 text-white font-bold text-base"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    Signing in...
                                </>
                            ) : (
                                <>
                                    <Store className="mr-2 h-5 w-5" />
                                    LOGIN AS SELLER
                                </>
                            )}
                        </Button>

                        <p className="text-center text-gray-600 mt-6">
                            Want to sell on BeKaarCool?{" "}
                            <Link href="/auth/seller-register" className="text-purple-600 hover:text-purple-700 font-semibold">
                                Register as Seller
                            </Link>
                        </p>
                    </form>
                </div>
            </div>
        </div>
    )
}
