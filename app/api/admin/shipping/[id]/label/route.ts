import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

interface RouteParams {
    params: Promise<{ id: string }>
}

export async function GET(request: Request, { params }: RouteParams) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user || (session.user as any).role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
        }

        const { id } = await params

        // Generate a simple shipping label PDF placeholder
        // In production, integrate with Delhivery API
        const labelContent = `
            SHIPPING LABEL
            ===============
            Order ID: ${id}
            Generated: ${new Date().toISOString()}
            
            This is a placeholder label.
            Integrate with Delhivery API for real labels.
        `

        return new NextResponse(labelContent, {
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename=shipping-label-${id}.pdf`
            }
        })
    } catch (error) {
        console.error("Admin label generation error:", error)
        return NextResponse.json({ error: "Failed to generate label" }, { status: 500 })
    }
}
