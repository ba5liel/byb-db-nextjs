"use client"

import * as React from "react"
import { CalendarDays, ChevronLeft, ChevronRight, X } from "lucide-react"
import Kenat, { monthNames, toGC, toEC } from "kenat"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

/**
 * FlexibleDateInput — an ETHIOPIAN-CALENDAR date field where MONTH and DAY are
 * optional (year-only and year+month entries are valid).
 *
 * Value is a partial Ethiopian date string: "" | "YYYY" | "YYYY-MM" | "YYYY-MM-DD"
 * (all parts Ethiopian calendar; 13 months, Pagume has 5/6 days).
 * The picker walks Year → Month → Day; the user can stop at any stage
 * ("Year only" / "Month only").
 *
 * Conversion helpers for the backend (which stores Gregorian Dates) live at the
 * bottom of this file — keep all EC↔GC conversion going through here.
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

export function getCurrentEthiopianYear(): number {
  return new Kenat().getEthiopian().year
}

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

/** Days in an Ethiopian month: 30 for months 1–12, Pagume (13) has 5 or 6. */
function daysInEcMonth(year: number, month: number) {
  if (month !== 13) return 30
  return year % 4 === 3 ? 6 : 5
}

function ecMonthName(month: number, locale: "en" | "am") {
  const names = locale === "am" ? monthNames.amharic : monthNames.english
  return names[month - 1] ?? String(month)
}

export function formatFlexibleDate(value: string | undefined, locale: "en" | "am" = "en"): string {
  const { year, month, day } = parseValue(value)
  if (!year) return ""
  const suffix = locale === "am" ? " ዓ.ም" : ""
  if (!month) return `${year}${suffix}`
  if (!day) return `${ecMonthName(month, locale)} ${year}${suffix}`
  return `${ecMonthName(month, locale)} ${day}, ${year}${suffix}`
}

export function FlexibleDateInput({
  id,
  value,
  onChange,
  placeholder,
  locale = "en",
  fromYear = 1900,
  toYear,
  disabled,
  className,
}: FlexibleDateInputProps) {
  const currentEcYear = React.useMemo(() => getCurrentEthiopianYear(), [])
  const maxYear = toYear ?? currentEcYear
  const parsed = parseValue(value)
  const [open, setOpen] = React.useState(false)
  const [stage, setStage] = React.useState<Stage>("year")
  const [draftYear, setDraftYear] = React.useState<number | undefined>(parsed.year)
  const [draftMonth, setDraftMonth] = React.useState<number | undefined>(parsed.month)
  const [pageStart, setPageStart] = React.useState(() => {
    const anchor = parsed.year ?? maxYear
    return Math.max(fromYear, anchor - (YEARS_PER_PAGE - 1))
  })

  const yearOnlyLabel = locale === "am" ? "ዓመት ብቻ" : "Year only"
  const monthOnlyLabel = locale === "am" ? "ወር ብቻ" : "Month only"
  const clearLabel = locale === "am" ? "አጽዳ" : "Clear"
  const pickYearLabel = locale === "am" ? "ዓመት ይምረጡ (ዓ.ም)" : "Pick a year (EC)"

  const openPicker = () => {
    const current = parseValue(value)
    setDraftYear(current.year)
    setDraftMonth(current.month)
    setStage("year")
    const anchor = current.year ?? maxYear
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
            <span className="flex-1 truncate text-left">{display}</span>
          ) : (
            <span className="flex-1 text-left text-muted-foreground">
              {placeholder ?? (locale === "am" ? "ቀን ይምረጡ (ዓ.ም)" : "Pick a date (EC)")}
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
              {stage === "month" && `${draftYear} ${locale === "am" ? "ዓ.ም" : "EC"}`}
              {stage === "day" && draftYear && draftMonth && `${ecMonthName(draftMonth, locale)} ${draftYear}`}
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
                disabled={pageStart + YEARS_PER_PAGE > maxYear}
                onClick={() => setPageStart(Math.min(maxYear, pageStart + YEARS_PER_PAGE))}
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
              .filter((y) => y >= fromYear && y <= maxYear)
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
              {Array.from({ length: 13 }, (_, i) => i + 1).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    setDraftMonth(m)
                    setStage("day")
                  }}
                  className={cn(
                    "rounded-md px-1 py-1.5 text-sm hover:bg-accent",
                    m === draftMonth && "bg-primary text-primary-foreground hover:bg-primary",
                    m === 13 && "col-span-3 bg-muted/50",
                  )}
                >
                  {ecMonthName(m, locale)}
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
              {monthOnlyLabel}: {ecMonthName(draftMonth, locale)} {draftYear} ✓
            </Button>
            <div className="grid grid-cols-6 gap-1">
              {Array.from({ length: daysInEcMonth(draftYear, draftMonth) }, (_, i) => i + 1).map((d) => (
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

// ============================================================================
// EC ↔ GC conversion helpers (all conversion goes through this file)
// ============================================================================

/** Ethiopian-calendar year from a partial EC value ("2015-04-11" → 2015). */
export function ecPartialYear(value: string | undefined): number | undefined {
  return parseValue(value).year
}

/**
 * Convert a partial EC value to a Gregorian ISO string for the backend.
 * Missing month/day default to Meskerem 1 (the first day of the EC year).
 */
export function ecPartialToGregorianISO(value: string | undefined): string | undefined {
  const { year, month, day } = parseValue(value)
  if (!year) return undefined
  const gc = toGC(year, month ?? 1, day ?? 1)
  return new Date(Date.UTC(gc.year, gc.month - 1, gc.day)).toISOString()
}

/**
 * Convert a Gregorian ISO date (from the backend) to a partial EC value.
 * If the stored Gregorian date is exactly Meskerem 1 of `knownEcYear`, the
 * entry was almost certainly year-only — reconstruct it as such.
 */
export function gregorianISOToEcPartial(
  iso: string | undefined,
  knownEcYear?: number,
): string {
  if (!iso) return ""
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ""
  const ec = toEC(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate())
  if (knownEcYear && ec.year === knownEcYear && ec.month === 1 && ec.day === 1) {
    return String(ec.year)
  }
  return `${ec.year}-${pad(ec.month)}-${pad(ec.day)}`
}

/** Approximate age in years from a partial EC birth value. */
export function ageFromEcPartial(value: string | undefined): number | undefined {
  const { year, month, day } = parseValue(value)
  if (!year) return undefined
  const today = new Kenat().getEthiopian()
  let age = today.year - year
  if (month) {
    if (today.month < month || (today.month === month && day && today.day < day)) {
      age--
    }
  }
  return Math.max(age, 0)
}
