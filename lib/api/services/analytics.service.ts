import { apiClient } from "../client"
import type {
  DashboardStatistics,
  SubCommunityStatistics,
  RegistrationTrends,
  ServiceStatistics,
  FinancialStatistics,
  ApiResponse,
} from "../types"

/**
 * Analytics API Service
 * Handles all analytics and statistics API calls
 */

export const analyticsService = {
  /**
   * Get dashboard statistics
   */
  async getDashboardStats(): Promise<ApiResponse<DashboardStatistics>> {
    const response = await apiClient.get<ApiResponse<DashboardStatistics>>("/api/analytics/dashboard")
    return response.data
  },

  /**
   * Get sub-community specific statistics
   */
  async getSubCommunityStats(subCommunity: string): Promise<ApiResponse<SubCommunityStatistics>> {
    const response = await apiClient.get<ApiResponse<SubCommunityStatistics>>(
      `/api/analytics/sub-community/${subCommunity}`
    )
    return response.data
  },

  /**
   * Get registration trends
   */
  async getRegistrationTrends(months?: number): Promise<ApiResponse<RegistrationTrends>> {
    const response = await apiClient.get<ApiResponse<RegistrationTrends>>(
      "/api/analytics/registration-trends",
      {
        params: { months },
      }
    )
    return response.data
  },

  /**
   * Get service enrollment statistics
   */
  async getServiceStats(): Promise<ApiResponse<ServiceStatistics>> {
    const response = await apiClient.get<ApiResponse<ServiceStatistics>>(
      "/api/analytics/service-stats"
    )
    return response.data
  },

  /**
   * Get financial statistics
   */
  async getFinancialStats(): Promise<ApiResponse<FinancialStatistics>> {
    const response = await apiClient.get<ApiResponse<FinancialStatistics>>(
      "/api/analytics/financial-stats"
    )
    return response.data
  },
}

