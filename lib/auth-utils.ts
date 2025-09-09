import mongoose from "mongoose"
import { connectDB } from "./mongodb"
import { User } from "@/models/User"

/**
 * Helper function to resolve user ID to MongoDB ObjectId
 * This handles cases where the session might contain Google OAuth IDs instead of MongoDB ObjectIds
 */
export async function resolveUserId(sessionUserId: string, userEmail?: string): Promise<string> {
  // Check if it's already a valid MongoDB ObjectId
  if (mongoose.Types.ObjectId.isValid(sessionUserId) && sessionUserId.length === 24) {
    return sessionUserId
  }
  
  // If not, it might be a Google OAuth ID, so find the user by email
  if (userEmail) {
    await connectDB()
    const user = await User.findOne({ email: userEmail })
    if (user) {
      return user._id.toString()
    }
  }
  
  throw new Error("Invalid user ID format and no email provided for fallback")
}