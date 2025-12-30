import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { membersService } from "../services"
import type {
  CreateMemberDto,
  UpdateMemberDto,
  MemberFilters,
} from "../types"

/**
 * Query keys for members
 */
export const memberKeys = {
  all: ["members"] as const,
  lists: () => [...memberKeys.all, "list"] as const,
  list: (filters?: MemberFilters) => [...memberKeys.lists(), filters] as const,
  details: () => [...memberKeys.all, "detail"] as const,
  detail: (id: string) => [...memberKeys.details(), id] as const,
  statistics: () => [...memberKeys.all, "statistics"] as const,
  search: (query: string) => [...memberKeys.all, "search", query] as const,
}

/**
 * Hook to fetch paginated list of members
 */
export function useMembers(filters?: MemberFilters) {
  return useQuery({
    queryKey: memberKeys.list(filters),
    queryFn: () => membersService.getMembers(filters),
  })
}

/**
 * Hook to fetch a single member by ID
 */
export function useMember(id: string) {
  return useQuery({
    queryKey: memberKeys.detail(id),
    queryFn: () => membersService.getMemberById(id),
    enabled: !!id, // Only run query if id is provided
  })
}

/**
 * Hook to fetch member statistics
 */
export function useMemberStatistics() {
  return useQuery({
    queryKey: memberKeys.statistics(),
    queryFn: () => membersService.getMemberStatistics(),
  })
}

/**
 * Hook to search members
 */
export function useSearchMembers(query: string, limit?: number) {
  return useQuery({
    queryKey: memberKeys.search(query),
    queryFn: () => membersService.searchMembers(query, limit),
    enabled: query.length > 0, // Only search if query is not empty
  })
}

/**
 * Hook to create a new member
 */
export function useCreateMember() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateMemberDto) => membersService.createMember(data),
    onSuccess: () => {
      // Invalidate and refetch member lists and statistics
      queryClient.invalidateQueries({ queryKey: memberKeys.lists() })
      queryClient.invalidateQueries({ queryKey: memberKeys.statistics() })
    },
  })
}

/**
 * Hook to update a member
 */
export function useUpdateMember() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateMemberDto }) =>
      membersService.updateMember(id, data),
    onSuccess: (_, variables) => {
      // Invalidate the specific member query
      queryClient.invalidateQueries({ queryKey: memberKeys.detail(variables.id) })
      // Invalidate member lists
      queryClient.invalidateQueries({ queryKey: memberKeys.lists() })
      // Invalidate statistics
      queryClient.invalidateQueries({ queryKey: memberKeys.statistics() })
    },
  })
}

/**
 * Hook to delete a member
 */
export function useDeleteMember() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => membersService.deleteMember(id),
    onSuccess: () => {
      // Invalidate member lists and statistics
      queryClient.invalidateQueries({ queryKey: memberKeys.lists() })
      queryClient.invalidateQueries({ queryKey: memberKeys.statistics() })
    },
  })
}

/**
 * Hook to restore a removed member
 */
export function useRestoreMember() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => membersService.restoreMember(id),
    onSuccess: (_, id) => {
      // Invalidate the specific member query
      queryClient.invalidateQueries({ queryKey: memberKeys.detail(id) })
      // Invalidate member lists
      queryClient.invalidateQueries({ queryKey: memberKeys.lists() })
      // Invalidate statistics
      queryClient.invalidateQueries({ queryKey: memberKeys.statistics() })
    },
  })
}

/**
 * Hook to update member status
 */
export function useUpdateMemberStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, status, reason }: { id: string; status: string; reason?: string }) =>
      membersService.updateMemberStatus(id, status, reason),
    onSuccess: (_, variables) => {
      // Invalidate the specific member query
      queryClient.invalidateQueries({ queryKey: memberKeys.detail(variables.id) })
      // Invalidate member lists
      queryClient.invalidateQueries({ queryKey: memberKeys.lists() })
      // Invalidate statistics
      queryClient.invalidateQueries({ queryKey: memberKeys.statistics() })
    },
  })
}

