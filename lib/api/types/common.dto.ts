/**
 * Common DTOs and types shared across API modules
 */

/**
 * Generic API response wrapper
 */
export interface ApiResponse<T> {
  success: boolean
  message?: string
  data?: T
  error?: string
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page?: number
  limit?: number
}

/**
 * Pagination metadata in response
 */
export interface PaginationMeta {
  total: number
  page: number
  limit: number
  pages: number
}

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  pagination: PaginationMeta
}

/**
 * Filter base interface
 */
export interface FilterParams {
  search?: string
  [key: string]: string | number | boolean | undefined
}

