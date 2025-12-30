import { apiClient } from "../client"
import type {
  CreateMemberDto,
  UpdateMemberDto,
  MemberDto,
  MemberFilters,
  MemberStatistics,
  MemberSearchResult,
  PaginatedResponse,
  ApiResponse,
} from "../types"

/**
 * Members API Service
 * Handles all member-related API calls
 */

export const membersService = {
  /**
   * Get paginated list of members with filters
   */
  async getMembers(filters?: MemberFilters): Promise<PaginatedResponse<MemberDto>> {
    const response = await apiClient.get<PaginatedResponse<MemberDto>>("/api/members", {
      params: filters,
    })
    return response.data
  },

  /**
   * Get a single member by ID
   */
  async getMemberById(id: string): Promise<ApiResponse<MemberDto>> {
    const response = await apiClient.get<ApiResponse<MemberDto>>(`/api/members/${id}`)
    return response.data
  },

  /**
   * Create a new member
   */
  async createMember(data: CreateMemberDto): Promise<ApiResponse<MemberDto>> {
    const response = await apiClient.post<ApiResponse<MemberDto>>("/api/members", data)
    return response.data
  },

  /**
   * Update a member
   */
  async updateMember(id: string, data: UpdateMemberDto): Promise<ApiResponse<MemberDto>> {
    const response = await apiClient.patch<ApiResponse<MemberDto>>(`/api/members/${id}`, data)
    return response.data
  },

  /**
   * Delete a member (soft delete)
   */
  async deleteMember(id: string): Promise<ApiResponse<void>> {
    const response = await apiClient.delete<ApiResponse<void>>(`/api/members/${id}`)
    return response.data
  },

  /**
   * Restore a removed member
   */
  async restoreMember(id: string): Promise<ApiResponse<MemberDto>> {
    const response = await apiClient.post<ApiResponse<MemberDto>>(`/api/members/${id}/restore`)
    return response.data
  },

  /**
   * Update member status
   */
  async updateMemberStatus(
    id: string,
    status: string,
    reason?: string
  ): Promise<ApiResponse<MemberDto>> {
    const response = await apiClient.patch<ApiResponse<MemberDto>>(`/api/members/${id}/status`, {
      memberStatus: status,
      removalReason: reason,
    })
    return response.data
  },

  /**
   * Search members by name, phone, or membership number
   */
  async searchMembers(query: string, limit?: number): Promise<ApiResponse<MemberSearchResult[]>> {
    const response = await apiClient.get<ApiResponse<MemberSearchResult[]>>("/api/members/search", {
      params: { q: query, limit },
    })
    return response.data
  },

  /**
   * Get member statistics
   */
  async getMemberStatistics(): Promise<ApiResponse<MemberStatistics>> {
    const response = await apiClient.get<ApiResponse<MemberStatistics>>("/api/members/statistics")
    return response.data
  },
}

