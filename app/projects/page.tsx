'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/lib/auth';
import { projectsApi, getErrorMessage } from '@/lib/api';
import { queryKeys } from '@/lib/query';
import { canManageProjects } from '@/lib/rbac';
import { Project, ProjectFormData } from '@/lib/types';
import Table from '@/components/ui/Table';
import Modal from '@/components/ui/Modal';
import Text from '@/components/forms/Text';
import { Plus, Edit, Trash2 } from 'lucide-react';

const projectSchema = z.object({
  code: z.string().min(1, 'Code is required'),
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
});

export default function ProjectsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  
  const { claims } = useAuth();
  const queryClient = useQueryClient();
  const limit = 10;

  // Fetch projects
  const { data: projectsResponse, isLoading } = useQuery({
    queryKey: queryKeys.projects.list({ page: currentPage, limit, q: searchQuery }),
    queryFn: () => projectsApi.list({ page: currentPage, limit, q: searchQuery }).then(res => res.data),
    enabled: !!(claims && canManageProjects(claims.roles)),
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: ProjectFormData) => projectsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.all });
      setIsCreateModalOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<ProjectFormData> }) => 
      projectsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.all });
      setIsEditModalOpen(false);
      setSelectedProject(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => projectsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.all });
      setIsDeleteModalOpen(false);
      setSelectedProject(null);
    },
  });

  // Forms
  const createForm = useForm<ProjectFormData>({ resolver: zodResolver(projectSchema) });
  const editForm = useForm<ProjectFormData>({ resolver: zodResolver(projectSchema) });

  const handleCreateSubmit = (data: ProjectFormData) => createMutation.mutate(data);
  const handleEditSubmit = (data: ProjectFormData) => {
    if (selectedProject) updateMutation.mutate({ id: selectedProject.id, data });
  };

  const openEditModal = (project: Project) => {
    setSelectedProject(project);
    editForm.reset({
      code: project.code,
      name: project.name,
      description: project.description || '',
    });
    setIsEditModalOpen(true);
  };

  // Check permissions after all hooks are declared
  if (!claims || !canManageProjects(claims.roles)) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900">Access Denied</h2>
        <p className="mt-2 text-gray-600">You don&apos;t have permission to manage projects.</p>
      </div>
    );
  }

  const columns = [
    { key: 'code', label: 'Code' },
    { key: 'name', label: 'Name' },
    { key: 'description', label: 'Description' },
    { key: 'created_at', label: 'Created', render: (value: unknown) => new Date(value as string).toLocaleDateString() },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Projects</h1>
          <p className="mt-1 text-sm text-gray-600">Manage IT projects and initiatives</p>
        </div>
        <button
          onClick={() => { createForm.reset(); setIsCreateModalOpen(true); }}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Project
        </button>
      </div>

      <Table
        data={projectsResponse?.data || []}
        columns={columns}
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        currentPage={currentPage}
        totalPages={projectsResponse?.pagination?.total_pages || 1}
        onPageChange={setCurrentPage}
        isLoading={isLoading}
        actions={(project) => (
          <div className="flex space-x-2">
            <button onClick={(e) => { e.stopPropagation(); openEditModal(project); }} className="text-blue-600 hover:text-blue-900">
              <Edit className="h-4 w-4" />
            </button>
            <button onClick={(e) => { e.stopPropagation(); setSelectedProject(project); setIsDeleteModalOpen(true); }} className="text-red-600 hover:text-red-900">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )}
      />

      {/* Create Modal */}
      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Add New Project">
        <form onSubmit={createForm.handleSubmit(handleCreateSubmit)} className="space-y-4">
          <Text label="Project Code" {...createForm.register('code')} error={createForm.formState.errors.code?.message} required />
          <Text label="Name" {...createForm.register('name')} error={createForm.formState.errors.name?.message} required />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea {...createForm.register('description')} rows={3} className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
          </div>
          {createMutation.error && <div className="text-sm text-red-600">{getErrorMessage(createMutation.error)}</div>}
          <div className="flex justify-end space-x-3 pt-4">
            <button type="button" onClick={() => setIsCreateModalOpen(false)} className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={createMutation.isPending} className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50">
              {createMutation.isPending ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Project">
        <form onSubmit={editForm.handleSubmit(handleEditSubmit)} className="space-y-4">
          <Text label="Project Code" {...editForm.register('code')} error={editForm.formState.errors.code?.message} required />
          <Text label="Name" {...editForm.register('name')} error={editForm.formState.errors.name?.message} required />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea {...editForm.register('description')} rows={3} className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
          </div>
          {updateMutation.error && <div className="text-sm text-red-600">{getErrorMessage(updateMutation.error)}</div>}
          <div className="flex justify-end space-x-3 pt-4">
            <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={updateMutation.isPending} className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50">
              {updateMutation.isPending ? 'Updating...' : 'Update Project'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Delete Project">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Are you sure you want to delete &quot;{selectedProject?.name}&quot; (Code: {selectedProject?.code})? This action cannot be undone.</p>
          {deleteMutation.error && <div className="text-sm text-red-600">{getErrorMessage(deleteMutation.error)}</div>}
          <div className="flex justify-end space-x-3">
            <button onClick={() => setIsDeleteModalOpen(false)} className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
            <button onClick={() => selectedProject && deleteMutation.mutate(selectedProject.id)} disabled={deleteMutation.isPending} className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50">
              {deleteMutation.isPending ? 'Deleting...' : 'Delete Project'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
