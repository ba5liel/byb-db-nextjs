/**
 * Members Excel import API (family-structure sheet)
 * POST /api/members/import (multipart/form-data)
 *
 * The sheet carries the household structure: role letters (F=father,
 * M=mother, C=child, I=independent), a family number per household and
 * the Eregenet (sub community / church group) per row — so no sefer or
 * sub-community pre-selection is needed.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"

export interface ImportRowResult {
  row: number
  fullName?: string
  status: "created" | "skipped" | "error"
  membershipNumber?: string
  memberId?: string
  familyNumber?: number
  familyName?: string
  familyRole?: "father" | "mother" | "child" | "independent" | "other"
  extendedFamily?: boolean
  warnings?: string[]
  message?: string
}

export interface ImportMembersResult {
  totalRows: number
  created: number
  skipped: number
  failed: number
  familiesCreated: number
  extendedTagged: number
  dryRun: boolean
  results: ImportRowResult[]
}

export async function importMembersFromExcel(options: {
  file: File
  dryRun?: boolean
}): Promise<ImportMembersResult> {
  const form = new FormData()
  form.append("file", options.file)

  const query = options.dryRun ? "?dryRun=true" : ""

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
