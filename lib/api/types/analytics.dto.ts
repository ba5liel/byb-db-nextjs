/**
 * Analytics and dashboard statistics DTOs
 */

export interface DashboardOverview {
  totalMembers: number
  maleCount: number
  femaleCount: number
  activeMembers: number
  inactiveMembers: number
  leftMembers?: number
  newMembersThisMonth: number
  totalFamilies: number
  tithePayersCount: number
  transferredMembers: number
  baptizedMembers: number
}

export interface Demographics {
  sexDistribution: {
    male: number
    female: number
  }
  ageGroupStats: Array<{
    ageGroup: string
    count: number
    male?: number
    female?: number
    percentage: number
  }>
  maritalStatusStats: Array<{
    status: string
    count: number
    percentage: number
  }>
}

export interface CommunityStats {
  subCommunityStats: Array<{
    subCommunity: string
    count: number
    male?: number
    female?: number
    baptized?: number
    children?: number
    childrenMale?: number
    childrenFemale?: number
    youth?: number
    youthMale?: number
    youthFemale?: number
    percentage: number
  }>
  groupTypeStats: Array<{
    groupType: string
    count: number
    percentage: number
  }>
  seferStats: Array<{
    sefer: string
    seferId?: string | null
    count: number
    male?: number
    female?: number
    percentage: number
  }>
}

export interface DashboardStatistics {
  overview: DashboardOverview
  demographics: Demographics
  community: CommunityStats
}

export interface SubCommunityStatistics {
  subCommunity: string
  totalMembers: number
  maleCount: number
  femaleCount: number
  activeMembers: number
  ageGroupBreakdown: Array<{
    ageGroup: string
    count: number
  }>
  groupTypeBreakdown: Array<{
    groupType: string
    count: number
  }>
  cellGroups?: Array<{
    cellGroupNumber: number
    count: number
  }>
}

export interface RegistrationTrendData {
  month: string
  year: number
  count: number
  male?: number
  female?: number
  cumulativeCount: number
}

export interface RegistrationTrends {
  trends: RegistrationTrendData[]
  totalRegistrations: number
  averagePerMonth: number
}

export interface ServiceStatistics {
  totalServices: number
  activeServices: number
  totalEnrollments: number
  averageMembersPerService: number
  totalServing: number
  wantingToServe: number
  serviceStats: Array<{
    serviceName: string
    count: number
    male: number
    female: number
  }>
  serviceTypeBreakdown: Array<{
    type: string
    count: number
    totalMembers: number
  }>
  topServices: Array<{
    serviceName: string
    memberCount: number
  }>
}

export interface FinancialStatistics {
  titheStats: {
    totalTithePayers: number
    totalMonthlyTithe: number
    averageTithe: number
    minTithe?: number
    maxTithe?: number
  }
  frequencyStats: Array<{
    frequency: string
    count: number
    totalAmount: number
  }>
}
