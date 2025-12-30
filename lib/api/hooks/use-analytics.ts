import { useQuery } from "@tanstack/react-query"
import { analyticsService } from "../services"

/**
 * Query keys for analytics
 */
export const analyticsKeys = {
  all: ["analytics"] as const,
  dashboard: () => [...analyticsKeys.all, "dashboard"] as const,
  subCommunity: (subCommunity: string) =>
    [...analyticsKeys.all, "sub-community", subCommunity] as const,
  registrationTrends: (months?: number) =>
    [...analyticsKeys.all, "registration-trends", months] as const,
  serviceStats: () => [...analyticsKeys.all, "service-stats"] as const,
  financialStats: () => [...analyticsKeys.all, "financial-stats"] as const,
}

/**
 * Hook to fetch dashboard statistics
 */
export function useDashboardStats() {
  return useQuery({
    queryKey: analyticsKeys.dashboard(),
    queryFn: () => analyticsService.getDashboardStats(),
    staleTime: 5 * 60 * 1000, // Consider fresh for 5 minutes
  })
}

/**
 * Hook to fetch sub-community statistics
 */
export function useSubCommunityStats(subCommunity: string) {
  return useQuery({
    queryKey: analyticsKeys.subCommunity(subCommunity),
    queryFn: () => analyticsService.getSubCommunityStats(subCommunity),
    enabled: !!subCommunity,
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * Hook to fetch registration trends
 */
export function useRegistrationTrends(months?: number) {
  return useQuery({
    queryKey: analyticsKeys.registrationTrends(months),
    queryFn: () => analyticsService.getRegistrationTrends(months),
    staleTime: 10 * 60 * 1000, // Consider fresh for 10 minutes
  })
}

/**
 * Hook to fetch service enrollment statistics
 */
export function useServiceStats() {
  return useQuery({
    queryKey: analyticsKeys.serviceStats(),
    queryFn: () => analyticsService.getServiceStats(),
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * Hook to fetch financial statistics
 */
export function useFinancialStats() {
  return useQuery({
    queryKey: analyticsKeys.financialStats(),
    queryFn: () => analyticsService.getFinancialStats(),
    staleTime: 5 * 60 * 1000,
  })
}

