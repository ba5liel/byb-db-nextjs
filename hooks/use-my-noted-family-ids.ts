"use client"

import { useCallback, useEffect, useState } from "react"
import { getMyNotedFamilyIds } from "@/lib/families-api"

export function useMyNotedFamilyIds() {
  const [ids, setIds] = useState<Set<string>>(new Set())

  const refresh = useCallback(async () => {
    try {
      const list = await getMyNotedFamilyIds()
      setIds(new Set(list))
    } catch {
      setIds(new Set())
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { notedFamilyIds: ids, refresh }
}
