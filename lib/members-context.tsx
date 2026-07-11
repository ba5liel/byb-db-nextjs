"use client"

/**
 * Members Context
 * 
 * Provides member data and operations from the backend API.
 * Replaces the previous localStorage-based mock data implementation.
 */

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import type { Member } from "./types"
import * as membersAPI from "./members-api"

interface MembersContextType {
  members: Member[]
  loading: boolean
  error: string | null
  fetchMembers: (filters?: any) => Promise<void>
  addMember: (member: Omit<Member, "id" | "createdAt" | "updatedAt">) => Promise<Member>
  updateMember: (id: string, member: Partial<Member>) => Promise<Member>
  deleteMember: (id: string) => Promise<void>
  getMember: (id: string) => Promise<Member | undefined>
  refreshMembers: () => Promise<void>
}

const MembersContext = createContext<MembersContextType | undefined>(undefined)

// --- Enum maps (frontend label <-> backend value) ---------------------------

const SUB_COMMUNITY_TO_UI: Record<string, Member["subCommunity"]> = {
  jemmo: "Jemmo",
  bethel: "Bethel",
  weyira: "Weyira",
  alpha: "Alpha",
}

const GROUP_TYPE_TO_UI: Record<string, Member["currentGroupType"]> = {
  cell_group: "Cell Group",
  youth_group: "Youth Group",
  bible_study: "Bible Study",
  prayer_group: "Prayer Group",
  none: "None",
}
const GROUP_TYPE_TO_BACKEND: Record<string, string> = {
  "Cell Group": "cell_group",
  "Youth Group": "youth_group",
  "Bible Study": "bible_study",
  "Prayer Group": "prayer_group",
  None: "none",
}

const CATECHESIS_TO_UI: Record<string, Member["catechesisStatus"]> = {
  not_started: "Not Started",
  in_progress: "In Progress",
  completed: "Completed",
}
const CATECHESIS_TO_BACKEND: Record<string, string> = {
  "Not Started": "not_started",
  "In Progress": "in_progress",
  Completed: "completed",
}

const MARITAL_TO_UI: Record<string, Member["maritalStatus"]> = {
  unmarried: "Unmarried",
  married: "Married",
  divorced: "Divorced",
  widowed: "Widowed",
}
const MARITAL_TO_BACKEND: Record<string, string> = {
  Unmarried: "unmarried",
  Married: "married",
  Divorced: "divorced",
  Widowed: "widowed",
}

const STATUS_TO_UI: Record<string, Member["membershipStatus"]> = {
  active: "Active",
  inactive: "Inactive",
  removed: "Removed",
  transferred_out: "Transferred Out",
  deceased: "Deceased",
}

const EDUCATION_TO_UI: Record<string, Member["educationLevel"]> = {
  uneducated: "Uneducated",
  "1-8": "1-8",
  "9-12": "9-12",
  finished_12: "Finished 12",
  diploma: "Diploma",
  degree: "Degree",
  masters: "Masters",
  phd: "PhD",
}
const EDUCATION_TO_BACKEND: Record<string, string> = {
  Uneducated: "uneducated",
  "1-8": "1-8",
  "9-12": "9-12",
  "Finished 12": "finished_12",
  Diploma: "diploma",
  Degree: "degree",
  Masters: "masters",
  PhD: "phd",
}

const JOB_TO_UI: Record<string, Member["jobType"]> = {
  self_employed: "Personal",
  government: "Government",
  private: "Private",
  unemployed: "Unemployed",
  student: "Student",
  retired: "Retired",
}
const JOB_TO_BACKEND: Record<string, string> = {
  Personal: "self_employed",
  Government: "government",
  Private: "private",
  Unemployed: "unemployed",
  Student: "student",
  Retired: "retired",
}

const FREQUENCY_TO_UI: Record<string, Member["titheFrequency"]> = {
  weekly: "Weekly",
  monthly: "Monthly",
  occasionally: "Occasionally",
}

/**
 * Maps backend member data to frontend Member type
 */
function mapBackendMemberToMember(backendMember: any): Member {
  const gender = backendMember.sex === "male" ? "Male" : "Female"

  // Parse fullName into firstName (Name), middleName (Father's), lastName (Grandfather's)
  const nameParts: string[] = backendMember.fullName?.trim().split(/\s+/) || []
  const firstName = nameParts[0] || ""
  const middleName = nameParts[1] || undefined
  const lastName = nameParts.length > 2 ? nameParts.slice(2).join(" ") : undefined

  const registrationDate = backendMember.registrationDate
    ? new Date(backendMember.registrationDate).toISOString().split("T")[0]
    : undefined

  return {
    id: backendMember._id || backendMember.id,
    fullName: backendMember.fullName,
    firstName,
    middleName,
    lastName,
    email: backendMember.email || undefined,
    phone: backendMember.phoneNumber || "",
    birthYearEthiopian: backendMember.birthYearEthiopian?.toString(),
    dateOfBirth: backendMember.birthDate
      ? new Date(backendMember.birthDate).toISOString().split("T")[0]
      : undefined,
    gender,
    nationality: backendMember.nationality,
    photoUrl: backendMember.memberPicture,
    membershipNumber: backendMember.membershipNumber,
    registrationDate,
    ageGroup: backendMember.ageGroup
      ? ((backendMember.ageGroup.charAt(0).toUpperCase() +
          backendMember.ageGroup.slice(1)) as Member["ageGroup"])
      : undefined,
    physicalAddress: backendMember.physicalAddress,
    woreda: backendMember.woreda,
    seferId:
      typeof backendMember.seferId === "object" && backendMember.seferId
        ? backendMember.seferId._id
        : backendMember.seferId,
    sefer:
      backendMember.sefer ||
      (typeof backendMember.seferId === "object" ? backendMember.seferId?.name : undefined),
    subCommunity: backendMember.subCommunity
      ? SUB_COMMUNITY_TO_UI[backendMember.subCommunity]
      : undefined,
    currentGroupType: backendMember.groupType
      ? GROUP_TYPE_TO_UI[backendMember.groupType]
      : undefined,
    cellGroupName: backendMember.groupName,
    cellGroupNumber: backendMember.cellGroupNumber?.toString(),
    reasonForNoGroup: backendMember.reasonForNoGroup,
    emergencyContactName: backendMember.emergencyContactName,
    emergencyContactPhone: backendMember.emergencyContactPhone,
    salvationYearEthiopian: backendMember.salvationYearEthiopian?.toString(),
    baptismYearEthiopian: backendMember.baptismYearEthiopian?.toString(),
    catechesisStatus: backendMember.catechesisStatus
      ? CATECHESIS_TO_UI[backendMember.catechesisStatus]
      : undefined,
    isTransfer: backendMember.cameByTransfer || false,
    transferFromChurch: backendMember.transferredFromChurch,
    transferDate: backendMember.transferDate
      ? new Date(backendMember.transferDate).toISOString().split("T")[0]
      : undefined,
    transferLetterUrl: backendMember.transferLetterUrl,
    currentServices: backendMember.currentlyServingAt || [],
    maritalStatus: backendMember.maritalStatus
      ? MARITAL_TO_UI[backendMember.maritalStatus] || "Unmarried"
      : "Unmarried",
    numberOfChildren: backendMember.numberOfChildren || 0,
    familyId:
      typeof backendMember.familyId === "object" && backendMember.familyId
        ? backendMember.familyId._id
        : backendMember.familyId,
    educationLevel: backendMember.educationLevel
      ? EDUCATION_TO_UI[backendMember.educationLevel]
      : undefined,
    jobType: backendMember.jobType ? JOB_TO_UI[backendMember.jobType] : undefined,
    profession: backendMember.profession,
    paysTithe: (backendMember.paysTithe as Member["paysTithe"]) || "unknown",
    titheAmount: backendMember.titheAmount,
    titheFrequency: backendMember.paymentFrequency
      ? FREQUENCY_TO_UI[backendMember.paymentFrequency]
      : undefined,
    membershipStatus: backendMember.memberStatus
      ? STATUS_TO_UI[backendMember.memberStatus] || "Active"
      : "Active",
    membershipType: backendMember.membershipType || "Regular",
    joinDate: registrationDate || new Date().toISOString().split("T")[0],
    notes: backendMember.notes,
    createdAt: backendMember.createdAt || new Date().toISOString(),
    updatedAt: backendMember.updatedAt || new Date().toISOString(),
  }
}

/** Coerce a value to a positive integer, or undefined if not parseable. */
function toInt(value: unknown): number | undefined {
  if (value === undefined || value === null || value === "") return undefined
  const n = typeof value === "number" ? value : parseInt(String(value), 10)
  return Number.isFinite(n) ? n : undefined
}

/** Empty string -> undefined (backend enums/emails reject empty strings). */
function clean(value: unknown): string | undefined {
  if (typeof value !== "string") return value as string | undefined
  const trimmed = value.trim()
  return trimmed === "" ? undefined : trimmed
}

/**
 * Maps a frontend Member to the backend create/update payload.
 *
 * CRITICAL: the backend validates with whitelist + forbidNonWhitelisted, so this
 * MUST emit ONLY whitelisted fields. Any stray key causes a 400. We build the
 * object explicitly and drop undefined/empty values.
 */
function mapMemberToBackendFormat(member: Partial<Member>): any {
  const out: Record<string, any> = {}

  const set = (key: string, value: unknown) => {
    if (value !== undefined && value !== null && value !== "") out[key] = value
  }

  // Name -> fullName
  const fullName =
    clean(member.fullName) ||
    [member.firstName, member.middleName, member.lastName].map(clean).filter(Boolean).join(" ")
  set("fullName", fullName || undefined)

  set("sex", member.gender ? (member.gender.toLowerCase() === "male" ? "male" : "female") : undefined)
  if (member.dateOfBirth) set("birthDate", new Date(member.dateOfBirth).toISOString())
  set("birthYearEthiopian", toInt(member.birthYearEthiopian))
  set("nationality", clean(member.nationality))
  set("phoneNumber", clean(member.phone))
  set("email", clean(member.email))
  set("physicalAddress", clean(member.physicalAddress))
  set("woreda", clean(member.woreda))
  set("seferId", clean(member.seferId))
  set("sefer", clean(member.sefer))
  set("memberPicture", clean(member.photoUrl))

  // Spiritual
  set("salvationYearEthiopian", toInt(member.salvationYearEthiopian))
  set("baptismYearEthiopian", toInt(member.baptismYearEthiopian))
  set("catechesisStatus", member.catechesisStatus ? CATECHESIS_TO_BACKEND[member.catechesisStatus] : undefined)

  // Church grouping
  set("subCommunity", member.subCommunity ? member.subCommunity.toLowerCase() : undefined)
  set("groupType", member.currentGroupType ? GROUP_TYPE_TO_BACKEND[member.currentGroupType] : undefined)
  set("groupName", clean(member.cellGroupName))
  set("cellGroupNumber", toInt(member.cellGroupNumber))
  set("reasonForNoGroup", clean(member.reasonForNoGroup))

  // Transfer
  if (member.isTransfer !== undefined) out.cameByTransfer = !!member.isTransfer
  if (member.isTransfer) {
    set("transferredFromChurch", clean(member.transferFromChurch))
    if (member.transferDate) set("transferDate", new Date(member.transferDate).toISOString())
    set("transferLetterUrl", clean(member.transferLetterUrl))
  }

  // Service
  if (member.currentServices && member.currentServices.length > 0) {
    out.currentlyServingAt = member.currentServices.slice(0, 2)
  }

  // Family / personal
  set("maritalStatus", member.maritalStatus ? MARITAL_TO_BACKEND[member.maritalStatus] : undefined)
  if (member.numberOfChildren !== undefined) set("numberOfChildren", toInt(member.numberOfChildren))
  set("emergencyContactName", clean(member.emergencyContactName))
  set("emergencyContactPhone", clean(member.emergencyContactPhone))

  // Education / profession
  set("educationLevel", member.educationLevel ? EDUCATION_TO_BACKEND[member.educationLevel] : undefined)
  set("jobType", member.jobType ? JOB_TO_BACKEND[member.jobType] : undefined)
  set("profession", clean(member.profession))

  // Financial — tithe amount/frequency only meaningful when paysTithe === 'yes'
  if (member.paysTithe !== undefined) out.paysTithe = member.paysTithe
  if (member.paysTithe === "yes") {
    set("titheAmount", toInt(member.titheAmount))
    set("paymentFrequency", member.titheFrequency ? member.titheFrequency.toLowerCase() : undefined)
  }

  set("notes", clean(member.notes))

  return out
}

export function MembersProvider({ children }: { children: ReactNode }) {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Fetch members from backend API
   */
  const fetchMembers = useCallback(async (filters?: any) => {
    try {
      setLoading(true)
      setError(null)
      const response = await membersAPI.getMembers(filters)
      const mappedMembers = response.data.map(mapBackendMemberToMember)
      setMembers(mappedMembers)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch members'
      setError(errorMessage)
      console.error('Error fetching members:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Refresh members list
   */
  const refreshMembers = useCallback(async () => {
    await fetchMembers()
  }, [fetchMembers])

  /**
   * Fetch members on mount
   */
  useEffect(() => {
    fetchMembers()
  }, [fetchMembers])

  /**
   * Add a new member
   */
  const addMember = useCallback(async (memberData: Omit<Member, "id" | "createdAt" | "updatedAt">): Promise<Member> => {
    try {
      setLoading(true)
      setError(null)
      const backendFormat = mapMemberToBackendFormat(memberData)
      const createdMember = await membersAPI.createMember(backendFormat)
      const mappedMember = mapBackendMemberToMember(createdMember)
      setMembers((prev) => [...prev, mappedMember])
      return mappedMember
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create member'
      setError(errorMessage)
      console.error('Error creating member:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Update an existing member
   */
  const updateMember = useCallback(async (id: string, memberData: Partial<Member>): Promise<Member> => {
    try {
      setLoading(true)
      setError(null)
      const backendFormat = mapMemberToBackendFormat(memberData)
      const updatedMember = await membersAPI.updateMember(id, backendFormat)
      const mappedMember = mapBackendMemberToMember(updatedMember)
      setMembers((prev) =>
        prev.map((member) => (member.id === id ? mappedMember : member))
      )
      return mappedMember
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update member'
      setError(errorMessage)
      console.error('Error updating member:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Delete a member
   */
  const deleteMember = useCallback(async (id: string): Promise<void> => {
    try {
      setLoading(true)
      setError(null)
      await membersAPI.deleteMember(id)
      setMembers((prev) => prev.filter((member) => member.id !== id))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete member'
      setError(errorMessage)
      console.error('Error deleting member:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Get a member by ID (from local state or fetch from API if not found)
   */
  const getMember = useCallback(async (id: string): Promise<Member | undefined> => {
    // First check if member is in local state
    const localMember = members.find((member) => member.id === id)
    if (localMember) {
      return localMember
    }
    
    // If not found, fetch from API
    try {
      const backendMember = await membersAPI.getMemberById(id)
      const mappedMember = mapBackendMemberToMember(backendMember)
      // Add to local state
      setMembers((prev) => {
        const exists = prev.find((m) => m.id === id)
        if (exists) return prev
        return [...prev, mappedMember]
      })
      return mappedMember
    } catch (err) {
      console.error('Error fetching member:', err)
      return undefined
    }
  }, [members])

  return (
    <MembersContext.Provider
      value={{
        members,
        loading,
        error,
        fetchMembers,
        addMember,
        updateMember,
        deleteMember,
        getMember,
        refreshMembers,
      }}
    >
      {children}
    </MembersContext.Provider>
  )
}

export function useMembers() {
  const context = useContext(MembersContext)
  if (context === undefined) {
    throw new Error("useMembers must be used within a MembersProvider")
  }
  return context
}
