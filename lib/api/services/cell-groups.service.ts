import { apiClient } from "../client"
import type {
  CellGroupDto,
  CellGroupFilters,
  CreateCellGroupDto,
  UpdateCellGroupDto,
  CommunityOverviewDto,
  ApiResponse,
  PaginatedResponse,
} from "../types"

export const cellGroupsService = {
  async getCellGroups(filters?: CellGroupFilters): Promise<PaginatedResponse<CellGroupDto>> {
    const response = await apiClient.get<PaginatedResponse<CellGroupDto>>("/api/cell-groups", {
      params: filters,
    })
    return response.data
  },

  async getCellGroupById(id: string): Promise<ApiResponse<CellGroupDto>> {
    const response = await apiClient.get<ApiResponse<CellGroupDto>>(`/api/cell-groups/${id}`)
    return response.data
  },

  async createCellGroup(data: CreateCellGroupDto): Promise<ApiResponse<CellGroupDto>> {
    const response = await apiClient.post<ApiResponse<CellGroupDto>>("/api/cell-groups", data)
    return response.data
  },

  async updateCellGroup(id: string, data: UpdateCellGroupDto): Promise<ApiResponse<CellGroupDto>> {
    const response = await apiClient.patch<ApiResponse<CellGroupDto>>(`/api/cell-groups/${id}`, data)
    return response.data
  },

  async deleteCellGroup(id: string): Promise<ApiResponse<void>> {
    const response = await apiClient.delete<ApiResponse<void>>(`/api/cell-groups/${id}`)
    return response.data
  },

  async getCommunityOverview(subCommunity: string): Promise<ApiResponse<CommunityOverviewDto>> {
    const response = await apiClient.get<ApiResponse<CommunityOverviewDto>>(
      `/api/cell-groups/community/${subCommunity}`
    )
    return response.data
  },
}
