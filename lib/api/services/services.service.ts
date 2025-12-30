import { apiClient } from "../client"
import type {
  CreateServiceDto,
  UpdateServiceDto,
  ServiceDto,
  ServiceFilters,
  EnrollMemberDto,
  ExitMemberDto,
  ServiceEnrollmentDto,
  PaginatedResponse,
  ApiResponse,
} from "../types"

/**
 * Church Services API Service
 * Handles all church service-related API calls
 */

export const servicesService = {
  /**
   * Get paginated list of services with filters
   */
  async getServices(filters?: ServiceFilters): Promise<PaginatedResponse<ServiceDto>> {
    const response = await apiClient.get<PaginatedResponse<ServiceDto>>("/api/church-services", {
      params: filters,
    })
    return response.data
  },

  /**
   * Get a single service by ID
   */
  async getServiceById(id: string): Promise<ApiResponse<ServiceDto>> {
    const response = await apiClient.get<ApiResponse<ServiceDto>>(`/api/church-services/${id}`)
    return response.data
  },

  /**
   * Create a new service
   */
  async createService(data: CreateServiceDto): Promise<ApiResponse<ServiceDto>> {
    const response = await apiClient.post<ApiResponse<ServiceDto>>("/api/church-services", data)
    return response.data
  },

  /**
   * Update a service
   */
  async updateService(id: string, data: UpdateServiceDto): Promise<ApiResponse<ServiceDto>> {
    const response = await apiClient.patch<ApiResponse<ServiceDto>>(
      `/api/church-services/${id}`,
      data
    )
    return response.data
  },

  /**
   * Delete a service
   */
  async deleteService(id: string): Promise<ApiResponse<void>> {
    const response = await apiClient.delete<ApiResponse<void>>(`/api/church-services/${id}`)
    return response.data
  },

  /**
   * Enroll a member to a service
   */
  async enrollMember(serviceId: string, data: EnrollMemberDto): Promise<ApiResponse<ServiceEnrollmentDto>> {
    const response = await apiClient.post<ApiResponse<ServiceEnrollmentDto>>(
      `/api/church-services/${serviceId}/enroll`,
      data
    )
    return response.data
  },

  /**
   * Exit a member from a service
   */
  async exitMember(serviceId: string, data: ExitMemberDto): Promise<ApiResponse<ServiceEnrollmentDto>> {
    const response = await apiClient.post<ApiResponse<ServiceEnrollmentDto>>(
      `/api/church-services/${serviceId}/exit`,
      data
    )
    return response.data
  },
}

