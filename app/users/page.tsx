'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/lib/auth';
import { usersApi, getErrorMessage } from '@/lib/api';
import { queryKeys } from '@/lib/query';
import { canCreateUsers, canEditUser, canViewUsers, isMainTenant } from '@/lib/rbac';
import { User, UserFormData } from '@/lib/types';
import Table from '@/components/ui/Table';
import Modal from '@/components/ui/Modal';
import Text from '@/components/forms/Text';

import { Plus, Edit, Trash2 } from 'lucide-react';

const userSchema = z.object({
  email: z.string().email('Invalid email address'),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  roles: z.array(z.string()).min(1, 'At least one role is required'),
  org_id: z.number().min(1, 'Organization ID is required'),
  password: z.string().optional(),
});

const AVAILABLE_ROLES = [
  { value: 'org_admin', label: 'Organization Admin' },
  { value: 'project_admin', label: 'Project Admin' },
  { value: 'viewer', label: 'Viewer' },
];

export default function UsersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  
  const { user: currentUser, claims } = useAuth();
  const queryClient = useQueryClient();

  const limit = 10;

  // Fetch users
  const { data: usersResponse, isLoading } = useQuery({
    queryKey: queryKeys.users.list({ page: currentPage, limit, q: searchQuery }),
    queryFn: () => usersApi.list({ page: currentPage, limit, q: searchQuery }).then(res => res.data),
    enabled: !!(claims && canViewUsers(claims.roles)),
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: UserFormData) => usersApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      setIsCreateModalOpen(false);
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<UserFormData> }) => 
      usersApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      setIsEditModalOpen(false);
      setSelectedUser(null);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => usersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      setIsDeleteModalOpen(false);
      setSelectedUser(null);
    },
  });

  // Form for create
  const createForm = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      org_id: claims?.org_id || 1,
      roles: [],
    },
  });

  // Form for edit
  const editForm = useForm<UserFormData>({
    resolver: zodResolver(userSchema.omit({ password: true })),
  });

  const handleCreateSubmit = (data: UserFormData) => {
    const submitData = {
      ...data,
      roles: selectedRoles,
    };
    createMutation.mutate(submitData);
  };

  const handleEditSubmit = (data: UserFormData) => {
    if (selectedUser) {
      const submitData = {
        ...data,
        roles: selectedRoles,
      };
      updateMutation.mutate({ id: selectedUser.id, data: submitData });
    }
  };

  const openEditModal = (user: User) => {
    if (!currentUser || !canEditUser(currentUser, user)) {
      return;
    }
    
    setSelectedUser(user);
    setSelectedRoles(user.roles);
    editForm.reset({
      email: user.email,
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      org_id: user.org_id,
      roles: user.roles,
    });
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (user: User) => {
    if (!currentUser || !canEditUser(currentUser, user)) {
      return;
    }
    setSelectedUser(user);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = () => {
    if (selectedUser) {
      deleteMutation.mutate(selectedUser.id);
    }
  };

  const handleRoleToggle = (role: string, isCreateForm = false) => {
    const currentRoles = selectedRoles;
    const newRoles = currentRoles.includes(role)
      ? currentRoles.filter(r => r !== role)
      : [...currentRoles, role];
    
    setSelectedRoles(newRoles);
    
    if (isCreateForm) {
      createForm.setValue('roles', newRoles);
    } else {
      editForm.setValue('roles', newRoles);
    }
  };

  // Check permissions for UI elements
  const canCreate = claims && canCreateUsers(claims.roles);
  const canView = claims && canViewUsers(claims.roles);

  // If user can't view users, show access denied
  if (!canView) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900">Access Denied</h2>
        <p className="mt-2 text-gray-600">You don&apos;t have permission to view users.</p>
      </div>
    );
  }

  const columns = [
    { key: 'email', label: 'Email' },
    { 
      key: 'first_name', 
      label: 'Name',
      render: (value: unknown, user: User) => 
        user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.first_name || '-'
    },
    { key: 'org_id', label: 'Organization' },
    { 
      key: 'roles', 
      label: 'Roles',
      render: (roles: unknown) => (roles as string[]).join(', ')
    },
    { 
      key: 'is_active', 
      label: 'Status',
      render: (isActive: unknown) => (
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
          isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {isActive ? 'Active' : 'Inactive'}
        </span>
      )
    },
    { 
      key: 'created_at', 
      label: 'Created',
      render: (value: unknown) => new Date(value as string).toLocaleDateString()
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Users</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage user accounts and permissions
          </p>
        </div>
        {canCreate && (
          <button
            onClick={() => {
              createForm.reset({
                org_id: claims?.org_id || 1,
                roles: [],
              });
              setSelectedRoles([]);
              setIsCreateModalOpen(true);
            }}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add User
          </button>
        )}
      </div>

      <Table
        data={usersResponse?.data || []}
        columns={columns}
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        currentPage={currentPage}
        totalPages={usersResponse?.pagination?.total_pages || 1}
        onPageChange={setCurrentPage}
        isLoading={isLoading}
        actions={(user) => {
          const canEdit = currentUser && canEditUser(currentUser, user);
          return (
            <div className="flex space-x-2">
              {canEdit && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openEditModal(user);
                  }}
                  className="text-blue-600 hover:text-blue-900"
                >
                  <Edit className="h-4 w-4" />
                </button>
              )}
              {canEdit && user.id !== currentUser?.id && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openDeleteModal(user);
                  }}
                  className="text-red-600 hover:text-red-900"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          );
        }}
      />

      {/* Create Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Add New User"
        size="lg"
      >
        <form onSubmit={createForm.handleSubmit(handleCreateSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Text
              label="Email"
              type="email"
              {...createForm.register('email')}
              error={createForm.formState.errors.email?.message}
              required
            />
            <Text
              label="Password"
              type="password"
              {...createForm.register('password')}
              error={createForm.formState.errors.password?.message}
              helperText="Leave empty to require user to set password on first login"
            />
            <Text
              label="First Name"
              {...createForm.register('first_name')}
              error={createForm.formState.errors.first_name?.message}
            />
            <Text
              label="Last Name"
              {...createForm.register('last_name')}
              error={createForm.formState.errors.last_name?.message}
            />
            <Text
              label="Organization ID"
              type="number"
              {...createForm.register('org_id', { valueAsNumber: true })}
              error={createForm.formState.errors.org_id?.message}
              required
              disabled={!isMainTenant(claims.org_id)}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Roles <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              {AVAILABLE_ROLES.map((role) => (
                <label key={role.value} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedRoles.includes(role.value)}
                    onChange={() => handleRoleToggle(role.value, true)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">{role.label}</span>
                </label>
              ))}
            </div>
            {createForm.formState.errors.roles && (
              <p className="mt-1 text-sm text-red-600">
                {createForm.formState.errors.roles.message}
              </p>
            )}
          </div>
          
          {createMutation.error && (
            <div className="text-sm text-red-600">
              {getErrorMessage(createMutation.error)}
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {createMutation.isPending ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit User"
        size="lg"
      >
        <form onSubmit={editForm.handleSubmit(handleEditSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Text
              label="Email"
              type="email"
              {...editForm.register('email')}
              error={editForm.formState.errors.email?.message}
              required
            />
            <Text
              label="First Name"
              {...editForm.register('first_name')}
              error={editForm.formState.errors.first_name?.message}
            />
            <Text
              label="Last Name"
              {...editForm.register('last_name')}
              error={editForm.formState.errors.last_name?.message}
            />
            <Text
              label="Organization ID"
              type="number"
              {...editForm.register('org_id', { valueAsNumber: true })}
              error={editForm.formState.errors.org_id?.message}
              required
              disabled={!isMainTenant(claims.org_id)}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Roles <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              {AVAILABLE_ROLES.map((role) => (
                <label key={role.value} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedRoles.includes(role.value)}
                    onChange={() => handleRoleToggle(role.value, false)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">{role.label}</span>
                </label>
              ))}
            </div>
            {editForm.formState.errors.roles && (
              <p className="mt-1 text-sm text-red-600">
                {editForm.formState.errors.roles.message}
              </p>
            )}
          </div>
          
          {updateMutation.error && (
            <div className="text-sm text-red-600">
              {getErrorMessage(updateMutation.error)}
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {updateMutation.isPending ? 'Updating...' : 'Update User'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete User"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Are you sure you want to delete the user &quot;{selectedUser?.email}&quot;? 
            This action cannot be undone.
          </p>
          
          {deleteMutation.error && (
            <div className="text-sm text-red-600">
              {getErrorMessage(deleteMutation.error)}
            </div>
          )}

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setIsDeleteModalOpen(false)}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete User'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
