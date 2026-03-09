import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { connectDB } from "@/lib/mongodb"
import { User } from "@/models/User"
import { resolveUserId } from "@/lib/auth-utils"
import { sendReferralInvitationEmail } from "@/lib/email"

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        await connectDB()
        
        const userId = await resolveUserId(session.user.id, session.user.email)
        const user = await User.findById(userId).select("affiliateCode name")

        if (!user || !user.affiliateCode) {
            return NextResponse.json({ error: "Referral code not found" }, { status: 404 })
        }

        const { emails } = await request.json()

        if (!emails || !Array.isArray(emails) || emails.length === 0) {
            return NextResponse.json({ error: "Please provide valid email addresses" }, { status: 400 })
        }

        const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "https://capitalcurv.com"
        const referralUrl = `${BASE_URL}/auth/register?ref=${user.affiliateCode}`

        // Dispatch emails to all invited friends
        const emailPromises = emails.map((friendEmail: string) => {
            // Extract a name from email or use a placeholder
            const friendName = friendEmail.split('@')[0]
            return sendReferralInvitationEmail(friendEmail, friendName, user.name, referralUrl)
        });

        await Promise.allSettled(emailPromises)

        return NextResponse.json({
            message: `Successfully sent ${emails.length} invitations.`,
            success: true
        }, { status: 200 })
    } catch (error: any) {
        console.error("Referral invite error:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
