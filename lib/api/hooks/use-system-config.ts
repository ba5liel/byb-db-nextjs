import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { systemConfigService } from "../services/system-config.service"
import type {
  ConfigOptionItem,
  AgeGroupDefinition,
  ServiceEnrollmentRules,
  ConfigListResource,
} from "../types"

/**
 * Query keys for system configuration
 */
export const systemConfigKeys = {
  all: ["system-config"] as const,
}

/**
 * Hook to fetch the entire system configuration
 */
export function useSystemConfig() {
  return useQuery({
    queryKey: systemConfigKeys.all,
    queryFn: () => systemConfigService.getConfig(),
  })
}

function useInvalidateConfig() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: systemConfigKeys.all })
}

// ---- Age groups ----

export function useAddAgeGroup() {
  const invalidate = useInvalidateConfig()
  return useMutation({
    mutationFn: (item: AgeGroupDefinition) => systemConfigService.addAgeGroup(item),
    onSuccess: invalidate,
  })
}

export function useUpdateAgeGroup() {
  const invalidate = useInvalidateConfig()
  return useMutation({
    mutationFn: ({ key, item }: { key: string; item: Partial<AgeGroupDefinition> }) =>
      systemConfigService.updateAgeGroup(key, item),
    onSuccess: invalidate,
  })
}

export function useDeleteAgeGroup() {
  const invalidate = useInvalidateConfig()
  return useMutation({
    mutationFn: (key: string) => systemConfigService.deleteAgeGroup(key),
    onSuccess: invalidate,
  })
}

// ---- Generic option lists ----

export function useAddOptionItem() {
  const invalidate = useInvalidateConfig()
  return useMutation({
    mutationFn: ({ resource, item }: { resource: ConfigListResource; item: ConfigOptionItem }) =>
      systemConfigService.addOptionItem(resource, item),
    onSuccess: invalidate,
  })
}

export function useUpdateOptionItem() {
  const invalidate = useInvalidateConfig()
  return useMutation({
    mutationFn: ({
      resource,
      key,
      item,
    }: {
      resource: ConfigListResource
      key: string
      item: Partial<ConfigOptionItem>
    }) => systemConfigService.updateOptionItem(resource, key, item),
    onSuccess: invalidate,
  })
}

export function useDeleteOptionItem() {
  const invalidate = useInvalidateConfig()
  return useMutation({
    mutationFn: ({ resource, key }: { resource: ConfigListResource; key: string }) =>
      systemConfigService.deleteOptionItem(resource, key),
    onSuccess: invalidate,
  })
}

export function useReorderOptionList() {
  const invalidate = useInvalidateConfig()
  return useMutation({
    mutationFn: ({
      resource,
      orderedKeys,
    }: {
      resource: ConfigListResource
      orderedKeys: string[]
    }) => systemConfigService.reorderOptionList(resource, orderedKeys),
    onSuccess: invalidate,
  })
}

// ---- Enrollment rules ----

export function useUpdateEnrollmentRules() {
  const invalidate = useInvalidateConfig()
  return useMutation({
    mutationFn: (rules: Partial<ServiceEnrollmentRules>) =>
      systemConfigService.updateEnrollmentRules(rules),
    onSuccess: invalidate,
  })
}
