/**
 * Member-related DTOs matching backend API
 */

export type Sex = "male" | "female"
export type MaritalStatus = "unmarried" | "married" | "divorced" | "widowed"
export type MemberStatus = "active" | "inactive" | "removed" | "transferred" | "deceased"
export type SubCommunity = "jemmo" | "bethel" | "weyira" | "alfa"
export type GroupType = "cell_group" | "youth_group" | "bible_study" | "prayer_group" | "none"
export type CatechesisStatus = "not_started" | "in_progress" | "completed"
export type EducationLevel = "uneducated" | "1-8" | "9-12" | "finished_12" | "diploma" | "degree" | "masters" | "phd"
export type JobType = "personal" | "government" | "private" | "unemployed" | "student" | "retired"
export type PaymentFrequency = "weekly" | "monthly" | "occasionally"
export type AgeGroup = "children" | "teenagers" | "youth" | "adults" | "seniors"
export type Shepherding = "alfa" | "beta" | "gamma" | "delta"

/**
 * Create member DTO - matches API specification exactly
 */
export interface CreateMemberDto {
  fullName: string
  sex: Sex
  birthDate: Date | string
  phoneNumber: string
  email?: string
  physicalAddress?: string
  memberPicture?: string
  salvationYear?: Date | string
  baptismYear?: Date | string
  catechesisStatus?: CatechesisStatus
  discipleshipProgram?: string
  subCommunity: SubCommunity
  groupType: GroupType
  groupName?: string
  cellGroupNumber?: number
  reasonForNoGroup?: string
  shepherding?: Shepherding
  cameByTransfer: boolean
  transferredFromChurch?: string
  transferYear?: Date | string
  transferLetterUrl?: string
  currentlyServingAt?: string[]
  wantingToServeAt?: string[]
  maritalStatus: MaritalStatus
  spouseId?: string
  numberOfChildren?: number
  emergencyContactName?: string
  emergencyContactPhone?: string
  motherId?: string
  fatherId?: string
  siblingIds?: string[]
  childrenIds?: string[]
  educationLevel?: EducationLevel
  jobType?: JobType
  profession?: string
  paysTithe: boolean
  titheAmount?: number
  paymentFrequency?: PaymentFrequency
  notes?: string
}

/**
 * Update member DTO (all fields optional)
 */
export type UpdateMemberDto = Partial<CreateMemberDto>

/**
 * Member response DTO
 */
export interface MemberDto extends CreateMemberDto {
  _id: string
  membershipNumber: string
  ageGroup?: AgeGroup
  memberStatus: MemberStatus
  createdAt: string
  updatedAt: string
}

/**
 * Member filters for list query
 */
export interface MemberFilters {
  search?: string
  subCommunity?: SubCommunity
  ageGroup?: AgeGroup
  sex?: Sex
  maritalStatus?: MaritalStatus
  memberStatus?: MemberStatus
  groupType?: GroupType
  page?: number
  limit?: number
}

/**
 * Member statistics response
 */
export interface MemberStatistics {
  totalMembers: number
  maleCount: number
  femaleCount: number
  activeMembers: number
  inactiveMembers: number
  newMembersThisMonth: number
  ageGroupStats: Array<{
    ageGroup: string
    count: number
  }>
  maritalStatusStats: Array<{
    status: string
    count: number
  }>
  subCommunityStats: Array<{
    subCommunity: string
    count: number
  }>
  groupTypeStats: Array<{
    groupType: string
    count: number
  }>
}

/**
 * Search member result
 */
export interface MemberSearchResult {
  _id: string
  fullName: string
  membershipNumber: string
  phoneNumber: string
  email?: string
  subCommunity: string
}

