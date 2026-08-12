/**
 * Members API
 *
 * This module provides all API functions for member management.
 * Uses session cookie-based authentication.
 *
 * Base URL: Configure via NEXT_PUBLIC_API_URL environment variable (defaults to http://localhost:3000)
 */

// API Base URL - can be configured via environment variable
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

/**
 * Generic API request helper
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

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Request failed' }))
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
  }

  // Return the full JSON body. Callers decide whether to use `.data`.
  // Unwrapping here caused getMembers to double-unwrap and always get [].
  return (await response.json()) as T
}

/**
 * Member Filter DTO
 */
export interface MemberFilterDto {
  search?: string
  subCommunity?: 'jemmo' | 'bethel' | 'weyira' | 'alfa' | 'alpha'
  ageGroup?: 'children' | 'teenagers' | 'youth' | 'adults' | 'seniors'
  sex?: 'male' | 'female'
  memberStatus?: 'active' | 'inactive' | 'removed' | 'transferred_out' | 'deceased'
  leftOnly?: boolean
  page?: number
  limit?: number
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

/**
 * Get all members with optional filters and pagination
 * GET /api/members
 * Requires: member:read permission
 *
 * @param filters - Optional filters (search, subCommunity, ageGroup, sex, memberStatus, page, limit)
 * @returns Paginated list of members
 */
export async function getMembers(
  filters?: MemberFilterDto
): Promise<PaginatedResponse<any>> {
  // Build query string
  const params = new URLSearchParams()
  if (filters?.search) params.append('search', filters.search)
  if (filters?.subCommunity) params.append('subCommunity', filters.subCommunity)
  if (filters?.ageGroup) params.append('ageGroup', filters.ageGroup)
  if (filters?.sex) params.append('sex', filters.sex)
  if (filters?.memberStatus) params.append('memberStatus', filters.memberStatus)
  if (filters?.leftOnly) params.append('leftOnly', 'true')
  if (filters?.page) params.append('page', String(filters.page))
  if (filters?.limit) params.append('limit', String(filters.limit))

  const queryString = params.toString()
  const endpoint = `/api/members${queryString ? `?${queryString}` : ''}`

  const response = await apiRequest<{ success: boolean; data: any[]; pagination: any }>(endpoint, {
    method: 'GET',
  })

  // Transform to match expected format
  return {
    data: response.data || [],
    pagination: response.pagination || { total: 0, page: 1, limit: 20, pages: 0 },
  }
}

/**
 * Get a single member by ID
 * GET /api/members/:id
 * Requires: member:read permission
 *
 * @param memberId - Member ID
 * @returns Member details
 */
export async function getMemberById(memberId: string): Promise<any> {
  const response = await apiRequest<{ success: boolean; data: any }>(`/api/members/${memberId}`, {
    method: 'GET',
  })
  return response.data || response
}

/**
 * Create a new member
 * POST /api/members
 * Requires: member:create permission
 *
 * @param memberData - Member creation data
 * @returns Created member
 */
export async function createMember(memberData: any): Promise<any> {
  const response = await apiRequest<{ success: boolean; data: any; message?: string }>('/api/members', {
    method: 'POST',
    body: JSON.stringify(memberData),
  })
  return response.data || response
}

/**
 * Update a member
 * PATCH /api/members/:id
 * Requires: member:update permission
 *
 * @param memberId - Member ID
 * @param memberData - Partial member data to update
 * @returns Updated member
 */
export async function updateMember(memberId: string, memberData: any): Promise<any> {
  const response = await apiRequest<{ success: boolean; data: any; message?: string }>(`/api/members/${memberId}`, {
    method: 'PATCH',
    body: JSON.stringify(memberData),
  })
  return response.data || response
}

/**
 * Delete a member (soft delete)
 * DELETE /api/members/:id
 * Requires: member:delete permission
 *
 * @param memberId - Member ID
 * @returns Success response
 */
export async function deleteMember(memberId: string): Promise<{ success: boolean; message?: string }> {
  return apiRequest<{ success: boolean; message?: string }>(`/api/members/${memberId}`, {
    method: 'DELETE',
  })
}

/**
 * Search members (for auto-suggest)
 * GET /api/members/search?q=query&limit=10
 * Requires: member:read permission
 *
 * @param query - Search query
 * @param limit - Maximum number of results (default: 10)
 * @returns Search results
 */
export async function searchMembers(query: string, limit: number = 10): Promise<any[]> {
  const response = await apiRequest<{ success: boolean; data: any[] }>(`/api/members/search?q=${encodeURIComponent(query)}&limit=${limit}`, {
    method: 'GET',
  })
  return response.data || []
}

/**
 * Get member statistics
 * GET /api/members/statistics
 * Requires: member:read permission
 *
 * @returns Member statistics
 */
export async function getMemberStatistics(): Promise<any> {
  const response = await apiRequest<{ success: boolean; data: any }>('/api/members/statistics', {
    method: 'GET',
  })
  return response.data || response
}

export async function updateMemberStatus(
  memberId: string,
  status: 'active' | 'inactive' | 'removed' | 'transferred_out' | 'deceased',
  reason?: string,
): Promise<any> {
  const response = await apiRequest<{ success: boolean; data: any }>(
    `/api/members/${memberId}/status`,
    {
      method: 'PATCH',
      body: JSON.stringify({ status, reason }),
    },
  )
  return response.data || response
}

export async function restoreMember(memberId: string): Promise<any> {
  const response = await apiRequest<{ success: boolean; data: any }>(
    `/api/members/${memberId}/restore`,
    { method: 'POST' },
  )
  return response.data || response
}

export type NoteTaskStatus = 'not_started' | 'in_progress' | 'done'

export interface MemberNoteDto {
  _id: string
  memberId:
    | string
    | {
        _id: string
        fullName?: string
        phoneNumber?: string
        memberStatus?: string
        membershipNumber?: string
      }
  body: string
  visibility: 'private' | 'public'
  status?: NoteTaskStatus
  createdBy: string
  createdByName?: string
  createdAt: string
  updatedAt: string
}

export async function getMemberNotes(memberId: string): Promise<MemberNoteDto[]> {
  const response = await apiRequest<{ success: boolean; data: MemberNoteDto[] }>(
    `/api/members/${memberId}/notes`,
    { method: 'GET' },
  )
  return response.data || []
}

export async function getMyNotes(): Promise<MemberNoteDto[]> {
  const response = await apiRequest<{ success: boolean; data: MemberNoteDto[] }>(
    `/api/members/notes/mine`,
    { method: 'GET' },
  )
  return response.data || []
}

export async function getMyNotedMemberIds(): Promise<string[]> {
  const response = await apiRequest<{ success: boolean; data: string[] }>(
    `/api/members/notes/mine/member-ids`,
    { method: 'GET' },
  )
  return response.data || []
}

export async function createMemberNote(
  memberId: string,
  body: string,
  isPublic = false,
  status: NoteTaskStatus = 'not_started',
): Promise<MemberNoteDto> {
  const response = await apiRequest<{ success: boolean; data: MemberNoteDto }>(
    `/api/members/${memberId}/notes`,
    {
      method: 'POST',
      body: JSON.stringify({ body, isPublic, status }),
    },
  )
  return response.data
}

export async function updateMemberNote(
  memberId: string,
  noteId: string,
  data: { body?: string; isPublic?: boolean; status?: NoteTaskStatus },
): Promise<MemberNoteDto> {
  const response = await apiRequest<{ success: boolean; data: MemberNoteDto }>(
    `/api/members/${memberId}/notes/${noteId}`,
    {
      method: 'PATCH',
      body: JSON.stringify(data),
    },
  )
  return response.data
}

export async function deleteMemberNote(
  memberId: string,
  noteId: string,
): Promise<void> {
  await apiRequest<{ success: boolean }>(
    `/api/members/${memberId}/notes/${noteId}`,
    { method: 'DELETE' },
  )
}

