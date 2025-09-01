import axios, { AxiosResponse } from 'axios';
import { 
  LoginResponse, 
  User, 
  Organization, 
  OrgStats, 
  Item, 
  Site, 
  Vendor, 
  Project, 
  ListResponse,
  LoginFormData,
  ProfileFormData,
  PasswordFormData,
  ItemFormData,
  UserFormData,
  OrganizationFormData,
  SiteFormData,
  VendorFormData,
  ProjectFormData
} from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

// Create axios instance
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token and org override
api.interceptors.request.use((config) => {
  // Add auth token
  const token = localStorage.getItem('era_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Add org override header for main tenant
  const orgOverride = localStorage.getItem('era_org_override');
  if (orgOverride) {
    config.headers['X-Org-Override'] = orgOverride;
  }

  return config;
});

// Response interceptor - handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear session and redirect to login
      localStorage.removeItem('era_token');
      localStorage.removeItem('era_user');
      localStorage.removeItem('era_org_override');
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: (data: LoginFormData): Promise<AxiosResponse<LoginResponse>> =>
    api.post('/auth/login', data),
  
  getProfile: (): Promise<AxiosResponse<User>> =>
    api.get('/auth/profile'),
  
  updateProfile: (data: ProfileFormData): Promise<AxiosResponse<User>> =>
    api.put('/auth/profile', data),
  
  changePassword: (data: PasswordFormData): Promise<AxiosResponse<void>> =>
    api.put('/auth/change-password', data),
};

// Users API
export const usersApi = {
  list: (params?: { page?: number; limit?: number; q?: string }): Promise<AxiosResponse<ListResponse<User>>> =>
    api.get('/users', { params }),
  
  create: (data: UserFormData): Promise<AxiosResponse<User>> =>
    api.post('/users', data),
  
  get: (id: number): Promise<AxiosResponse<User>> =>
    api.get(`/users/${id}`),
  
  update: (id: number, data: Partial<UserFormData>): Promise<AxiosResponse<User>> =>
    api.put(`/users/${id}`, data),
  
  delete: (id: number): Promise<AxiosResponse<void>> =>
    api.delete(`/users/${id}`),
};

// Organizations API
export const organizationsApi = {
  list: (params?: { page?: number; limit?: number; q?: string }): Promise<AxiosResponse<ListResponse<Organization>>> =>
    api.get('/organizations', { params }),
  
  create: (data: OrganizationFormData): Promise<AxiosResponse<Organization>> =>
    api.post('/organizations', data),
  
  get: (id: number): Promise<AxiosResponse<Organization>> =>
    api.get(`/organizations/${id}`),
  
  update: (id: number, data: Partial<OrganizationFormData>): Promise<AxiosResponse<Organization>> =>
    api.put(`/organizations/${id}`, data),
  
  delete: (id: number): Promise<AxiosResponse<void>> =>
    api.delete(`/organizations/${id}`),
  
  getStats: (id: number): Promise<AxiosResponse<OrgStats>> =>
    api.get(`/organizations/${id}/stats`),
};

// Items API
export const itemsApi = {
  list: (params?: { page?: number; limit?: number; q?: string }): Promise<AxiosResponse<ListResponse<Item>>> =>
    api.get('/items', { params }),
  
  create: (data: ItemFormData): Promise<AxiosResponse<Item>> =>
    api.post('/items', data),
  
  get: (id: number): Promise<AxiosResponse<Item>> =>
    api.get(`/items/${id}`),
  
  update: (id: number, data: Partial<ItemFormData>): Promise<AxiosResponse<Item>> =>
    api.put(`/items/${id}`, data),
  
  delete: (id: number): Promise<AxiosResponse<void>> =>
    api.delete(`/items/${id}`),
};

// Sites API
export const sitesApi = {
  list: (params?: { page?: number; limit?: number; q?: string }): Promise<AxiosResponse<ListResponse<Site>>> =>
    api.get('/sites', { params }),
  
  create: (data: SiteFormData): Promise<AxiosResponse<Site>> =>
    api.post('/sites', data),
  
  get: (id: number): Promise<AxiosResponse<Site>> =>
    api.get(`/sites/${id}`),
  
  update: (id: number, data: Partial<SiteFormData>): Promise<AxiosResponse<Site>> =>
    api.put(`/sites/${id}`, data),
  
  delete: (id: number): Promise<AxiosResponse<void>> =>
    api.delete(`/sites/${id}`),
};

// Vendors API
export const vendorsApi = {
  list: (params?: { page?: number; limit?: number; q?: string }): Promise<AxiosResponse<ListResponse<Vendor>>> =>
    api.get('/vendors', { params }),
  
  create: (data: VendorFormData): Promise<AxiosResponse<Vendor>> =>
    api.post('/vendors', data),
  
  get: (id: number): Promise<AxiosResponse<Vendor>> =>
    api.get(`/vendors/${id}`),
  
  update: (id: number, data: Partial<VendorFormData>): Promise<AxiosResponse<Vendor>> =>
    api.put(`/vendors/${id}`, data),
  
  delete: (id: number): Promise<AxiosResponse<void>> =>
    api.delete(`/vendors/${id}`),
};

// Projects API
export const projectsApi = {
  list: (params?: { page?: number; limit?: number; q?: string }): Promise<AxiosResponse<ListResponse<Project>>> =>
    api.get('/projects', { params }),
  
  create: (data: ProjectFormData): Promise<AxiosResponse<Project>> =>
    api.post('/projects', data),
  
  get: (id: number): Promise<AxiosResponse<Project>> =>
    api.get(`/projects/${id}`),
  
  update: (id: number, data: Partial<ProjectFormData>): Promise<AxiosResponse<Project>> =>
    api.put(`/projects/${id}`, data),
  
  delete: (id: number): Promise<AxiosResponse<void>> =>
    api.delete(`/projects/${id}`),
};

// Helper to get error message from API response
export const getErrorMessage = (error: unknown): string => {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const axiosError = error as { response?: { data?: { error?: string } } };
    if (axiosError.response?.data?.error) {
      return axiosError.response.data.error;
    }
  }
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const messageError = error as { message: string };
    return messageError.message;
  }
  return 'An unexpected error occurred';
};
