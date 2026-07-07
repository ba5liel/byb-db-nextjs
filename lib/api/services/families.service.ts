import { apiClient } from "../client"
import type { ApiResponse, FamilyUnitDto } from "../types"

/**
 * Families API Service
 * Family units are derived server-side from member family links
 */

export const familiesService = {
  /** Get all family units */
  async getFamilies(): Promise<ApiResponse<FamilyUnitDto[]>> {
    const response = await apiClient.get<ApiResponse<FamilyUnitDto[]>>("/api/members/families")
    return response.data
  },
}
