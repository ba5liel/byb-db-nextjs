/**
 * Members Excel import API
 * POST /api/members/import (multipart/form-data)
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"

export interface ImportRowResult {
  row: number
  fullName?: string
  status: "created" | "skipped" | "error"
  membershipNumber?: string
  memberId?: string
  message?: string
}

export interface ImportMembersResult {
  totalRows: number
  created: number
  skipped: number
  failed: number
  dryRun: boolean
  results: ImportRowResult[]
}

export async function importMembersFromExcel(options: {
  file: File
  dryRun?: boolean
  seferId?: string
  defaultSubCommunity?: "jemmo" | "bethel" | "weyira" | "alpha"
}): Promise<ImportMembersResult> {
  const form = new FormData()
  form.append("file", options.file)
  if (options.dryRun) form.append("dryRun", "true")
  if (options.seferId) form.append("seferId", options.seferId)
  if (options.defaultSubCommunity) {
    form.append("defaultSubCommunity", options.defaultSubCommunity)
  }

  const params = new URLSearchParams()
  if (options.dryRun) params.set("dryRun", "true")
  if (options.seferId) params.set("seferId", options.seferId)
  if (options.defaultSubCommunity) {
    params.set("defaultSubCommunity", options.defaultSubCommunity)
  }
  const query = params.toString() ? `?${params.toString()}` : ""

  const response = await fetch(`${API_BASE_URL}/api/members/import${query}`, {
    method: "POST",
    credentials: "include",
    body: form,
  })

  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(payload.message || `Import failed (${response.status})`)
  }

  return (payload.data || payload) as ImportMembersResult
}
