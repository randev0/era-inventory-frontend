'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import { authApi, organizationsApi, itemsApi, sitesApi, vendorsApi, projectsApi } from '@/lib/api';
import { queryKeys } from '@/lib/query';
import { canViewOrganizations } from '@/lib/rbac';
import { Package, MapPin, Building2, FolderKanban, Users } from 'lucide-react';

export default function DashboardPage() {
  const { claims } = useAuth();

  // Get profile data
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: queryKeys.auth.profile,
    queryFn: () => authApi.getProfile().then(res => res.data),
  });

  // Get organization stats if available, otherwise get counts from individual lists
  const orgOverride = localStorage.getItem('era_org_override');
  const currentOrgId = orgOverride ? parseInt(orgOverride) : claims?.org_id;
  
  const { data: orgStats, isLoading: statsLoading } = useQuery({
    queryKey: ['org-stats', currentOrgId],
    queryFn: async () => {
      if (currentOrgId && canViewOrganizations(claims?.org_id || 0)) {
        try {
          const response = await organizationsApi.getStats(currentOrgId);
          return response.data;
        } catch {
          // If stats endpoint is not available, fall back to individual counts
          const [items, sites, vendors, projects] = await Promise.all([
            itemsApi.list({ limit: 1 }).then(res => res.data.pagination.total),
            sitesApi.list({ limit: 1 }).then(res => res.data.pagination.total),
            vendorsApi.list({ limit: 1 }).then(res => res.data.pagination.total),
            projectsApi.list({ limit: 1 }).then(res => res.data.pagination.total),
          ]);
          
          return {
            item_count: items,
            site_count: sites,
            vendor_count: vendors,
            project_count: projects,
            user_count: 0, // Cannot get user count without proper endpoint
          };
        }
      } else {
        // Get counts for current org context
        const [items, sites, vendors, projects] = await Promise.all([
          itemsApi.list({ limit: 1 }).then(res => res.data.pagination.total),
          sitesApi.list({ limit: 1 }).then(res => res.data.pagination.total),
          vendorsApi.list({ limit: 1 }).then(res => res.data.pagination.total),
          projectsApi.list({ limit: 1 }).then(res => res.data.pagination.total),
        ]);
        
        return {
          item_count: items,
          site_count: sites,
          vendor_count: vendors,
          project_count: projects,
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
          Welcome back, {profile?.first_name && profile?.last_name 
            ? `${profile.first_name} ${profile.last_name}` 
            : profile?.email}
        </p>
      </div>

      {/* Profile Info */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Profile Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <p className="mt-1 text-sm text-gray-900">{profile?.email}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Organization ID</label>
            <p className="mt-1 text-sm text-gray-900">{profile?.org_id}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <p className="mt-1 text-sm text-gray-900">
              {profile?.first_name && profile?.last_name 
                ? `${profile.first_name} ${profile.last_name}` 
                : 'Not set'}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Roles</label>
            <p className="mt-1 text-sm text-gray-900">{profile?.roles.join(', ')}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Status</label>
            <p className="mt-1 text-sm text-gray-900">
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                profile?.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {profile?.is_active ? 'Active' : 'Inactive'}
              </span>
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Last Login</label>
            <p className="mt-1 text-sm text-gray-900">
              {profile?.last_login_at 
                ? new Date(profile.last_login_at).toLocaleString()
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
