/**
 * Create Admin User Script
 * Run: npm run create-admin
 */

import { User } from "@/models/User";
import bcrypt from "bcryptjs"
import { connectDB } from "@/lib/mongodb";
async function createAdmin() {
    try {
        console.log("🔌 Connecting to MongoDB...")
        await connectDB()
        console.log("✅ Connected to MongoDB")

        const hashedPassword = await bcrypt.hash("Admin@123", 10)

        // Check if admin already exists
        const existingAdmin = await User.findOne({ email: "admin@baefikra.com" })

        if (existingAdmin) {
            // Update password for existing admin
            await User.updateOne(
                { email: "admin@baefikra.com" },
                {
                    $set: {
                        password: hashedPassword,
                        role: "admin",
                        isVerified: true,
                        isActive: true
                    }
                }
            )
            console.log("✅ Admin password updated!")
            console.log("   Email: admin@baefikra.com")
            console.log("   Password: Admin@123")
        } else {
            // Create new admin
            await User.create({
                name: "Admin",
                email: "admin@baefikra.com",
                password: hashedPassword,
                role: "admin",
                phone: "9999999999",
                isVerified: true,
                isActive: true
            })
            console.log("✅ Admin user created!")
            console.log("   Email: admin@baefikra.com")
            console.log("   Password: Admin@123")
        }

        // Also create/update seller
        const sellerPassword = await bcrypt.hash("Seller@123", 10)
        const existingSeller = await User.findOne({ email: "seller@baefikra.com" })

        if (existingSeller) {
            await User.updateOne(
                { email: "seller@baefikra.com" },
                {
                    $set: {
                        password: sellerPassword,
                        role: "seller",
                        isVerified: true,
                        isActive: true
                    }
                }
            )
            console.log("\n✅ Seller password updated!")
        } else {
            await User.create({
                name: "Demo Seller",
                email: "seller@baefikra.com",
                password: sellerPassword,
                role: "seller",
                phone: "8888888888",
                isVerified: true,
                isActive: true
            })
            console.log("\n✅ Seller user created!")
        }
        console.log("   Email: seller@baefikra.com")
        console.log("   Password: Seller@123")

        console.log("\n🎉 Done! You can now login.")
    } catch (error) {
        console.error("❌ Error:", error)
    } finally {
        process.exit(0)
    }
}

createAdmin()
