/**
 * Church service-related DTOs
 */

export type ServiceType =
  | "worship"
  | "evangelism"
  | "teaching"
  | "prayer"
  | "youth"
  | "children"
  | "media"
  | "administration"
  | "other"

/**
 * Create service DTO
 */
export interface CreateServiceDto {
  serviceName: string
  serviceDescription: string
  type: ServiceType
  service_logo?: string
  leader: string // Member ID
  secretary?: string // Member ID
  leadership_start: Date | string
  leadership_end?: Date | string
  maximum_members_allowed?: number
  meeting_schedule?: string
  meeting_location?: string
  status: boolean
}

/**
 * Update service DTO
 */
export type UpdateServiceDto = Partial<CreateServiceDto>

/**
 * Service response DTO
 */
export interface ServiceDto extends CreateServiceDto {
  _id: string
  currentMemberCount: number
  activeMemberCount: number
  createdAt: string
  updatedAt: string
}

/**
 * Service filters
 */
export interface ServiceFilters {
  type?: ServiceType
  status?: string // "true" or "false"
  page?: number
  limit?: number
}

/**
 * Enroll member DTO
 */
export interface EnrollMemberDto {
  memberId: string
  roleInService?: string
  notes?: string
}

/**
 * Exit member DTO
 */
export interface ExitMemberDto {
  memberId: string
  exitReason?: string
}

/**
 * Service enrollment response
 */
export interface ServiceEnrollmentDto {
  _id: string
  serviceId: string
  memberId: string
  memberName: string
  roleInService?: string
  enrolledDate: string
  exitDate?: string
  exitReason?: string
  isActive: boolean
  notes?: string
}

