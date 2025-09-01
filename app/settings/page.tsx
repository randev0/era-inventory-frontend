'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { User, Key, LogOut, Globe } from 'lucide-react';

export default function SettingsPage() {
  const { logout } = useAuth();

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-600">
          Manage your account settings and preferences
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profile Settings */}
        <Link
          href="/settings/profile"
          className="block p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
        >
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <User className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Profile</h3>
              <p className="mt-1 text-sm text-gray-600">
                Update your personal information and profile details
              </p>
            </div>
          </div>
        </Link>

        {/* Password Settings */}
        <Link
          href="/settings/password"
          className="block p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
        >
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Key className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Change Password</h3>
              <p className="mt-1 text-sm text-gray-600">
                Update your account password for security
              </p>
            </div>
          </div>
        </Link>
      </div>

      {/* System Information */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">System Information</h2>
        <div className="space-y-3">
          <div className="flex items-center">
            <Globe className="h-5 w-5 text-gray-400 mr-3" />
            <div>
              <span className="text-sm font-medium text-gray-700">API Base URL:</span>
              <span className="ml-2 text-sm text-gray-600 font-mono">{API_BASE_URL}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Actions</h2>
        <button
          onClick={logout}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </button>
      </div>
    </div>
  );
}
