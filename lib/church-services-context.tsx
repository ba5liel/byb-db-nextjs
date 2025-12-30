"use client"

/**
 * Church Services Context
 * 
 * Provides state management and API functions for church services/ministries.
 * This context wraps the API functions and provides caching, loading states, and error handling.
 */

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import type { ChurchService, ServiceFilterDto, CreateChurchServiceDto, UpdateChurchServiceDto } from "./types"
import * as churchServicesAPI from "./church-services-api"

interface ChurchServicesContextType {
  // State
  services: ChurchService[]
  loading: boolean
  error: string | null
  
  // CRUD Operations
  fetchServices: (filters?: ServiceFilterDto) => Promise<void>
  getService: (id: string) => Promise<ChurchService | null>
  createService: (serviceData: CreateChurchServiceDto) => Promise<ChurchService>
  updateService: (id: string, serviceData: UpdateChurchServiceDto) => Promise<ChurchService>
  
  // Helper functions
  getServiceById: (id: string) => ChurchService | undefined
  clearError: () => void
}

const ChurchServicesContext = createContext<ChurchServicesContextType | undefined>(undefined)

/**
 * Church Services Provider Component
 * 
 * Wraps the application to provide church services state and API functions.
 * All church service operations require superAdmin authentication.
 */
export function ChurchServicesProvider({ children }: { children: ReactNode }) {
  const [services, setServices] = useState<ChurchService[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  /**
   * Fetch all church services with optional filters
   * 
   * @param filters - Optional filters (type, status, page, limit)
   */
  const fetchServices = useCallback(async (filters?: ServiceFilterDto) => {
    try {
      setLoading(true)
      setError(null)
      const response = await churchServicesAPI.getChurchServices(filters)
      setServices(response.data || [])
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch church services'
      setError(errorMessage)
      console.error('Error fetching church services:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Get a single service by ID (from API)
   * 
   * @param id - Service ID
   * @returns Service or null if not found
   */
  const getService = useCallback(async (id: string): Promise<ChurchService | null> => {
    try {
      setLoading(true)
      setError(null)
      const service = await churchServicesAPI.getChurchServiceById(id)
      
      // Update the service in the local state if it exists
      setServices(prev => {
        const index = prev.findIndex(s => s._id === id)
        if (index >= 0) {
          const updated = [...prev]
          updated[index] = service
          return updated
        }
        return [...prev, service]
      })
      
      return service
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch service'
      setError(errorMessage)
      console.error('Error fetching service:', err)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Create a new church service
   * 
   * @param serviceData - Service creation data
   * @returns Created service
   */
  const createService = useCallback(async (serviceData: CreateChurchServiceDto): Promise<ChurchService> => {
    try {
      setLoading(true)
      setError(null)
      const newService = await churchServicesAPI.createChurchService(serviceData)
      
      // Add the new service to the local state
      setServices(prev => [newService, ...prev])
      
      return newService
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create service'
      setError(errorMessage)
      console.error('Error creating service:', err)
      throw err // Re-throw so component can handle it
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Update an existing church service
   * 
   * @param id - Service ID
   * @param serviceData - Partial service data to update
   * @returns Updated service
   */
  const updateService = useCallback(async (
    id: string,
    serviceData: UpdateChurchServiceDto
  ): Promise<ChurchService> => {
    try {
      setLoading(true)
      setError(null)
      const updatedService = await churchServicesAPI.updateChurchService(id, serviceData)
      
      // Update the service in the local state
      setServices(prev => prev.map(s => s._id === id ? updatedService : s))
      
      return updatedService
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update service'
      setError(errorMessage)
      console.error('Error updating service:', err)
      throw err // Re-throw so component can handle it
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Get a service from local state by ID (synchronous)
   * 
   * @param id - Service ID
   * @returns Service or undefined if not found
   */
  const getServiceById = useCallback((id: string): ChurchService | undefined => {
    return services.find(s => s._id === id)
  }, [services])

  // Initial fetch on mount (optional - can be called manually by components)
  // useEffect(() => {
  //   fetchServices()
  // }, [fetchServices])

  return (
    <ChurchServicesContext.Provider
      value={{
        services,
        loading,
        error,
        fetchServices,
        getService,
        createService,
        updateService,
        getServiceById,
        clearError,
      }}
    >
      {children}
    </ChurchServicesContext.Provider>
  )
}

/**
 * Hook to use the Church Services Context
 * 
 * @returns ChurchServicesContextType
 * @throws Error if used outside ChurchServicesProvider
 */
export function useChurchServices() {
  const context = useContext(ChurchServicesContext)
  if (context === undefined) {
    throw new Error("useChurchServices must be used within a ChurchServicesProvider")
  }
  return context
}

