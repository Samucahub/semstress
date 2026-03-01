'use client';

import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import ProtectedRoute from '@/components/ProtectedRoute';
import { apiFetch } from '@/lib/api';
import { getCurrentUserId } from '@/lib/auth';
import { useOnceEffect } from '@/lib/hooks';

type User = {
  id: string;
  name: string;
  username: string;
  email: string;
  role: 'USER' | 'ADMIN';
  createdAt: string;
  emailVerified: boolean;
  status?: 'verified' | 'pending';
};

type DashboardStats = {
  totalUsers: number;
  totalTasks: number;
  totalTimeEntries: number;
  totalProjects: number;
  adminUsers: number;
  regularUsers: number;
  newUsersThisWeek: number;
  newTasksThisWeek: number;
  timeEntriesThisWeek: number;
  totalTimeSpent: number;
};

type Activity = {
  id: string;
  action: string;
  entityType: string;
  entityId?: string;
  details?: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    username: string;
  };
};

type ConfirmDialogState = {
  isOpen: boolean;
  userId?: string;
  userName?: string;
};

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'activities'>('overview');
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>({ isOpen: false });
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    setCurrentUserId(getCurrentUserId());
  }, []);

  useOnceEffect(() => {
    loadData();
  });

  async function loadData() {
    try {
      setLoading(true);
      setError('');
      const [statsData, usersData, activitiesData] = await Promise.all([
        apiFetch('/admin/dashboard/stats'),
        apiFetch('/admin/users'),
        apiFetch('/admin/activities?limit=30'),
      ]);
      setStats(statsData);
      setUsers(usersData);
      setActivities(activitiesData);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  }

  async function updateRole(userId: string, role: User['role']) {
    try {
      setError('');
      setLoading(true);
      await apiFetch(`/admin/users/${userId}`, {
        method: 'PATCH',
        body: JSON.stringify({ role }),
      });
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar role');
    } finally {
      setLoading(false);
    }
  }

  function openDeleteConfirm(userId: string, userName: string) {
    setConfirmDialog({ isOpen: true, userId, userName });
  }

  function closeDeleteConfirm() {
    setConfirmDialog({ isOpen: false });
  }

  async function confirmDelete() {
    if (!confirmDialog.userId) return;

    try {
      setError('');
      setLoading(true);
      await apiFetch(`/admin/users/${confirmDialog.userId}`, {
        method: 'DELETE',
        body: JSON.stringify({ confirmed: true }),
      });
      closeDeleteConfirm();
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Erro ao remover utilizador');
    } finally {
      setLoading(false);
    }
  }

  const formatTimeSpent = (milliseconds: number) => {
    const hours = Math.floor(milliseconds / 3600000);
    const minutes = Math.floor((milliseconds % 3600000) / 60000);
    return `${hours}h ${minutes}m`;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-PT', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const StatCard = ({ label, value, change }: { label: string; value: number | string; change?: number }) => (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <p className="text-gray-600 text-sm">{label}</p>
      <p className="text-2xl font-bold mt-2">{value}</p>
      {change !== undefined && change !== 0 && (
        <p className={`text-xs mt-1 ${change > 0 ? 'text-green-600' : 'text-red-600'}`}>
          {change > 0 ? '↑' : '↓'} {Math.abs(change)} esta semana
        </p>
      )}
    </div>
  );

  return (
    <ProtectedRoute>
      <div className="app-layout">
        <Sidebar />

        <main className="app-main">
          <div className="max-w-7xl mx-auto px-8 py-8 space-y-6">
            <header>
              <h1 className="text-3xl font-semibold">Painel Admin</h1>
              <p className="text-gray-500 mt-1">Monitorização e gestão do sistema</p>
            </header>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded text-sm">
                {error}
              </div>
            )}

            {/* Abas */}
            <div className="flex gap-2 border-b">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-4 py-2 font-medium border-b-2 ${
                  activeTab === 'overview'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`px-4 py-2 font-medium border-b-2 ${
                  activeTab === 'users'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                Utilizadores ({users.length})
              </button>
              <button
                onClick={() => setActiveTab('activities')}
                className={`px-4 py-2 font-medium border-b-2 ${
                  activeTab === 'activities'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                Atividades
              </button>
            </div>

            {/* TAB: OVERVIEW */}
            {activeTab === 'overview' && stats && (
              <div className="space-y-6">
                {/* Botão de backup da base de dados */}
                <div className="flex justify-end">
                  <button
                    onClick={async () => {
                      try {
                        const result = await apiFetch('/admin/backup');
                        if (result.file && result.filename) {
                          const link = document.createElement('a');
                          link.href = `data:${result.mimetype};base64,${result.file}`;
                          link.download = result.filename;
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        } else {
                          alert('Falha ao gerar backup.');
                        }
                      } catch (err: any) {
                        alert('Erro ao baixar backup: ' + (err.message || ''));
                      }
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg mb-4 shadow"
                  >
                    Fazer backup da base de dados
                  </button>
                </div>
                {/* Grid de Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard label="Total de Utilizadores" value={stats.totalUsers} change={stats.newUsersThisWeek} />
                  <StatCard label="Admins" value={stats.adminUsers} />
                  <StatCard label="Utilizadores" value={stats.regularUsers} />
                  <StatCard label="Total de Projetos" value={stats.totalProjects} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard label="Total de Tarefas" value={stats.totalTasks} change={stats.newTasksThisWeek} />
                  <StatCard label="Time Entries" value={stats.totalTimeEntries} change={stats.timeEntriesThisWeek} />
                  <StatCard label="Tempo Total Registado" value={formatTimeSpent(stats.totalTimeSpent)} />
                  <StatCard label="Média por Utilizador" value={stats.totalUsers > 0 ? (stats.totalTimeSpent / stats.totalUsers / 3600000).toFixed(1) + 'h' : '0h'} />
                </div>

                {/* Últimas Atividades */}
                <Card>
                  <div className="space-y-4">
                    <h2 className="text-lg font-semibold">Últimas Atividades</h2>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {activities.slice(0, 20).map((activity) => (
                        <div
                          key={activity.id}
                          className="flex items-start justify-between p-3 bg-gray-50 rounded border border-gray-200 text-sm"
                        >
                          <div className="flex-1">
                            <p className="font-medium">
                              <span className="text-blue-600">@{activity.user.username}</span>
                              {' → '}
                              <span className="text-gray-700">{activity.action}</span>
                            </p>
                            <p className="text-gray-600 text-xs mt-1">
                              {activity.entityType}
                              {activity.entityId && ` • ID: ${activity.entityId}`}
                            </p>
                          </div>
                          <p className="text-gray-500 text-xs whitespace-nowrap ml-4">
                            {formatDate(activity.createdAt)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {/* TAB: UTILIZADORES */}
            {activeTab === 'users' && (
              <Card>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-left bg-gray-50 border-b">
                      <tr>
                        <th className="py-3 px-4">Nome</th>
                        <th className="py-3 px-4">Username</th>
                        <th className="py-3 px-4">Email</th>
                        <th className="py-3 px-4">Role</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Criado</th>
                        <th className="py-3 px-4"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => (
                        <tr key={u.id} className="border-b last:border-0 hover:bg-gray-50">
                          <td className="py-3 px-4">{u.name}</td>
                          <td className="py-3 px-4 font-mono text-xs text-gray-600">@{u.username}</td>
                          <td className="py-3 px-4">{u.email}</td>
                          <td className="py-3 px-4">
                            {u.status === 'pending' ? (
                              <span className="text-gray-500 text-xs">-</span>
                            ) : (
                              <select
                                value={u.role}
                                disabled={loading}
                                onChange={(e) => updateRole(u.id, e.target.value as User['role'])}
                                className="border rounded px-2 py-1 text-sm"
                              >
                                <option value="USER">USER</option>
                                <option value="ADMIN">ADMIN</option>
                              </select>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`text-xs px-2 py-1 rounded ${
                                u.status === 'pending'
                                  ? 'bg-yellow-100 text-yellow-700'
                                  : u.emailVerified
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-orange-100 text-orange-700'
                              }`}
                            >
                              {u.status === 'pending' ? 'Pendente' : u.emailVerified ? 'Verificado' : 'Não Verificado'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-gray-600">
                            {new Date(u.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4 text-right">
                            {u.id !== currentUserId && u.status !== 'pending' ? (
                              <Button
                                onClick={() => openDeleteConfirm(u.id, u.username)}
                                className="bg-red-600 hover:bg-red-700 text-sm"
                                disabled={loading}
                              >
                                Remover
                              </Button>
                            ) : u.id === currentUserId ? (
                              <span className="text-xs text-gray-500 italic">Sua conta</span>
                            ) : (
                              <span className="text-xs text-gray-400 italic">Pendente</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}

            {/* TAB: ATIVIDADES */}
            {activeTab === 'activities' && (
              <Card>
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold">Histórico de Atividades</h2>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {activities.map((activity) => (
                      <div
                        key={activity.id}
                        className="flex items-start justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded font-medium">
                              {activity.action}
                            </span>
                            <span className="text-gray-600 text-sm">{activity.entityType}</span>
                            {activity.entityId && (
                              <span className="text-gray-500 text-xs font-mono">#{activity.entityId.slice(0, 8)}</span>
                            )}
                          </div>
                          <p className="text-gray-900 font-medium">@{activity.user.username}</p>
                          {activity.details && <p className="text-gray-600 text-sm mt-1">{activity.details}</p>}
                          <p className="text-gray-500 text-xs mt-2">{formatDate(activity.createdAt)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            )}
          </div>
        </main>
      </div>

      {/* Modal de Confirmação */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md p-6">
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Confirmar Eliminação</h2>
              <p className="text-gray-700">
                Tens a certeza que queres eliminar o utilizador <strong>@{confirmDialog.userName}</strong>?
              </p>
              <p className="text-sm text-gray-500">
                Esta ação é irreversível e irá apagar todos os dados associados.
              </p>
              <div className="flex gap-3 justify-end pt-4">
                <Button
                  onClick={closeDeleteConfirm}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800"
                  disabled={loading}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={confirmDelete}
                  className="bg-red-600 hover:bg-red-700"
                  disabled={loading}
                >
                  {loading ? 'A eliminar...' : 'Eliminar'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
}

