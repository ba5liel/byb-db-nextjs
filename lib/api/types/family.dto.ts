/**
 * Family unit DTOs (GET /api/members/families)
 */

export type FamilyRole =
  | "father"
  | "mother"
  | "spouse"
  | "child"
  | "sibling"
  | "relative"

export interface FamilyMemberDto {
  _id: string
  fullName: string
  sex: "male" | "female"
  memberPicture?: string
  phoneNumber?: string
  memberStatus?: string
  age?: number
  role: FamilyRole
  spouseId?: string
  motherId?: string
  fatherId?: string
}

export interface FamilyUnitDto {
  /** Smallest member id in the unit — stable identifier */
  id: string
  familyName: string
  headName: string
  memberCount: number
  counts: Partial<Record<FamilyRole, number>>
  members: FamilyMemberDto[]
}
