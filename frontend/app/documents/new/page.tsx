'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { documentsApi, apiFetch } from '@/lib/api';
import { CreateDocumentDto } from '@/lib/types';
import { MarkdownEditor } from '@/components/MarkdownEditor';
import Sidebar from '@/components/Sidebar';
import ProtectedRoute from '@/components/ProtectedRoute';
import InternshipCheck from '@/components/InternshipCheck';
import { Save, X } from 'lucide-react';

function NewDocumentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const projectId = searchParams.get('projectId');
  const taskId = searchParams.get('taskId');

  const [projects, setProjects] = useState<any[]>([]);
  const [collaborativeProjects, setCollaborativeProjects] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const [formData, setFormData] = useState<CreateDocumentDto>({
    title: '',
    content: '# Novo Documento\n\nComece a escrever aqui...',
    slug: '',
    isPublic: true,
    isPinned: false,
    tags: [],
    ...(projectId && { projectId }),
    ...(taskId && { taskId }),
  });

  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    loadProjectsAndTasks();
  }, []);

  const loadProjectsAndTasks = async () => {
    try {
      setLoadingData(true);
      const [projectsData, collaborativeProjectsData, tasksData] = await Promise.all([
        apiFetch('/projects'),
        apiFetch('/projects/collaborative/accessible'),
        apiFetch('/tasks?includeCollaborative=true')
      ]);
      setProjects(projectsData);
      setCollaborativeProjects(collaborativeProjectsData);
      const accessibleProjectIds = new Set<string>([
        ...projectsData.map((p: any) => p.id),
        ...collaborativeProjectsData.map((p: any) => p.id),
      ]);
      const filteredTasks = (tasksData as any[]).filter(
        (task) => !task.projectId || accessibleProjectIds.has(task.projectId),
      );
      setTasks(filteredTasks);
    } catch (err: any) {
      console.error('Erro ao carregar dados:', err);
    } finally {
      setLoadingData(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      setError('O título é obrigatório');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      await documentsApi.create(formData);
      router.push('/documents');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags?.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...(formData.tags || []), tagInput.trim()],
      });
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags?.filter(t => t !== tag) || [],
    });
  };

  return (
    <ProtectedRoute>
      <InternshipCheck>
      <div className="flex">
        <Sidebar />
        <div className="flex-1 ml-20">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Criar Novo Documento</h1>
        <p className="mt-2 text-gray-600">
          Crie documentação em Markdown para seus projetos e tarefas
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md text-red-800">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
          {/* Associação */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4 border-b border-gray-200">
            <div>
              <label htmlFor="projectId" className="block text-sm font-medium text-gray-700 mb-2">
                Associar a Projeto
              </label>
              <select
                id="projectId"
                value={formData.projectId || ''}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  projectId: e.target.value || undefined,
                  taskId: e.target.value ? undefined : formData.taskId // Limpa task se escolher projeto
                })}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loadingData}
              >
                <option value="">Nenhum projeto</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.title}
                  </option>
                ))}
                {collaborativeProjects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="taskId" className="block text-sm font-medium text-gray-700 mb-2">
                Associar a Tarefa
              </label>
              <select
                id="taskId"
                value={formData.taskId || ''}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  taskId: e.target.value || undefined,
                  projectId: e.target.value ? undefined : formData.projectId // Limpa projeto se escolher task
                })}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loadingData}
              >
                <option value="">Nenhuma tarefa</option>
                {tasks.map((task) => (
                  <option key={task.id} value={task.id}>
                    {task.title} {task.project ? `(${task.project.title})` : '(Tarefa Simples)'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Título *
            </label>
            <input
              type="text"
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ex: README do Projeto, Guia de Setup, etc."
              required
            />
          </div>

          {/* Slug */}
          <div>
            <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-2">
              Slug (URL amigável)
            </label>
            <input
              type="text"
              id="slug"
              value={formData.slug || ''}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ex: readme-projeto"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tags
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Adicionar tag..."
              />
              <button
                type="button"
                onClick={addTag}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                Adicionar
              </button>
            </div>
            {formData.tags && formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-md"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-2 text-blue-600 hover:text-blue-800"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Options */}
          <div className="flex gap-6">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.isPublic}
                onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Público (visível para membros do projeto/tarefa)</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.isPinned}
                onChange={(e) => setFormData({ ...formData, isPinned: e.target.checked })}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Fixar documento</span>
            </label>
          </div>

          {/* Content Editor */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Conteúdo (Markdown) *
            </label>
            <MarkdownEditor
              value={formData.content}
              onChange={(content) => setFormData({ ...formData, content })}
              height={500}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-5 h-5 mr-2" />
                Criar Documento
              </>
            )}
          </button>
        </div>
      </form>
          </div>
        </div>
      </div>
      </InternshipCheck>
    </ProtectedRoute>
  );
}
export default function NewDocumentPage() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <NewDocumentContent />
    </Suspense>
  );
}