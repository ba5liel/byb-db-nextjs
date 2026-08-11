"use client"

import { useCallback, useEffect, useState } from "react"
import { getMyNotedMemberIds } from "@/lib/members-api"

/** Member IDs that have at least one note authored by the logged-in user. */
export function useMyNotedMemberIds() {
  const [ids, setIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const list = await getMyNotedMemberIds()
      setIds(new Set(list))
    } catch {
      setIds(new Set())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { notedMemberIds: ids, loading, refresh }
}
