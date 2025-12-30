/**
 * Minister-related DTOs
 */

export type MinisterRole = "pastor" | "elder" | "deacon" | "evangelist" | "teacher" | "other"
export type MinisterStatus = "active" | "inactive" | "suspended" | "retired"
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

/**
 * Minister response DTO
 */
export interface MinisterDto extends CreateMinisterDto {
  _id: string
  status: MinisterStatus
  memberName: string
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
