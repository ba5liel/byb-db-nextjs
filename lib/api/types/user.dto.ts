/**
 * User DTOs for Better Auth integration
 */

export interface User {
  id: string;
  email: string;
  name: string;
  role?: string;
  createdAt: string;
  updatedAt: string;
  emailVerified?: boolean;
  image?: string;
  banned?: boolean;
  banReason?: string;
  banExpires?: number;
}

export interface CreateUserDto {
  email: string;
  password: string;
  name: string;
  role?: string;
}

export interface UpdateUserDto {
  name?: string;
  email?: string;
}

export interface AssignRoleDto {
  role: string;
}

export interface ResetPasswordDto {
  newPassword: string;
  sendEmail?: boolean;
  sendSMS?: boolean;
}

export interface BanUserDto {
  reason: string;
}

export interface UserFilters {
  role?: string;
  search?: string;
  banned?: boolean;
  page?: number;
  limit?: number;
}

export interface UserListResponse {
  users: User[];
  total?: number;
  page?: number;
  limit?: number;
}

