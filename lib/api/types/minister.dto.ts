/**
 * Minister-related DTOs
 */

export type MinisterRole =
  | "pastor"
  | "apostle"
  | "evangelist"
  | "elder"
  | "deacon"
  | "deaconess"
  | "youth_leader"
  | "other"
export type MinisterStatus = "active" | "on_leave" | "suspended" | "retired"
export type ContractType = "full_time" | "part_time" | "volunteer"

/**
 * Create minister DTO
 */
export interface CreateMinisterDto {
  memberId: string
  role: MinisterRole
  customRole?: string
  ordinationDate: Date | string
  ordinationCertificateUrl?: string
  responsibilities?: string
  assignedDepartments?: string[]
  salary?: number
  contractType?: ContractType
  hasSystemAccess: boolean
  email?: string
  password?: string
  permissionRole?: string
}

/**
 * Update minister DTO
 */
export type UpdateMinisterDto = Partial<CreateMinisterDto> & {
  status?: MinisterStatus
  statusChangeReason?: string
}

/**
 * Member reference as populated on a minister response (backend populates
 * `memberId` with a subset of member fields).
 */
export interface PopulatedMember {
  _id: string
  fullName: string
  membershipNumber?: string
  phoneNumber?: string
  email?: string
  memberPicture?: string
  phase?: string
}

/**
 * Minister response DTO
 */
export interface MinisterDto extends Omit<CreateMinisterDto, "memberId"> {
  _id: string
  memberId: string | PopulatedMember
  status: MinisterStatus
  memberName?: string
  memberEmail?: string
  createdAt: string
  updatedAt: string
}

/**
 * Minister filters
 */
export interface MinisterFilters {
  role?: MinisterRole
  status?: MinisterStatus
  search?: string
  page?: number
  limit?: number
}
