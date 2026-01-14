/**
 * Base Service
 * Abstract service pattern for business logic
 * Services coordinate between repositories and external systems
 */

import { IApiResponse, IPaginatedResponse, IPaginationOptions } from "@/lib/types/entities"
import { BaseRepository } from "@/lib/repositories/base.repository"
import { Document, FilterQuery } from "mongoose"

export abstract class BaseService<T extends Document, R extends BaseRepository<T>> {
    protected repository: R

    constructor(repository: R) {
        this.repository = repository
    }

    /**
     * Get by ID with error handling
     */
    async getById(id: string): Promise<T | null> {
        return this.repository.findById(id)
    }

    /**
     * Get all with pagination
     */
    async getAll(
        filter: FilterQuery<T> = {},
        options: IPaginationOptions = { page: 1, limit: 10 }
    ): Promise<IPaginatedResponse<T>> {
        return this.repository.findPaginated(filter, options)
    }

    /**
     * Create with validation
     */
    async create(data: Partial<T>): Promise<T> {
        return this.repository.create(data)
    }

    /**
     * Update with existence check
     */
    async update(id: string, data: Partial<T>): Promise<T | null> {
        const existing = await this.repository.findById(id)
        if (!existing) return null
        return this.repository.updateById(id, data)
    }

    /**
     * Delete with existence check
     */
    async delete(id: string): Promise<boolean> {
        return this.repository.deleteById(id)
    }

    /**
     * Soft delete
     */
    async softDelete(id: string): Promise<T | null> {
        return this.repository.softDelete(id)
    }

    /**
     * Check if exists
     */
    async exists(filter: FilterQuery<T>): Promise<boolean> {
        return this.repository.exists(filter)
    }

    /**
     * Count documents
     */
    async count(filter: FilterQuery<T> = {}): Promise<number> {
        return this.repository.count(filter)
    }
}
