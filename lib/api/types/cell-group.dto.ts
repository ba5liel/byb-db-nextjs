import type { SubCommunity } from "./member.dto"

export interface CellGroupLeaderRef {
  _id: string
  fullName: string
  phoneNumber?: string
}

export interface CellGroupDto {
  _id: string
  subCommunity: SubCommunity
  cellNumber: number
  name?: string
  leaderId?: CellGroupLeaderRef | string
  meetingLocation?: string
  meetingSchedule?: string
  isActive: boolean
  description?: string
  createdAt: string
  updatedAt: string
}

export interface CreateCellGroupDto {
  subCommunity: SubCommunity
  cellNumber: number
  name?: string
  leaderId?: string
  meetingLocation?: string
  meetingSchedule?: string
  isActive?: boolean
  description?: string
}

export type UpdateCellGroupDto = Partial<Omit<CreateCellGroupDto, "subCommunity" | "cellNumber">>

export interface CellGroupFilters {
  subCommunity?: SubCommunity
  isActive?: boolean
  page?: number
  limit?: number
}

export interface CommunityOverviewDto {
  subCommunity: SubCommunity
  count: number
  cellGroups: CellGroupDto[]
}
