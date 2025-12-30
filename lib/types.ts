export interface Member {
  id: string
  
  // Basic Information (መሰረታዊ መረጃ)
  fullName?: string // Combined field
  firstName: string
  middleName?: string
  lastName: string
  email?: string // Now optional
  phone: string
  yearOfBirthEthiopian?: string // Ethiopian calendar year
  dateOfBirth?: string // Gregorian calendar
  gender: "Male" | "Female"
  photoUrl?: string
  membershipNumber?: string // Auto-generated unique ID
  registrationDate?: string // Auto-filled on creation
  
  // Age & Categorization (የእድሜ መረጃ)
  ageGroup?: "Children" | "Teenagers" | "Youth" | "Adults" | "Seniors" // Auto-calculated
  
  // Address (የመኖሪያ አድራሻ)
  physicalAddress?: string
  address?: string
  city?: string
  state?: string
  zipCode?: string
  subCity?: string
  woreda?: string
  kebele?: string

  // Emergency Contact (የድንገተኛ ጊዜ ግንኙነት)
  emergencyContactName?: string
  emergencyContactRelation?: string
  emergencyContactPhone?: string

  // Spiritual Journey (መንፈሳዊ ጉዞ)
  salvationYearEthiopian?: string // ጌታን ያገኙበት አመት (ዓ.ም)
  salvationDate?: string
  baptismYearEthiopian?: string // የተጠመቁበት አመት (ዓ.ም)
  baptismDate?: string
  confirmationDate?: string
  catechesisStatus?: "Not Started" | "In Progress" | "Completed" // የካቴኬሲስ ሁኔታ
  discipleshipProgram?: string // የደቀመዝሙርነት ፕሮግራም
  discipleshipLevel?: string
  mentor?: string // እረኝነት
  testimony?: string
  faithJourneyNotes?: string

  // Church Grouping & Community (የቤተክርስትያን ቡድን)
  subCommunity?: "Jemmo" | "Bethel" | "Weyira" | "Alfa" | string // መንደር/ክፍል
  currentGroupType?: "Cell Group" | "Youth Group" | "Bible Study" | "Prayer Group" | "None" | string // የሚማሩበት ቡድን አይነት
  cellGroupType?: string
  cellGroupName?: string // የሚማሩበት ቡድን ስም
  cellGroupNumber?: string // የሴል ግሩፕ ቁጥር
  reasonForNoGroup?: string // ምክንያት (if None selected)

  // Transfer Information (የዝውውር መረጃ)
  isTransfer: boolean // ተዘዋውርው ነው የመጡት
  transferFromChurch?: string // የመጡበት ቤ/ክ
  transferYearEthiopian?: string // የመጡበት አመት (ዓ.ም)
  transferDate?: string
  transferLetterUrl?: string // የዝውውር ደብዳቤ

  // Service & Ministry (አገልግሎት)
  currentServices: string[] // የሚያገለግሉበት አገልግሎት ዘርፍ (max 2)
  desiredServices: string[] // ማገልገል የሚፈልጉብት አገልግሎት ዘርፍ
  mentorshipBy?: string // እረኝነት

  // Family & Personal Status (የቤተሰብ መረጃ)
  maritalStatus: "Unmarried" | "Married" | "Divorced" | "Widowed" // የትዳር ሁኔታ
  spouseName?: string // የትዳር ጓድኛ ሙሉ ስም
  spouseMemberId?: string // Link to spouse if they're a member
  numberOfChildren: number // የልጆች ብዛት
  familyRelationships?: FamilyRelationship[]

  // Education & Profession (ትምህርት እና ሙያ)
  educationLevel?: "Uneducated" | "1-8" | "9-12" | "Finished 12" | "Diploma" | "Degree" | "Masters" | "PhD" | string // የትምህርት ደረጃ
  jobType?: "Personal" | "Government" | "Private" | "Unemployed" | "Student" | "Retired" | string // የስራ አይነት
  profession?: string // ሙያ
  occupation?: string

  // Financial Contribution (የገንዘብ አስተዋፅዖ)
  paysTithe: boolean // አስራት ይከፍላሉ
  titheAmount?: number // መጠን በብር
  titheFrequency?: "Weekly" | "Monthly" | "Occasionally" | string // የክፍያ ድግግሞሽ

  // Member Status & History (የአባል ሁኔታ)
  membershipStatus: "Active" | "Inactive" | "Removed" | "Transferred Out" | "Deceased" // የአባል ሁኔታ
  removalReason?: string // የማስወገጃ ምክንያት
  statusChangeDate?: string // ሁኔታ የተቀየረበት ቀን
  membershipType: "Regular" | "Guest" | "Transferred" | string
  
  // Join/Registration
  joinDate: string
  nationality?: string
  
  // Notes & Documents
  notes?: string // ማስታወሻ
  documents?: MemberDocument[]

  // Metadata
  createdAt: string
  updatedAt: string
  createdBy?: string
  updatedBy?: string
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