import { type NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { Cart } from "@/models/Cart"
import { Product } from "@/models/Product"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { resolveUserId } from "@/lib/auth-utils"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    // Resolve user ID to ensure it's a valid MongoDB ObjectId
    const userId = await resolveUserId(session.user.id, session.user.email)

    let cart = await Cart.findOne({ user: userId }).populate({
      path: "items.product",
      select: "name price originalPrice images stock seller isActive",
      populate: {
        path: "seller",
        select: "name",
      },
    })

    if (!cart) {
      cart = new Cart({
        user: userId,
        items: [],
        total: 0,
        subtotal: 0,
        shipping: 0,
        tax: 0,
        discount: 0,
      })
      await cart.save()
    }

    // Filter out inactive products (keep custom products)
    cart.items = cart.items.filter((item: any) => 
      item.customProduct || (item.product && item.product.isActive)
    )

    // Recalculate totals
    cart.subtotal = cart.items.reduce((sum: number, item: any) => {
      const price = item.product?.price || item.price || 0
      return sum + price * item.quantity
    }, 0)

    cart.tax = cart.subtotal * 0.18 // 18% GST
    cart.shipping = cart.subtotal > 999 ? 0 : 99
    cart.total = cart.subtotal + cart.tax + cart.shipping - (cart.discount || 0)

    await cart.save()

    return NextResponse.json(cart)
  } catch (error) {
    console.error("Error fetching cart:", error)
    return NextResponse.json({ message: "Failed to fetch cart" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    // Resolve user ID to ensure it's a valid MongoDB ObjectId
    const userId = await resolveUserId(session.user.id, session.user.email)

    const { productId, quantity, size, color, customization, productType, productName, basePrice } = await request.json()

    let cart = await Cart.findOne({ user: userId })
    if (!cart) {
      cart = new Cart({ user: userId, items: [], total: 0 })
    }

    // Handle custom design products
    if (productType && productName && basePrice && customization) {
      // This is a custom design product
      const customItem = {
        quantity: quantity || 1,
        size: size || "M",
        color: color || "Default",
        customization,
        price: basePrice,
        customProduct: {
          type: productType,
          name: productName,
          basePrice,
        },
      }
      cart.items.push(customItem)
    } else {
      // Handle regular products
      if (!productId || !quantity || quantity < 1) {
        return NextResponse.json({ message: "Invalid product or quantity" }, { status: 400 })
      }

      const product = await Product.findById(productId).populate("seller", "name")
      if (!product || !product.isActive) {
        return NextResponse.json({ message: "Product not found or inactive" }, { status: 404 })
      }

      if (product.stock < quantity) {
        return NextResponse.json({ message: "Insufficient stock" }, { status: 400 })
      }

      // Check if item already exists in cart
      const existingItemIndex = cart.items.findIndex(
        (item: any) => item.product?.toString() === productId && item.size === size && item.color === color,
      )

      if (existingItemIndex > -1) {
        const newQuantity = cart.items[existingItemIndex].quantity + quantity
        if (newQuantity > product.stock) {
          return NextResponse.json({ message: "Cannot add more items than available stock" }, { status: 400 })
        }
        cart.items[existingItemIndex].quantity = newQuantity
      } else {
        cart.items.push({
          product: productId,
          quantity,
          size: size || "M",
          color: color || "Default",
          customization: customization || null,
          price: product.price,
        })
      }
    }

    // Recalculate totals
    await cart.populate({
      path: "items.product",
      select: "name price originalPrice images stock seller",
      populate: {
        path: "seller",
        select: "name",
      },
    })

    cart.subtotal = cart.items.reduce((sum: number, item: any) => {
      const price = item.product?.price || item.price || 0
      return sum + price * item.quantity
    }, 0)
    cart.tax = cart.subtotal * 0.18
    cart.shipping = cart.subtotal > 999 ? 0 : 99
    cart.total = cart.subtotal + cart.tax + cart.shipping - (cart.discount || 0)

    await cart.save()

    return NextResponse.json(cart)
  } catch (error) {
    console.error("Error adding to cart:", error)
    return NextResponse.json({ message: "Failed to add to cart" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    // Resolve user ID to ensure it's a valid MongoDB ObjectId
    const userId = await resolveUserId(session.user.id, session.user.email)

    await Cart.findOneAndUpdate(
      { user: userId },
      {
        items: [],
        total: 0,
        subtotal: 0,
        shipping: 0,
        tax: 0,
        couponCode: null,
        discount: 0,
      },
    )

    return NextResponse.json({ message: "Cart cleared successfully" })
  } catch (error) {
    console.error("Error clearing cart:", error)
    return NextResponse.json({ message: "Failed to clear cart" }, { status: 500 })
  }
}
