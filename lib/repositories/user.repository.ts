/**
 * User Repository
 * Data access layer for User model
 */

import { BaseRepository } from "./base.repository"
import { User } from "@/models/User"
import { IUser, IAddress } from "@/lib/types/entities"
import { Types } from "mongoose"
import bcrypt from "bcryptjs"

class UserRepository extends BaseRepository<IUser> {
    constructor() {
        super(User)
    }

    /**
     * Find user by email
     */
    async findByEmail(email: string): Promise<IUser | null> {
        return this.model.findOne({ email: email.toLowerCase() }).lean<IUser>()
    }

    /**
     * Find user with password (for auth)
     */
    async findByEmailWithPassword(email: string): Promise<IUser | null> {
        return this.model.findOne({ email: email.toLowerCase() }).select("+password").lean<IUser>()
    }

    /**
     * Create user with hashed password
     */
    async createWithPassword(data: {
        name: string
        email: string
        password: string
        phone?: string
        role?: string
    }): Promise<IUser> {
        const hashedPassword = await bcrypt.hash(data.password, 12)
        return this.create({
            ...data,
            email: data.email.toLowerCase(),
            password: hashedPassword
        } as Partial<IUser>)
    }

    /**
     * Verify password
     */
    async verifyPassword(email: string, password: string): Promise<IUser | null> {
        const user = await this.findByEmailWithPassword(email)
        if (!user || !user.password) return null

        const isValid = await bcrypt.compare(password, user.password)
        if (!isValid) return null

        // Remove password before returning
        delete (user as any).password
        return user
    }

    /**
     * Add address to user
     */
    async addAddress(userId: string, address: IAddress): Promise<IUser | null> {
        const addressWithId = { ...address, _id: new Types.ObjectId() }

        // If this is set as default, unset other defaults
        if (address.isDefault) {
            await this.model.updateOne(
                { _id: userId },
                { $set: { "addresses.$[].isDefault": false } }
            )
        }

        return this.model.findByIdAndUpdate(
            userId,
            { $push: { addresses: addressWithId } },
            { new: true }
        ).lean<IUser>()
    }

    /**
     * Update user address
     */
    async updateAddress(userId: string, addressId: string, address: Partial<IAddress>): Promise<IUser | null> {
        if (address.isDefault) {
            await this.model.updateOne(
                { _id: userId },
                { $set: { "addresses.$[].isDefault": false } }
            )
        }

        return this.model.findOneAndUpdate(
            { _id: userId, "addresses._id": addressId },
            {
                $set: Object.fromEntries(
                    Object.entries(address).map(([k, v]) => [`addresses.$.${k}`, v])
                )
            },
            { new: true }
        ).lean<IUser>()
    }

    /**
     * Delete user address
     */
    async deleteAddress(userId: string, addressId: string): Promise<IUser | null> {
        return this.model.findByIdAndUpdate(
            userId,
            { $pull: { addresses: { _id: addressId } } },
            { new: true }
        ).lean<IUser>()
    }

    /**
     * Add product to wishlist
     */
    async addToWishlist(userId: string, productId: string): Promise<IUser | null> {
        return this.model.findByIdAndUpdate(
            userId,
            { $addToSet: { wishlist: productId } },
            { new: true }
        ).lean<IUser>()
    }

    /**
     * Remove product from wishlist
     */
    async removeFromWishlist(userId: string, productId: string): Promise<IUser | null> {
        return this.model.findByIdAndUpdate(
            userId,
            { $pull: { wishlist: productId } },
            { new: true }
        ).lean<IUser>()
    }

    /**
     * Get wishlist with populated products
     * @deprecated Use WishlistItem model instead
     */
    async getWishlistWithProducts(userId: string): Promise<any[]> {
        const user = await this.model.findById(userId)
            .populate({
                path: "wishlist",
                select: "name price originalPrice images rating category brand slug"
            })
            .lean() as any

        return user?.wishlist || []
    }

    /**
     * Add loyalty points
     */
    async addLoyaltyPoints(userId: string, points: number): Promise<IUser | null> {
        const user = await this.model.findByIdAndUpdate(
            userId,
            { $inc: { loyaltyPoints: points } },
            { new: true }
        ).lean<IUser>()

        // Update tier based on points
        if (user) {
            const newTier = this.calculateLoyaltyTier(user.loyaltyPoints)
            if (newTier !== user.loyaltyTier) {
                return this.updateById(userId, { loyaltyTier: newTier })
            }
        }

        return user
    }

    /**
     * Calculate loyalty tier based on points
     */
    private calculateLoyaltyTier(points: number): string {
        if (points >= 10000) return "platinum"
        if (points >= 5000) return "gold"
        if (points >= 1000) return "silver"
        return "bronze"
    }

    /**
     * Update last login
     */
    async updateLastLogin(userId: string): Promise<void> {
        await this.model.updateOne(
            { _id: userId },
            { lastLogin: new Date() }
        )
    }

    /**
     * Set password reset token
     */
    async setPasswordResetToken(email: string, token: string, expires: Date): Promise<boolean> {
        const result = await this.model.updateOne(
            { email: email.toLowerCase() },
            { resetPasswordToken: token, resetPasswordExpires: expires }
        )
        return result.modifiedCount > 0
    }

    /**
     * Find by reset token
     */
    async findByResetToken(token: string): Promise<IUser | null> {
        return this.model.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: new Date() }
        }).lean<IUser>()
    }

    /**
     * Reset password
     */
    async resetPassword(token: string, newPassword: string): Promise<boolean> {
        const hashedPassword = await bcrypt.hash(newPassword, 12)
        const result = await this.model.updateOne(
            { resetPasswordToken: token, resetPasswordExpires: { $gt: new Date() } },
            {
                password: hashedPassword,
                resetPasswordToken: null,
                resetPasswordExpires: null
            }
        )
        return result.modifiedCount > 0
    }

    /**
     * Get users by role
     */
    async findByRole(role: string, options = { page: 1, limit: 10 }): Promise<any> {
        return this.findPaginated({ role }, options)
    }

    /**
     * Search users
     */
    async search(query: string, options = { page: 1, limit: 10 }): Promise<any> {
        const regex = new RegExp(query, "i")
        return this.findPaginated(
            { $or: [{ name: regex }, { email: regex }, { phone: regex }] },
            options
        )
    }
}

// Export singleton instance
export const userRepository = new UserRepository()
