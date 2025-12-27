"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import type { User } from "./types"
import { signIn, signUp, signOut, getSession } from "./auth-api"

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

/**
 * Maps backend user data to frontend User type
 */
function mapBackendUserToUser(backendUser: any): User | null {
  if (!backendUser) return null

  // Split name into firstName and lastName if needed
  const nameParts = backendUser.name?.split(" ") || []
  const firstName = backendUser.firstName || nameParts[0] || ""
  const lastName = backendUser.lastName || nameParts.slice(1).join(" ") || ""

  return {
    id: backendUser.id,
    email: backendUser.email,
    firstName,
    lastName,
    role: backendUser.role || "user",
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Check for existing session on mount
  useEffect(() => {
    async function checkSession() {
      try {
        const sessionUser = await getSession()
        if (sessionUser) {
          const mappedUser = mapBackendUserToUser(sessionUser)
          setUser(mappedUser)
        }
      } catch (error) {
        console.error("Error checking session:", error)
      } finally {
        setLoading(false)
      }
    }

    checkSession()
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const response = await signIn(email, password)
      
      // Better Auth returns user in response.user or response.data.user
      const backendUser = response.user || response.data?.user || response
      const mappedUser = mapBackendUserToUser(backendUser)
      
      if (mappedUser) {
        setUser(mappedUser)
        return { success: true }
      }
      
      return { success: false, error: "Invalid response from server" }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Login failed"
      return { success: false, error: errorMessage }
    }
  }

  const register = async (name: string, email: string, password: string) => {
    try {
      const response = await signUp(email, password, name)
      
      // Better Auth returns user in response.user or response.data.user
      const backendUser = response.user || response.data?.user || response
      const mappedUser = mapBackendUserToUser(backendUser)
      
      if (mappedUser) {
        setUser(mappedUser)
        return { success: true }
      }
      
      return { success: false, error: "Invalid response from server" }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Registration failed"
      return { success: false, error: errorMessage }
    }
  }

  const logout = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error("Error signing out:", error)
    } finally {
      // Always clear user state on client side
      setUser(null)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
