'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import Button from '@/components/ui/Button';
import ProtectedRoute from '@/components/ProtectedRoute';
import InternshipCheck from '@/components/InternshipCheck';
import { apiFetch } from '@/lib/api';
import { useOnceEffect } from '@/lib/hooks';
import {
  ChevronDown,
  ChevronRight,
  MoreHorizontal,
  MoreVertical,
  Folder,
  FileText,
} from 'lucide-react';

type Status = {
  id: string;
  name: string;
  order: number;
  _count?: { tasks: number };
};

type TaskDocument = {
  id: string;
  title: string;
  author: { id: string; name: string; username: string };
};

type Task = {
  id: string;
  title: string;
  description?: string;
  statusId: string;
  order: number;
  documents?: TaskDocument[];
};

export default function SimpleTasksPage() {
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [error, setError] = useState('');
  const [isClient, setIsClient] = useState(false);

  const [taskDialog, setTaskDialog] = useState<{
    open: boolean;
    mode: 'create' | 'edit';
    task?: Task;
  }>({ open: false, mode: 'create' });

  const [statusDialog, setStatusDialog] = useState(false);
  const [newStatusName, setNewStatusName] = useState('');

  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<string | null>(null);
  const [draggedStatusId, setDraggedStatusId] = useState<string | null>(null);
  const [dragOverColumnId, setDragOverColumnId] = useState<string | null>(null);

  // Mark component as client-side mounted
  useOnceEffect(() => {
    setIsClient(true);
  });

  useOnceEffect(() => {
    loadData();
  });

  // Auto-open task dialog from URL param (only on client)
  useEffect(() => {
    if (!isClient) return;
    try {
      const searchParams = useSearchParams();
      const taskId = searchParams.get('taskId');
      if (taskId && tasks.length > 0) {
        const task = tasks.find((t) => t.id === taskId);
        if (task) {
          setTaskDialog({ open: true, mode: 'edit', task });
        }
      }
    } catch (err) {
      // useSearchParams called outside of 'use client' or in SSR context, ignore
    }
  }, [tasks, isClient]);

  async function loadData() {
    try {
      const [statusesData, tasksData] = await Promise.all([
        apiFetch('/statuses'),
        apiFetch('/tasks'),
      ]);
      // Filter only simple tasks (no projectId)
      const simpleTasks = tasksData.filter((t: any) => !t.projectId);
      setStatuses(statusesData);
      setTasks(simpleTasks);
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

  function handleDragStart(id: string) {
    setDraggedItem(id);
  }

  function handleDragEnd() {
    setDraggedItem(null);
    setDragOverStatus(null);
  }

  function handleStatusDragStart(id: string, event?: React.DragEvent<HTMLDivElement>) {
    if (event?.dataTransfer) {
      event.dataTransfer.setData('text/plain', id);
      event.dataTransfer.effectAllowed = 'move';
    }
    setDraggedStatusId(id);
  }

  function handleStatusDragEnd() {
    setDraggedStatusId(null);
    setDragOverColumnId(null);
  }

  async function handleStatusDrop(targetId: string) {
    if (!draggedStatusId || draggedStatusId === targetId) {
      handleStatusDragEnd();
      return;
    }

    const current = [...statuses];
    const fromIndex = current.findIndex((s) => s.id === draggedStatusId);
    const toIndex = current.findIndex((s) => s.id === targetId);

    if (fromIndex === -1 || toIndex === -1) {
      handleStatusDragEnd();
      return;
    }

    const next = [...current];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);

    setStatuses(next);
    handleStatusDragEnd();

    try {
      await apiFetch('/statuses/reorder', {
        method: 'PATCH',
        body: JSON.stringify({ statusIds: next.map((s) => s.id) }),
      });
    } catch (err: any) {
      setError(err.message || 'Erro ao ordenar status');
      loadData();
    }
  }

  async function handleDrop(statusId: string) {
    if (draggedStatusId) return;
    if (!draggedItem) return;

    try {
      await apiFetch(`/tasks/${draggedItem}`, {
        method: 'PATCH',
        body: JSON.stringify({ statusId }),
      });
      loadData();
    } catch (err: any) {
      setError(err.message);
    }

    setDraggedItem(null);
    setDragOverStatus(null);
  }

  function getStatusTasks(statusId: string) {
    return tasks.filter((t) => t.statusId === statusId);
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
                  <h1 className="text-4xl font-bold text-gray-900">Tarefas Simples</h1>
                  <p className="text-gray-500 mt-2">Gerencie suas tarefas do dia a dia</p>
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
                      onClick={() => setTaskDialog({ open: true, mode: 'create' })}
                      className="bg-gray-900 hover:bg-gray-800 flex items-center shadow-sm hover:shadow-md transition-all"
                    >
                      + Nova Tarefa
                    </Button>
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
                      dragOverStatus === status.id || dragOverColumnId === status.id
                        ? 'border-gray-400 shadow-md' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onDragOver={(e) => {
                      e.preventDefault();
                      if (draggedStatusId) {
                        setDragOverColumnId(status.id);
                      } else {
                        setDragOverStatus(status.id);
                      }
                    }}
                    onDragLeave={() => {
                      if (draggedStatusId) {
                        setDragOverColumnId(null);
                      } else {
                        setDragOverStatus(null);
                      }
                    }}
                    onDrop={() => {
                      if (draggedStatusId) {
                        handleStatusDrop(status.id);
                      } else {
                        handleDrop(status.id);
                      }
                    }}
                  >
                    {/* Column Header */}
                    <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-200">
                      <div className="flex items-center gap-2">
                        <div
                          className="p-1 rounded text-gray-400 hover:text-gray-600 cursor-move"
                          draggable
                          onDragStart={(event) => handleStatusDragStart(status.id, event)}
                          onDragEnd={handleStatusDragEnd}
                          title="Arraste para ordenar"
                        >
                          <div className="grid grid-cols-2 gap-0.5 w-4 h-4">
                            {Array.from({ length: 6 }).map((_, index) => (
                              <span
                                key={index}
                                className="w-1 h-1 rounded-full bg-current"
                              />
                            ))}
                          </div>
                        </div>
                        <div className="w-2 h-8 bg-gray-400 rounded-full"></div>
                        <h3 className="font-bold text-gray-900 text-lg">{status.name}</h3>
                        <span className="text-xs font-semibold text-gray-600 bg-gray-200 px-2.5 py-1 rounded-full">
                          {getStatusTasks(status.id).length}
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

                    {/* Tasks */}
                    <div className="space-y-3">
                      {getStatusTasks(status.id).map((task) => (
                        <div
                          key={task.id}
                          draggable
                          onDragStart={() => handleDragStart(task.id)}
                          onDragEnd={handleDragEnd}
                          className={`bg-white rounded-lg p-3.5 cursor-move hover:shadow-md transition-all duration-150 border border-gray-200 ${
                            draggedItem === task.id ? 'opacity-50' : ''
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className="text-sm font-bold text-gray-900 mb-2">{task.title}</p>
                              {task.description && (
                                <p className="text-xs text-gray-600 mb-2">{task.description}</p>
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
                                      setTaskDialog({ open: true, mode: 'edit', task });
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
                          {/* Documents */}
                          {task.documents && task.documents.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {task.documents.map((doc) => (
                                <Link
                                  key={doc.id}
                                  href={`/documents/${doc.id}`}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs hover:bg-blue-100 transition-colors"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <FileText className="w-3 h-3" />
                                  {doc.title}
                                </Link>
                              ))}
                            </div>
                          )}
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

function TaskDialog({
  mode,
  task,
  statuses,
  onClose,
  onSave,
}: {
  mode: 'create' | 'edit';
  task?: Task;
  statuses: Status[];
  onClose: () => void;
  onSave: (data: Partial<Task>) => void;
}) {
  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [statusId, setStatusId] = useState(task?.statusId || statuses[0]?.id || '');

  function handleSubmit() {
    onSave({ title, description, statusId });
  }

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white border border-gray-200 rounded-xl p-8 w-[500px] shadow-lg">
        <h3 className="text-2xl font-bold text-gray-900 mb-6">
          {mode === 'create' ? 'Criar Tarefa' : 'Editar Tarefa'}
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
