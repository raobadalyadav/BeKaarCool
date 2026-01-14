/**
 * Search History Model
 * For tracking recent and popular searches
 */

import mongoose, { Document, Model } from "mongoose"

export interface ISearchHistory extends Document {
    user?: mongoose.Types.ObjectId
    query: string
    category?: string
    resultsCount: number
    sessionId?: string
    createdAt: Date
}

interface ISearchHistoryModel extends Model<ISearchHistory> {
    getPopularSearches(limit?: number): Promise<{ query: string; count: number }[]>
    getRecentSearches(userId: string, limit?: number): Promise<string[]>
    recordSearch(query: string, userId?: string, resultsCount?: number): Promise<ISearchHistory>
}

const searchHistorySchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    query: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
    },
    category: String,
    resultsCount: {
        type: Number,
        default: 0
    },
    sessionId: String
}, {
    timestamps: true
})

// Indexes
searchHistorySchema.index({ query: 1 })
searchHistorySchema.index({ user: 1, createdAt: -1 })
searchHistorySchema.index({ createdAt: -1 })

// Get popular searches (aggregated)
searchHistorySchema.statics.getPopularSearches = async function (limit = 10) {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    return this.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo } } },
        {
            $group: {
                _id: "$query",
                count: { $sum: 1 }
            }
        },
        { $sort: { count: -1 } },
        { $limit: limit },
        { $project: { _id: 0, query: "$_id", count: 1 } }
    ])
}

// Get recent searches for a user
searchHistorySchema.statics.getRecentSearches = async function (userId: string, limit = 10) {
    const searches = await this.find({ user: userId })
        .sort({ createdAt: -1 })
        .limit(limit * 2) // Get more to filter duplicates
        .select("query")

    // Remove duplicates
    const unique: string[] = []
    for (const s of searches) {
        if (!unique.includes(s.query) && unique.length < limit) {
            unique.push(s.query)
        }
    }
    return unique
}

// Record a search
searchHistorySchema.statics.recordSearch = async function (
    query: string,
    userId?: string,
    resultsCount = 0
) {
    return this.create({
        query: query.toLowerCase().trim(),
        user: userId ? new mongoose.Types.ObjectId(userId) : undefined,
        resultsCount
    })
}

export const SearchHistory = (mongoose.models.SearchHistory as ISearchHistoryModel) ||
    mongoose.model<ISearchHistory, ISearchHistoryModel>("SearchHistory", searchHistorySchema)
