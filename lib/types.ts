export interface Member {
  id: string
  // Basic Information
  firstName: string
  middleName?: string
  lastName: string
  email: string
  phone: string
  dateOfBirth?: string
  gender: "Male" | "Female" | "Other"
  maritalStatus: "Single" | "Married" | "Divorced" | "Widowed"
  nationality?: string
  occupation?: string
  photoUrl?: string

  // Address
  address?: string
  city?: string
  state?: string
  zipCode?: string
  subCity?: string
  woreda?: string
  kebele?: string

  // Emergency Contact
  emergencyContactName?: string
  emergencyContactRelation?: string
  emergencyContactPhone?: string

  // Spiritual Journey
  salvationDate?: string
  baptismDate?: string
  confirmationDate?: string
  salvationYearEthiopian?: string
  baptismYearEthiopian?: string
  catechesisStatus?: "Not Started" | "In Progress" | "Completed"
  discipleshipLevel?: string
  discipleshipProgram?: string
  mentor?: string
  testimony?: string
  faithJourneyNotes?: string

  // Church Grouping
  subCommunity?: string
  cellGroupType?: string
  cellGroupNumber?: string
  cellGroupName?: string

  // Transfer Information
  isTransfer: boolean
  transferFromChurch?: string
  transferDate?: string
  transferLetterUrl?: string

  // Service & Ministry
  currentServices: string[]
  desiredServices: string[]
  mentorshipBy?: string

  // Family Information
  spouseName?: string
  numberOfChildren: number
  familyRelationships?: FamilyRelationship[]

  // Education & Profession
  educationLevel?: string
  jobType?: string
  profession?: string

  // Financial Contribution
  paysTithe: boolean
  titheAmount?: number
  titheFrequency?: "Weekly" | "Monthly" | "Yearly"

  // Membership
  joinDate: string
  membershipStatus: "Active" | "Inactive" | "Suspended"
  membershipType: "Regular" | "Guest" | "Transferred"
  membershipNumber?: string
  notes?: string

  // Metadata
  createdAt: string
  updatedAt: string
}

export interface FamilyRelationship {
  id: string
  relatedMemberId: string
  relationshipType: "Parent" | "Child" | "Spouse" | "Sibling"
  relatedMemberName: string
}

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: string
}
