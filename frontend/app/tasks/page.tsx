'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Button from '@/components/ui/Button';
import ProtectedRoute from '@/components/ProtectedRoute';
import InternshipCheck from '@/components/InternshipCheck';
import TaskDialog from '@/components/TaskDialog';
import { apiFetch } from '@/lib/api';
import { useOnceEffect } from '@/lib/hooks';
import {
  ChevronDown,
  ChevronRight,
  MoreHorizontal,
  MoreVertical,
  Folder,
} from 'lucide-react';

type Priority = 'LOW' | 'MEDIUM' | 'HIGH';

type Status = {
  id: string;
  name: string;
  order: number;
  _count?: { tasks: number; projects: number };
};

type Task = {
  id: string;
  title: string;
  description?: string;
  priority: Priority;
  statusId: string;
  projectId?: string;
  order: number;
  assignees?: { user: { id: string; name: string; email: string } }[];
  assignedToIds?: string[];
  documents?: { id: string; title: string; author: { name: string }; createdAt: string }[];
};

type Project = {
  id: string;
  title: string;
  description?: string;
  color: string;
  statusId: string;
  order: number;
  tasks: Task[];
  _count?: { tasks: number };
};

const COLORS = [
  { name: 'Purple', value: 'purple' },
  { name: 'Blue', value: 'blue' },
  { name: 'Green', value: 'green' },
  { name: 'Orange', value: 'orange' },
  { name: 'Red', value: 'red' },
  { name: 'Pink', value: 'pink' },
];

const getColorClass = (color: string) => {
  const map: Record<string, string> = {
    purple: '#8b5cf6',
    blue: '#3b82f6',
    green: '#10b981',
    orange: '#f97316',
    red: '#ef4444',
    pink: '#ec4899',
  };
  return map[color] || map.blue;
};

export default function TasksPage() {
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [error, setError] = useState('');
  const [isClient, setIsClient] = useState(false);

  // Dialogs
  const [taskDialog, setTaskDialog] = useState<{
    open: boolean;
    mode: 'create' | 'edit';
    task?: Task;
  }>({ open: false, mode: 'create' });

  const [projectDialog, setProjectDialog] = useState<{
    open: boolean;
    mode: 'create' | 'edit';
    project?: Project;
  }>({ open: false, mode: 'create' });

  const [statusDialog, setStatusDialog] = useState(false);
  const [newStatusName, setNewStatusName] = useState('');

  // Dropdown menus
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [draggedItem, setDraggedItem] = useState<{
    type: 'task' | 'project';
    id: string;
  } | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<string | null>(null);

  useOnceEffect(() => {
    setIsClient(true);
  });

  useOnceEffect(() => {
    loadData();
  });

  useEffect(() => {
    if (!isClient) return;
    try {
      const searchParams = useSearchParams();
      const taskId = searchParams.get('taskId');
      if (taskId) {
        loadTaskWithDocuments(taskId);
      }
    } catch (err) {
      // useSearchParams called outside of 'use client' or in SSR context, ignore
    }
  }, [isClient]);

  async function loadData() {
    try {
      const [statusesData, tasksData, projectsData] = await Promise.all([
        apiFetch('/statuses'),
        apiFetch('/tasks'),
        apiFetch('/projects'),
      ]);
      setStatuses(statusesData);
      setTasks(tasksData);
      setProjects(projectsData);
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function createStatus() {
    if (!newStatusName.trim()) return;
    try {
      await apiFetch('/statuses', {
        method: 'POST',
        body: JSON.stringify({ name: newStatusName }),
      });
      setNewStatusName('');
      setStatusDialog(false);
      loadData();
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function deleteStatus(id: string) {
    try {
      await apiFetch(`/statuses/${id}`, { method: 'DELETE' });
      loadData();
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function loadTaskWithDocuments(taskId: string) {
    try {
      const taskData = await apiFetch(`/tasks/${taskId}`);
      console.log('[loadTaskWithDocuments] Task data:', taskData);
      setTaskDialog({ open: true, mode: 'edit', task: taskData });
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function createOrUpdateTask(data: Partial<Task>) {
    try {
      if (taskDialog.mode === 'edit' && taskDialog.task) {
        await apiFetch(`/tasks/${taskDialog.task.id}`, {
          method: 'PATCH',
          body: JSON.stringify(data),
        });
      } else {
        await apiFetch('/tasks', {
          method: 'POST',
          body: JSON.stringify(data),
        });
      }
      setTaskDialog({ open: false, mode: 'create' });
      loadData();
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function deleteTask(id: string) {
    try {
      await apiFetch(`/tasks/${id}`, { method: 'DELETE' });
      loadData();
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function createOrUpdateProject(data: Partial<Project>) {
    try {
      if (projectDialog.mode === 'edit' && projectDialog.project) {
        await apiFetch(`/projects/${projectDialog.project.id}`, {
          method: 'PATCH',
          body: JSON.stringify(data),
        });
      } else {
        await apiFetch('/projects', {
          method: 'POST',
          body: JSON.stringify(data),
        });
      }
      setProjectDialog({ open: false, mode: 'create' });
      loadData();
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function deleteProject(id: string) {
    try {
      await apiFetch(`/projects/${id}`, { method: 'DELETE' });
      loadData();
    } catch (err: any) {
      setError(err.message);
    }
  }

  function handleDragStart(type: 'task' | 'project', id: string) {
    setDraggedItem({ type, id });
  }

  function handleDragEnd() {
    setDraggedItem(null);
    setDragOverStatus(null);
  }

  async function handleDrop(statusId: string) {
    if (!draggedItem) return;

    try {
      if (draggedItem.type === 'task') {
        await apiFetch(`/tasks/${draggedItem.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ statusId }),
        });
      } else {
        await apiFetch(`/projects/${draggedItem.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ statusId }),
        });
      }
      loadData();
    } catch (err: any) {
      setError(err.message);
    }

    setDraggedItem(null);
    setDragOverStatus(null);
  }

  function toggleProject(id: string) {
    setExpandedProjects((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function getStatusProjects(statusId: string) {
    return projects.filter((p) => p.statusId === statusId);
  }

  function getStatusTasks(statusId: string) {
    return tasks.filter((t) => t.statusId === statusId && !t.projectId);
  }

  function getPriorityBadge(priority: Priority) {
    const styles = {
      LOW: 'bg-blue-600/90 text-white',
      MEDIUM: 'bg-amber-600/90 text-white',
      HIGH: 'bg-red-600/90 text-white',
    };
    const labels = { LOW: 'Baixa', MEDIUM: 'Média', HIGH: 'Alta' };
    return (
      <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${styles[priority]}`}>
        {labels[priority]}
      </span>
    );
  }

  return (
    <ProtectedRoute>
      <InternshipCheck>
        <div className="app-layout">
          <Sidebar />

          <main className="app-main bg-white min-h-screen">
            <div className="max-w-[1400px] mx-auto px-8 py-8">
              {/* Header */}
              <header className="mb-8 flex justify-between items-start">
                <div>
                  <h1 className="text-4xl font-bold text-gray-900">
                    Project Board
                  </h1>
                  <p className="text-gray-500 mt-2">Gerencie suas tarefas e projetos</p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setStatusDialog(true)}
                    className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 font-medium"
                  >
                    + Status
                  </button>
                  <div className="relative">
                    <Button
                      onClick={() => setOpenMenu(openMenu === 'new' ? null : 'new')}
                      className="bg-gray-900 hover:bg-gray-800 flex items-center shadow-sm hover:shadow-md transition-all"
                    >
                      + Novo <ChevronDown className="ml-2 w-4 h-4" />
                    </Button>
                    {openMenu === 'new' && (
                      <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                        <button
                          onClick={() => {
                            setTaskDialog({ open: true, mode: 'create' });
                            setOpenMenu(null);
                          }}
                          className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors font-medium"
                        >
                          Criar Tarefa
                        </button>
                        <button
                          onClick={() => {
                            setProjectDialog({ open: true, mode: 'create' });
                            setOpenMenu(null);
                          }}
                          className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors font-medium border-t border-gray-200"
                        >
                          Criar Projeto
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </header>

              {error && (
                <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm shadow-sm">
                  {error}
                </div>
              )}

              {/* Kanban Board */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {statuses.map((status) => (
                  <div
                    key={status.id}
                    className={`bg-gray-50 rounded-xl p-4 border-2 transition-all duration-200 shadow-sm ${
                      dragOverStatus === status.id 
                        ? 'border-gray-400 shadow-md' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOverStatus(status.id);
                    }}
                    onDragLeave={() => setDragOverStatus(null)}
                    onDrop={() => handleDrop(status.id)}
                  >
                    {/* Column Header */}
                    <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-200">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-8 bg-gray-400 rounded-full"></div>
                        <h3 className="font-bold text-gray-900 text-lg">{status.name}</h3>
                        <span className="text-xs font-semibold text-gray-600 bg-gray-200 px-2.5 py-1 rounded-full">
                          {getStatusTasks(status.id).length + getStatusProjects(status.id).length}
                        </span>
                      </div>
                      <div className="relative">
                        <button
                          onClick={() => setOpenMenu(openMenu === status.id ? null : status.id)}
                          className="p-1 hover:bg-gray-200 rounded transition-colors text-gray-500 hover:text-gray-700"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        {openMenu === status.id && (
                          <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                            <button
                              onClick={() => {
                                deleteStatus(status.id);
                                setOpenMenu(null);
                              }}
                              className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors font-medium"
                            >
                              Deletar
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Projects */}
                    <div className="space-y-3">
                      {getStatusProjects(status.id).map((project) => (
                        <div
                          key={project.id}
                          draggable
                          onDragStart={() => handleDragStart('project', project.id)}
                          onDragEnd={handleDragEnd}
                          className={`bg-white border-l-4 rounded-lg p-3.5 cursor-move hover:shadow-md transition-all duration-150 border border-gray-200 ${
                            draggedItem?.id === project.id ? 'opacity-50' : ''
                          }`}
                          style={{ borderLeftColor: getColorClass(project.color) }}
                        >
                          <div className="flex items-start gap-3">
                            <button
                              onClick={() => toggleProject(project.id)}
                              className="mt-0.5 text-gray-500 hover:text-gray-900 transition-colors"
                            >
                              {expandedProjects.has(project.id) ? (
                                <ChevronDown className="w-5 h-5" />
                              ) : (
                                <ChevronRight className="w-5 h-5" />
                              )}
                            </button>
                            <Folder
                              className="w-5 h-5 mt-0.5 flex-shrink-0"
                              style={{ color: getColorClass(project.color) }}
                            />
                            <div className="flex-1">
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <h4 className="font-bold text-gray-900 text-sm">{project.title}</h4>
                                  {project.description && (
                                    <p className="text-xs text-gray-600 mt-1">{project.description}</p>
                                  )}
                                  <p className="text-xs text-gray-500 mt-2 font-medium">
                                    {project.tasks?.length || 0} {project.tasks?.length === 1 ? 'tarefa' : 'tarefas'}
                                  </p>
                                </div>
                                <div className="relative">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setOpenMenu(openMenu === project.id ? null : project.id);
                                    }}
                                    className="p-1 hover:bg-gray-200 rounded transition-colors text-gray-500 hover:text-gray-700"
                                  >
                                    <MoreHorizontal className="w-4 h-4" />
                                  </button>
                                  {openMenu === project.id && (
                                    <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                                      <button
                                        onClick={() => {
                                          setProjectDialog({ open: true, mode: 'edit', project });
                                          setOpenMenu(null);
                                        }}
                                        className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors font-medium"
                                      >
                                        Editar
                                      </button>
                                      <button
                                        onClick={() => {
                                          deleteProject(project.id);
                                          setOpenMenu(null);
                                        }}
                                        className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors font-medium border-t border-gray-200"
                                      >
                                        Deletar
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Expanded Tasks */}
                              {expandedProjects.has(project.id) && project.tasks.length > 0 && (
                                <div className="mt-3 ml-6 space-y-2 border-l border-gray-300 pl-3">
                                  {project.tasks.map((task) => (
                                    <div
                                      key={task.id}
                                      className="bg-gray-100 rounded p-2.5 text-sm hover:bg-gray-200 transition-colors"
                                    >
                                      <p className="text-gray-900 font-medium">{task.title}</p>
                                      {task.description && (
                                        <p className="text-gray-600 text-xs mt-1">{task.description}</p>
                                      )}
                                      <div className="mt-2">{getPriorityBadge(task.priority)}</div>
                                      {task.documents && task.documents.length > 0 && (
                                        <div className="mt-2 flex flex-wrap gap-2">
                                          {task.documents.map((doc) => (
                                            <a
                                              key={doc.id}
                                              href={`/documents/${doc.id}`}
                                              className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 transition-colors"
                                              title={`Documento: ${doc.title}`}
                                            >
                                              📄 {doc.title}
                                            </a>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}

                      {/* Standalone Tasks */}
                      {getStatusTasks(status.id).map((task) => (
                        <div
                          key={task.id}
                          draggable
                          onDragStart={() => handleDragStart('task', task.id)}
                          onDragEnd={handleDragEnd}
                          className={`bg-white rounded-lg p-3.5 cursor-move hover:shadow-md transition-all duration-150 border border-gray-200 ${
                            draggedItem?.id === task.id ? 'opacity-50' : ''
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className="text-sm font-bold text-gray-900 mb-2">{task.title}</p>
                              {task.description && (
                                <p className="text-xs text-gray-600 mb-2">{task.description}</p>
                              )}
                              {getPriorityBadge(task.priority)}
                              
                              {/* Assignees */}
                              {task.assignees && task.assignees.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-2">
                                  {task.assignees.map((assignee) => (
                                    <span
                                      key={assignee.user.id}
                                      className="text-xs bg-gray-900 text-white px-2 py-1 rounded-full"
                                    >
                                      {assignee.user.name}
                                    </span>
                                  ))}
                                </div>
                              )}

                              {/* Documents */}
                              {task.documents && task.documents.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-2">
                                  {task.documents.map((doc) => (
                                    <a
                                      key={doc.id}
                                      href={`/documents/${doc.id}`}
                                      className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 transition-colors"
                                      title={`Documento: ${doc.title}`}
                                    >
                                      📄 {doc.title}
                                    </a>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div className="relative">
                              <button
                                onClick={() =>
                                  setOpenMenu(openMenu === task.id ? null : task.id)
                                }
                                className="p-1 hover:bg-gray-200 rounded transition-colors text-gray-500 hover:text-gray-700"
                              >
                                <MoreHorizontal className="w-4 h-4" />
                              </button>
                              {openMenu === task.id && (
                                <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                                  <button
                                    onClick={() => {
                                      loadTaskWithDocuments(task.id);
                                      setOpenMenu(null);
                                    }}
                                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors font-medium"
                                  >
                                    Editar
                                  </button>
                                  <button
                                    onClick={() => {
                                      deleteTask(task.id);
                                      setOpenMenu(null);
                                    }}
                                    className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors font-medium border-t border-gray-200"
                                  >
                                    Deletar
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </main>
        </div>

        {/* Task Dialog */}
        {taskDialog.open && (
          <TaskDialog
            mode={taskDialog.mode}
            task={taskDialog.task}
            statuses={statuses}
            projects={projects}
            onClose={() => {
              setTaskDialog({ open: false, mode: 'create' });
              // Clear taskId from URL to prevent re-opening
              const url = new URL(window.location.href);
              if (url.searchParams.has('taskId')) {
                url.searchParams.delete('taskId');
                window.history.replaceState({}, '', url.pathname);
              }
            }}
            onSave={createOrUpdateTask}
          />
        )}

        {/* Project Dialog */}
        {projectDialog.open && (
          <ProjectDialog
            mode={projectDialog.mode}
            project={projectDialog.project}
            statuses={statuses}
            onClose={() => setProjectDialog({ open: false, mode: 'create' })}
            onSave={createOrUpdateProject}
          />
        )}

        {/* Status Dialog */}
        {statusDialog && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white border border-gray-200 rounded-xl p-8 w-96 shadow-lg">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Novo Status</h3>
              <input
                type="text"
                placeholder="ex: Em Revisão, Testando..."
                value={newStatusName}
                onChange={(e) => setNewStatusName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && createStatus()}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent transition-all"
              />
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setStatusDialog(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={createStatus}
                  className="flex-1 px-4 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-all font-medium"
                >
                  Criar
                </button>
              </div>
            </div>
          </div>
        )}
      </InternshipCheck>
    </ProtectedRoute>
  );
}

function ProjectDialog({
  mode,
  project,
  statuses,
  onClose,
  onSave,
}: {
  mode: 'create' | 'edit';
  project?: Project;
  statuses: Status[];
  onClose: () => void;
  onSave: (data: Partial<Project>) => void;
}) {
  const [title, setTitle] = useState(project?.title || '');
  const [description, setDescription] = useState(project?.description || '');
  const [statusId, setStatusId] = useState(project?.statusId || statuses[0]?.id || '');
  const [color, setColor] = useState(project?.color || 'blue');

  function handleSubmit() {
    onSave({ title, description, statusId, color });
  }

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white border border-gray-200 rounded-xl p-8 w-[500px] shadow-lg">
        <h3 className="text-2xl font-bold text-gray-900 mb-6">
          {mode === 'create' ? 'Criar Projeto' : 'Editar Projeto'}
        </h3>
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Título</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Descrição</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent transition-all resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
            <select
              value={statusId}
              onChange={(e) => setStatusId(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent transition-all"
            >
              {statuses.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Cor</label>
            <select
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent transition-all"
            >
              {COLORS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.name}
                </option>
              ))}
            </select>
            <div className="mt-3 flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-lg shadow-md"
                style={{ backgroundColor: getColorClass(color) }}
              />
              <span className="text-sm text-gray-600">Pré-visualização</span>
            </div>
          </div>
        </div>
        <div className="flex gap-3 mt-8">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all font-medium"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 px-4 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-all font-medium"
          >
            {mode === 'create' ? 'Criar' : 'Atualizar'}
          </button>
        </div>
      </div>
    </div>
  );
}
