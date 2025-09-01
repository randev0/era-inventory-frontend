'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { canSwitchOrgs } from '@/lib/rbac';
import { queryClient } from '@/lib/query';
import { ChevronDown, LogOut, User } from 'lucide-react';

export default function Header() {
  const { user, claims, logout } = useAuth();
  const [orgOverride, setOrgOverride] = useState<string>(
    localStorage.getItem('era_org_override') || ''
  );
  const [showDropdown, setShowDropdown] = useState(false);

  if (!user || !claims) return null;

  const handleOrgChange = (newOrgId: string) => {
    if (newOrgId) {
      localStorage.setItem('era_org_override', newOrgId);
    } else {
      localStorage.removeItem('era_org_override');
    }
    setOrgOverride(newOrgId);
    
    // Invalidate all queries to refetch with new org context
    queryClient.invalidateQueries();
  };

  const currentOrgId = orgOverride || claims.org_id.toString();

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="flex items-center justify-between h-16 px-6">
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-600">
            <span className="font-medium">Organization:</span> {currentOrgId}
          </div>
          
          {canSwitchOrgs(claims.org_id) && (
            <div className="flex items-center space-x-2">
              <label htmlFor="org-override" className="text-sm font-medium text-gray-700">
                Switch to Org:
              </label>
              <input
                id="org-override"
                type="number"
                value={orgOverride}
                onChange={(e) => handleOrgChange(e.target.value)}
                placeholder="Org ID"
                className="w-20 px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          )}
          
          <div className="text-sm text-gray-600">
            <span className="font-medium">Roles:</span> {claims.roles.join(', ')}
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center space-x-2 text-sm text-gray-700 hover:text-gray-900 focus:outline-none"
            >
              <User className="h-5 w-5" />
              <span>{user.email}</span>
              <ChevronDown className="h-4 w-4" />
            </button>

            {showDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
                <div className="py-1">
                  <div className="px-4 py-2 text-sm text-gray-500 border-b">
                    {user.first_name && user.last_name 
                      ? `${user.first_name} ${user.last_name}`
                      : user.email
                    }
                  </div>
                  <button
                    onClick={() => {
                      logout();
                      setShowDropdown(false);
                    }}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
