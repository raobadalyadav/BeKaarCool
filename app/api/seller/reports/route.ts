import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { connectDB } from "@/lib/mongodb"
import { Order } from "@/models/Order"
import { Product } from "@/models/Product"
import { User } from "@/models/User"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || (session.user.role !== "seller" && session.user.role !== "admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const range = searchParams.get("range") || "30d"

    await connectDB()

    // Calculate date range
    const now = new Date()
    let startDate = new Date()
    
    switch (range) {
      case "7d":
        startDate.setDate(now.getDate() - 7)
        break
      case "30d":
        startDate.setDate(now.getDate() - 30)
        break
      case "90d":
        startDate.setDate(now.getDate() - 90)
        break
      case "1y":
        startDate.setFullYear(now.getFullYear() - 1)
        break
      default:
        startDate.setDate(now.getDate() - 30)
    }

    // Get seller's products
    const sellerProducts = await Product.find({ seller: session.user.id })
    const productIds = sellerProducts.map(p => p._id)

    // Get orders containing seller's products
    const orders = await Order.find({
      "items.product": { $in: productIds },
      createdAt: { $gte: startDate }
    }).populate("items.product customer")

    // Calculate sales metrics
    let totalSales = 0
    let totalOrders = orders.length
    const productSales = new Map()
    const customerSet = new Set()
    const categorySales = new Map()

    orders.forEach(order => {
      customerSet.add(order.customer._id.toString())
      
      order.items.forEach(item => {
        if (productIds.some(id => id.toString() === item.product._id.toString())) {
          const itemRevenue = item.price * item.quantity
          totalSales += itemRevenue

          // Track product sales
          const productName = item.product.name
          if (!productSales.has(productName)) {
            productSales.set(productName, { sales: 0, revenue: 0 })
          }
          const productData = productSales.get(productName)
          productData.sales += item.quantity
          productData.revenue += itemRevenue

          // Track category sales
          const category = item.product.category
          if (!categorySales.has(category)) {
            categorySales.set(category, { products: 0, revenue: 0 })
          }
          const categoryData = categorySales.get(category)
          categoryData.revenue += itemRevenue
        }
      })
    })

    // Calculate category product counts
    sellerProducts.forEach(product => {
      if (categorySales.has(product.category)) {
        categorySales.get(product.category).products += 1
      }
    })

    // Get customer metrics
    const allCustomerOrders = await Order.find({
      "items.product": { $in: productIds }
    }).populate("customer")

    const customerOrderCounts = new Map()
    allCustomerOrders.forEach(order => {
      const customerId = order.customer._id.toString()
      customerOrderCounts.set(customerId, (customerOrderCounts.get(customerId) || 0) + 1)
    })

    const returningCustomers = Array.from(customerOrderCounts.values()).filter(count => count > 1).length
    const newCustomers = customerSet.size
    const totalCustomers = customerOrderCounts.size

    // Top products
    const topProducts = Array.from(productSales.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)

    // Top categories
    const topCategories = Array.from(categorySales.entries())
      .map(([category, data]) => ({ category, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)

    // Mock financial data (in real app, calculate from actual expenses)
    const totalExpenses = Math.floor(totalSales * 0.3) // 30% expenses
    const netProfit = totalSales - totalExpenses
    const profitMargin = totalSales > 0 ? Math.round((netProfit / totalSales) * 100) : 0

    const reportData = {
      salesReport: {
        totalSales,
        totalOrders,
        avgOrderValue: totalOrders > 0 ? Math.round(totalSales / totalOrders) : 0,
        topProducts
      },
      customerReport: {
        totalCustomers,
        newCustomers,
        returningCustomers,
        customerRetention: totalCustomers > 0 ? Math.round((returningCustomers / totalCustomers) * 100) : 0
      },
      inventoryReport: {
        totalProducts: sellerProducts.length,
        lowStockProducts: sellerProducts.filter(p => p.stock < 10).length,
        outOfStockProducts: sellerProducts.filter(p => p.stock === 0).length,
        topCategories
      },
      financialReport: {
        totalRevenue: totalSales,
        totalExpenses,
        netProfit,
        profitMargin
      }
    }

    return NextResponse.json(reportData)
  } catch (error) {
    console.error("Error fetching report data:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}