import type { Member } from "./types"

/**
 * Maps backend member API response to the legacy frontend Member type.
 * Used by detail/edit/new pages to keep form field names consistent.
 */
export function mapBackendMemberToMember(backendMember: any): Member {
  const gender = backendMember.sex === "male" ? "Male" : "Female"

  const nameParts = backendMember.fullName?.split(" ") || []
  const firstName = nameParts[0] || ""
  const middleName = nameParts.length > 2 ? nameParts.slice(1, -1).join(" ") : ""
  const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : ""

  const membershipStatusMap: Record<string, string> = {
    active: "Active",
    inactive: "Inactive",
    removed: "Removed",
    transferred_out: "Transferred Out",
    deceased: "Deceased",
  }
  const membershipStatus = membershipStatusMap[backendMember.memberStatus] || "Active"

  const ageGroup = backendMember.ageGroup
    ? backendMember.ageGroup.charAt(0).toUpperCase() + backendMember.ageGroup.slice(1)
    : undefined

  const catechesisStatusMap: Record<string, string> = {
    not_started: "Not Started",
    in_progress: "In Progress",
    completed: "Completed",
  }
  const catechesisStatus = backendMember.catechesisStatus
    ? catechesisStatusMap[backendMember.catechesisStatus] || backendMember.catechesisStatus
    : undefined

  const groupTypeMap: Record<string, string> = {
    cell_group: "Cell Group",
    youth_group: "Youth Group",
    bible_study: "Bible Study",
    prayer_group: "Prayer Group",
    none: "None",
  }
  const currentGroupType = backendMember.groupType
    ? groupTypeMap[backendMember.groupType] || backendMember.groupType
    : undefined

  const subCommunity = backendMember.subCommunity
    ? backendMember.subCommunity.charAt(0).toUpperCase() + backendMember.subCommunity.slice(1)
    : undefined

  const maritalStatusMap: Record<string, string> = {
    unmarried: "Unmarried",
    married: "Married",
    divorced: "Divorced",
    widowed: "Widowed",
  }
  const maritalStatus = backendMember.maritalStatus
    ? maritalStatusMap[backendMember.maritalStatus] || backendMember.maritalStatus
    : "Unmarried"

  return {
    id: backendMember._id || backendMember.id,
    fullName: backendMember.fullName,
    firstName,
    middleName: middleName || undefined,
    lastName,
    email: backendMember.email,
    phone: backendMember.phoneNumber,
    yearOfBirthEthiopian: backendMember.birthDate
      ? new Date(backendMember.birthDate).getFullYear().toString()
      : undefined,
    dateOfBirth: backendMember.birthDate
      ? new Date(backendMember.birthDate).toISOString().split("T")[0]
      : undefined,
    gender,
    photoUrl: backendMember.memberPicture,
    membershipNumber: backendMember.membershipNumber,
    registrationDate: backendMember.registrationDate
      ? new Date(backendMember.registrationDate).toISOString().split("T")[0]
      : undefined,
    ageGroup: ageGroup as Member["ageGroup"],
    physicalAddress: backendMember.physicalAddress,
    address: backendMember.physicalAddress,
    emergencyContactName: backendMember.emergencyContactName,
    emergencyContactRelation: backendMember.emergencyContactRelation,
    emergencyContactPhone: backendMember.emergencyContactPhone,
    salvationYearEthiopian: backendMember.salvationYear
      ? new Date(backendMember.salvationYear).getFullYear().toString()
      : undefined,
    salvationDate: backendMember.salvationYear
      ? new Date(backendMember.salvationYear).toISOString().split("T")[0]
      : undefined,
    baptismYearEthiopian: backendMember.baptismYear
      ? new Date(backendMember.baptismYear).getFullYear().toString()
      : undefined,
    baptismDate: backendMember.baptismYear
      ? new Date(backendMember.baptismYear).toISOString().split("T")[0]
      : undefined,
    catechesisStatus: catechesisStatus as Member["catechesisStatus"],
    discipleshipProgram: backendMember.discipleshipProgram,
    subCommunity: subCommunity as Member["subCommunity"],
    currentGroupType: currentGroupType as Member["currentGroupType"],
    cellGroupType: backendMember.groupType,
    cellGroupName: backendMember.groupName,
    cellGroupNumber: backendMember.cellGroupNumber?.toString(),
    reasonForNoGroup: backendMember.reasonForNoGroup,
    isTransfer: backendMember.cameByTransfer || false,
    transferFromChurch: backendMember.transferredFromChurch,
    transferYearEthiopian: backendMember.transferYear
      ? new Date(backendMember.transferYear).getFullYear().toString()
      : undefined,
    transferDate: backendMember.transferYear
      ? new Date(backendMember.transferYear).toISOString().split("T")[0]
      : undefined,
    transferLetterUrl: backendMember.transferLetterUrl,
    currentServices: backendMember.currentlyServingAt || [],
    desiredServices: backendMember.wantingToServeAt || [],
    maritalStatus: maritalStatus as Member["maritalStatus"],
    spouseName: backendMember.spouseName,
    numberOfChildren: backendMember.numberOfChildren || 0,
    educationLevel: backendMember.educationLevel,
    jobType: backendMember.jobType,
    profession: backendMember.profession,
    occupation: backendMember.profession,
    paysTithe: backendMember.paysTithe || false,
    titheAmount: backendMember.titheAmount,
    titheFrequency: backendMember.paymentFrequency
      ? backendMember.paymentFrequency.charAt(0).toUpperCase() + backendMember.paymentFrequency.slice(1)
      : undefined,
    membershipStatus: membershipStatus as Member["membershipStatus"],
    membershipType: backendMember.membershipType || "Regular",
    joinDate: backendMember.registrationDate
      ? new Date(backendMember.registrationDate).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0],
    nationality: backendMember.nationality,
    notes: backendMember.notes,
    createdAt: backendMember.createdAt || new Date().toISOString(),
    updatedAt: backendMember.updatedAt || new Date().toISOString(),
  }
}

/**
 * Maps the legacy frontend Member type to the backend API format (CreateMemberDto / UpdateMemberDto).
 */
export function mapMemberToBackendFormat(member: Partial<Member>): Record<string, unknown> {
  const backend: Record<string, unknown> = {}

  if (member.firstName !== undefined || member.lastName !== undefined) {
    const parts = [member.firstName, member.middleName, member.lastName].filter(Boolean)
    backend.fullName = parts.join(" ")
  }
  if (member.fullName !== undefined) backend.fullName = member.fullName

  if (member.gender !== undefined) {
    backend.sex = member.gender.toLowerCase() === "male" ? "male" : "female"
  }
  if (member.dateOfBirth !== undefined) backend.birthDate = new Date(member.dateOfBirth)
  if (member.phone !== undefined) backend.phoneNumber = member.phone
  if (member.email !== undefined) backend.email = member.email
  if (member.physicalAddress !== undefined || member.address !== undefined) {
    backend.physicalAddress = member.physicalAddress || member.address
  }
  if (member.photoUrl !== undefined) backend.memberPicture = member.photoUrl

  // memberStatus is not allowed in UpdateMemberDto — omitted intentionally

  if (member.subCommunity !== undefined) {
    backend.subCommunity = member.subCommunity.toLowerCase()
  }

  if (member.currentGroupType !== undefined) {
    const groupTypeMap: Record<string, string> = {
      "Cell Group": "cell_group",
      "Youth Group": "youth_group",
      "Bible Study": "bible_study",
      "Prayer Group": "prayer_group",
      None: "none",
    }
    backend.groupType =
      groupTypeMap[member.currentGroupType] || member.currentGroupType.toLowerCase().replace(" ", "_")
  }

  if (member.cellGroupName !== undefined) backend.groupName = member.cellGroupName
  if (member.cellGroupNumber !== undefined) backend.cellGroupNumber = parseInt(member.cellGroupNumber)
  if (member.reasonForNoGroup !== undefined) backend.reasonForNoGroup = member.reasonForNoGroup
  if (member.discipleshipProgram !== undefined) backend.discipleshipProgram = member.discipleshipProgram

  if (member.isTransfer !== undefined) backend.cameByTransfer = member.isTransfer
  if (member.transferFromChurch !== undefined) backend.transferredFromChurch = member.transferFromChurch
  if (member.transferDate !== undefined) backend.transferYear = new Date(member.transferDate)
  if (member.transferLetterUrl !== undefined) backend.transferLetterUrl = member.transferLetterUrl

  if (member.currentServices !== undefined) backend.currentlyServingAt = member.currentServices
  if (member.desiredServices !== undefined) backend.wantingToServeAt = member.desiredServices

  if (member.maritalStatus !== undefined) {
    const maritalMap: Record<string, string> = {
      Unmarried: "unmarried",
      Married: "married",
      Divorced: "divorced",
      Widowed: "widowed",
    }
    backend.maritalStatus = maritalMap[member.maritalStatus] || member.maritalStatus.toLowerCase()
  }

  if (member.numberOfChildren !== undefined) backend.numberOfChildren = member.numberOfChildren

  if (member.educationLevel !== undefined) backend.educationLevel = member.educationLevel
  if (member.jobType !== undefined) backend.jobType = member.jobType
  if (member.profession !== undefined || member.occupation !== undefined) {
    backend.profession = member.profession || member.occupation
  }

  if (member.paysTithe !== undefined) backend.paysTithe = member.paysTithe
  if (member.titheAmount !== undefined) backend.titheAmount = member.titheAmount
  if (member.titheFrequency !== undefined) backend.paymentFrequency = member.titheFrequency.toLowerCase()

  if (member.nationality !== undefined) backend.nationality = member.nationality
  if (member.notes !== undefined) backend.notes = member.notes

  // registrationDate is not allowed in UpdateMemberDto — omitted intentionally
  if (member.salvationDate !== undefined) backend.salvationYear = new Date(member.salvationDate)
  if (member.baptismDate !== undefined) backend.baptismYear = new Date(member.baptismDate)

  if (member.catechesisStatus !== undefined) {
    const catechesisMap: Record<string, string> = {
      "Not Started": "not_started",
      "In Progress": "in_progress",
      Completed: "completed",
    }
    backend.catechesisStatus =
      catechesisMap[member.catechesisStatus] ||
      member.catechesisStatus.toLowerCase().replace(" ", "_")
  }

  if (member.emergencyContactName !== undefined) backend.emergencyContactName = member.emergencyContactName
  if (member.emergencyContactPhone !== undefined) backend.emergencyContactPhone = member.emergencyContactPhone
  if (member.emergencyContactRelation !== undefined) backend.emergencyContactRelation = member.emergencyContactRelation

  return backend
}
