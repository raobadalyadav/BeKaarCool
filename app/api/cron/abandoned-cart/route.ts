import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Cart } from "@/models/Cart";
import { User } from "@/models/User";
import {
  sendAbandonedCartEmail,
  sendLoyaltyPointsExpiryEmail,
} from "@/lib/email";

export const dynamic = "force-dynamic";

// Secret key to verify cron job requests
const CRON_SECRET = process.env.CRON_SECRET || "cron_secret";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const now = new Date();

    // 1. Process Abandoned Carts
    // Find carts updated more than 24 hours ago, but less than 48 hours ago, that have > 0 items
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

    const abandonedCarts = await Cart.find({
      updatedAt: { $lt: oneDayAgo, $gte: twoDaysAgo },
      $and: [
        { items: { $exists: true } },
        { $expr: { $gt: [{ $size: "$items" }, 0] } },
      ],
    }).populate("user", "name email");

    let cartsEmailed = 0;
    const cartPromises = abandonedCarts.map(async (cart: any) => {
      if (cart.user?.email && cart.user?.name) {
        const BASE_URL = process.env.NEXT_PUBLIC_APP_URL;
        const cartUrl = `${BASE_URL}/cart`;

        await sendAbandonedCartEmail(
          cart.user.name,
          cart.user.email,
          cartUrl,
        ).catch(console.error);
        cartsEmailed++;
      }
    });

    await Promise.allSettled(cartPromises);

    // 2. Process Points Expiry
    // Example: Find users with points > 0 expiring within 7 days.
    // Assuming your schema has points expiry fields. If not, this is a placeholder standard practice.
    /* 
        const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
        const expiringPointsUsers = await User.find({
            loyaltyPoints: { $gt: 0 },
            pointsExpiryDate: { $lte: sevenDaysFromNow, $gt: now }
        })
        
        let pointEmailsSent = 0
        const pointsPromises = expiringPointsUsers.map(async (user: any) => {
            if (user?.email && user?.name) {
                const formattedDate = user.pointsExpiryDate.toLocaleDateString()
                await sendLoyaltyPointsExpiryEmail(user.email, user.name, user.loyaltyPoints, formattedDate).catch(console.error)
                pointEmailsSent++
            }
        })
        
        await Promise.allSettled(pointsPromises)
        */

    return NextResponse.json({
      message: "Cron job executed successfully",
      stats: {
        abandonedCartsEmailed: cartsEmailed,
        // pointsExpiringEmailed: pointEmailsSent
      },
    });
  } catch (error: any) {
    console.error("Cron execute error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
