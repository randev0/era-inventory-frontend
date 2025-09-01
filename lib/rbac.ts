import { User } from './types';

export const isMainTenant = (orgId: number) => orgId === 1;
export const has = (roles: string[], r: string) => roles.includes(r);

export const canCreateUsers = (roles: string[]) => has(roles, "org_admin");
export const canViewAllOrgs = (orgId: number) => isMainTenant(orgId);
export const canEditUser = (current: User, target: User) =>
  has(current.roles, "org_admin") && (current.org_id === target.org_id || isMainTenant(current.org_id));

// Additional RBAC helpers for UI permissions
export const canCreateItems = (roles: string[]) => 
  has(roles, "org_admin") || has(roles, "project_admin");

export const canEditItems = (roles: string[]) => 
  has(roles, "org_admin") || has(roles, "project_admin");

export const canDeleteItems = (roles: string[]) => 
  has(roles, "org_admin");

export const canManageSites = (roles: string[]) => 
  has(roles, "org_admin");

export const canManageVendors = (roles: string[]) => 
  has(roles, "org_admin");

export const canManageProjects = (roles: string[]) => 
  has(roles, "org_admin");

export const canViewUsers = (roles: string[]) => 
  has(roles, "org_admin");

export const canViewOrganizations = (orgId: number) => 
  isMainTenant(orgId);

export const canSwitchOrgs = (orgId: number) => 
  isMainTenant(orgId);
