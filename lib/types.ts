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
  gender: "Male" | "Female" | "Other"
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
