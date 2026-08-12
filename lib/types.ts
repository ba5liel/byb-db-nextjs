// Ethiopian-localized church grouping. Backend stores lowercase 'alpha' etc.
export type SubCommunity = "Jemmo" | "Bethel" | "Weyira" | "Alpha"
export type ChurchGroup = "jemmo" | "bethel" | "weyira" | "alpha"
export type Nationality = "ethiopian" | "non_ethiopian"
export type PaysTithe = "yes" | "no" | "unknown"
export type FamilyRole = "father" | "mother" | "child" | "sibling" | "spouse" | "other"

export interface Member {
  id: string

  // Basic Information (መሰረታዊ መረጃ)
  fullName?: string // Combined field (firstName + middleName + lastName)
  firstName: string // ስም (Name)
  middleName?: string // የአባት ስም (Father's Name) — required in the form
  lastName?: string // የአያት ስም (Grandfather's Name) — optional
  email?: string
  phone: string
  birthYearEthiopian?: string // የትውልድ ዓመት (ዓ.ም)
  dateOfBirth?: string // Gregorian calendar (backend birthDate)
  gender: "Male" | "Female"
  nationality?: Nationality
  photoUrl?: string
  membershipNumber?: string // Auto-generated unique ID
  registrationDate?: string // Auto-filled on creation

  // Age & Categorization (የእድሜ መረጃ)
  ageGroup?: "Children" | "Teenagers" | "Youth" | "Adults" | "Seniors" // Auto-calculated

  // Address & Church Grouping (የመኖሪያ አድራሻ / የቤተክርስቲያን ቡድን)
  physicalAddress?: string
  woreda?: string
  seferId?: string // Mongo id of the selected sefer
  sefer?: string // sefer name
  subCommunity?: SubCommunity // derived from sefer's churchGroup
  currentGroupType?: "Cell Group" | "Youth Group" | "Bible Study" | "Prayer Group" | "None"
  cellGroupName?: string
  cellGroupNumber?: string
  reasonForNoGroup?: string

  // Emergency Contact (የድንገተኛ ጊዜ ግንኙነት)
  emergencyContactName?: string
  emergencyContactPhone?: string

  // Spiritual Journey (መንፈሳዊ ጉዞ)
  salvationYearEthiopian?: string // የደኅንነት ዓመት (ዓ.ም)
  baptismYearEthiopian?: string // የጥምቀት ዓመት (ዓ.ም)
  catechesisStatus?: "Not Started" | "In Progress" | "Completed" // Discipleship status

  // Transfer Information (የዝውውር መረጃ)
  isTransfer: boolean // cameByTransfer
  transferFromChurch?: string
  transferDate?: string
  transferLetterUrl?: string

  // Service & Ministry (አገልግሎት)
  currentServices: string[] // currentlyServingAt (max 2)

  // Family & Personal Status (የቤተሰብ መረጃ)
  maritalStatus: "Unmarried" | "Married" | "Divorced" | "Widowed"
  numberOfChildren: number
  familyId?: string // linked household (frontend-only convenience)
  familyRole?: FamilyRole // this member's role in the linked family

  // Education & Profession (ትምህርት እና ሙያ)
  educationLevel?: "Uneducated" | "1-8" | "9-12" | "Finished 12" | "Diploma" | "Degree" | "Masters" | "PhD"
  jobType?: "Personal" | "Government" | "Private" | "Unemployed" | "Student" | "Retired"
  profession?: string

  // Financial Contribution (የገንዘብ አስተዋፅዖ)
  paysTithe: PaysTithe // አስራት — yes/no/unknown
  titheAmount?: number
  titheFrequency?: "Weekly" | "Monthly" | "Occasionally"

  // Member Status & History (የአባል ሁኔታ)
  membershipStatus: "Active" | "Inactive" | "Removed" | "Transferred Out" | "Deceased"
  membershipType?: "Regular" | "Guest" | "Transferred" | string
  /** When status last changed (leave / restore date). */
  statusChangeDate?: string
  /** Reason recorded when the member left / was removed. */
  leaveReason?: string

  // Join/Registration
  joinDate: string

  // Legacy single notes field (kept for older data; prefer MemberNote)
  notes?: string

  // Metadata
  createdAt: string
  updatedAt: string
  createdBy?: string
  updatedBy?: string
}

/** Per-user note on a member. Private notes are author-only; public notes are shared. */
export interface MemberNote {
  id: string
  memberId: string
  body: string
  visibility: "private" | "public"
  status: "not_started" | "in_progress" | "done"
  createdBy: string
  createdByName?: string
  createdAt: string
  updatedAt: string
  isMine?: boolean
}

/**
 * Sefer (neighborhood/zone). GET /api/sefers.
 */
export interface Sefer {
  _id: string
  name: string
  nameAmharic?: string
  churchGroup: ChurchGroup
  isActive: boolean
}

/**
 * A member entry within a family. On read, memberId is populated by the backend.
 */
export interface FamilyMember {
  memberId:
    | string
    | {
        _id: string
        fullName: string
        membershipNumber?: string
        sex?: string
        phoneNumber?: string
        memberPicture?: string
      }
  role: FamilyRole
}

/**
 * A family (household). GET /api/families.
 */
export interface Family {
  _id: string
  name?: string
  members: FamilyMember[]
}

export interface FamilyRelationship {
  id: string
  relatedMemberId: string
  relationshipType: "Parent" | "Child" | "Spouse" | "Sibling"
  relatedMemberName: string
}

export interface MemberDocument {
  id: string
  type: "Member Acceptance File" | "Sinbet File" | "Marriage Certificate" | "Baptism Certificate" | "ID Card Copy" | "Other" | string
  fileName: string
  fileUrl: string
  uploadedDate: string
  uploadedBy?: string
  notes?: string
}

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: string
}

export type Locale = "en" | "am"

// ============================================================================
// System Admin Types
// ============================================================================

/**
 * Admin User Role
 */
export type AdminUserRole = 
  | 'superAdmin'
  | 'admin'
  | 'ministerAdmin'
  | 'serviceManager'
  | 'reportViewer'
  | 'dataEntry'
  | 'user'
  | 'bethelAdmin'
  | 'jemmoAdmin'
  | 'youthAdmin'
  | 'childrenAdmin'
  | 'weyiraAdmin'
  | 'alphaAdmin'

/**
 * Admin User Status
 */
export type AdminUserStatus = 
  | 'active'
  | 'inactive'
  | 'locked'
  | 'pending_activation'

/**
 * Admin User Interface
 */
export interface AdminUser {
  _id: string
  authUserId: string
  username: string
  fullName: string
  email: string
  phoneNumber?: string
  role: AdminUserRole
  customPrivileges?: string[]
  deniedPrivileges?: string[]
  status: AdminUserStatus
  statusReason?: string
  statusChangedAt?: string
  statusChangedBy?: string
  mustChangePassword: boolean
  passwordLastChangedAt?: string
  passwordExpiresAt?: string
  lastLoginAt?: string
  lastLoginIp?: string
  failedLoginAttempts: number
  lockedUntil?: string
  lockReason?: string
  isDeleted: boolean
  deletedAt?: string
  deletedBy?: string
  notifyOnPasswordChange: boolean
  notifyOnLogin: boolean
  ministerId?: string
  memberId?: string
  createdBy?: string
  updatedBy?: string
  createdAt?: string
  updatedAt?: string
}

/**
 * Active Session Interface
 */
export interface ActiveSession {
  token: string
  userId: string
  username: string
  email: string
  ipAddress?: string
  userAgent?: string
  createdAt: string
  lastActivityAt: string
  expiresAt: string
}

/**
 * Activity Log Interface
 */
export interface ActivityLog {
  _id: string
  userId: string
  username: string
  action: string
  resource: string
  resourceId?: string
  details?: Record<string, any>
  ipAddress?: string
  userAgent?: string
  createdAt: string
}

// ============================================================================
// Church Services Types
// ============================================================================

/**
 * Church Service Type
 */
export type ServiceType = 
  | 'worship'
  | 'evangelism'
  | 'social_service'
  | 'education'
  | 'youth'
  | 'children'
  | 'prayer'
  | 'media'
  | 'administration'
  | 'other'

/**
 * Church Service Interface
 */
export interface ChurchService {
  _id: string
  serviceName: string
  serviceDescription: string
  type: ServiceType
  service_logo?: string
  leader: string | { _id: string; fullName?: string } // Member ID or populated member
  secretary?: string | { _id: string; fullName?: string } // Member ID or populated member
  leadership_start: string // ISO date string
  leadership_end?: string // ISO date string
  maximum_members_allowed?: number
  meeting_schedule?: string
  meeting_location?: string
  status: boolean // true = active, false = inactive
  currentMemberCount?: number // Added by service
  availableSlots?: number | null // Added by service
  created_at?: string
  created_by?: string
  last_updated_at?: string
}

/**
 * Service Enrollment Interface
 */
export interface ServiceEnrollment {
  _id: string
  serviceId: string
  memberId: string
  enrollmentDate: string
  exitDate?: string
  status: 'active' | 'exited'
  roleInService?: string
  notes?: string
  exitReason?: string
  createdBy?: string
  updatedBy?: string
}

// ============================================================================
// Church Service DTOs (mirror lib/church-services-api.ts)
// ============================================================================

/**
 * Create Church Service DTO
 */
export interface CreateChurchServiceDto {
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
  status?: boolean
}

/**
 * Update Church Service DTO (all fields optional)
 */
export interface UpdateChurchServiceDto extends Partial<CreateChurchServiceDto> {}

/**
 * Service Filter DTO
 */
export interface ServiceFilterDto {
  type?: ServiceType
  status?: string | boolean // 'true'/'false' string or boolean
  page?: number
  limit?: number
}

/**
 * Generic paginated response
 */
export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    total: number
    page: number
    limit: number
    pages: number
  }
}

// ============================================================================
// System Admin DTOs (mirror lib/system-admin-api.ts)
// ============================================================================

/**
 * Create Admin User DTO
 */
export interface CreateAdminUserDto {
  username: string
  fullName: string
  email: string
  phoneNumber?: string
  password: string
  role: AdminUserRole
  ministerId?: string
  memberId?: string
  customPrivileges?: string[]
  deniedPrivileges?: string[]
  sendCredentialsSms?: boolean
  sendCredentialsEmail?: boolean
}

/**
 * Update Admin User DTO
 */
export interface UpdateAdminUserDto {
  fullName?: string
  email?: string
  phoneNumber?: string
  role?: AdminUserRole
  ministerId?: string
  memberId?: string
  customPrivileges?: string[]
  deniedPrivileges?: string[]
  notifyOnPasswordChange?: boolean
  notifyOnLogin?: boolean
}

/**
 * Update User Status DTO
 */
export interface UpdateUserStatusDto {
  status: AdminUserStatus
  reason?: string
}

/**
 * Reset Password DTO
 */
export interface ResetPasswordDto {
  newPassword: string
  forcePasswordChange?: boolean
  sendViaSms?: boolean
  sendViaEmail?: boolean
}

/**
 * Lock Account DTO
 */
export interface LockAccountDto {
  reason: string
  lockDurationMinutes?: number
}

/**
 * Query Admin Users DTO
 */
export interface QueryAdminUsersDto {
  search?: string
  role?: AdminUserRole
  status?: AdminUserStatus
  includeDeleted?: boolean
  page?: number
  limit?: number
}

/**
 * Query Active Sessions DTO
 */
export interface QueryActiveSessionsDto {
  userId?: string
  page?: number
  limit?: number
}

/**
 * Query Activity Logs DTO
 */
export interface QueryActivityLogsDto {
  userId?: string
  action?: string
  resource?: string
  startDate?: string
  endDate?: string
  page?: number
  limit?: number
}