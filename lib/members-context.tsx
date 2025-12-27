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

/**
 * Maps backend member data to frontend Member type
 */
function mapBackendMemberToMember(backendMember: any): Member {
  // Backend uses sex: 'male'/'female', frontend uses gender: 'Male'/'Female'
  const gender = backendMember.sex === 'male' ? 'Male' : 'Female'
  
  // Parse fullName into firstName, middleName, lastName
  const nameParts = backendMember.fullName?.split(' ') || []
  const firstName = nameParts[0] || ''
  const middleName = nameParts.length > 2 ? nameParts.slice(1, -1).join(' ') : ''
  const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : ''

  // Map memberStatus to membershipStatus
  const membershipStatusMap: Record<string, string> = {
    'active': 'Active',
    'inactive': 'Inactive',
    'removed': 'Removed',
    'transferred_out': 'Transferred Out',
    'deceased': 'Deceased',
  }
  const membershipStatus = membershipStatusMap[backendMember.memberStatus] || 'Active'

  // Map ageGroup to frontend format (capitalize first letter)
  const ageGroup = backendMember.ageGroup 
    ? backendMember.ageGroup.charAt(0).toUpperCase() + backendMember.ageGroup.slice(1)
    : undefined

  // Map catechesisStatus
  const catechesisStatusMap: Record<string, string> = {
    'not_started': 'Not Started',
    'in_progress': 'In Progress',
    'completed': 'Completed',
  }
  const catechesisStatus = backendMember.catechesisStatus 
    ? catechesisStatusMap[backendMember.catechesisStatus] || backendMember.catechesisStatus
    : undefined

  // Map groupType
  const groupTypeMap: Record<string, string> = {
    'cell_group': 'Cell Group',
    'youth_group': 'Youth Group',
    'bible_study': 'Bible Study',
    'prayer_group': 'Prayer Group',
    'none': 'None',
  }
  const currentGroupType = backendMember.groupType 
    ? groupTypeMap[backendMember.groupType] || backendMember.groupType
    : undefined

  // Map subCommunity (capitalize first letter)
  const subCommunity = backendMember.subCommunity 
    ? backendMember.subCommunity.charAt(0).toUpperCase() + backendMember.subCommunity.slice(1)
    : undefined

  // Map maritalStatus
  const maritalStatusMap: Record<string, string> = {
    'unmarried': 'Unmarried',
    'married': 'Married',
    'divorced': 'Divorced',
    'widowed': 'Widowed',
  }
  const maritalStatus = backendMember.maritalStatus 
    ? maritalStatusMap[backendMember.maritalStatus] || backendMember.maritalStatus
    : 'Unmarried'

  return {
    id: backendMember._id || backendMember.id,
    fullName: backendMember.fullName,
    firstName,
    middleName: middleName || undefined,
    lastName,
    email: backendMember.email,
    phone: backendMember.phoneNumber,
    yearOfBirthEthiopian: backendMember.birthDate ? new Date(backendMember.birthDate).getFullYear().toString() : undefined,
    dateOfBirth: backendMember.birthDate ? new Date(backendMember.birthDate).toISOString().split('T')[0] : undefined,
    gender,
    photoUrl: backendMember.memberPicture,
    membershipNumber: backendMember.membershipNumber,
    registrationDate: backendMember.registrationDate ? new Date(backendMember.registrationDate).toISOString().split('T')[0] : undefined,
    ageGroup,
    physicalAddress: backendMember.physicalAddress,
    address: backendMember.physicalAddress,
    emergencyContactName: backendMember.emergencyContactName,
    emergencyContactRelation: backendMember.emergencyContactRelation,
    emergencyContactPhone: backendMember.emergencyContactPhone,
    salvationYearEthiopian: backendMember.salvationYear ? new Date(backendMember.salvationYear).getFullYear().toString() : undefined,
    salvationDate: backendMember.salvationYear ? new Date(backendMember.salvationYear).toISOString().split('T')[0] : undefined,
    baptismYearEthiopian: backendMember.baptismYear ? new Date(backendMember.baptismYear).getFullYear().toString() : undefined,
    baptismDate: backendMember.baptismYear ? new Date(backendMember.baptismYear).toISOString().split('T')[0] : undefined,
    catechesisStatus,
    discipleshipProgram: backendMember.discipleshipProgram,
    subCommunity,
    currentGroupType,
    cellGroupType: backendMember.groupType,
    cellGroupName: backendMember.groupName,
    cellGroupNumber: backendMember.cellGroupNumber?.toString(),
    reasonForNoGroup: backendMember.reasonForNoGroup,
    isTransfer: backendMember.cameByTransfer || false,
    transferFromChurch: backendMember.transferredFromChurch,
    transferYearEthiopian: backendMember.transferYear ? new Date(backendMember.transferYear).getFullYear().toString() : undefined,
    transferDate: backendMember.transferYear ? new Date(backendMember.transferYear).toISOString().split('T')[0] : undefined,
    transferLetterUrl: backendMember.transferLetterUrl,
    currentServices: backendMember.currentlyServingAt || [],
    desiredServices: backendMember.wantingToServeAt || [],
    maritalStatus: maritalStatus as "Unmarried" | "Married" | "Divorced" | "Widowed",
    spouseName: backendMember.spouseName,
    numberOfChildren: backendMember.numberOfChildren || 0,
    educationLevel: backendMember.educationLevel,
    jobType: backendMember.jobType,
    profession: backendMember.profession,
    occupation: backendMember.profession,
    paysTithe: backendMember.paysTithe || false,
    titheAmount: backendMember.titheAmount,
    titheFrequency: backendMember.paymentFrequency ? backendMember.paymentFrequency.charAt(0).toUpperCase() + backendMember.paymentFrequency.slice(1) : undefined,
    membershipStatus: membershipStatus as "Active" | "Inactive" | "Removed" | "Transferred Out" | "Deceased",
    membershipType: backendMember.membershipType || "Regular",
    joinDate: backendMember.registrationDate ? new Date(backendMember.registrationDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    nationality: backendMember.nationality,
    createdAt: backendMember.createdAt || new Date().toISOString(),
    updatedAt: backendMember.updatedAt || new Date().toISOString(),
  }
}

/**
 * Maps frontend Member type to backend create/update format
 */
function mapMemberToBackendFormat(member: Partial<Member>, isUpdate: boolean = false): any {
  const backendMember: any = {}

  if (member.fullName !== undefined) backendMember.fullName = member.fullName
  if (member.firstName !== undefined || member.lastName !== undefined) {
    // Combine firstName, middleName, lastName into fullName
    const nameParts = [member.firstName, member.middleName, member.lastName].filter(Boolean)
    backendMember.fullName = nameParts.join(' ')
  }

  // Map gender to sex
  if (member.gender !== undefined) {
    backendMember.sex = member.gender.toLowerCase() === 'male' ? 'male' : 'female'
  }

  // Map dateOfBirth to birthDate
  if (member.dateOfBirth !== undefined) {
    backendMember.birthDate = new Date(member.dateOfBirth)
  }

  if (member.phone !== undefined) backendMember.phoneNumber = member.phone
  if (member.email !== undefined) backendMember.email = member.email
  if (member.physicalAddress !== undefined || member.address !== undefined) {
    backendMember.physicalAddress = member.physicalAddress || member.address
  }
  if (member.photoUrl !== undefined) backendMember.memberPicture = member.photoUrl

  // Map membershipStatus to memberStatus
  if (member.membershipStatus !== undefined) {
    const statusMap: Record<string, string> = {
      'Active': 'active',
      'Inactive': 'inactive',
      'Removed': 'removed',
      'Transferred Out': 'transferred_out',
      'Deceased': 'deceased',
    }
    backendMember.memberStatus = statusMap[member.membershipStatus] || member.membershipStatus.toLowerCase()
  }

  // Map ageGroup (lowercase)
  if (member.ageGroup !== undefined) {
    backendMember.ageGroup = member.ageGroup.toLowerCase()
  }

  // Map subCommunity (lowercase)
  if (member.subCommunity !== undefined) {
    backendMember.subCommunity = member.subCommunity.toLowerCase()
  }

  // Map currentGroupType to groupType
  if (member.currentGroupType !== undefined) {
    const groupTypeMap: Record<string, string> = {
      'Cell Group': 'cell_group',
      'Youth Group': 'youth_group',
      'Bible Study': 'bible_study',
      'Prayer Group': 'prayer_group',
      'None': 'none',
    }
    backendMember.groupType = groupTypeMap[member.currentGroupType] || member.currentGroupType.toLowerCase().replace(' ', '_')
  }

  if (member.cellGroupName !== undefined) backendMember.groupName = member.cellGroupName
  if (member.cellGroupNumber !== undefined) backendMember.cellGroupNumber = parseInt(member.cellGroupNumber)
  if (member.reasonForNoGroup !== undefined) backendMember.reasonForNoGroup = member.reasonForNoGroup
  if (member.discipleshipProgram !== undefined) backendMember.discipleshipProgram = member.discipleshipProgram

  // Transfer info
  if (member.isTransfer !== undefined) backendMember.cameByTransfer = member.isTransfer
  if (member.transferFromChurch !== undefined) backendMember.transferredFromChurch = member.transferFromChurch
  if (member.transferDate !== undefined) backendMember.transferYear = new Date(member.transferDate)
  if (member.transferLetterUrl !== undefined) backendMember.transferLetterUrl = member.transferLetterUrl

  if (member.currentServices !== undefined) backendMember.currentlyServingAt = member.currentServices
  if (member.desiredServices !== undefined) backendMember.wantingToServeAt = member.desiredServices

  // Marital status
  if (member.maritalStatus !== undefined) {
    const maritalMap: Record<string, string> = {
      'Unmarried': 'unmarried',
      'Married': 'married',
      'Divorced': 'divorced',
      'Widowed': 'widowed',
    }
    backendMember.maritalStatus = maritalMap[member.maritalStatus] || member.maritalStatus.toLowerCase()
  }

  if (member.spouseName !== undefined) backendMember.spouseName = member.spouseName
  if (member.numberOfChildren !== undefined) backendMember.numberOfChildren = member.numberOfChildren

  if (member.educationLevel !== undefined) backendMember.educationLevel = member.educationLevel
  if (member.jobType !== undefined) backendMember.jobType = member.jobType
  if (member.profession !== undefined || member.occupation !== undefined) {
    backendMember.profession = member.profession || member.occupation
  }

  if (member.paysTithe !== undefined) backendMember.paysTithe = member.paysTithe
  if (member.titheAmount !== undefined) backendMember.titheAmount = member.titheAmount
  if (member.titheFrequency !== undefined) {
    backendMember.paymentFrequency = member.titheFrequency.toLowerCase()
  }

  if (member.nationality !== undefined) backendMember.nationality = member.nationality

  // Dates
  if (member.registrationDate !== undefined || member.joinDate !== undefined) {
    backendMember.registrationDate = new Date(member.registrationDate || member.joinDate || new Date())
  }

  // Spiritual journey dates
  if (member.salvationDate !== undefined) {
    backendMember.salvationYear = new Date(member.salvationDate)
  }
  if (member.baptismDate !== undefined) {
    backendMember.baptismYear = new Date(member.baptismDate)
  }

  // Catechesis status
  if (member.catechesisStatus !== undefined) {
    const catechesisMap: Record<string, string> = {
      'Not Started': 'not_started',
      'In Progress': 'in_progress',
      'Completed': 'completed',
    }
    backendMember.catechesisStatus = catechesisMap[member.catechesisStatus] || member.catechesisStatus.toLowerCase().replace(' ', '_')
  }

  return backendMember
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
      const backendFormat = mapMemberToBackendFormat(memberData, false)
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
      const backendFormat = mapMemberToBackendFormat(memberData, true)
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
