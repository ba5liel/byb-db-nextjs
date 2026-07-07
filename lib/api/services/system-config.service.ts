import { apiClient } from "../client"
import type {
  SystemConfigDto,
  ConfigOptionItem,
  AgeGroupDefinition,
  ServiceEnrollmentRules,
  ConfigListResource,
} from "../types"

/**
 * System Configuration API Service
 * Backend routes live under /api/system-admin/config
 */

const BASE = "/api/system-admin/config"

export const systemConfigService = {
  /** Get the entire system configuration */
  async getConfig(): Promise<SystemConfigDto> {
    const response = await apiClient.get<SystemConfigDto>(BASE)
    return response.data
  },

  // ---- Age groups (range-based, keyed) ----
  async getAgeGroups(): Promise<AgeGroupDefinition[]> {
    const response = await apiClient.get<AgeGroupDefinition[]>(`${BASE}/age-groups`)
    return response.data
  },

  async addAgeGroup(item: AgeGroupDefinition): Promise<SystemConfigDto> {
    const response = await apiClient.post<SystemConfigDto>(`${BASE}/age-groups`, item)
    return response.data
  },

  async updateAgeGroup(key: string, item: Partial<AgeGroupDefinition>): Promise<SystemConfigDto> {
    const response = await apiClient.put<SystemConfigDto>(`${BASE}/age-groups/${key}`, item)
    return response.data
  },

  async deleteAgeGroup(key: string): Promise<SystemConfigDto> {
    const response = await apiClient.delete<SystemConfigDto>(`${BASE}/age-groups/${key}`)
    return response.data
  },

  // ---- Generic option lists (minister-roles, service-types, education-levels, job-types, marital-status) ----
  async getOptionList(resource: ConfigListResource): Promise<ConfigOptionItem[]> {
    const response = await apiClient.get<ConfigOptionItem[]>(`${BASE}/${resource}`)
    return response.data
  },

  async addOptionItem(
    resource: ConfigListResource,
    item: ConfigOptionItem
  ): Promise<SystemConfigDto> {
    const response = await apiClient.post<SystemConfigDto>(`${BASE}/${resource}`, item)
    return response.data
  },

  async updateOptionItem(
    resource: ConfigListResource,
    key: string,
    item: Partial<ConfigOptionItem>
  ): Promise<SystemConfigDto> {
    const response = await apiClient.put<SystemConfigDto>(`${BASE}/${resource}/${key}`, item)
    return response.data
  },

  async deleteOptionItem(resource: ConfigListResource, key: string): Promise<SystemConfigDto> {
    const response = await apiClient.delete<SystemConfigDto>(`${BASE}/${resource}/${key}`)
    return response.data
  },

  async reorderOptionList(
    resource: ConfigListResource,
    orderedKeys: string[]
  ): Promise<SystemConfigDto> {
    const response = await apiClient.put<SystemConfigDto>(`${BASE}/${resource}/reorder`, {
      orderedKeys,
    })
    return response.data
  },

  // ---- Service enrollment rules ----
  async getEnrollmentRules(): Promise<ServiceEnrollmentRules> {
    const response = await apiClient.get<ServiceEnrollmentRules>(`${BASE}/enrollment-rules`)
    return response.data
  },

  async updateEnrollmentRules(
    rules: Partial<ServiceEnrollmentRules>
  ): Promise<SystemConfigDto> {
    const response = await apiClient.put<SystemConfigDto>(`${BASE}/enrollment-rules`, rules)
    return response.data
  },
}
