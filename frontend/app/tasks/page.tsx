'use client';

import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import ProtectedRoute from '@/components/ProtectedRoute';
import InternshipCheck from '@/components/InternshipCheck';
import { apiFetch } from '@/lib/api';

type Task = {
  id: string;
  title: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadTasks();
  }, []);

  async function loadTasks() {
    const data = await apiFetch('/tasks');
    setTasks(data);
  }

  async function createTask() {
    if (!title.trim()) return;

    try {
      setError('');
      await apiFetch('/tasks', {
        method: 'POST',
        body: JSON.stringify({ title }),
      });

      setTitle('');
      loadTasks();
    } catch (err: any) {
      setError(err.message || 'Erro ao criar tarefa');
    }
  }

  async function updateStatus(id: string, status: Task['status']) {
    try {
      setError('');
      await apiFetch(`/tasks/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });

      loadTasks();
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar tarefa');
    }
  }

  function renderKanbanColumn(status: Task['status'], label: string, color: string) {
    const filtered = tasks.filter((t) => t.status === status);
    const count = filtered.length;

    return (
      <div className="kanban-column">
        <div className="kanban-header">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${color}`}></div>
            <h3 className="font-semibold text-gray-900">{label}</h3>
          </div>
          <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
            {count}
          </span>
        </div>

        <div className="space-y-3">
          {filtered.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">Sem tarefas</p>
          ) : (
            filtered.map((task) => (
              <div key={task.id} className="kanban-card">
                <p className="text-sm font-medium text-gray-900 mb-3">{task.title}</p>
                <select
                  value={task.status}
                  onChange={(e) => updateStatus(task.id, e.target.value as Task['status'])}
                  className="w-full px-3 py-1.5 border border-gray-200 rounded-md text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
                >
                  <option value="TODO">A Fazer</option>
                  <option value="IN_PROGRESS">Em Progresso</option>
                  <option value="DONE">Concluído</option>
                </select>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <InternshipCheck>
        <div className="app-layout">
          <Sidebar />

          <main className="app-main">
            <div className="max-w-7xl mx-auto px-8 py-8">
              {/* Header */}
              <header className="mb-8">
                <h1 className="text-3xl font-semibold text-gray-900">Tarefas</h1>
                <p className="text-gray-500 mt-1">Organiza e acompanha o teu trabalho</p>
              </header>

              {/* Create Task */}
              {error && (
                <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div className="mb-8 flex gap-3 bg-white p-4 rounded-lg border border-gray-200">
                <Input
                  type="text"
                  placeholder="Nova tarefa..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && createTask()}
                  className="flex-1"
                />
                <Button onClick={createTask}>Adicionar</Button>
              </div>

              {/* Kanban Board */}
              <div className="kanban-container">
                {renderKanbanColumn('TODO', 'A Fazer', 'bg-gray-400')}
                {renderKanbanColumn('IN_PROGRESS', 'Em Progresso', 'bg-blue-500')}
                {renderKanbanColumn('DONE', 'Concluído', 'bg-green-500')}
              </div>
            </div>
          </main>
        </div>
      </InternshipCheck>
    </ProtectedRoute>
  );
}
