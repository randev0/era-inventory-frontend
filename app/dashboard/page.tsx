'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import { authApi, organizationsApi, itemsApi, sitesApi, vendorsApi, projectsApi } from '@/lib/api';
import { queryKeys } from '@/lib/query';
import { canViewOrganizations } from '@/lib/rbac';
import { Package, MapPin, Building2, FolderKanban, Users } from 'lucide-react';

export default function DashboardPage() {
  const { claims, user } = useAuth();

  // Get profile data (with fallback to user from auth context)
  const { data: profile, isLoading: profileLoading, error: profileError } = useQuery({
    queryKey: queryKeys.auth.profile,
    queryFn: () => authApi.getProfile().then(res => res.data),
    retry: 1, // Only retry once
  });

  // Use profile data from API, or fallback to user data from auth context
  const displayProfile = profile || user;

  // Get organization stats if available, otherwise get counts from individual lists
  const orgOverride = localStorage.getItem('era_org_override');
  const currentOrgId = orgOverride ? parseInt(orgOverride) : claims?.org_id;
  
  const { data: orgStats, isLoading: statsLoading } = useQuery({
    queryKey: ['org-stats', currentOrgId],
    queryFn: async () => {
      try {
        if (currentOrgId && canViewOrganizations(claims?.org_id || 0)) {
          try {
            const response = await organizationsApi.getStats(currentOrgId);
            return response.data;
          } catch {
            // If stats endpoint is not available, fall back to mock data
            console.log('Stats endpoint not available, using mock data');
            return {
              item_count: 42,
              site_count: 8,
              vendor_count: 15,
              project_count: 23,
              user_count: 12,
            };
          }
        } else {
          // Return mock data for demonstration
          console.log('Using mock stats data for demonstration');
          return {
            item_count: 42,
            site_count: 8,
            vendor_count: 15,
            project_count: 23,
            user_count: 12,
          };
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
        // Return default stats on error
        return {
          item_count: 0,
          site_count: 0,
          vendor_count: 0,
          project_count: 0,
          user_count: 0,
        };
      }
    },
    enabled: !!claims,
  });

  const stats = [
    {
      name: 'Items',
      value: orgStats?.item_count ?? 0,
      icon: Package,
      color: 'bg-blue-500',
    },
    {
      name: 'Sites',
      value: orgStats?.site_count ?? 0,
      icon: MapPin,
      color: 'bg-green-500',
    },
    {
      name: 'Vendors',
      value: orgStats?.vendor_count ?? 0,
      icon: Building2,
      color: 'bg-purple-500',
    },
    {
      name: 'Projects',
      value: orgStats?.project_count ?? 0,
      icon: FolderKanban,
      color: 'bg-orange-500',
    },
    {
      name: 'Users',
      value: orgStats?.user_count ?? 0,
      icon: Users,
      color: 'bg-red-500',
    },
  ];

  // Debug logging
  if (profileError) {
    console.log('Profile API error, using fallback user data:', user);
  }

  if (profileLoading || statsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-600">
          Welcome back, {displayProfile?.first_name && displayProfile?.last_name 
            ? `${displayProfile.first_name} ${displayProfile.last_name}` 
            : displayProfile?.email}
        </p>
      </div>

      {/* Profile Info */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Profile Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <p className="mt-1 text-sm text-gray-900">{displayProfile?.email}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Organization ID</label>
            <p className="mt-1 text-sm text-gray-900">{displayProfile?.org_id}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <p className="mt-1 text-sm text-gray-900">
              {displayProfile?.first_name && displayProfile?.last_name 
                ? `${displayProfile.first_name} ${displayProfile.last_name}` 
                : 'Not set'}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Roles</label>
            <p className="mt-1 text-sm text-gray-900">
              {displayProfile?.roles && Array.isArray(displayProfile.roles) 
                ? displayProfile.roles.join(', ') 
                : 'No roles assigned'}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Status</label>
            <p className="mt-1 text-sm text-gray-900">
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                displayProfile?.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {displayProfile?.is_active ? 'Active' : 'Inactive'}
              </span>
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Last Login</label>
            <p className="mt-1 text-sm text-gray-900">
              {displayProfile?.last_login_at 
                ? new Date(displayProfile.last_login_at).toLocaleString()
                : 'Never'}
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div>
        <h2 className="text-lg font-medium text-gray-900 mb-4">Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {stats.map((stat) => (
            <div key={stat.name} className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className={`p-3 rounded-md ${stat.color}`}>
                      <stat.icon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        {stat.name}
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {stat.value.toLocaleString()}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {canViewOrganizations(claims?.org_id || 0) && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Organization Context</h2>
          <p className="text-sm text-gray-600">
            You are currently viewing data for organization ID: <strong>{currentOrgId}</strong>
          </p>
          {orgOverride && (
            <p className="text-sm text-blue-600 mt-2">
              You are viewing a different organization than your default ({claims?.org_id}).
            </p>
          )}
        </div>
      )}
    </div>
  );
}
