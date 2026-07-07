"use client"

import { useState, useRef } from "react"
import { Upload, FileUp, CheckCircle2, XCircle, AlertCircle, Download } from "lucide-react"
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/hooks/use-toast"
import {
  parseFileToRows, validateMemberRow, downloadMemberTemplate,
} from "@/lib/utils/import-export"
import type { CreateMemberDto } from "@/lib/api/types"
import type { RowValidationResult } from "@/lib/utils/import-export"

interface ImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Called for each valid row — should call the create API */
  onImportRow: (dto: CreateMemberDto) => Promise<unknown>
  /** Human-readable name of what's being imported */
  entityName?: string
}

type ParsedRow = RowValidationResult & { rowNum: number; raw: Record<string, unknown> }

type Phase = "idle" | "parsed" | "importing" | "done"

export function ImportDialog({
  open, onOpenChange, onImportRow, entityName = "Members",
}: ImportDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [phase, setPhase] = useState<Phase>("idle")
  const [parsing, setParsing] = useState(false)
  const [rows, setRows] = useState<ParsedRow[]>([])
  const [progress, setProgress] = useState(0)
  const [results, setResults] = useState<{ imported: number; skipped: number; errors: string[] }>({ imported: 0, skipped: 0, errors: [] })
  const [filename, setFilename] = useState("")

  const validRows   = rows.filter(r => r.ok)
  const invalidRows = rows.filter(r => !r.ok)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setFilename(file.name)
    setParsing(true)
    setPhase("idle")
    setRows([])
    try {
      const raw = await parseFileToRows(file)
      if (raw.length === 0) {
        toast({ title: "Empty file", description: "The file contains no data rows.", variant: "destructive" })
        setParsing(false)
        return
      }
      const parsed: ParsedRow[] = raw.map((row, i) => ({
        rowNum: i + 2, // row 1 is header
        raw: row,
        ...validateMemberRow(row),
      }))
      setRows(parsed)
      setPhase("parsed")
    } catch (err) {
      toast({ title: "Parse error", description: String(err), variant: "destructive" })
    } finally {
      setParsing(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  async function handleImport() {
    setPhase("importing")
    setProgress(0)
    const toImport = validRows
    let imported = 0
    let skipped = 0
    const errors: string[] = []

    for (let i = 0; i < toImport.length; i++) {
      const row = toImport[i]
      if (!row.ok) { skipped++; continue }
      try {
        await onImportRow(row.dto)
        imported++
      } catch (err) {
        skipped++
        errors.push(`Row ${row.rowNum}: ${err instanceof Error ? err.message : String(err)}`)
      }
      setProgress(Math.round(((i + 1) / toImport.length) * 100))
    }

    setResults({ imported, skipped: skipped + invalidRows.length, errors })
    setPhase("done")
    if (imported > 0) {
      toast({ title: "Import complete", description: `${imported} records imported successfully.` })
    }
  }

  function handleReset() {
    setPhase("idle")
    setRows([])
    setProgress(0)
    setResults({ imported: 0, skipped: 0, errors: [] })
    setFilename("")
  }

  function handleClose() {
    handleReset()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Import {entityName}</DialogTitle>
          <DialogDescription>
            Upload an Excel (.xlsx/.xls), CSV, or JSON file. Invalid rows are skipped automatically.
          </DialogDescription>
        </DialogHeader>

        {/* ── IDLE / FILE PICK ── */}
        {phase === "idle" && !parsing && (
          <div className="space-y-4 py-2">
            <div
              className="border-2 border-dashed border-white/20 rounded-xl p-10 text-center hover:border-primary/50 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <FileUp className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-lg font-semibold mb-1">Click to choose a file</p>
              <p className="text-sm text-muted-foreground">Supported: .xlsx, .xls, .csv, .json</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv,.json"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
            <div className="flex justify-between items-center pt-1">
              <span className="text-sm text-muted-foreground">Don&apos;t have a template?</span>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-primary"
                onClick={() => downloadMemberTemplate()}
              >
                <Download className="w-4 h-4" />
                Download template
              </Button>
            </div>
          </div>
        )}

        {parsing && (
          <div className="space-y-3 py-6">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <p className="text-sm text-muted-foreground text-center">Parsing {filename}…</p>
          </div>
        )}

        {/* ── PARSED PREVIEW ── */}
        {phase === "parsed" && (
          <div className="space-y-5 py-2">
            {/* Summary bar */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white/5 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-primary">{rows.length}</div>
                <div className="text-xs text-muted-foreground mt-0.5">Total rows</div>
              </div>
              <div className="bg-green-500/10 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-green-500">{validRows.length}</div>
                <div className="text-xs text-muted-foreground mt-0.5">Valid</div>
              </div>
              <div className="bg-red-500/10 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-red-500">{invalidRows.length}</div>
                <div className="text-xs text-muted-foreground mt-0.5">Will be skipped</div>
              </div>
            </div>

            {/* Preview table — first 5 valid rows */}
            {validRows.length > 0 && (
              <div>
                <p className="text-sm font-bold mb-2 text-muted-foreground uppercase tracking-wide">
                  Preview (first {Math.min(5, validRows.length)} valid rows)
                </p>
                <div className="overflow-x-auto rounded-xl border border-white/10">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-white/10 bg-white/5">
                        <th className="text-left py-2 px-3 font-bold">Name</th>
                        <th className="text-left py-2 px-3 font-bold">Sex</th>
                        <th className="text-left py-2 px-3 font-bold">Phone</th>
                        <th className="text-left py-2 px-3 font-bold">Community</th>
                        <th className="text-left py-2 px-3 font-bold">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {validRows.slice(0, 5).map(row => (
                        <tr key={row.rowNum} className="border-b border-white/5">
                          <td className="py-2 px-3">{row.ok ? row.dto.fullName : "—"}</td>
                          <td className="py-2 px-3 capitalize">{row.ok ? row.dto.sex : "—"}</td>
                          <td className="py-2 px-3">{row.ok ? row.dto.phoneNumber : "—"}</td>
                          <td className="py-2 px-3 capitalize">{row.ok ? row.dto.subCommunity : "—"}</td>
                          <td className="py-2 px-3">
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Invalid rows */}
            {invalidRows.length > 0 && (
              <div>
                <p className="text-sm font-bold mb-2 text-red-400 uppercase tracking-wide flex items-center gap-1.5">
                  <XCircle className="w-4 h-4" />
                  {invalidRows.length} row{invalidRows.length !== 1 ? "s" : ""} will be skipped
                </p>
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {invalidRows.map(row => (
                    <div key={row.rowNum} className="text-xs bg-red-500/10 rounded-lg px-3 py-2">
                      <span className="font-bold">Row {row.rowNum}:</span>{" "}
                      {!row.ok && row.errors.join(" · ")}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={handleReset}>Choose different file</Button>
              <Button
                onClick={handleImport}
                disabled={validRows.length === 0}
                className="flex-1"
              >
                <Upload className="w-4 h-4 mr-2" />
                Import {validRows.length} record{validRows.length !== 1 ? "s" : ""}
              </Button>
            </div>
          </div>
        )}

        {/* ── IMPORTING ── */}
        {phase === "importing" && (
          <div className="space-y-6 py-8 text-center">
            <Upload className="w-12 h-12 text-primary mx-auto animate-pulse" />
            <div>
              <p className="text-lg font-semibold mb-3">Importing records…</p>
              <Progress value={progress} className="h-3" />
              <p className="text-sm text-muted-foreground mt-2">{progress}% complete</p>
            </div>
          </div>
        )}

        {/* ── DONE ── */}
        {phase === "done" && (
          <div className="space-y-5 py-4">
            <div className="text-center">
              {results.imported > 0 ? (
                <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
              ) : (
                <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
              )}
              <h3 className="text-xl font-bold mb-1">Import complete</h3>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-green-500/10 rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-green-500">{results.imported}</div>
                <div className="text-sm text-muted-foreground mt-0.5">Imported</div>
              </div>
              <div className="bg-yellow-500/10 rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-yellow-500">{results.skipped}</div>
                <div className="text-sm text-muted-foreground mt-0.5">Skipped</div>
              </div>
            </div>

            {results.errors.length > 0 && (
              <div>
                <p className="text-sm font-bold mb-2 text-muted-foreground">Errors during import</p>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {results.errors.map((e, i) => (
                    <div key={i} className="text-xs bg-red-500/10 rounded px-3 py-2">{e}</div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <Button variant="outline" onClick={handleReset} className="flex-1">Import more</Button>
              <Button onClick={handleClose} className="flex-1">Done</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
