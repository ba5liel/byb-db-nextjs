/**
 * React Query hooks for user management
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useToast } from "@/hooks/use-toast"
import type {
  User,
  CreateUserDto,
  UpdateUserDto,
  AssignRoleDto,
  ResetPasswordDto,
  BanUserDto,
} from "../types"
import * as usersService from "../services/users.service"

// Query keys
export const userKeys = {
  all: ["users"] as const,
  lists: () => [...userKeys.all, "list"] as const,
  list: (filters?: any) => [...userKeys.lists(), filters] as const,
  details: () => [...userKeys.all, "detail"] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
  session: () => [...userKeys.all, "session"] as const,
}

/**
 * Hook to fetch all users
 */
export function useUsers() {
  return useQuery({
    queryKey: userKeys.lists(),
    queryFn: () => usersService.getUsers(),
  })
}

/**
 * Hook to fetch a single user by ID
 */
export function useUser(userId: string) {
  return useQuery({
    queryKey: userKeys.detail(userId),
    queryFn: () => usersService.getUserById(userId),
    enabled: !!userId,
  })
}

/**
 * Hook to get admin session
 */
export function useAdminSession() {
  return useQuery({
    queryKey: userKeys.session(),
    queryFn: () => usersService.getAdminSession(),
  })
}

/**
 * Hook to create a new user
 */
export function useCreateUser() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (data: CreateUserDto) => usersService.createUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() })
      toast({
        title: "Success",
        description: "User created successfully",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to create user",
        variant: "destructive",
      })
    },
  })
}

/**
 * Hook to update user
 */
export function useUpdateUser() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: UpdateUserDto }) =>
      usersService.updateUser(userId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() })
      queryClient.invalidateQueries({ queryKey: userKeys.detail(variables.userId) })
      toast({
        title: "Success",
        description: "User updated successfully",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update user",
        variant: "destructive",
      })
    },
  })
}

/**
 * Hook to assign role to user
 */
export function useAssignRole() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: AssignRoleDto }) =>
      usersService.assignRole(userId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() })
      queryClient.invalidateQueries({ queryKey: userKeys.detail(variables.userId) })
      toast({
        title: "Success",
        description: "Role assigned successfully",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to assign role",
        variant: "destructive",
      })
    },
  })
}

/**
 * Hook to reset user password
 */
export function useResetUserPassword() {
  const { toast } = useToast()

  return useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: ResetPasswordDto }) =>
      usersService.resetUserPassword(userId, data),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Password reset successfully",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to reset password",
        variant: "destructive",
      })
    },
  })
}

/**
 * Hook to revoke user sessions
 */
export function useRevokeUserSessions() {
  const { toast } = useToast()

  return useMutation({
    mutationFn: (userId: string) => usersService.revokeUserSessions(userId),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "All user sessions revoked successfully",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to revoke sessions",
        variant: "destructive",
      })
    },
  })
}

/**
 * Hook to ban user
 */
export function useBanUser() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: BanUserDto }) =>
      usersService.banUser(userId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() })
      queryClient.invalidateQueries({ queryKey: userKeys.detail(variables.userId) })
      toast({
        title: "Success",
        description: "User banned successfully",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to ban user",
        variant: "destructive",
      })
    },
  })
}

/**
 * Hook to unban user
 */
export function useUnbanUser() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (userId: string) => usersService.unbanUser(userId),
    onSuccess: (_, userId) => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() })
      queryClient.invalidateQueries({ queryKey: userKeys.detail(userId) })
      toast({
        title: "Success",
        description: "User unbanned successfully",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to unban user",
        variant: "destructive",
      })
    },
  })
}

/**
 * Hook to delete user
 */
export function useDeleteUser() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (userId: string) => usersService.deleteUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() })
      toast({
        title: "Success",
        description: "User deleted successfully",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete user",
        variant: "destructive",
      })
    },
  })
}

/**
 * Hook to check permissions
 */
export function useCheckPermission() {
  return useMutation({
    mutationFn: (permissions: Record<string, string[]>) => usersService.checkPermission(permissions),
  })
}

