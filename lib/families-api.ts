/**
 * Families API
 *
 * Family (household) linking for members. Follows the same fetch style as
 * lib/members-api.ts (NEXT_PUBLIC_API_URL, cookie-based auth).
 *
 * All backend responses are shaped { success, ... }.
 */

import type { ChurchGroup, Family, FamilyRole } from "./types"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
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

  return response.json() as Promise<T>
}

export interface FamilySearchResult {
  data: Family[]
  total: number
  page: number
  limit: number
  totalPages: number
}

/**
 * Search families.
 * GET /api/families?search=<q>&page&limit&subCommunity
 */
export async function searchFamilies(
  search: string,
  page = 1,
  limit = 10,
  subCommunity?: string,
): Promise<FamilySearchResult> {
  const params = new URLSearchParams()
  if (search) params.append("search", search)
  if (subCommunity) params.append("subCommunity", subCommunity)
  params.append("page", String(page))
  params.append("limit", String(limit))

  const res = await request<{
    success: boolean
    data: Family[]
    total: number
    page: number
    limit: number
    totalPages: number
  }>(`/api/families?${params.toString()}`, { method: "GET" })

  return {
    data: res.data || [],
    total: res.total || 0,
    page: res.page || page,
    limit: res.limit || limit,
    totalPages: res.totalPages || 0,
  }
}

/**
 * Get a single family by id.
 * GET /api/families/:id
 */
export async function getFamily(id: string): Promise<Family> {
  const res = await request<{ success: boolean; data: Family }>(`/api/families/${id}`, {
    method: "GET",
  })
  return res.data
}

/**
 * Create a new family with an initial member set.
 * POST /api/families { name?, members: [{ memberId, role }] }
 */
export async function createFamily(payload: {
  name?: string
  members: { memberId: string; role: FamilyRole }[]
}): Promise<Family> {
  const res = await request<{ success: boolean; data: Family }>(`/api/families`, {
    method: "POST",
    body: JSON.stringify(payload),
  })
  return res.data
}

/**
 * Add a member to an existing family.
 * POST /api/families/:id/members { memberId, role }
 */
export async function addFamilyMember(
  familyId: string,
  memberId: string,
  role: FamilyRole,
): Promise<Family> {
  const res = await request<{ success: boolean; data: Family }>(
    `/api/families/${familyId}/members`,
    { method: "POST", body: JSON.stringify({ memberId, role }) },
  )
  return res.data
}

/**
 * Remove a member from a family.
 * DELETE /api/families/:id/members/:memberId
 */
export async function removeFamilyMember(familyId: string, memberId: string): Promise<void> {
  await request<{ success: boolean }>(`/api/families/${familyId}/members/${memberId}`, {
    method: "DELETE",
  })
}

/**
 * Minimal member-creation payload for bulk household registration.
 * Mirrors the backend CreateMemberDto required fields.
 */
export interface CreateHouseholdMemberDto {
  fullName: string
  sex: "male" | "female"
  birthDate: string
  phoneNumber: string
  subCommunity: ChurchGroup
  cameByTransfer: boolean
  maritalStatus: "unmarried" | "married" | "divorced" | "widowed"
  paysTithe: "yes" | "no" | "unknown"
  birthYearEthiopian?: number
  seferId?: string
  sefer?: string
  woreda?: string
  nationality?: string
}

/**
 * Register a whole household in one request, creating new members.
 * POST /api/families/household { name?, members: [{ member, role }] }
 */
export async function createHousehold(payload: {
  name?: string
  members: { member: CreateHouseholdMemberDto; role: FamilyRole }[]
}): Promise<Family> {
  const res = await request<{ success: boolean; data: Family }>(`/api/families/household`, {
    method: "POST",
    body: JSON.stringify(payload),
  })
  return res.data
}

export interface FamilyTreeNode {
  _id: string
  fullName: string
  sex?: string
  membershipNumber?: string
  memberPicture?: string
  birthDate?: string
}

export interface FamilyTreeEdge {
  from: string
  to: string
  type: "parent" | "child" | "spouse" | "sibling"
}

export interface FamilyTree {
  rootMemberId: string
  familyId: string
  nodes: FamilyTreeNode[]
  edges: FamilyTreeEdge[]
}

/**
 * Fetch a member's family tree (nodes + relationship edges).
 * GET /api/families/member/:memberId/tree
 */
export async function getFamilyTree(memberId: string): Promise<FamilyTree> {
  const res = await request<{ success: boolean; data: FamilyTree }>(
    `/api/families/member/${memberId}/tree`,
    { method: "GET" },
  )
  return res.data
}

export type NoteTaskStatus = "not_started" | "in_progress" | "done"

export interface FamilyNoteDto {
  _id: string
  familyId:
    | string
    | {
        _id: string
        name?: string
        subCommunity?: string
      }
  body: string
  visibility: "private" | "public"
  status?: NoteTaskStatus
  createdBy: string
  createdByName?: string
  createdAt: string
  updatedAt: string
}

export async function getFamilyNotes(familyId: string): Promise<FamilyNoteDto[]> {
  const res = await request<{ success: boolean; data: FamilyNoteDto[] }>(
    `/api/families/${familyId}/notes`,
  )
  return res.data || []
}

export async function getMyFamilyNotes(): Promise<FamilyNoteDto[]> {
  const res = await request<{ success: boolean; data: FamilyNoteDto[] }>(
    `/api/families/notes/mine`,
  )
  return res.data || []
}

export async function getMyNotedFamilyIds(): Promise<string[]> {
  const res = await request<{ success: boolean; data: string[] }>(
    `/api/families/notes/mine/family-ids`,
  )
  return res.data || []
}

export async function createFamilyNote(
  familyId: string,
  body: string,
  isPublic = false,
  status: NoteTaskStatus = "not_started",
): Promise<FamilyNoteDto> {
  const res = await request<{ success: boolean; data: FamilyNoteDto }>(
    `/api/families/${familyId}/notes`,
    {
      method: "POST",
      body: JSON.stringify({ body, isPublic, status }),
    },
  )
  return res.data
}

export async function updateFamilyNote(
  familyId: string,
  noteId: string,
  data: { body?: string; isPublic?: boolean; status?: NoteTaskStatus },
): Promise<FamilyNoteDto> {
  const res = await request<{ success: boolean; data: FamilyNoteDto }>(
    `/api/families/${familyId}/notes/${noteId}`,
    {
      method: "PATCH",
      body: JSON.stringify(data),
    },
  )
  return res.data
}

export async function deleteFamilyNote(
  familyId: string,
  noteId: string,
): Promise<void> {
  await request(`/api/families/${familyId}/notes/${noteId}`, {
    method: "DELETE",
  })
}
