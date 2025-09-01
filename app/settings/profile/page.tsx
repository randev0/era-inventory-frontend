'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { authApi, getErrorMessage } from '@/lib/api';
import { queryKeys } from '@/lib/query';
import { ProfileFormData } from '@/lib/types';
import Text from '@/components/forms/Text';
import { ArrowLeft, Save } from 'lucide-react';

const profileSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
});

export default function ProfilePage() {
  const [isSuccess, setIsSuccess] = useState(false);
  const queryClient = useQueryClient();

  // Get profile data
  const { data: profile, isLoading } = useQuery({
    queryKey: queryKeys.auth.profile,
    queryFn: () => authApi.getProfile().then(res => res.data),
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data: ProfileFormData) => authApi.updateProfile(data),
    onSuccess: (response) => {
      queryClient.setQueryData(queryKeys.auth.profile, response.data);
      // Also update user in localStorage
      const storedUser = localStorage.getItem('era_user');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        localStorage.setItem('era_user', JSON.stringify({ ...user, ...response.data }));
      }
      setIsSuccess(true);
      setTimeout(() => setIsSuccess(false), 3000);
    },
  });

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    values: profile ? {
      first_name: profile.first_name || '',
      last_name: profile.last_name || '',
      email: profile.email,
    } : undefined,
  });

  const onSubmit = (data: ProfileFormData) => {
    updateMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Link
          href="/settings"
          className="mr-4 inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Settings
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Profile Settings</h1>
        <p className="mt-1 text-sm text-gray-600">
          Update your personal information and profile details
        </p>
      </div>

      <div className="bg-white shadow rounded-lg">
        <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Text
              label="First Name"
              {...form.register('first_name')}
              error={form.formState.errors.first_name?.message}
              required
            />
            <Text
              label="Last Name"
              {...form.register('last_name')}
              error={form.formState.errors.last_name?.message}
              required
            />
          </div>

          <Text
            label="Email Address"
            type="email"
            {...form.register('email')}
            error={form.formState.errors.email?.message}
            required
          />

          {/* Read-only fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Organization ID</label>
              <div className="mt-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm text-gray-600">
                {profile?.org_id}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Roles</label>
              <div className="mt-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm text-gray-600">
                {profile?.roles.join(', ')}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <div className="mt-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  profile?.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {profile?.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Last Login</label>
              <div className="mt-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm text-gray-600">
                {profile?.last_login_at 
                  ? new Date(profile.last_login_at).toLocaleString()
                  : 'Never'}
              </div>
            </div>
          </div>

          {/* Success message */}
          {isSuccess && (
            <div className="rounded-md bg-green-50 p-4">
              <div className="text-sm text-green-700">
                Profile updated successfully!
              </div>
            </div>
          )}

          {/* Error message */}
          {updateMutation.error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">
                {getErrorMessage(updateMutation.error)}
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <Save className="h-4 w-4 mr-2" />
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
