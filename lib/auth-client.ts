import { createAuthClient } from "better-auth/react"
import { adminClient, organizationClient } from "better-auth/client/plugins"
import { ac } from "./permissions"

/**
 * Better Auth Client Configuration
 * This client connects to the NestJS backend auth endpoints
 * 
 * IMPORTANT: Both adminClient and organizationClient plugins are included
 * - adminClient: System-wide user management
 * - organizationClient: Multi-tenant with dynamic roles
 */
export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:3000/api/auth",
  
  plugins: [
    // Admin client plugin for system-wide operations
    adminClient(),
    
    // Organization client plugin with dynamic roles
    organizationClient({
      ac, // Same access controller as server
      dynamicAccessControl: {
        enabled: true,
      }
    }),
  ],
})

/**
 * Export hooks for use in components
 */
export const {
  useSession,
  signIn,
  signUp,
  signOut,
  useActiveOrganization,
} = authClient

/**
 * Export types for TypeScript
 */
export type AuthClient = typeof authClient
export type Session = typeof authClient.$Infer.Session

