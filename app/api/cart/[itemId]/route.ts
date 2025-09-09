import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { Cart } from "@/models/Cart"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { resolveUserId } from "@/lib/auth-utils"

export async function PUT(request: NextRequest, { params }: { params: Promise<{ itemId: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    await connectDB()
    const userId = await resolveUserId(session.user.id, session.user.email)
    const { itemId } = await params
    const { quantity } = await request.json()

    const cart = await Cart.findOne({ user: userId })
    if (!cart) {
      return NextResponse.json({ message: "Cart not found" }, { status: 404 })
    }

    const itemIndex = cart.items.findIndex((item: any) => item._id.toString() === itemId)
    if (itemIndex === -1) {
      return NextResponse.json({ message: "Item not found in cart" }, { status: 404 })
    }

    if (quantity <= 0) {
      cart.items.splice(itemIndex, 1)
    } else {
      cart.items[itemIndex].quantity = quantity
    }

    // Recalculate totals
    await cart.populate({
      path: "items.product",
      select: "price",
    })

    cart.subtotal = cart.items.reduce((sum: number, item: any) => {
      const price = item.product?.price || item.price || 0
      return sum + price * item.quantity
    }, 0)
    cart.tax = cart.subtotal * 0.18
    cart.shipping = cart.subtotal > 999 ? 0 : 99
    cart.total = cart.subtotal + cart.tax + cart.shipping - (cart.discount || 0)

    await cart.save()

    await cart.populate({
      path: "items.product",
      select: "name price originalPrice images stock seller",
      populate: {
        path: "seller",
        select: "name",
      },
    })

    return NextResponse.json(cart)
  } catch (error) {
    console.error("Error updating cart item:", error)
    return NextResponse.json({ message: "Failed to update cart item" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ itemId: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    await connectDB()
    const userId = await resolveUserId(session.user.id, session.user.email)
    const { itemId } = await params

    const cart = await Cart.findOne({ user: userId })
    if (!cart) {
      return NextResponse.json({ message: "Cart not found" }, { status: 404 })
    }

    cart.items = cart.items.filter((item: any) => item._id.toString() !== itemId)

    // Recalculate totals
    await cart.populate({
      path: "items.product",
      select: "price",
    })

    cart.subtotal = cart.items.reduce((sum: number, item: any) => {
      const price = item.product?.price || item.price || 0
      return sum + price * item.quantity
    }, 0)
    cart.tax = cart.subtotal * 0.18
    cart.shipping = cart.subtotal > 999 ? 0 : 99
    cart.total = cart.subtotal + cart.tax + cart.shipping - (cart.discount || 0)

    await cart.save()

    await cart.populate({
      path: "items.product",
      select: "name price originalPrice images stock seller",
      populate: {
        path: "seller",
        select: "name",
      },
    })

    return NextResponse.json(cart)
  } catch (error) {
    console.error("Error removing cart item:", error)
    return NextResponse.json({ message: "Failed to remove cart item" }, { status: 500 })
  }
}