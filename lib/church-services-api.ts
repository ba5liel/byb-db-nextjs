/**
 * Church Services API
 * 
 * This module provides all API functions for managing church services/ministries.
 * All endpoints require superAdmin authentication.
 * 
 * Base URL: Configure via NEXT_PUBLIC_API_URL environment variable (defaults to http://localhost:3000)
 */

import type { 
  ChurchService, 
  ServiceType, 
  ServiceEnrollment 
} from "./types"

// API Base URL - can be configured via environment variable
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

/**
 * Helper function to make authenticated API requests
 * Automatically includes credentials (cookies) for session-based auth
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    credentials: 'include', // Important for cookie-based authentication
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  // Handle error responses
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Request failed' }))
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
  }

  const data = await response.json()
  return data.data || data // Return data field if present, otherwise return entire response
}

// ============================================================================
// Type Definitions (re-exported from types.ts for convenience)
// ============================================================================

// Types are imported from ./types.ts

/**
 * Create Church Service DTO
 */
export interface CreateChurchServiceDto {
  serviceName: string
  serviceDescription: string
  type: ServiceType
  service_logo?: string
  leader: string // Member ID
  secretary?: string // Member ID
  leadership_start: Date | string
  leadership_end?: Date | string
  maximum_members_allowed?: number
  meeting_schedule?: string
  meeting_location?: string
  status?: boolean
}

/**
 * Update Church Service DTO (all fields optional)
 */
export interface UpdateChurchServiceDto extends Partial<CreateChurchServiceDto> {}

/**
 * Service Filter DTO
 */
export interface ServiceFilterDto {
  type?: ServiceType
  status?: string | boolean // 'true'/'false' string or boolean
  page?: number
  limit?: number
}

// ServiceEnrollment type is imported from ./types.ts

/**
 * Enroll Member DTO
 */
export interface EnrollMemberDto {
  memberId: string
  roleInService?: string
  notes?: string
}

/**
 * Exit Member DTO
 */
export interface ExitMemberDto {
  memberId: string
  exitReason?: string
}

/**
 * Paginated Response
 */
export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    total: number
    page: number
    limit: number
    pages: number
  }
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Create a new church service/ministry
 * POST /api/church-services
 * 
 * @param serviceData - Service creation data
 * @returns Created service with current member count and available slots
 */
export async function createChurchService(
  serviceData: CreateChurchServiceDto
): Promise<ChurchService> {
  // Convert Date objects to ISO strings if needed
  const payload = {
    ...serviceData,
    leadership_start: serviceData.leadership_start instanceof Date 
      ? serviceData.leadership_start.toISOString() 
      : serviceData.leadership_start,
    leadership_end: serviceData.leadership_end instanceof Date
      ? serviceData.leadership_end.toISOString()
      : serviceData.leadership_end,
  }

  return apiRequest<ChurchService>('/api/church-services', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

/**
 * Get all church services with optional filters and pagination
 * GET /api/church-services
 * 
 * @param filters - Optional filters (type, status, page, limit)
 * @returns Paginated list of services
 */
export async function getChurchServices(
  filters?: ServiceFilterDto
): Promise<PaginatedResponse<ChurchService>> {
  // Build query string
  const params = new URLSearchParams()
  if (filters?.type) params.append('type', filters.type)
  if (filters?.status !== undefined) {
    params.append('status', String(filters.status))
  }
  if (filters?.page) params.append('page', String(filters.page))
  if (filters?.limit) params.append('limit', String(filters.limit))

  const queryString = params.toString()
  const endpoint = `/api/church-services${queryString ? `?${queryString}` : ''}`

  return apiRequest<PaginatedResponse<ChurchService>>(endpoint, {
    method: 'GET',
  })
}

/**
 * Get a single church service by ID
 * GET /api/church-services/:id
 * 
 * @param serviceId - Service ID
 * @returns Service details with current member count and available slots
 */
export async function getChurchServiceById(serviceId: string): Promise<ChurchService> {
  return apiRequest<ChurchService>(`/api/church-services/${serviceId}`, {
    method: 'GET',
  })
}

/**
 * Update a church service
 * PATCH /api/church-services/:id
 * 
 * @param serviceId - Service ID
 * @param serviceData - Partial service data to update
 * @returns Updated service
 */
export async function updateChurchService(
  serviceId: string,
  serviceData: UpdateChurchServiceDto
): Promise<ChurchService> {
  // Convert Date objects to ISO strings if needed
  const payload = {
    ...serviceData,
    leadership_start: serviceData.leadership_start instanceof Date
      ? serviceData.leadership_start.toISOString()
      : serviceData.leadership_start,
    leadership_end: serviceData.leadership_end instanceof Date
      ? serviceData.leadership_end.toISOString()
      : serviceData.leadership_end,
  }

  // Remove undefined values
  Object.keys(payload).forEach(key => {
    if (payload[key as keyof typeof payload] === undefined) {
      delete payload[key as keyof typeof payload]
    }
  })

  return apiRequest<ChurchService>(`/api/church-services/${serviceId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

/**
 * Enroll a member to a church service
 * POST /api/church-services/:id/enroll
 * 
 * Validations:
 * - Member must not already be enrolled in this service
 * - Member must not be enrolled in more than 2 active services
 * - Service must be active
 * - Service must not be at maximum capacity (if limit is set)
 * 
 * @param serviceId - Service ID
 * @param enrollmentData - Enrollment data (memberId, roleInService?, notes?)
 * @returns Created enrollment record
 */
export async function enrollMemberToService(
  serviceId: string,
  enrollmentData: EnrollMemberDto
): Promise<ServiceEnrollment> {
  return apiRequest<ServiceEnrollment>(`/api/church-services/${serviceId}/enroll`, {
    method: 'POST',
    body: JSON.stringify(enrollmentData),
  })
}

/**
 * Exit a member from a church service
 * POST /api/church-services/:id/exit
 * 
 * @param serviceId - Service ID
 * @param exitData - Exit data (memberId, exitReason?)
 * @returns Updated enrollment record with exit date
 */
export async function exitMemberFromService(
  serviceId: string,
  exitData: ExitMemberDto
): Promise<ServiceEnrollment> {
  return apiRequest<ServiceEnrollment>(`/api/church-services/${serviceId}/exit`, {
    method: 'POST',
    body: JSON.stringify(exitData),
  })
}

