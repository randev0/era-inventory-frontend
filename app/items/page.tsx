'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/lib/auth';
import { itemsApi, getErrorMessage } from '@/lib/api';
import { queryKeys } from '@/lib/query';
import { canCreateItems, canEditItems, canDeleteItems } from '@/lib/rbac';
import { Item, ItemFormData } from '@/lib/types';
import Table from '@/components/ui/Table';
import Modal from '@/components/ui/Modal';
import Text from '@/components/forms/Text';
import { Plus, Edit, Trash2 } from 'lucide-react';

const itemSchema = z.object({
  asset_tag: z.string().min(1, 'Asset tag is required'),
  name: z.string().min(1, 'Name is required'),
  manufacturer: z.string().optional(),
  model: z.string().optional(),
  device_type: z.string().optional(),
  site: z.string().optional(),
  installed_at: z.string().optional(),
  warranty_end: z.string().optional(),
  notes: z.string().optional(),
});

export default function ItemsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  
  const { claims } = useAuth();
  const queryClient = useQueryClient();

  const limit = 10;

  // Fetch items
  const { data: itemsResponse, isLoading } = useQuery({
    queryKey: queryKeys.items.list({ page: currentPage, limit, q: searchQuery }),
    queryFn: () => itemsApi.list({ page: currentPage, limit, q: searchQuery }).then(res => res.data),
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: ItemFormData) => itemsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.items.all });
      setIsCreateModalOpen(false);
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<ItemFormData> }) => 
      itemsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.items.all });
      setIsEditModalOpen(false);
      setSelectedItem(null);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => itemsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.items.all });
      setIsDeleteModalOpen(false);
      setSelectedItem(null);
    },
  });

  // Form for create
  const createForm = useForm<ItemFormData>({
    resolver: zodResolver(itemSchema),
  });

  // Form for edit
  const editForm = useForm<ItemFormData>({
    resolver: zodResolver(itemSchema),
  });

  const handleCreateSubmit = (data: ItemFormData) => {
    createMutation.mutate(data);
  };

  const handleEditSubmit = (data: ItemFormData) => {
    if (selectedItem) {
      updateMutation.mutate({ id: selectedItem.id, data });
    }
  };

  const openEditModal = (item: Item) => {
    setSelectedItem(item);
    editForm.reset({
      asset_tag: item.asset_tag,
      name: item.name,
      manufacturer: item.manufacturer || '',
      model: item.model || '',
      device_type: item.device_type || '',
      site: item.site || '',
      installed_at: item.installed_at || '',
      warranty_end: item.warranty_end || '',
      notes: item.notes || '',
    });
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (item: Item) => {
    setSelectedItem(item);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = () => {
    if (selectedItem) {
      deleteMutation.mutate(selectedItem.id);
    }
  };

  const columns = [
    { key: 'asset_tag', label: 'Asset Tag' },
    { key: 'name', label: 'Name' },
    { key: 'manufacturer', label: 'Manufacturer' },
    { key: 'model', label: 'Model' },
    { key: 'device_type', label: 'Device Type' },
    { key: 'site', label: 'Site' },
    { 
      key: 'warranty_end', 
      label: 'Warranty End',
      render: (value: unknown) => value ? new Date(value as string).toLocaleDateString() : '-'
    },
  ];

  const canCreate = claims && canCreateItems(claims.roles);
  const canEdit = claims && canEditItems(claims.roles);
  const canDelete = claims && canDeleteItems(claims.roles);



  return (
    <div className="space-y-6">
      {/* Debug indicator */}
      {(isEditModalOpen || isDeleteModalOpen) && (
        <div className="fixed top-4 right-4 bg-red-500 text-white p-2 rounded z-50">
          Modal State: Edit={isEditModalOpen ? 'OPEN' : 'CLOSED'}, Delete={isDeleteModalOpen ? 'OPEN' : 'CLOSED'}
        </div>
      )}
      
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Items</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage your IT inventory items
          </p>
        </div>
        {canCreate && (
          <button
            onClick={() => {
              createForm.reset();
              setIsCreateModalOpen(true);
            }}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </button>
        )}
      </div>

      <Table
        data={itemsResponse?.data || []}
        columns={columns}
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        currentPage={currentPage}
        totalPages={itemsResponse?.pagination?.total_pages || 1}
        onPageChange={setCurrentPage}
        isLoading={isLoading}
        actions={(item) => (
          <div className="flex space-x-2">
            {canEdit && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openEditModal(item);
                }}
                className="text-blue-600 hover:text-blue-900"
              >
                <Edit className="h-4 w-4" />
              </button>
            )}
            {canDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openDeleteModal(item);
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
        title="Add New Item"
        size="lg"
      >
        <form onSubmit={createForm.handleSubmit(handleCreateSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Text
              label="Asset Tag"
              {...createForm.register('asset_tag')}
              error={createForm.formState.errors.asset_tag?.message}
              required
            />
            <Text
              label="Name"
              {...createForm.register('name')}
              error={createForm.formState.errors.name?.message}
              required
            />
            <Text
              label="Manufacturer"
              {...createForm.register('manufacturer')}
              error={createForm.formState.errors.manufacturer?.message}
            />
            <Text
              label="Model"
              {...createForm.register('model')}
              error={createForm.formState.errors.model?.message}
            />
            <Text
              label="Device Type"
              {...createForm.register('device_type')}
              error={createForm.formState.errors.device_type?.message}
            />
            <Text
              label="Site"
              {...createForm.register('site')}
              error={createForm.formState.errors.site?.message}
            />
            <Text
              label="Installed At"
              type="date"
              {...createForm.register('installed_at')}
              error={createForm.formState.errors.installed_at?.message}
            />
            <Text
              label="Warranty End"
              type="date"
              {...createForm.register('warranty_end')}
              error={createForm.formState.errors.warranty_end?.message}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              {...createForm.register('notes')}
              rows={3}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
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
              {createMutation.isPending ? 'Creating...' : 'Create Item'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Item"
        size="lg"
      >
        <form onSubmit={editForm.handleSubmit(handleEditSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Text
              label="Asset Tag"
              {...editForm.register('asset_tag')}
              error={editForm.formState.errors.asset_tag?.message}
              required
            />
            <Text
              label="Name"
              {...editForm.register('name')}
              error={editForm.formState.errors.name?.message}
              required
            />
            <Text
              label="Manufacturer"
              {...editForm.register('manufacturer')}
              error={editForm.formState.errors.manufacturer?.message}
            />
            <Text
              label="Model"
              {...editForm.register('model')}
              error={editForm.formState.errors.model?.message}
            />
            <Text
              label="Device Type"
              {...editForm.register('device_type')}
              error={editForm.formState.errors.device_type?.message}
            />
            <Text
              label="Site"
              {...editForm.register('site')}
              error={editForm.formState.errors.site?.message}
            />
            <Text
              label="Installed At"
              type="date"
              {...editForm.register('installed_at')}
              error={editForm.formState.errors.installed_at?.message}
            />
            <Text
              label="Warranty End"
              type="date"
              {...editForm.register('warranty_end')}
              error={editForm.formState.errors.warranty_end?.message}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              {...editForm.register('notes')}
              rows={3}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
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
              {updateMutation.isPending ? 'Updating...' : 'Update Item'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Item"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Are you sure you want to delete the item &quot;{selectedItem?.name}&quot; (Asset Tag: {selectedItem?.asset_tag})? 
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
              {deleteMutation.isPending ? 'Deleting...' : 'Delete Item'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
