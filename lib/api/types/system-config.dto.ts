/**
 * System Configuration DTOs (SystemConfig singleton on the backend)
 */

export interface AgeGroupDefinition {
  key: string
  labelEn: string
  labelAm: string
  minAge: number
  maxAge: number
}

/** Shared shape for minister roles, service types, education levels, job types, marital statuses */
export interface ConfigOptionItem {
  key: string
  labelEn: string
  labelAm: string
  displayOrder?: number
  isActive?: boolean
}

export interface ServiceEnrollmentRules {
  maxServicesPerMember: number
  allowExceptions: boolean
}

export interface SystemConfigDto {
  _id: string
  configKey: string
  ageGroups: AgeGroupDefinition[]
  ministerRoles: ConfigOptionItem[]
  serviceTypes: ConfigOptionItem[]
  educationLevels: ConfigOptionItem[]
  jobTypes: ConfigOptionItem[]
  maritalStatusOptions: ConfigOptionItem[]
  serviceEnrollmentRules: ServiceEnrollmentRules
  dateFormat?: string
  primaryLanguage?: string
}

/** Resource segments for the per-list CRUD endpoints */
export type ConfigListResource =
  | "minister-roles"
  | "service-types"
  | "education-levels"
  | "job-types"
  | "marital-status"

/** Maps a config list resource to its field on SystemConfigDto */
export const CONFIG_RESOURCE_FIELD: Record<ConfigListResource, keyof SystemConfigDto> = {
  "minister-roles": "ministerRoles",
  "service-types": "serviceTypes",
  "education-levels": "educationLevels",
  "job-types": "jobTypes",
  "marital-status": "maritalStatusOptions",
}
