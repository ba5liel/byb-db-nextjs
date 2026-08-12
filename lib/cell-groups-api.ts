/**
 * Cell Groups API client
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"

async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  })
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: "Request failed" }))
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
  }
  return (await response.json()) as T
}

export type SubCommunityId = "jemmo" | "bethel" | "weyira" | "alpha"

export interface CellGroupMember {
  _id: string
  fullName?: string
  phoneNumber?: string
  membershipNumber?: string
  sex?: string
  subCommunity?: string
  memberStatus?: string
}

export interface CellGroup {
  _id: string
  name: string
  subCommunity: SubCommunityId
  memberIds: CellGroupMember[] | string[]
  isActive?: boolean
  createdAt?: string
  updatedAt?: string
}

export interface CellGroupStats {
  total: number
  totalMembers: number
  bySubCommunity: Record<string, { count: number; members: number }>
}

export async function getCellGroups(subCommunity?: string): Promise<CellGroup[]> {
  const params = new URLSearchParams()
  if (subCommunity) params.set("subCommunity", subCommunity)
  const qs = params.toString()
  const res = await apiRequest<{ success: boolean; data: CellGroup[] }>(
    `/api/cell-groups${qs ? `?${qs}` : ""}`,
  )
  return res.data || []
}

export async function getCellGroup(id: string): Promise<CellGroup> {
  const res = await apiRequest<{ success: boolean; data: CellGroup }>(
    `/api/cell-groups/${id}`,
  )
  return res.data
}

export async function getCellGroupStats(): Promise<CellGroupStats> {
  const res = await apiRequest<{ success: boolean; data: CellGroupStats }>(
    `/api/cell-groups/stats`,
  )
  return res.data
}

export async function getAvailableCellMembers(
  subCommunity: SubCommunityId,
  search?: string,
  limit = 20,
): Promise<CellGroupMember[]> {
  const params = new URLSearchParams({ subCommunity, limit: String(limit) })
  if (search?.trim()) params.set("search", search.trim())
  const res = await apiRequest<{ success: boolean; data: CellGroupMember[] }>(
    `/api/cell-groups/available-members?${params}`,
  )
  return res.data || []
}

export async function createCellGroup(data: {
  name: string
  subCommunity: SubCommunityId
  memberIds?: string[]
}): Promise<CellGroup> {
  const res = await apiRequest<{ success: boolean; data: CellGroup }>(
    `/api/cell-groups`,
    { method: "POST", body: JSON.stringify(data) },
  )
  return res.data
}

export async function updateCellGroup(
  id: string,
  data: { name?: string; subCommunity?: SubCommunityId; isActive?: boolean },
): Promise<CellGroup> {
  const res = await apiRequest<{ success: boolean; data: CellGroup }>(
    `/api/cell-groups/${id}`,
    { method: "PATCH", body: JSON.stringify(data) },
  )
  return res.data
}

export async function addCellGroupMembers(
  id: string,
  memberIds: string[],
): Promise<CellGroup> {
  const res = await apiRequest<{ success: boolean; data: CellGroup }>(
    `/api/cell-groups/${id}/members`,
    { method: "POST", body: JSON.stringify({ memberIds }) },
  )
  return res.data
}

export async function removeCellGroupMember(
  id: string,
  memberId: string,
): Promise<CellGroup> {
  const res = await apiRequest<{ success: boolean; data: CellGroup }>(
    `/api/cell-groups/${id}/members/${memberId}`,
    { method: "DELETE" },
  )
  return res.data
}

export async function deleteCellGroup(id: string): Promise<void> {
  await apiRequest(`/api/cell-groups/${id}`, { method: "DELETE" })
}
