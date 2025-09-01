'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { 
  canViewUsers, 
  canViewOrganizations, 
  canManageSites, 
  canManageVendors, 
  canManageProjects 
} from '@/lib/rbac';
import {
  LayoutDashboard,
  Package,
  MapPin,
  Building2,
  FolderKanban,
  Users,
  Building,
  Settings,
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, alwaysShow: true },
  { name: 'Items', href: '/items', icon: Package, alwaysShow: true },
  { name: 'Sites', href: '/sites', icon: MapPin, requiresPermission: 'sites' },
  { name: 'Vendors', href: '/vendors', icon: Building2, requiresPermission: 'vendors' },
  { name: 'Projects', href: '/projects', icon: FolderKanban, requiresPermission: 'projects' },
  { name: 'Users', href: '/users', icon: Users, requiresPermission: 'users' },
  { name: 'Organizations', href: '/organizations', icon: Building, requiresPermission: 'organizations' },
  { name: 'Settings', href: '/settings', icon: Settings, alwaysShow: true },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { claims } = useAuth();

  if (!claims) return null;

  const hasPermission = (permission: string) => {
    switch (permission) {
      case 'users':
        return canViewUsers(claims.roles);
      case 'organizations':
        return canViewOrganizations(claims.org_id);
      case 'sites':
        return canManageSites(claims.roles);
      case 'vendors':
        return canManageVendors(claims.roles);
      case 'projects':
        return canManageProjects(claims.roles);
      default:
        return true;
    }
  };

  const filteredNavigation = navigation.filter(item => 
    item.alwaysShow || (item.requiresPermission && hasPermission(item.requiresPermission))
  );

  return (
    <div className="flex flex-col h-full w-64 bg-gray-900">
      <div className="flex items-center h-16 px-4">
        <h1 className="text-xl font-bold text-white">Era Inventory</h1>
      </div>
      
      <nav className="flex-1 px-2 py-4 space-y-1">
        {filteredNavigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`
                group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors
                ${isActive
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }
              `}
            >
              <item.icon
                className={`mr-3 h-5 w-5 ${
                  isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'
                }`}
              />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
