import { createAuthClient } from "better-auth/react"
import { adminClient, organizationClient } from "better-auth/client/plugins"
import { ac } from "./permissions"

/**
 * Better Auth Client Configuration
 * This client connects to the NestJS backend auth endpoints
 * 
 * IMPORTANT: Configuration must match backend exactly
 * - adminClient: Only for superAdmin (system-wide operations)
 * - organizationClient: All users are organization members
 */
export const authClient = createAuthClient({
  // Backend auth endpoint
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:3000/api/auth",
  
  // Session configuration (matches backend)
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // Update every 24 hours
  },
  
  plugins: [
    // Admin client plugin - only for superAdmin
    adminClient(),
    
    // Organization client plugin - all users
    organizationClient({
      ac, // Same access controller as backend
      
      // Dynamic role creation enabled
      dynamicAccessControl: {
        enabled: true,
        maximumRolesPerOrganization: 20,
      },
      
      // Single organization mode (users cannot create orgs)
      allowUserToCreateOrganization: false,
      creatorRole: "member", // Default role for new users
      
      // Membership settings
      membershipLimit: 1000,
      invitationExpiresIn: 60 * 60 * 24 * 7, // 7 days
      invitationLimit: 100,
      cancelPendingInvitationsOnReInvite: true,
      requireEmailVerificationOnInvitation: false,
    }),
  ],
})

/**
 * Export hooks and functions for use in components
 */
export const {
  useSession,
  signIn,
  signUp,
  signOut,
  useActiveOrganization,
  organization,
} = authClient

/**
 * Export types for TypeScript
 */
export type AuthClient = typeof authClient
export type Session = typeof authClient.$Infer.Session

/**
 * Helper function to get API base URL
 */
export const getApiBaseUrl = () => {
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"
}

