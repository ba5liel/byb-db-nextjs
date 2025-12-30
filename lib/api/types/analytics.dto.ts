/**
 * Analytics and dashboard statistics DTOs
 */

/**
 * Dashboard overview statistics
 */
export interface DashboardOverview {
  totalMembers: number
  maleCount: number
  femaleCount: number
  activeMembers: number
  inactiveMembers: number
  newMembersThisMonth: number
}

/**
 * Demographics statistics
 */
export interface Demographics {
  sexDistribution: {
    male: number
    female: number
  }
  ageGroupStats: Array<{
    ageGroup: string
    count: number
    percentage: number
  }>
  maritalStatusStats: Array<{
    status: string
    count: number
    percentage: number
  }>
}

/**
 * Community statistics
 */
export interface CommunityStats {
  subCommunityStats: Array<{
    subCommunity: string
    count: number
    percentage: number
  }>
  groupTypeStats: Array<{
    groupType: string
    count: number
    percentage: number
  }>
}

/**
 * Complete dashboard statistics
 */
export interface DashboardStatistics {
  overview: DashboardOverview
  demographics: Demographics
  community: CommunityStats
}

/**
 * Sub-community specific statistics
 */
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
}

/**
 * Registration trends data point
 */
export interface RegistrationTrendData {
  month: string
  year: number
  count: number
  cumulativeCount: number
}

/**
 * Registration trends response
 */
export interface RegistrationTrends {
  trends: RegistrationTrendData[]
  totalRegistrations: number
  averagePerMonth: number
}

/**
 * Service enrollment statistics
 */
export interface ServiceStatistics {
  totalServices: number
  activeServices: number
  totalEnrollments: number
  averageMembersPerService: number
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

/**
 * Financial statistics
 */
export interface FinancialStatistics {
  titheStats: {
    totalTithePayers: number
    totalMonthlyTithe: number
    averageTithe: number
  }
  frequencyStats: Array<{
    frequency: string
    count: number
    totalAmount: number
  }>
}

