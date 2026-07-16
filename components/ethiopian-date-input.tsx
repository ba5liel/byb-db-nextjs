"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"

/**
 * SEAM: Ethiopian-calendar (EC) input widgets.
 *
 * These two wrappers are the single place where the app collects Ethiopian
 * calendar years and dates. Today they render plain inputs (a numeric year and
 * an HTML date picker), but the whole point of routing every EC field through
 * this file is so a real Ethiopian-calendar picker can be dropped in later by
 * editing ONLY this component — no wizard/detail/edit changes required.
 *
 * Keep the props (id/name/value/onChange) stable so callers keep working.
 */

interface EthiopianYearInputProps {
  id?: string
  name?: string
  value?: string | number
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

/**
 * Numeric Ethiopian-calendar year (ዓ.ም). Kept as a text-numeric field so the
 * value stays a string in form state and an empty field never becomes 0.
 */
export function EthiopianYearInput({ className, ...props }: EthiopianYearInputProps) {
  return (
    <Input
      inputMode="numeric"
      pattern="[0-9]*"
      maxLength={4}
      className={className}
      {...props}
    />
  )
}

interface EthiopianDateInputProps {
  id?: string
  name?: string
  value?: string
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  className?: string
  disabled?: boolean
}

/**
 * A calendar date. Currently a plain Gregorian date picker; swap this body for
 * an EC date picker when one is available.
 */
export function EthiopianDateInput({ className, ...props }: EthiopianDateInputProps) {
  return <Input type="date" className={className} {...props} />
}
