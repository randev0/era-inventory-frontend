'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { authApi, getErrorMessage } from '@/lib/api';
import { PasswordFormData } from '@/lib/types';
import Text from '@/components/forms/Text';
import { ArrowLeft, Save } from 'lucide-react';

const passwordSchema = z.object({
  current_password: z.string().min(1, 'Current password is required'),
  new_password: z.string().min(8, 'New password must be at least 8 characters'),
  confirm_password: z.string().min(1, 'Please confirm your new password'),
}).refine((data) => data.new_password === data.confirm_password, {
  message: "Passwords don't match",
  path: ["confirm_password"],
});

export default function PasswordPage() {
  const [isSuccess, setIsSuccess] = useState(false);

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data: PasswordFormData) => authApi.changePassword(data),
    onSuccess: () => {
      setIsSuccess(true);
      form.reset();
      setTimeout(() => setIsSuccess(false), 5000);
    },
  });

  const form = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  const onSubmit = (data: PasswordFormData) => {
    updateMutation.mutate(data);
  };

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
        <h1 className="text-2xl font-semibold text-gray-900">Change Password</h1>
        <p className="mt-1 text-sm text-gray-600">
          Update your account password for security
        </p>
      </div>

      <div className="bg-white shadow rounded-lg">
        <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 space-y-6">
          <Text
            label="Current Password"
            type="password"
            {...form.register('current_password')}
            error={form.formState.errors.current_password?.message}
            required
          />

          <Text
            label="New Password"
            type="password"
            {...form.register('new_password')}
            error={form.formState.errors.new_password?.message}
            required
            helperText="Password must be at least 8 characters long"
          />

          <Text
            label="Confirm New Password"
            type="password"
            {...form.register('confirm_password')}
            error={form.formState.errors.confirm_password?.message}
            required
          />

          {/* Success message */}
          {isSuccess && (
            <div className="rounded-md bg-green-50 p-4">
              <div className="text-sm text-green-700">
                Password changed successfully!
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

          <div className="border-t border-gray-200 pt-6">
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={updateMutation.isPending}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <Save className="h-4 w-4 mr-2" />
                {updateMutation.isPending ? 'Changing Password...' : 'Change Password'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Security Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-900 mb-2">Password Security Tips</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Use a strong password with at least 8 characters</li>
          <li>• Include a mix of uppercase, lowercase, numbers, and special characters</li>
          <li>• Don&apos;t use personal information or common words</li>
          <li>• Don&apos;t reuse passwords from other accounts</li>
          <li>• Consider using a password manager</li>
        </ul>
      </div>
    </div>
  );
}
