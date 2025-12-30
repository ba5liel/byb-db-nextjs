/**
 * Role DTOs for role management
 */

export interface Role {
  id: string;
  name: string;
  nameAmharic: string;
  description: string;
  descriptionAmharic: string;
  permissions: {statements: Record<string, string[]>;};
}

export interface RoleMetadata {
  name: string;
  nameAmharic: string;
  description: string;
  descriptionAmharic: string;
}

export interface RoleNames {
  SUPER_ADMIN: string;
  CHURCH_PASTOR: string;
  ADMIN: string;
  MINISTER: string;
  VIEWER: string;
}

export interface PermissionResource {
  [resource: string]: readonly string[];
}

export interface CurrentUserRole {
  userId: string;
  email: string;
  name: string;
  role: string;
  roleMetadata: RoleMetadata;
  permissions: Record<string, string[]>;
}

export interface RolesListResponse {
  roles: Role[];
  totalRoles: number;
}

export interface PermissionsResponse {
  resources: PermissionResource;
  description: string;
}

export interface RoleConstantsResponse {
  roleNames: RoleNames;
  metadata: Record<string, RoleMetadata>;
}

