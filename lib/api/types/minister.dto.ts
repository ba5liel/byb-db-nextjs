/**
 * Minister-related DTOs
 */

export type MinisterRole = "pastor" | "elder" | "deacon" | "evangelist" | "teacher" | "other"
export type MinisterStatus = "active" | "on_leave" | "suspended" | "retired"
export type ContractType = "full_time" | "part_time" | "volunteer" | "contract"

/**
 * Create minister DTO
 */
export interface CreateMinisterDto {
  memberId: string
  role: MinisterRole
  customRole?: string
  ordinationDate: Date | string
  ordinationCertificateUrl?: string
  ordainingBody?: string
  responsibilities: string
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

/** Shape of a populated member reference returned by the backend */
export interface PopulatedMemberRef {
  _id: string
  fullName: string
  membershipNumber?: string
  phoneNumber?: string
  email?: string
  memberPicture?: string
}

/**
 * Minister response DTO
 * `memberId` is a populated member object in API responses (string when sending).
 */
export interface MinisterDto extends Omit<CreateMinisterDto, "memberId"> {
  _id: string
  memberId: string | PopulatedMemberRef
  status: MinisterStatus
  statusEffectiveDate?: string
  createdAt: string
  updatedAt: string
}

/** Resolve the populated member ref from a minister response */
export function getMinisterMember(minister: MinisterDto): PopulatedMemberRef | null {
  return typeof minister.memberId === "object" && minister.memberId !== null
    ? minister.memberId
    : null
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
