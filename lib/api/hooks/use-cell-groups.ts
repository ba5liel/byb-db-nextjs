import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { cellGroupsService } from "../services"
import type { CellGroupFilters, CreateCellGroupDto, UpdateCellGroupDto } from "../types"

export const cellGroupKeys = {
  all: ["cell-groups"] as const,
  lists: () => [...cellGroupKeys.all, "list"] as const,
  list: (filters?: CellGroupFilters) => [...cellGroupKeys.lists(), filters] as const,
  details: () => [...cellGroupKeys.all, "detail"] as const,
  detail: (id: string) => [...cellGroupKeys.details(), id] as const,
  community: (sub: string) => [...cellGroupKeys.all, "community", sub] as const,
}

export function useCellGroups(filters?: CellGroupFilters) {
  return useQuery({
    queryKey: cellGroupKeys.list(filters),
    queryFn: () => cellGroupsService.getCellGroups(filters),
  })
}

export function useCellGroup(id: string) {
  return useQuery({
    queryKey: cellGroupKeys.detail(id),
    queryFn: () => cellGroupsService.getCellGroupById(id),
    enabled: !!id,
  })
}

export function useCommunityOverview(subCommunity: string) {
  return useQuery({
    queryKey: cellGroupKeys.community(subCommunity),
    queryFn: () => cellGroupsService.getCommunityOverview(subCommunity),
    enabled: !!subCommunity,
  })
}

export function useCreateCellGroup() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateCellGroupDto) => cellGroupsService.createCellGroup(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cellGroupKeys.lists() })
      queryClient.invalidateQueries({ queryKey: cellGroupKeys.all })
    },
  })
}

export function useUpdateCellGroup() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCellGroupDto }) =>
      cellGroupsService.updateCellGroup(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: cellGroupKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: cellGroupKeys.lists() })
      queryClient.invalidateQueries({ queryKey: cellGroupKeys.all })
    },
  })
}

export function useDeleteCellGroup() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => cellGroupsService.deleteCellGroup(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cellGroupKeys.lists() })
      queryClient.invalidateQueries({ queryKey: cellGroupKeys.all })
    },
  })
}
