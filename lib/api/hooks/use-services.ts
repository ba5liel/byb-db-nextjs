import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { servicesService } from "../services"
import type {
  CreateServiceDto,
  UpdateServiceDto,
  ServiceFilters,
  EnrollMemberDto,
  ExitMemberDto,
} from "../types"

/**
 * Query keys for services
 */
export const serviceKeys = {
  all: ["services"] as const,
  lists: () => [...serviceKeys.all, "list"] as const,
  list: (filters?: ServiceFilters) => [...serviceKeys.lists(), filters] as const,
  details: () => [...serviceKeys.all, "detail"] as const,
  detail: (id: string) => [...serviceKeys.details(), id] as const,
}

/**
 * Hook to fetch paginated list of services
 */
export function useServices(filters?: ServiceFilters) {
  return useQuery({
    queryKey: serviceKeys.list(filters),
    queryFn: () => servicesService.getServices(filters),
  })
}

/**
 * Hook to fetch a single service by ID
 */
export function useService(id: string) {
  return useQuery({
    queryKey: serviceKeys.detail(id),
    queryFn: () => servicesService.getServiceById(id),
    enabled: !!id, // Only run query if id is provided
  })
}

/**
 * Hook to create a new service
 */
export function useCreateService() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateServiceDto) => servicesService.createService(data),
    onSuccess: () => {
      // Invalidate and refetch service lists
      queryClient.invalidateQueries({ queryKey: serviceKeys.lists() })
    },
  })
}

/**
 * Hook to update a service
 */
export function useUpdateService() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateServiceDto }) =>
      servicesService.updateService(id, data),
    onSuccess: (_, variables) => {
      // Invalidate the specific service query
      queryClient.invalidateQueries({ queryKey: serviceKeys.detail(variables.id) })
      // Invalidate service lists
      queryClient.invalidateQueries({ queryKey: serviceKeys.lists() })
    },
  })
}

/**
 * Hook to delete a service
 */
export function useDeleteService() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => servicesService.deleteService(id),
    onSuccess: () => {
      // Invalidate service lists
      queryClient.invalidateQueries({ queryKey: serviceKeys.lists() })
    },
  })
}

/**
 * Hook to enroll a member to a service
 */
export function useEnrollMember() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ serviceId, data }: { serviceId: string; data: EnrollMemberDto }) =>
      servicesService.enrollMember(serviceId, data),
    onSuccess: (_, variables) => {
      // Invalidate the specific service query
      queryClient.invalidateQueries({ queryKey: serviceKeys.detail(variables.serviceId) })
      // Invalidate service lists
      queryClient.invalidateQueries({ queryKey: serviceKeys.lists() })
    },
  })
}

/**
 * Hook to exit a member from a service
 */
export function useExitMember() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ serviceId, data }: { serviceId: string; data: ExitMemberDto }) =>
      servicesService.exitMember(serviceId, data),
    onSuccess: (_, variables) => {
      // Invalidate the specific service query
      queryClient.invalidateQueries({ queryKey: serviceKeys.detail(variables.serviceId) })
      // Invalidate service lists
      queryClient.invalidateQueries({ queryKey: serviceKeys.lists() })
    },
  })
}

