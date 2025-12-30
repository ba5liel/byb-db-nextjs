import { apiClient } from "../client"
import type {
  CreateMinisterDto,
  UpdateMinisterDto,
  MinisterDto,
  MinisterFilters,
  PaginatedResponse,
  ApiResponse,
} from "../types"

/**
 * Ministers API Service
 * Handles all minister-related API calls
 */

export const ministersService = {
  /**
   * Get paginated list of ministers with filters
   */
  async getMinisters(filters?: MinisterFilters): Promise<PaginatedResponse<MinisterDto>> {
    const response = await apiClient.get<PaginatedResponse<MinisterDto>>("/api/ministers", {
      params: filters,
    })
    return response.data
  },

  /**
   * Get a single minister by ID
   */
  async getMinisterById(id: string): Promise<ApiResponse<MinisterDto>> {
    const response = await apiClient.get<ApiResponse<MinisterDto>>(`/api/ministers/${id}`)
    return response.data
  },

  /**
   * Create a new minister
   */
  async createMinister(data: CreateMinisterDto): Promise<ApiResponse<MinisterDto>> {
    const response = await apiClient.post<ApiResponse<MinisterDto>>("/api/ministers", data)
    return response.data
  },

  /**
   * Update a minister
   */
  async updateMinister(id: string, data: UpdateMinisterDto): Promise<ApiResponse<MinisterDto>> {
    const response = await apiClient.patch<ApiResponse<MinisterDto>>(`/api/ministers/${id}`, data)
    return response.data
  },

  /**
   * Delete a minister
   */
  async deleteMinister(id: string): Promise<ApiResponse<void>> {
    const response = await apiClient.delete<ApiResponse<void>>(`/api/ministers/${id}`)
    return response.data
  },

  /**
   * Update minister status
   */
  async updateMinisterStatus(
    id: string,
    status: string,
    reason?: string
  ): Promise<ApiResponse<MinisterDto>> {
    const response = await apiClient.patch<ApiResponse<MinisterDto>>(`/api/ministers/${id}/status`, {
      status,
      statusChangeReason: reason,
    })
    return response.data
  },
}
