'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/lib/auth';
import { organizationsApi, getErrorMessage } from '@/lib/api';
import { queryKeys } from '@/lib/query';
import { canViewOrganizations } from '@/lib/rbac';
import { Organization, OrganizationFormData } from '@/lib/types';
import Table from '@/components/ui/Table';
import Modal from '@/components/ui/Modal';
import Text from '@/components/forms/Text';
import { Plus, Edit, Trash2, BarChart3 } from 'lucide-react';

const organizationSchema = z.object({
  name: z.string().min(1, 'Name is required'),
});

export default function OrganizationsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  
  const { claims } = useAuth();
  const queryClient = useQueryClient();

  const limit = 10;

  // Fetch organizations
  const { data: orgsResponse, isLoading } = useQuery({
    queryKey: queryKeys.organizations.list({ page: currentPage, limit, q: searchQuery }),
    queryFn: () => organizationsApi.list({ page: currentPage, limit, q: searchQuery }).then(res => res.data),
    enabled: !!(claims && canViewOrganizations(claims.org_id)),
  });

  // Fetch organization stats
  const { data: orgStats, isLoading: statsLoading } = useQuery({
    queryKey: queryKeys.organizations.stats(selectedOrg?.id || 0),
    queryFn: () => selectedOrg ? organizationsApi.getStats(selectedOrg.id).then(res => res.data) : null,
    enabled: !!selectedOrg && isStatsModalOpen,
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: OrganizationFormData) => organizationsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.organizations.all });
      setIsCreateModalOpen(false);
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<OrganizationFormData> }) => 
      organizationsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.organizations.all });
      setIsEditModalOpen(false);
      setSelectedOrg(null);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => organizationsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.organizations.all });
      setIsDeleteModalOpen(false);
      setSelectedOrg(null);
    },
  });

  // Form for create
  const createForm = useForm<OrganizationFormData>({
    resolver: zodResolver(organizationSchema),
  });

  // Form for edit
  const editForm = useForm<OrganizationFormData>({
    resolver: zodResolver(organizationSchema),
  });

  const handleCreateSubmit = (data: OrganizationFormData) => {
    createMutation.mutate(data);
  };

  const handleEditSubmit = (data: OrganizationFormData) => {
    if (selectedOrg) {
      updateMutation.mutate({ id: selectedOrg.id, data });
    }
  };

  const openEditModal = (org: Organization) => {
    setSelectedOrg(org);
    editForm.reset({
      name: org.name,
    });
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (org: Organization) => {
    setSelectedOrg(org);
    setIsDeleteModalOpen(true);
  };

  const openStatsModal = (org: Organization) => {
    setSelectedOrg(org);
    setIsStatsModalOpen(true);
  };

  const handleDelete = () => {
    if (selectedOrg) {
      deleteMutation.mutate(selectedOrg.id);
    }
  };

  // Check permissions after all hooks are declared
  if (!claims || !canViewOrganizations(claims.org_id)) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900">Access Denied</h2>
        <p className="mt-2 text-gray-600">You don&apos;t have permission to view organizations.</p>
      </div>
    );
  }

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Name' },
    { 
      key: 'created_at', 
      label: 'Created',
      render: (value: unknown) => new Date(value as string).toLocaleDateString()
    },
    { 
      key: 'updated_at', 
      label: 'Updated',
      render: (value: unknown) => new Date(value as string).toLocaleDateString()
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Organizations</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage client organizations and tenants
          </p>
        </div>
        <button
          onClick={() => {
            createForm.reset();
            setIsCreateModalOpen(true);
          }}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Organization
        </button>
      </div>

      <Table
        data={orgsResponse?.data || []}
        columns={columns}
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        currentPage={currentPage}
        totalPages={orgsResponse?.pagination.total_pages || 1}
        onPageChange={setCurrentPage}
        isLoading={isLoading}
        actions={(org) => (
          <div className="flex space-x-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                openStatsModal(org);
              }}
              className="text-green-600 hover:text-green-900"
              title="View Stats"
            >
              <BarChart3 className="h-4 w-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                openEditModal(org);
              }}
              className="text-blue-600 hover:text-blue-900"
            >
              <Edit className="h-4 w-4" />
            </button>
            {org.id !== 1 && ( // Don't allow deleting the main tenant
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openDeleteModal(org);
                }}
                className="text-red-600 hover:text-red-900"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        )}
      />

      {/* Create Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Add New Organization"
      >
        <form onSubmit={createForm.handleSubmit(handleCreateSubmit)} className="space-y-4">
          <Text
            label="Organization Name"
            {...createForm.register('name')}
            error={createForm.formState.errors.name?.message}
            required
          />
          
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
              {createMutation.isPending ? 'Creating...' : 'Create Organization'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Organization"
      >
        <form onSubmit={editForm.handleSubmit(handleEditSubmit)} className="space-y-4">
          <Text
            label="Organization Name"
            {...editForm.register('name')}
            error={editForm.formState.errors.name?.message}
            required
          />
          
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
              {updateMutation.isPending ? 'Updating...' : 'Update Organization'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Organization"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Are you sure you want to delete the organization &quot;{selectedOrg?.name}&quot;? 
            This action cannot be undone and will affect all users and data associated with this organization.
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
              {deleteMutation.isPending ? 'Deleting...' : 'Delete Organization'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Stats Modal */}
      <Modal
        isOpen={isStatsModalOpen}
        onClose={() => {
          setIsStatsModalOpen(false);
          setSelectedOrg(null);
        }}
        title={`${selectedOrg?.name} Statistics`}
        size="lg"
      >
        <div className="space-y-4">
          {statsLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : orgStats ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-900">{orgStats.user_count}</div>
                <div className="text-sm text-blue-700">Users</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-900">{orgStats.item_count}</div>
                <div className="text-sm text-green-700">Items</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-purple-900">{orgStats.site_count}</div>
                <div className="text-sm text-purple-700">Sites</div>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-orange-900">{orgStats.vendor_count}</div>
                <div className="text-sm text-orange-700">Vendors</div>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-red-900">{orgStats.project_count}</div>
                <div className="text-sm text-red-700">Projects</div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              Unable to load statistics for this organization.
            </div>
          )}
          
          <div className="flex justify-end pt-4">
            <button
              onClick={() => {
                setIsStatsModalOpen(false);
                setSelectedOrg(null);
              }}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
