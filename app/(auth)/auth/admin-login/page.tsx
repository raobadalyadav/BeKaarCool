"use client"

import { useState } from "react"
import { signIn, getSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, Mail, Lock, Loader2, ShieldCheck, CheckCircle } from "lucide-react"
import { useForm } from "react-hook-form"
import { useToast } from "@/hooks/use-toast"

interface LoginForm {
    email: string
    password: string
}

export default function AdminLoginPage() {
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
                // Check if user is admin
                const session = await getSession()
                if (session?.user?.role !== "admin") {
                    setError("Access denied. This login is for administrators only.")
                    toast({
                        title: "Access Denied",
                        description: "You are not authorized to access the admin panel",
                        variant: "destructive"
                    })
                    return
                }

                setSuccess("Login successful! Redirecting to Admin Dashboard...")
                toast({
                    title: "Welcome Admin!",
                    description: "Redirecting to dashboard..."
                })

                setTimeout(() => {
                    router.push("/admin")
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
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-gray-900 via-gray-800 to-black items-center justify-center p-12">
                <div className="max-w-md text-center">
                    <div className="w-24 h-24 bg-yellow-400 rounded-2xl flex items-center justify-center mx-auto mb-8">
                        <ShieldCheck className="w-12 h-12 text-black" />
                    </div>
                    <h1 className="text-4xl font-bold text-white mb-4">Admin Portal</h1>
                    <p className="text-xl text-gray-300 mb-8">
                        Secure access to BeKaarCool's administrative dashboard
                    </p>
                    <div className="space-y-4 text-left">
                        <div className="flex items-center gap-3 bg-white/10 p-4 rounded-lg">
                            <CheckCircle className="w-5 h-5 text-yellow-400" />
                            <span className="text-white">Manage products & inventory</span>
                        </div>
                        <div className="flex items-center gap-3 bg-white/10 p-4 rounded-lg">
                            <CheckCircle className="w-5 h-5 text-yellow-400" />
                            <span className="text-white">Process orders & refunds</span>
                        </div>
                        <div className="flex items-center gap-3 bg-white/10 p-4 rounded-lg">
                            <CheckCircle className="w-5 h-5 text-yellow-400" />
                            <span className="text-white">View analytics & reports</span>
                        </div>
                        <div className="flex items-center gap-3 bg-white/10 p-4 rounded-lg">
                            <CheckCircle className="w-5 h-5 text-yellow-400" />
                            <span className="text-white">Manage users & sellers</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50">
                <div className="w-full max-w-md">
                    {/* Mobile Logo */}
                    <div className="lg:hidden text-center mb-8">
                        <div className="w-16 h-16 bg-gray-900 rounded-xl flex items-center justify-center mx-auto mb-4">
                            <ShieldCheck className="w-8 h-8 text-yellow-400" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900">Admin Portal</h1>
                    </div>

                    <div className="text-center mb-8">
                        <h2 className="text-3xl font-bold text-gray-900">Admin Login</h2>
                        <p className="text-gray-600 mt-2">Sign in to access the admin dashboard</p>
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
                            <Label htmlFor="email" className="text-gray-700 font-medium">Admin Email</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="admin@bekaarcool.com"
                                    className="pl-11 h-12 border-gray-300 focus:border-gray-900 focus:ring-gray-900"
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
                                    className="pl-11 pr-11 h-12 border-gray-300 focus:border-gray-900 focus:ring-gray-900"
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

                        <Button
                            type="submit"
                            className="w-full h-12 bg-gray-900 hover:bg-gray-800 text-white font-bold text-base"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    Signing in...
                                </>
                            ) : (
                                <>
                                    <ShieldCheck className="mr-2 h-5 w-5" />
                                    LOGIN AS ADMIN
                                </>
                            )}
                        </Button>

                        <div className="text-center mt-6 text-gray-500 text-sm">
                            This login is for administrators only.
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}
