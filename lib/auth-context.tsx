"use client"

import { createContext, useContext, type ReactNode } from "react"
import { useSession, signIn, signUp, signOut } from "./auth-client"
import type { User } from "./types"
import { signIn, signUp, signOut, getSession } from "./auth-api"

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
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
  const { data: session, isPending } = useSession()

  // Convert Better Auth session to User type
  const user: User | null = session?.user
    ? {
        id: session.user.id,
        email: session.user.email,
        firstName: session.user.name?.split(" ")[0] || "",
        lastName: session.user.name?.split(" ").slice(1).join(" ") || "",
        role: session.user.role || "user",
      }
    : null

  const login = async (email: string, password: string) => {
    try {
      const result = await signIn.email({
        email,
        password,
      })

      if (result.error) {
        return { success: false, error: result.error.message || "Login failed" }
      }

      return { success: true }
    } catch (error) {
      console.error("Login error:", error)
      return { success: false, error: "An unexpected error occurred" }
    }
  }

  const register = async (name: string, email: string, password: string) => {
    try {
      const result = await signUp.email({
        name,
        email,
        password,
      })

      if (result.error) {
        return { success: false, error: result.error.message || "Registration failed" }
      }

      return { success: true }
    } catch (error) {
      console.error("Registration error:", error)
      return { success: false, error: "An unexpected error occurred" }
    }
  }

  const logout = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading: isPending,
        login,
        register,
        logout,
        isAuthenticated: !!session,
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
