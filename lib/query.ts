import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30 * 1000, // 30 seconds
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

// Query keys for consistent cache management
export const queryKeys = {
  auth: {
    profile: ['auth', 'profile'] as const,
  },
  users: {
    all: ['users'] as const,
    list: (params?: { page?: number; limit?: number; q?: string }) => 
      ['users', 'list', params] as const,
    detail: (id: number) => ['users', 'detail', id] as const,
  },
  organizations: {
    all: ['organizations'] as const,
    list: (params?: { page?: number; limit?: number; q?: string }) => 
      ['organizations', 'list', params] as const,
    detail: (id: number) => ['organizations', 'detail', id] as const,
    stats: (id: number) => ['organizations', 'stats', id] as const,
  },
  items: {
    all: ['items'] as const,
    list: (params?: { page?: number; limit?: number; q?: string }) => 
      ['items', 'list', params] as const,
    detail: (id: number) => ['items', 'detail', id] as const,
  },
  sites: {
    all: ['sites'] as const,
    list: (params?: { page?: number; limit?: number; q?: string }) => 
      ['sites', 'list', params] as const,
    detail: (id: number) => ['sites', 'detail', id] as const,
  },
  vendors: {
    all: ['vendors'] as const,
    list: (params?: { page?: number; limit?: number; q?: string }) => 
      ['vendors', 'list', params] as const,
    detail: (id: number) => ['vendors', 'detail', id] as const,
  },
  projects: {
    all: ['projects'] as const,
    list: (params?: { page?: number; limit?: number; q?: string }) => 
      ['projects', 'list', params] as const,
    detail: (id: number) => ['projects', 'detail', id] as const,
  },
} as const;
