'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/lib/auth';
import { sitesApi, getErrorMessage } from '@/lib/api';
import { queryKeys } from '@/lib/query';
import { canManageSites } from '@/lib/rbac';
import { Site, SiteFormData } from '@/lib/types';
import Table from '@/components/ui/Table';
import Modal from '@/components/ui/Modal';
import Text from '@/components/forms/Text';
import { Plus, Edit, Trash2 } from 'lucide-react';

const siteSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  location: z.string().optional(),
  notes: z.string().optional(),
});

export default function SitesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  
  const { claims } = useAuth();
  const queryClient = useQueryClient();
  const limit = 10;

  // Fetch sites
  const { data: sitesResponse, isLoading } = useQuery({
    queryKey: queryKeys.sites.list({ page: currentPage, limit, q: searchQuery }),
    queryFn: () => sitesApi.list({ page: currentPage, limit, q: searchQuery }).then(res => res.data),
    enabled: !!(claims && canManageSites(claims.roles)),
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: SiteFormData) => sitesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sites.all });
      setIsCreateModalOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<SiteFormData> }) => 
      sitesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sites.all });
      setIsEditModalOpen(false);
      setSelectedSite(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => sitesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sites.all });
      setIsDeleteModalOpen(false);
      setSelectedSite(null);
    },
  });

  // Forms
  const createForm = useForm<SiteFormData>({ resolver: zodResolver(siteSchema) });
  const editForm = useForm<SiteFormData>({ resolver: zodResolver(siteSchema) });

  const handleCreateSubmit = (data: SiteFormData) => createMutation.mutate(data);
  const handleEditSubmit = (data: SiteFormData) => {
    if (selectedSite) updateMutation.mutate({ id: selectedSite.id, data });
  };

  const openEditModal = (site: Site) => {
    setSelectedSite(site);
    editForm.reset({
      name: site.name,
      location: site.location || '',
      notes: site.notes || '',
    });
    setIsEditModalOpen(true);
  };

  // Check permissions after all hooks are declared
  if (!claims || !canManageSites(claims.roles)) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900">Access Denied</h2>
        <p className="mt-2 text-gray-600">You don&apos;t have permission to manage sites.</p>
      </div>
    );
  }

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'location', label: 'Location' },
    { key: 'created_at', label: 'Created', render: (value: unknown) => new Date(value as string).toLocaleDateString() },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Sites</h1>
          <p className="mt-1 text-sm text-gray-600">Manage physical locations and sites</p>
        </div>
        <button
          onClick={() => { createForm.reset(); setIsCreateModalOpen(true); }}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Site
        </button>
      </div>

      <Table
        data={sitesResponse?.data || []}
        columns={columns}
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        currentPage={currentPage}
        totalPages={sitesResponse?.pagination.total_pages || 1}
        onPageChange={setCurrentPage}
        isLoading={isLoading}
        actions={(site) => (
          <div className="flex space-x-2">
            <button onClick={(e) => { e.stopPropagation(); openEditModal(site); }} className="text-blue-600 hover:text-blue-900">
              <Edit className="h-4 w-4" />
            </button>
            <button onClick={(e) => { e.stopPropagation(); setSelectedSite(site); setIsDeleteModalOpen(true); }} className="text-red-600 hover:text-red-900">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )}
      />

      {/* Create Modal */}
      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Add New Site">
        <form onSubmit={createForm.handleSubmit(handleCreateSubmit)} className="space-y-4">
          <Text label="Name" {...createForm.register('name')} error={createForm.formState.errors.name?.message} required />
          <Text label="Location" {...createForm.register('location')} error={createForm.formState.errors.location?.message} />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea {...createForm.register('notes')} rows={3} className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
          </div>
          {createMutation.error && <div className="text-sm text-red-600">{getErrorMessage(createMutation.error)}</div>}
          <div className="flex justify-end space-x-3 pt-4">
            <button type="button" onClick={() => setIsCreateModalOpen(false)} className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={createMutation.isPending} className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50">
              {createMutation.isPending ? 'Creating...' : 'Create Site'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Site">
        <form onSubmit={editForm.handleSubmit(handleEditSubmit)} className="space-y-4">
          <Text label="Name" {...editForm.register('name')} error={editForm.formState.errors.name?.message} required />
          <Text label="Location" {...editForm.register('location')} error={editForm.formState.errors.location?.message} />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea {...editForm.register('notes')} rows={3} className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
          </div>
          {updateMutation.error && <div className="text-sm text-red-600">{getErrorMessage(updateMutation.error)}</div>}
          <div className="flex justify-end space-x-3 pt-4">
            <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={updateMutation.isPending} className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50">
              {updateMutation.isPending ? 'Updating...' : 'Update Site'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Delete Site">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Are you sure you want to delete &quot;{selectedSite?.name}&quot;? This action cannot be undone.</p>
          {deleteMutation.error && <div className="text-sm text-red-600">{getErrorMessage(deleteMutation.error)}</div>}
          <div className="flex justify-end space-x-3">
            <button onClick={() => setIsDeleteModalOpen(false)} className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
            <button onClick={() => selectedSite && deleteMutation.mutate(selectedSite.id)} disabled={deleteMutation.isPending} className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50">
              {deleteMutation.isPending ? 'Deleting...' : 'Delete Site'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
