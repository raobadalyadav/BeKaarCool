/**
 * Base Repository
 * Abstract repository pattern for database operations
 * Provides common CRUD operations with type safety
 */

import { Model, FilterQuery, UpdateQuery, Types, HydratedDocument } from "mongoose"
import { IPaginationOptions, IPaginatedResponse } from "@/lib/types/entities"

export interface IBaseRepository<T> {
    findById(id: string): Promise<T | null>
    findOne(filter: FilterQuery<T>): Promise<T | null>
    findAll(filter?: FilterQuery<T>): Promise<T[]>
    findPaginated(filter: FilterQuery<T>, options: IPaginationOptions): Promise<IPaginatedResponse<T>>
    create(data: Partial<T>): Promise<T>
    updateById(id: string, data: UpdateQuery<T>): Promise<T | null>
    deleteById(id: string): Promise<boolean>
    count(filter?: FilterQuery<T>): Promise<number>
    exists(filter: FilterQuery<T>): Promise<boolean>
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export abstract class BaseRepository<T = any> implements IBaseRepository<T> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    protected model: Model<any>

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(model: Model<any>) {
        this.model = model
    }

    /**
     * Find a document by ID
     */
    async findById(id: string): Promise<T | null> {
        if (!this.isValidObjectId(id)) return null
        return this.model.findById(id).lean<T>()
    }

    /**
     * Find a single document by filter
     */
    async findOne(filter: FilterQuery<T>): Promise<T | null> {
        return this.model.findOne(filter).lean<T>()
    }

    /**
     * Find all documents matching filter
     */
    async findAll(filter: FilterQuery<T> = {}): Promise<T[]> {
        return this.model.find(filter).lean<T[]>()
    }

    /**
     * Find documents with pagination
     */
    async findPaginated(
        filter: FilterQuery<T> = {},
        options: IPaginationOptions
    ): Promise<IPaginatedResponse<T>> {
        const { page = 1, limit = 10, sort = { createdAt: -1 } } = options
        const skip = (page - 1) * limit

        const [data, total] = await Promise.all([
            this.model.find(filter).sort(sort).skip(skip).limit(limit).lean<T[]>(),
            this.model.countDocuments(filter)
        ])

        const pages = Math.ceil(total / limit)

        return {
            data,
            pagination: {
                page,
                limit,
                total,
                pages,
                hasNext: page < pages,
                hasPrev: page > 1
            }
        }
    }

    /**
     * Create a new document
     */
    async create(data: Partial<T>): Promise<T> {
        const doc = new this.model(data)
        await doc.save()
        return doc.toObject() as T
    }

    /**
     * Update a document by ID
     */
    async updateById(id: string, data: UpdateQuery<T>): Promise<T | null> {
        if (!this.isValidObjectId(id)) return null
        return this.model.findByIdAndUpdate(
            id,
            { ...data, updatedAt: new Date() },
            { new: true, runValidators: true }
        ).lean<T>()
    }

    /**
     * Delete a document by ID
     */
    async deleteById(id: string): Promise<boolean> {
        if (!this.isValidObjectId(id)) return false
        const result = await this.model.findByIdAndDelete(id)
        return !!result
    }

    /**
     * Count documents matching filter
     */
    async count(filter: FilterQuery<T> = {}): Promise<number> {
        return this.model.countDocuments(filter)
    }

    /**
     * Check if document exists
     */
    async exists(filter: FilterQuery<T>): Promise<boolean> {
        const doc = await this.model.exists(filter)
        return !!doc
    }

    /**
     * Soft delete (mark as inactive)
     */
    async softDelete(id: string): Promise<T | null> {
        return this.updateById(id, { isActive: false } as UpdateQuery<T>)
    }

    /**
     * Bulk create documents
     */
    async bulkCreate(data: Partial<T>[]): Promise<T[]> {
        const docs = await this.model.insertMany(data)
        return docs.map(doc => doc.toObject()) as T[]
    }

    /**
     * Bulk update documents
     */
    async bulkUpdate(filter: FilterQuery<T>, data: UpdateQuery<T>): Promise<number> {
        const result = await this.model.updateMany(
            filter,
            { ...data, updatedAt: new Date() }
        )
        return result.modifiedCount
    }

    /**
     * Validate MongoDB ObjectId
     */
    protected isValidObjectId(id: string): boolean {
        return Types.ObjectId.isValid(id)
    }

    /**
     * Get aggregation pipeline result
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async aggregate<R = unknown>(pipeline: any[]): Promise<R[]> {
        return this.model.aggregate(pipeline)
    }
}
