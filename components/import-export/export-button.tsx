"use client"

import { useState } from "react"
import { Download, FileSpreadsheet, FileText, FileJson, FileDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "@/hooks/use-toast"
import { downloadFile } from "@/lib/utils/import-export"
import type { ExportColumn, ExportFormat } from "@/lib/utils/import-export"

interface ExportButtonProps {
  /** Called when user picks a format; should return all rows to export */
  fetchAll: () => Promise<Record<string, unknown>[]>
  columns: ExportColumn[]
  filename: string
  title: string
  disabled?: boolean
}

const FORMAT_OPTIONS: { format: ExportFormat; label: string; icon: React.FC<{ className?: string }> }[] = [
  { format: "xlsx", label: "Excel (.xlsx)",   icon: FileSpreadsheet },
  { format: "csv",  label: "CSV (.csv)",       icon: FileText },
  { format: "json", label: "JSON (.json)",     icon: FileJson },
  { format: "pdf",  label: "PDF (.pdf)",       icon: FileDown },
]

export function ExportButton({ fetchAll, columns, filename, title, disabled }: ExportButtonProps) {
  const [loading, setLoading] = useState<ExportFormat | null>(null)

  async function handleExport(format: ExportFormat) {
    setLoading(format)
    try {
      const data = await fetchAll()
      if (data.length === 0) {
        toast({ title: "Nothing to export", description: "No records match the current filters.", variant: "destructive" })
        return
      }
      await downloadFile(format, data, columns, filename, title)
      toast({ title: "Export ready", description: `${data.length} records exported as ${format.toUpperCase()}.` })
    } catch (err) {
      toast({ title: "Export failed", description: String(err), variant: "destructive" })
    } finally {
      setLoading(null)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="lg" className="gap-2" disabled={!!loading || disabled}>
          <Download className="w-5 h-5" />
          {loading ? `Exporting ${loading.toUpperCase()}…` : "Export"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Export as…</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {FORMAT_OPTIONS.map(({ format, label, icon: Icon }) => (
          <DropdownMenuItem
            key={format}
            onClick={() => handleExport(format)}
            disabled={!!loading}
            className="gap-2 cursor-pointer"
          >
            <Icon className="w-4 h-4" />
            {label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
