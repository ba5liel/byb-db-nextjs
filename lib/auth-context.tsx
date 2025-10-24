"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import type { User } from "./types"

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is logged in
    const storedUser = localStorage.getItem("church_user")
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch (error) {
        console.error("Failed to parse user from localStorage:", error)
      }
    }
    setLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    // In production, this would call a real API
    const storedUsers = localStorage.getItem("church_users")
    const users = storedUsers ? JSON.parse(storedUsers) : []

    const foundUser = users.find((u: { email: string; password: string; id: string; name: string; role: string }) => u.email === email && u.password === password)

    if (foundUser) {
      const user: User = {
        id: foundUser.id,
        email: foundUser.email,
        firstName: foundUser.firstName || foundUser.name?.split(" ")[0] || "",
        lastName: foundUser.lastName || foundUser.name?.split(" ")[1] || "",
        role: foundUser.role || "admin",
      }
      setUser(user)
      localStorage.setItem("church_user", JSON.stringify(user))
      return { success: true }
    }

    return { success: false, error: "Invalid email or password" }
  }

  const register = async (name: string, email: string, password: string) => {
    const storedUsers = localStorage.getItem("church_users")
    const users = storedUsers ? JSON.parse(storedUsers) : []

    // Check if user already exists
    if (users.find((u: { email: string }) => u.email === email)) {
      return { success: false, error: "User already exists" }
    }

    const newUser = {
      id: crypto.randomUUID(),
      email,
      password,
      name,
      role: "admin",
    }

    users.push(newUser)
    localStorage.setItem("church_users", JSON.stringify(users))

    const user: User = {
      id: newUser.id,
      email: newUser.email,
      firstName: name.split(" ")[0] || name,
      lastName: name.split(" ")[1] || "",
      role: newUser.role,
    }
    setUser(user)
    localStorage.setItem("church_user", JSON.stringify(user))

    return { success: true }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("church_user")
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
