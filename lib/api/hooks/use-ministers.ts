import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { ministersService } from "../services/ministers.service"
import type {
  CreateMinisterDto,
  UpdateMinisterDto,
  MinisterFilters,
} from "../types"

/**
 * Query keys for ministers
 */
export const ministerKeys = {
  all: ["ministers"] as const,
  lists: () => [...ministerKeys.all, "list"] as const,
  list: (filters?: MinisterFilters) => [...ministerKeys.lists(), filters] as const,
  details: () => [...ministerKeys.all, "detail"] as const,
  detail: (id: string) => [...ministerKeys.details(), id] as const,
}

/**
 * Hook to fetch paginated list of ministers
 */
export function useMinisters(filters?: MinisterFilters) {
  return useQuery({
    queryKey: ministerKeys.list(filters),
    queryFn: () => ministersService.getMinisters(filters),
  })
}

/**
 * Hook to fetch a single minister by ID
 */
export function useMinister(id: string) {
  return useQuery({
    queryKey: ministerKeys.detail(id),
    queryFn: () => ministersService.getMinisterById(id),
    enabled: !!id,
  })
}

/**
 * Hook to create a new minister
 */
export function useCreateMinister() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateMinisterDto) => ministersService.createMinister(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ministerKeys.lists() })
    },
  })
}

/**
 * Hook to update a minister
 */
export function useUpdateMinister() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateMinisterDto }) =>
      ministersService.updateMinister(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ministerKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: ministerKeys.lists() })
    },
  })
}

/**
 * Hook to delete a minister
 */
export function useDeleteMinister() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => ministersService.deleteMinister(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ministerKeys.lists() })
    },
  })
}

/**
 * Hook to update minister status
 */
export function useUpdateMinisterStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, status, reason }: { id: string; status: string; reason?: string }) =>
      ministersService.updateMinisterStatus(id, status, reason),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ministerKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: ministerKeys.lists() })
    },
  })
}
