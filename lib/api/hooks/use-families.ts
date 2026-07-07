import { useQuery } from "@tanstack/react-query"
import { familiesService } from "../services/families.service"

/**
 * Query keys for families
 */
export const familyKeys = {
  all: ["families"] as const,
  list: () => [...familyKeys.all, "list"] as const,
}

/**
 * Hook to fetch all family units
 */
export function useFamilies() {
  return useQuery({
    queryKey: familyKeys.list(),
    queryFn: () => familiesService.getFamilies(),
    select: (response) => response.data ?? [],
  })
}
