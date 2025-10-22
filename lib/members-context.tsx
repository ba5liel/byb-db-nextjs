"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import type { Member } from "./types"

interface MembersContextType {
  members: Member[]
  addMember: (member: Omit<Member, "id" | "createdAt" | "updatedAt">) => void
  updateMember: (id: string, member: Partial<Member>) => void
  deleteMember: (id: string) => void
  getMember: (id: string) => Member | undefined
}

const MembersContext = createContext<MembersContextType | undefined>(undefined)

const sampleMembers: Member[] = [
  {
    id: "1",
    firstName: "Abebe",
    middleName: "Kebede",
    lastName: "Tesfaye",
    email: "abebe.tesfaye@example.com",
    phone: "+251911234567",
    dateOfBirth: "1985-03-15",
    gender: "Male",
    maritalStatus: "Married",
    nationality: "Ethiopian",
    occupation: "Software Engineer",
    address: "Bole Road",
    city: "Addis Ababa",
    subCity: "Bole",
    woreda: "08",
    kebele: "12",
    emergencyContactName: "Almaz Tesfaye",
    emergencyContactRelation: "Spouse",
    emergencyContactPhone: "+251911234568",
    salvationDate: "2010-05-20",
    baptismDate: "2010-08-15",
    salvationYearEthiopian: "2002",
    baptismYearEthiopian: "2002",
    catechesisStatus: "Completed",
    discipleshipProgram: "Advanced Discipleship",
    mentor: "Pastor Daniel",
    subCommunity: "Bole Fellowship",
    cellGroupType: "Men's Group",
    cellGroupNumber: "5",
    cellGroupName: "Warriors of Faith",
    isTransfer: false,
    currentServices: ["Worship Team", "Youth Ministry"],
    desiredServices: [],
    spouseName: "Almaz Tesfaye",
    numberOfChildren: 2,
    educationLevel: "Bachelor's Degree",
    jobType: "Full-time",
    profession: "Software Engineer",
    paysTithe: true,
    titheAmount: 5000,
    titheFrequency: "Monthly",
    joinDate: "2010-09-01",
    membershipStatus: "Active",
    membershipType: "Regular",
    membershipNumber: "MEM-001",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "2",
    firstName: "Sara",
    middleName: "Haile",
    lastName: "Gebre",
    email: "sara.gebre@example.com",
    phone: "+251922345678",
    dateOfBirth: "1990-07-22",
    gender: "Female",
    maritalStatus: "Single",
    nationality: "Ethiopian",
    occupation: "Teacher",
    address: "Megenagna",
    city: "Addis Ababa",
    subCity: "Kirkos",
    woreda: "03",
    kebele: "08",
    emergencyContactName: "Haile Gebre",
    emergencyContactRelation: "Father",
    emergencyContactPhone: "+251922345679",
    salvationDate: "2015-12-10",
    baptismDate: "2016-03-20",
    salvationYearEthiopian: "2008",
    baptismYearEthiopian: "2008",
    catechesisStatus: "In Progress",
    discipleshipProgram: "Basic Discipleship",
    subCommunity: "Kirkos Fellowship",
    cellGroupType: "Women's Group",
    cellGroupNumber: "3",
    cellGroupName: "Daughters of Zion",
    isTransfer: false,
    currentServices: ["Children's Ministry"],
    desiredServices: ["Prayer Team"],
    numberOfChildren: 0,
    educationLevel: "Bachelor's Degree",
    jobType: "Full-time",
    profession: "Elementary School Teacher",
    paysTithe: true,
    titheAmount: 3000,
    titheFrequency: "Monthly",
    joinDate: "2016-04-01",
    membershipStatus: "Active",
    membershipType: "Regular",
    membershipNumber: "MEM-002",
    createdAt: "2024-01-02T00:00:00Z",
    updatedAt: "2024-01-02T00:00:00Z",
  },
  {
    id: "3",
    firstName: "Daniel",
    middleName: "Mulugeta",
    lastName: "Bekele",
    email: "daniel.bekele@example.com",
    phone: "+251933456789",
    dateOfBirth: "1978-11-05",
    gender: "Male",
    maritalStatus: "Married",
    nationality: "Ethiopian",
    occupation: "Business Owner",
    address: "Gerji",
    city: "Addis Ababa",
    subCity: "Yeka",
    woreda: "12",
    kebele: "15",
    emergencyContactName: "Tigist Bekele",
    emergencyContactRelation: "Spouse",
    emergencyContactPhone: "+251933456790",
    salvationDate: "2005-01-15",
    baptismDate: "2005-04-10",
    salvationYearEthiopian: "1997",
    baptismYearEthiopian: "1997",
    catechesisStatus: "Completed",
    discipleshipProgram: "Leadership Training",
    mentor: "Pastor John",
    subCommunity: "Yeka Fellowship",
    cellGroupType: "Family Group",
    cellGroupNumber: "7",
    cellGroupName: "Faith Family",
    isTransfer: false,
    currentServices: ["Ushering", "Finance Committee"],
    desiredServices: [],
    spouseName: "Tigist Bekele",
    numberOfChildren: 3,
    educationLevel: "Master's Degree",
    jobType: "Self-employed",
    profession: "Business Owner",
    paysTithe: true,
    titheAmount: 10000,
    titheFrequency: "Monthly",
    joinDate: "2005-05-01",
    membershipStatus: "Active",
    membershipType: "Regular",
    membershipNumber: "MEM-003",
    createdAt: "2024-01-03T00:00:00Z",
    updatedAt: "2024-01-03T00:00:00Z",
  },
  {
    id: "4",
    firstName: "Marta",
    lastName: "Alemayehu",
    email: "marta.alemayehu@example.com",
    phone: "+251944567890",
    dateOfBirth: "1995-04-18",
    gender: "Female",
    maritalStatus: "Single",
    nationality: "Ethiopian",
    occupation: "Nurse",
    address: "CMC",
    city: "Addis Ababa",
    subCity: "Addis Ketema",
    woreda: "05",
    kebele: "10",
    emergencyContactName: "Alemayehu Tadesse",
    emergencyContactRelation: "Father",
    emergencyContactPhone: "+251944567891",
    salvationDate: "2018-06-25",
    baptismDate: "2018-09-15",
    salvationYearEthiopian: "2010",
    baptismYearEthiopian: "2011",
    catechesisStatus: "Completed",
    discipleshipProgram: "Intermediate Discipleship",
    subCommunity: "Addis Ketema Fellowship",
    cellGroupType: "Young Adults",
    cellGroupNumber: "2",
    cellGroupName: "New Generation",
    isTransfer: false,
    currentServices: ["Medical Team"],
    desiredServices: ["Worship Team"],
    numberOfChildren: 0,
    educationLevel: "Bachelor's Degree",
    jobType: "Full-time",
    profession: "Registered Nurse",
    paysTithe: true,
    titheAmount: 2500,
    titheFrequency: "Monthly",
    joinDate: "2018-10-01",
    membershipStatus: "Active",
    membershipType: "Regular",
    membershipNumber: "MEM-004",
    createdAt: "2024-01-04T00:00:00Z",
    updatedAt: "2024-01-04T00:00:00Z",
  },
  {
    id: "5",
    firstName: "Yohannes",
    middleName: "Girma",
    lastName: "Tadesse",
    email: "yohannes.tadesse@example.com",
    phone: "+251955678901",
    dateOfBirth: "1982-09-30",
    gender: "Male",
    maritalStatus: "Divorced",
    nationality: "Ethiopian",
    occupation: "Accountant",
    address: "Kality",
    city: "Addis Ababa",
    subCity: "Akaki Kality",
    woreda: "10",
    kebele: "20",
    emergencyContactName: "Girma Tadesse",
    emergencyContactRelation: "Brother",
    emergencyContactPhone: "+251955678902",
    salvationDate: "2012-03-08",
    baptismDate: "2012-06-17",
    salvationYearEthiopian: "2004",
    baptismYearEthiopian: "2004",
    catechesisStatus: "Completed",
    discipleshipProgram: "Recovery Ministry",
    subCommunity: "Akaki Fellowship",
    cellGroupType: "Men's Group",
    cellGroupNumber: "4",
    cellGroupName: "Men of Valor",
    isTransfer: true,
    transferFromChurch: "Grace Church",
    transferDate: "2012-02-01",
    currentServices: ["Finance Team"],
    desiredServices: [],
    numberOfChildren: 1,
    educationLevel: "Bachelor's Degree",
    jobType: "Full-time",
    profession: "Senior Accountant",
    paysTithe: true,
    titheAmount: 4000,
    titheFrequency: "Monthly",
    joinDate: "2012-07-01",
    membershipStatus: "Active",
    membershipType: "Transferred",
    membershipNumber: "MEM-005",
    createdAt: "2024-01-05T00:00:00Z",
    updatedAt: "2024-01-05T00:00:00Z",
  },
]

export function MembersProvider({ children }: { children: ReactNode }) {
  const [members, setMembers] = useState<Member[]>([])

  useEffect(() => {
    const stored = localStorage.getItem("church_members")
    if (stored) {
      try {
        const parsedMembers = JSON.parse(stored)
        // If no members in storage, use sample data
        if (parsedMembers.length === 0) {
          setMembers(sampleMembers)
          localStorage.setItem("church_members", JSON.stringify(sampleMembers))
        } else {
          setMembers(parsedMembers)
        }
      } catch (error) {
        console.error("Failed to parse members from localStorage:", error)
        setMembers(sampleMembers)
        localStorage.setItem("church_members", JSON.stringify(sampleMembers))
      }
    } else {
      // No data in storage, use sample data
      setMembers(sampleMembers)
      localStorage.setItem("church_members", JSON.stringify(sampleMembers))
    }
  }, [])

  // Save members to localStorage whenever they change
  useEffect(() => {
    if (members.length > 0) {
      localStorage.setItem("church_members", JSON.stringify(members))
    }
  }, [members])

  const addMember = (memberData: Omit<Member, "id" | "createdAt" | "updatedAt">) => {
    const newMember: Member = {
      ...memberData,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    setMembers((prev) => [...prev, newMember])
  }

  const updateMember = (id: string, memberData: Partial<Member>) => {
    setMembers((prev) =>
      prev.map((member) =>
        member.id === id ? { ...member, ...memberData, updatedAt: new Date().toISOString() } : member,
      ),
    )
  }

  const deleteMember = (id: string) => {
    setMembers((prev) => prev.filter((member) => member.id !== id))
  }

  const getMember = (id: string) => {
    return members.find((member) => member.id === id)
  }

  return (
    <MembersContext.Provider
      value={{
        members,
        addMember,
        updateMember,
        deleteMember,
        getMember,
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
