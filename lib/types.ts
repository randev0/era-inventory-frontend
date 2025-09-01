// JWT claims stored client-side
export interface JWTClaims {
  sub: string;      // user id
  org_id: number;   // org id
  roles: string[];  // ["org_admin","project_admin","viewer"]
  iss: string; 
  aud: string; 
  exp: number; 
  iat: number;
}

// Login response
export interface LoginResponse { 
  token: string; 
  user: User; 
}

// Core entities
export interface User {
  id: number;
  email: string;
  first_name?: string;
  last_name?: string;
  org_id: number;
  roles: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_login_at?: string;
}

export interface Organization { 
  id: number; 
  name: string; 
  created_at: string; 
  updated_at: string; 
}

export interface OrgStats { 
  user_count: number; 
  item_count: number; 
  site_count: number; 
  vendor_count: number; 
  project_count: number; 
}

export interface Item {
  id: number; 
  asset_tag: string; 
  name: string;
  manufacturer?: string; 
  model?: string; 
  device_type?: string; 
  site?: string;
  installed_at?: string; 
  warranty_end?: string; 
  notes?: string;
  created_at: string; 
  updated_at: string;
}

export interface Site { 
  id: number; 
  name: string; 
  location?: string; 
  notes?: string; 
  created_at: string; 
  updated_at: string; 
}

export interface Vendor { 
  id: number; 
  name: string; 
  email?: string; 
  phone?: string; 
  notes?: string; 
  created_at: string; 
  updated_at: string; 
}

export interface Project { 
  id: number; 
  code: string; 
  name: string; 
  description?: string; 
  created_at: string; 
  updated_at: string; 
}

// API response types
export interface ListResponse<T> {
  data: T[];
  pagination: { 
    page: number; 
    limit: number; 
    total: number; 
    total_pages: number; 
  };
}

export interface ErrorResponse { 
  error: string; 
  code: "MISSING_AUTH_HEADER"|"TOKEN_EXPIRED"|"INSUFFICIENT_PERMISSIONS"|"INVALID_INPUT"|"NOT_FOUND"; 
}

// Form types
export interface LoginFormData {
  email: string;
  password: string;
}

export interface ProfileFormData {
  first_name: string;
  last_name: string;
  email: string;
}

export interface PasswordFormData {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

export interface ItemFormData {
  asset_tag: string;
  name: string;
  manufacturer?: string;
  model?: string;
  device_type?: string;
  site?: string;
  installed_at?: string;
  warranty_end?: string;
  notes?: string;
}

export interface UserFormData {
  email: string;
  first_name?: string;
  last_name?: string;
  roles: string[];
  org_id: number;
  password?: string;
}

export interface OrganizationFormData {
  name: string;
}

export interface SiteFormData {
  name: string;
  location?: string;
  notes?: string;
}

export interface VendorFormData {
  name: string;
  email?: string;
  phone?: string;
  notes?: string;
}

export interface ProjectFormData {
  code: string;
  name: string;
  description?: string;
}
