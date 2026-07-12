/**
 * Client-side import/export utilities for Excel (.xlsx/.xls), CSV, JSON, PDF.
 * All heavy libraries are dynamically imported so SSR bundles stay clean.
 */

import type { CreateMemberDto, Sex, SubCommunity, GroupType, MaritalStatus, EducationLevel, JobType, CatechesisStatus, PaymentFrequency } from "@/lib/api/types"

export type ExportFormat = "xlsx" | "csv" | "json" | "pdf"

export interface ExportColumn {
  key: string
  header: string
  format?: (val: unknown) => string
}

// ─── Member column definitions ───────────────────────────────────────────────

const fmt = {
  bool: (v: unknown) => (v === true || v === "true" || v === 1 || v === "yes" || v === "Yes") ? "Yes" : "No",
  date: (v: unknown) => (v ? new Date(String(v)).toLocaleDateString() : ""),
}

export const MEMBER_EXPORT_COLUMNS: ExportColumn[] = [
  { key: "membershipNumber",      header: "Membership No." },
  { key: "fullName",              header: "Full Name" },
  { key: "sex",                   header: "Sex" },
  { key: "birthDate",             header: "Birth Date",         format: fmt.date },
  { key: "phoneNumber",           header: "Phone Number" },
  { key: "email",                 header: "Email" },
  { key: "physicalAddress",       header: "Physical Address" },
  { key: "subCommunity",          header: "Sub-Community" },
  { key: "groupType",             header: "Group Type" },
  { key: "maritalStatus",         header: "Marital Status" },
  { key: "educationLevel",        header: "Education Level" },
  { key: "jobType",               header: "Job Type" },
  { key: "profession",            header: "Profession" },
  { key: "paysTithe",             header: "Pays Tithe",          format: fmt.bool },
  { key: "titheAmount",           header: "Tithe Amount (Birr)" },
  { key: "paymentFrequency",      header: "Payment Frequency" },
  { key: "cameByTransfer",        header: "Came by Transfer",    format: fmt.bool },
  { key: "transferredFromChurch", header: "Transferred From" },
  { key: "catechesisStatus",      header: "Catechesis Status" },
  { key: "memberStatus",          header: "Status" },
  { key: "createdAt",             header: "Registered On",       format: fmt.date },
]

/** Template column order and instructions for the import sheet */
export const MEMBER_IMPORT_TEMPLATE_COLUMNS = [
  "fullName",
  "sex",
  "birthDate",
  "phoneNumber",
  "email",
  "physicalAddress",
  "subCommunity",
  "groupType",
  "maritalStatus",
  "educationLevel",
  "jobType",
  "profession",
  "paysTithe",
  "titheAmount",
  "paymentFrequency",
  "cameByTransfer",
  "transferredFromChurch",
  "catechesisStatus",
  "numberOfChildren",
  "emergencyContactName",
  "emergencyContactPhone",
  "notes",
]

const MEMBER_IMPORT_NOTES: Record<string, string> = {
  fullName:              "REQUIRED. Full name.",
  sex:                   "REQUIRED. male / female",
  birthDate:             "REQUIRED. YYYY-MM-DD",
  phoneNumber:           "REQUIRED. e.g. 0911234567",
  email:                 "Optional. Valid email.",
  physicalAddress:       "Optional.",
  subCommunity:          "REQUIRED. jemmo / bethel / weyira / alfa",
  groupType:             "REQUIRED. cell_group / youth_group / bible_study / prayer_group / none",
  maritalStatus:         "REQUIRED. unmarried / married / divorced / widowed",
  educationLevel:        "Optional. uneducated / 1-8 / 9-12 / finished_12 / diploma / degree / masters / phd",
  jobType:               "Optional. personal / government / private / unemployed / student / retired",
  profession:            "Optional.",
  paysTithe:             "REQUIRED. yes / no",
  titheAmount:           "Optional. Number. Required if paysTithe=yes.",
  paymentFrequency:      "Optional. weekly / monthly / occasionally",
  cameByTransfer:        "REQUIRED. yes / no",
  transferredFromChurch: "Optional. Name of previous church. Required if cameByTransfer=yes.",
  catechesisStatus:      "Optional. not_started / in_progress / completed",
  numberOfChildren:      "Optional. Number.",
  emergencyContactName:  "Optional.",
  emergencyContactPhone: "Optional.",
  notes:                 "Optional.",
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parseBool(val: unknown): boolean | null {
  if (val === null || val === undefined || val === "") return null
  const s = String(val).toLowerCase().trim()
  if (["yes", "true", "1", "y"].includes(s)) return true
  if (["no", "false", "0", "n"].includes(s)) return false
  return null
}

function parseDate(val: unknown): Date | null {
  if (!val) return null
  const d = new Date(String(val))
  return isNaN(d.getTime()) ? null : d
}

// ─── Row validation ───────────────────────────────────────────────────────────

export type RowValidationResult =
  | { ok: true; dto: CreateMemberDto }
  | { ok: false; errors: string[] }

const SEX_VALUES = ["male", "female"]
const COMMUNITY_VALUES = ["jemmo", "bethel", "weyira", "alfa"]
const GROUP_TYPE_VALUES = ["cell_group", "youth_group", "bible_study", "prayer_group", "none"]
const MARITAL_VALUES = ["unmarried", "married", "divorced", "widowed"]
const EDU_VALUES = ["uneducated", "1-8", "9-12", "finished_12", "diploma", "degree", "masters", "phd"]
const JOB_VALUES = ["personal", "government", "private", "unemployed", "student", "retired"]
const PAY_FREQ_VALUES = ["weekly", "monthly", "occasionally"]
const CATECHESIS_VALUES = ["not_started", "in_progress", "completed"]

export function validateMemberRow(row: Record<string, unknown>): RowValidationResult {
  const errors: string[] = []

  const fullName = String(row.fullName || "").trim()
  const sex = String(row.sex || "").toLowerCase().trim()
  const birthDate = parseDate(row.birthDate)
  const phoneNumber = String(row.phoneNumber || "").trim()
  const subCommunity = String(row.subCommunity || "").toLowerCase().trim()
  const groupType = String(row.groupType || "").toLowerCase().trim()
  const maritalStatus = String(row.maritalStatus || "").toLowerCase().trim()
  const paysTithe = parseBool(row.paysTithe)
  const cameByTransfer = parseBool(row.cameByTransfer)

  if (!fullName)                          errors.push("fullName is required")
  if (!SEX_VALUES.includes(sex))          errors.push(`sex must be male or female (got "${row.sex}")`)
  if (!birthDate)                         errors.push(`birthDate is invalid (got "${row.birthDate}")`)
  if (!phoneNumber)                       errors.push("phoneNumber is required")
  if (!COMMUNITY_VALUES.includes(subCommunity)) errors.push(`subCommunity must be one of ${COMMUNITY_VALUES.join(", ")} (got "${row.subCommunity}")`)
  if (!GROUP_TYPE_VALUES.includes(groupType))   errors.push(`groupType must be one of ${GROUP_TYPE_VALUES.join(", ")} (got "${row.groupType}")`)
  if (!MARITAL_VALUES.includes(maritalStatus))  errors.push(`maritalStatus must be one of ${MARITAL_VALUES.join(", ")} (got "${row.maritalStatus}")`)
  if (paysTithe === null)                 errors.push("paysTithe is required (yes or no)")
  if (paysTithe === true && (row.titheAmount === undefined || row.titheAmount === "")) {
    errors.push("titheAmount is required when paysTithe is yes")
  }
  if (cameByTransfer === null)            errors.push("cameByTransfer is required (yes or no)")

  const educationLevel = String(row.educationLevel || "").trim()
  if (educationLevel && !EDU_VALUES.includes(educationLevel)) errors.push(`educationLevel must be one of ${EDU_VALUES.join(", ")}`)

  const jobType = String(row.jobType || "").trim()
  if (jobType && !JOB_VALUES.includes(jobType)) errors.push(`jobType must be one of ${JOB_VALUES.join(", ")}`)

  const paymentFrequency = String(row.paymentFrequency || "").trim()
  if (paymentFrequency && !PAY_FREQ_VALUES.includes(paymentFrequency)) errors.push(`paymentFrequency must be one of ${PAY_FREQ_VALUES.join(", ")}`)

  const catechesisStatus = String(row.catechesisStatus || "").trim()
  if (catechesisStatus && !CATECHESIS_VALUES.includes(catechesisStatus)) errors.push(`catechesisStatus must be one of ${CATECHESIS_VALUES.join(", ")}`)

  if (errors.length > 0) return { ok: false, errors }

  // Build DTO imperatively to avoid TypeScript spread-union issues
  const dto: CreateMemberDto = {
    fullName,
    sex: sex as Sex,
    birthDate: birthDate!,
    phoneNumber,
    subCommunity: subCommunity as SubCommunity,
    groupType: groupType as GroupType,
    maritalStatus: maritalStatus as MaritalStatus,
    paysTithe: paysTithe!,
    cameByTransfer: cameByTransfer!,
  }
  if (row.email)            dto.email = String(row.email)
  if (row.physicalAddress)  dto.physicalAddress = String(row.physicalAddress)
  if (educationLevel)       dto.educationLevel = educationLevel as EducationLevel
  if (jobType)              dto.jobType = jobType as JobType
  if (row.profession)       dto.profession = String(row.profession)
  if (paysTithe && row.titheAmount) dto.titheAmount = Number(row.titheAmount)
  if (paymentFrequency)     dto.paymentFrequency = paymentFrequency as PaymentFrequency
  if (cameByTransfer && row.transferredFromChurch) dto.transferredFromChurch = String(row.transferredFromChurch)
  if (catechesisStatus)     dto.catechesisStatus = catechesisStatus as CatechesisStatus
  if (row.numberOfChildren !== undefined && row.numberOfChildren !== "") dto.numberOfChildren = Number(row.numberOfChildren)
  if (row.emergencyContactName)  dto.emergencyContactName = String(row.emergencyContactName)
  if (row.emergencyContactPhone) dto.emergencyContactPhone = String(row.emergencyContactPhone)
  if (row.notes)            dto.notes = String(row.notes)

  return { ok: true, dto }
}

// ─── File parsing ─────────────────────────────────────────────────────────────

export async function parseFileToRows(file: File): Promise<Record<string, unknown>[]> {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? ""

  if (ext === "json") {
    const text = await file.text()
    const parsed = JSON.parse(text)
    return Array.isArray(parsed) ? parsed : [parsed]
  }

  if (ext === "csv" || ext === "xlsx" || ext === "xls") {
    const XLSX = await import("xlsx")
    const buffer = await file.arrayBuffer()
    const wb = XLSX.read(buffer, { type: "array", cellDates: true })
    const ws = wb.Sheets[wb.SheetNames[0]]
    // raw: false converts dates, defval fills empty cells
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: "" })
    return rows
  }

  throw new Error(`Unsupported file type: .${ext}. Please use .xlsx, .xls, .csv, or .json`)
}

// ─── Export helpers ───────────────────────────────────────────────────────────

function applyColumns(data: Record<string, unknown>[], columns: ExportColumn[]) {
  return data.map(row =>
    Object.fromEntries(
      columns.map(col => [
        col.header,
        col.format ? col.format(row[col.key]) : (row[col.key] ?? ""),
      ])
    )
  )
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export async function downloadExcel(
  data: Record<string, unknown>[],
  columns: ExportColumn[],
  filename: string
) {
  const XLSX = await import("xlsx")
  const rows = applyColumns(data, columns)
  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, "Data")
  XLSX.writeFile(wb, `${filename}.xlsx`)
}

export async function downloadCSV(
  data: Record<string, unknown>[],
  columns: ExportColumn[],
  filename: string
) {
  const XLSX = await import("xlsx")
  const rows = applyColumns(data, columns)
  const ws = XLSX.utils.json_to_sheet(rows)
  const csv = XLSX.utils.sheet_to_csv(ws)
  triggerDownload(new Blob([csv], { type: "text/csv;charset=utf-8;" }), `${filename}.csv`)
}

export async function downloadJSON(
  data: Record<string, unknown>[],
  filename: string
) {
  const json = JSON.stringify(data, null, 2)
  triggerDownload(new Blob([json], { type: "application/json" }), `${filename}.json`)
}

export async function downloadPDF(
  data: Record<string, unknown>[],
  columns: ExportColumn[],
  filename: string,
  title: string
) {
  const { jsPDF } = await import("jspdf")
  const { default: autoTable } = await import("jspdf-autotable")

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" })

  doc.setFontSize(14)
  doc.setFont("helvetica", "bold")
  doc.text(title, 14, 14)
  doc.setFontSize(9)
  doc.setFont("helvetica", "normal")
  doc.text(`Exported: ${new Date().toLocaleDateString()}  ·  ${data.length} records`, 14, 20)

  const headers = columns.map(c => c.header)
  const rows = data.map(row =>
    columns.map(col => {
      const val = col.format ? col.format(row[col.key]) : (row[col.key] ?? "")
      return String(val)
    })
  )

  autoTable(doc, {
    head: [headers],
    body: rows,
    startY: 25,
    styles: { fontSize: 7, cellPadding: 1.5 },
    headStyles: { fillColor: [99, 102, 241], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [248, 249, 250] },
  })

  doc.save(`${filename}.pdf`)
}

/** Downloads a blank import template (.xlsx) with a notes row */
export async function downloadMemberTemplate() {
  const XLSX = await import("xlsx")

  const headers = MEMBER_IMPORT_TEMPLATE_COLUMNS
  const notesRow = headers.map(h => MEMBER_IMPORT_NOTES[h] ?? "")
  const exampleRow = [
    "አበበ ከበደ ተስፋዬ", "male", "1990-06-15", "0911234567", "abebe@email.com",
    "ቦሌ, አዲስ አበባ", "bethel", "cell_group", "unmarried",
    "degree", "private", "Software Engineer", "yes", "2000", "monthly",
    "no", "", "completed", "0", "", "", "",
  ]

  const ws = XLSX.utils.aoa_to_sheet([headers, notesRow, exampleRow])

  // Style the header row (bold)
  const range = XLSX.utils.decode_range(ws["!ref"] ?? "A1")
  for (let c = range.s.c; c <= range.e.c; c++) {
    const cell = XLSX.utils.encode_cell({ r: 0, c })
    if (ws[cell]) ws[cell].s = { font: { bold: true }, fill: { fgColor: { rgb: "6366F1" } } }
  }
  ws["!cols"] = headers.map(() => ({ wch: 22 }))

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, "Members Import")
  XLSX.writeFile(wb, "member_import_template.xlsx")
}

/** One-shot entry point used by ExportButton */
export async function downloadFile(
  format: ExportFormat,
  data: Record<string, unknown>[],
  columns: ExportColumn[],
  filename: string,
  title: string
) {
  switch (format) {
    case "xlsx": return downloadExcel(data, columns, filename)
    case "csv":  return downloadCSV(data, columns, filename)
    case "json": return downloadJSON(data, filename)
    case "pdf":  return downloadPDF(data, columns, filename, title)
  }
}
