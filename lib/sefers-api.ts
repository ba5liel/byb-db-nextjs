/**
 * Sefers API
 *
 * Fetches the church "sefer" (neighborhood/zone) list used to derive a member's
 * church group. Follows the same fetch style as lib/members-api.ts
 * (NEXT_PUBLIC_API_URL, cookie-based auth via credentials: 'include').
 */

import type { ChurchGroup, Sefer } from "./types"

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

/**
 * Get all sefers. Pass includeInactive for the admin view.
 * GET /api/sefers -> { success: true, data: Sefer[] }
 */
export async function getSefers(includeInactive = false): Promise<Sefer[]> {
  const query = includeInactive ? "?includeInactive=true" : ""
  const data = await request<{ success: boolean; data: Sefer[] }>(`/api/sefers${query}`, {
    method: "GET",
  })
  return data.data || []
}

export interface SeferPayload {
  name: string
  nameAmharic?: string
  churchGroup: ChurchGroup
  isActive?: boolean
}

/**
 * Create a sefer (superadmin-only, backend-enforced).
 * POST /api/sefers
 */
export async function createSefer(payload: SeferPayload): Promise<Sefer> {
  const res = await request<{ success: boolean; data: Sefer }>(`/api/sefers`, {
    method: "POST",
    body: JSON.stringify(payload),
  })
  return res.data
}

/**
 * Update a sefer (superadmin-only, backend-enforced).
 * PATCH /api/sefers/:id
 */
export async function updateSefer(id: string, payload: Partial<SeferPayload>): Promise<Sefer> {
  const res = await request<{ success: boolean; data: Sefer }>(`/api/sefers/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  })
  return res.data
}

/**
 * Delete a sefer (superadmin-only, backend-enforced).
 * DELETE /api/sefers/:id
 */
export async function deleteSefer(id: string): Promise<void> {
  await request<{ success: boolean }>(`/api/sefers/${id}`, { method: "DELETE" })
}
