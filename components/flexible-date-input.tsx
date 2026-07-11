"use client"

import * as React from "react"
import { CalendarDays, ChevronLeft, ChevronRight, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

/**
 * FlexibleDateInput — a single date field where MONTH and DAY are optional.
 *
 * Value is a partial ISO string: "" | "YYYY" | "YYYY-MM" | "YYYY-MM-DD".
 * The picker walks Year → Month → Day; the user can stop at any stage
 * ("Year only" / "Month only"), which replaces the old pattern of a separate
 * year input next to a full date input.
 *
 * NOTE: like components/ethiopian-date-input.tsx, this is the seam for a
 * future Ethiopian-calendar picker — swap the grids in this file only.
 */

interface FlexibleDateInputProps {
  id?: string
  value?: string
  onChange: (value: string) => void
  placeholder?: string
  locale?: "en" | "am"
  fromYear?: number
  toYear?: number
  disabled?: boolean
  className?: string
}

type Stage = "year" | "month" | "day"

const YEARS_PER_PAGE = 16

function parseValue(value: string | undefined): {
  year?: number
  month?: number
  day?: number
} {
  if (!value) return {}
  const [y, m, d] = value.split("-").map((p) => parseInt(p, 10))
  return {
    year: Number.isFinite(y) ? y : undefined,
    month: Number.isFinite(m) ? m : undefined,
    day: Number.isFinite(d) ? d : undefined,
  }
}

function pad(n: number) {
  return String(n).padStart(2, "0")
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate()
}

export function formatFlexibleDate(value: string | undefined, locale: "en" | "am" = "en"): string {
  const { year, month, day } = parseValue(value)
  if (!year) return ""
  if (!month) return String(year)
  const monthName = new Intl.DateTimeFormat(locale === "am" ? "am" : "en", {
    month: "short",
  }).format(new Date(year, month - 1, 1))
  if (!day) return `${monthName} ${year}`
  return `${monthName} ${day}, ${year}`
}

export function FlexibleDateInput({
  id,
  value,
  onChange,
  placeholder,
  locale = "en",
  fromYear = 1900,
  toYear = new Date().getFullYear(),
  disabled,
  className,
}: FlexibleDateInputProps) {
  const parsed = parseValue(value)
  const [open, setOpen] = React.useState(false)
  const [stage, setStage] = React.useState<Stage>("year")
  const [draftYear, setDraftYear] = React.useState<number | undefined>(parsed.year)
  const [draftMonth, setDraftMonth] = React.useState<number | undefined>(parsed.month)
  const [pageStart, setPageStart] = React.useState(() => {
    const anchor = parsed.year ?? toYear
    return Math.max(fromYear, anchor - (YEARS_PER_PAGE - 1))
  })

  const monthNames = React.useMemo(() => {
    const fmt = new Intl.DateTimeFormat(locale === "am" ? "am" : "en", { month: "short" })
    return Array.from({ length: 12 }, (_, i) => fmt.format(new Date(2000, i, 1)))
  }, [locale])

  const yearOnlyLabel = locale === "am" ? "ዓመት ብቻ" : "Year only"
  const monthOnlyLabel = locale === "am" ? "ወር ብቻ" : "Month only"
  const clearLabel = locale === "am" ? "አጽዳ" : "Clear"
  const pickYearLabel = locale === "am" ? "ዓመት ይምረጡ" : "Pick a year"

  const openPicker = () => {
    const current = parseValue(value)
    setDraftYear(current.year)
    setDraftMonth(current.month)
    setStage("year")
    const anchor = current.year ?? toYear
    setPageStart(Math.max(fromYear, anchor - (YEARS_PER_PAGE - 1)))
    setOpen(true)
  }

  const commit = (v: string) => {
    onChange(v)
    setOpen(false)
  }

  const display = formatFlexibleDate(value, locale)

  return (
    <Popover open={open} onOpenChange={(next) => (next ? openPicker() : setOpen(false))}>
      <PopoverTrigger asChild>
        <button
          type="button"
          id={id}
          disabled={disabled}
          className={cn(
            "flex h-9 w-full items-center gap-2 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
            "disabled:cursor-not-allowed disabled:opacity-50",
            className,
          )}
        >
          <CalendarDays className="h-4 w-4 shrink-0 text-muted-foreground" />
          {display ? (
            <span className="flex-1 text-left">{display}</span>
          ) : (
            <span className="flex-1 text-left text-muted-foreground">
              {placeholder ?? (locale === "am" ? "ቀን ይምረጡ" : "Pick a date")}
            </span>
          )}
          {display && !disabled && (
            <span
              role="button"
              tabIndex={-1}
              aria-label={clearLabel}
              className="rounded-sm p-0.5 text-muted-foreground hover:text-foreground"
              onClick={(e) => {
                e.stopPropagation()
                onChange("")
              }}
            >
              <X className="h-3.5 w-3.5" />
            </span>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent className="w-72 p-3" align="start">
        {/* Header: breadcrumb of the draft selection */}
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-1 text-sm font-medium">
            {stage !== "year" && (
              <button
                type="button"
                className="mr-1 rounded p-1 hover:bg-accent"
                onClick={() => setStage(stage === "day" ? "month" : "year")}
                aria-label="Back"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            )}
            <span>
              {stage === "year" && pickYearLabel}
              {stage === "month" && draftYear}
              {stage === "day" && draftYear && draftMonth && `${monthNames[draftMonth - 1]} ${draftYear}`}
            </span>
          </div>
          {stage === "year" && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                className="rounded p-1 hover:bg-accent disabled:opacity-40"
                disabled={pageStart <= fromYear}
                onClick={() => setPageStart(Math.max(fromYear, pageStart - YEARS_PER_PAGE))}
                aria-label="Earlier years"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                className="rounded p-1 hover:bg-accent disabled:opacity-40"
                disabled={pageStart + YEARS_PER_PAGE > toYear}
                onClick={() => setPageStart(Math.min(toYear, pageStart + YEARS_PER_PAGE))}
                aria-label="Later years"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {stage === "year" && (
          <div className="grid grid-cols-4 gap-1.5">
            {Array.from({ length: YEARS_PER_PAGE }, (_, i) => pageStart + i)
              .filter((y) => y >= fromYear && y <= toYear)
              .map((y) => (
                <button
                  key={y}
                  type="button"
                  onClick={() => {
                    setDraftYear(y)
                    setDraftMonth(undefined)
                    setStage("month")
                  }}
                  className={cn(
                    "rounded-md px-1 py-1.5 text-sm hover:bg-accent",
                    y === draftYear && "bg-primary text-primary-foreground hover:bg-primary",
                  )}
                >
                  {y}
                </button>
              ))}
          </div>
        )}

        {stage === "month" && draftYear && (
          <>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="mb-2 w-full"
              onClick={() => commit(String(draftYear))}
            >
              {yearOnlyLabel}: {draftYear} ✓
            </Button>
            <div className="grid grid-cols-3 gap-1.5">
              {monthNames.map((name, i) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => {
                    setDraftMonth(i + 1)
                    setStage("day")
                  }}
                  className={cn(
                    "rounded-md px-1 py-1.5 text-sm hover:bg-accent",
                    i + 1 === draftMonth && "bg-primary text-primary-foreground hover:bg-primary",
                  )}
                >
                  {name}
                </button>
              ))}
            </div>
          </>
        )}

        {stage === "day" && draftYear && draftMonth && (
          <>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="mb-2 w-full"
              onClick={() => commit(`${draftYear}-${pad(draftMonth)}`)}
            >
              {monthOnlyLabel}: {monthNames[draftMonth - 1]} {draftYear} ✓
            </Button>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: daysInMonth(draftYear, draftMonth) }, (_, i) => i + 1).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => commit(`${draftYear}-${pad(draftMonth)}-${pad(d)}`)}
                  className={cn(
                    "rounded-md py-1 text-sm hover:bg-accent",
                    parsed.year === draftYear && parsed.month === draftMonth && parsed.day === d &&
                      "bg-primary text-primary-foreground hover:bg-primary",
                  )}
                >
                  {d}
                </button>
              ))}
            </div>
          </>
        )}

        {value && (
          <button
            type="button"
            onClick={() => commit("")}
            className="mt-2 w-full rounded-md py-1 text-xs text-muted-foreground hover:bg-accent hover:text-destructive"
          >
            {clearLabel}
          </button>
        )}
      </PopoverContent>
    </Popover>
  )
}
