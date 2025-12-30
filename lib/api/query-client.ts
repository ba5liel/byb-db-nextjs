import { QueryClient } from "@tanstack/react-query"

/**
 * TanStack Query Client Configuration
 * Sets up default options for queries and mutations
 */

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data considered fresh for 1 minute
      staleTime: 60 * 1000,
      // Cache data for 5 minutes
      gcTime: 5 * 60 * 1000,
      // Retry failed requests once
      retry: 1,
      // Refetch on window focus (useful for keeping data fresh)
      refetchOnWindowFocus: true,
      // Refetch on mount if data is stale
      refetchOnMount: true,
    },
    mutations: {
      // Retry failed mutations once
      retry: 1,
    },
  },
})

