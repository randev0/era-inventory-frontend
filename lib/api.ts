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

// Check if we're running in the browser and can use the proxy
const isClient = typeof window !== 'undefined';
// Use local API endpoints when the backend is not available
const API_BASE_URL = isClient 
  ? '/api'  // Use Next.js API routes when in browser (fallback for missing backend)
  : process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080'; // Direct URL for SSR

// Debug logging for connection issues
console.log('API_BASE_URL configured as:', API_BASE_URL);
console.log('Environment variable NEXT_PUBLIC_API_BASE_URL:', process.env.NEXT_PUBLIC_API_BASE_URL);
console.log('Is client-side:', isClient);

// Health check function
export const checkServerHealth = async (): Promise<boolean> => {
  try {
    const healthEndpoint = isClient ? '/api/health' : `${API_BASE_URL}/health`;
    console.log('Checking server health at:', healthEndpoint);
    const response = await fetch(healthEndpoint, {
      method: 'GET',
      // Only set CORS mode when calling external URL directly
      ...(API_BASE_URL.startsWith('http') ? { mode: 'cors' as RequestMode } : {}),
      headers: {
        'Content-Type': 'application/json',
      },
    });
    console.log('Health check response status:', response.status);
    return response.ok;
  } catch (error) {
    console.error('Server health check failed:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      name: error instanceof Error ? error.name : 'Unknown',
      stack: error instanceof Error ? error.stack : 'No stack'
    });
    return false;
  }
};

// Create axios instance
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false,
  timeout: 10000,
  // Add additional configuration for better error handling
  validateStatus: function (status) {
    return status >= 200 && status < 500; // Don't throw for 4xx errors
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

// Test backend connection utility
export const testBackendConnection = async (): Promise<{ success: boolean; message: string; details?: any }> => {
  try {
    const healthEndpoint = isClient ? '/api/health' : `${API_BASE_URL}/health`;
    console.log('Testing backend connection to:', healthEndpoint);
    
    // Use the appropriate fetch configuration based on URL type
    const fetchConfig: RequestInit = {
      method: 'GET',
      headers: {
        'Accept': 'text/plain, application/json, */*',
        'Content-Type': 'application/json',
      },
    };
    
    // Only add CORS-specific config for external URLs
    if (healthEndpoint.startsWith('http')) {
      fetchConfig.mode = 'cors';
      fetchConfig.credentials = 'omit';
    }
    
    const response = await fetch(healthEndpoint, fetchConfig);
    
    if (response.ok) {
      const data = await response.text();
      return {
        success: true,
        message: 'Backend connection successful',
        details: { status: response.status, data }
      };
    } else {
      return {
        success: false,
        message: `Backend responded with status ${response.status}`,
        details: { status: response.status, statusText: response.statusText }
      };
    }
  } catch (error) {
    console.error('Backend connection test failed:', error);
    
    // Provide more specific error messages for common issues
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    if (errorMessage.includes('Failed to fetch')) {
      return {
        success: false,
        message: 'CORS error: The backend server may not have proper CORS headers configured for frontend origin',
        details: { 
          error: errorMessage,
          suggestion: 'Check backend CORS configuration for http://localhost:3000',
          backendUrl: API_BASE_URL
        }
      };
    }
    
    return {
      success: false,
      message: getErrorMessage(error),
      details: error
    };
  }
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
    const message = messageError.message;
    
    // Handle common network errors
    if (message.includes('ERR_NETWORK') || message.includes('Network Error')) {
      return 'Unable to connect to server. Please check if the backend is running.';
    }
    if (message.includes('ERR_CONNECTION_REFUSED') || message.includes('ECONNREFUSED')) {
      return 'Connection refused. Please ensure the backend server is running on the configured port.';
    }
    if (message.includes('timeout')) {
      return 'Request timeout. Please check your network connection and try again.';
    }
    
    return message;
  }
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const codeError = error as { code: string };
    if (codeError.code === 'ERR_NETWORK' || codeError.code === 'ECONNREFUSED') {
      return 'Unable to connect to server. Please check if the backend is running.';
    }
  }
  return 'An unexpected error occurred';
};
