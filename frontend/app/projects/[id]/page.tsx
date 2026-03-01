'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Button from '@/components/ui/Button';
import ProtectedRoute from '@/components/ProtectedRoute';
import InternshipCheck from '@/components/InternshipCheck';
import { apiFetch } from '@/lib/api';
import { useOnceEffect } from '@/lib/hooks';
import {
  MoreHorizontal,
  MoreVertical,
  GripVertical,
  ArrowLeft,
} from 'lucide-react';

type Priority = 'LOW' | 'MEDIUM' | 'HIGH';

type Status = {
  id: string;
  name: string;
  order: number;
  _count?: { tasks: number };
};

type Task = {
  id: string;
  title: string;
  description?: string;
  priority?: Priority;
  statusId: string;
  order: number;
  dueDate?: string;
  startDate?: string;
  assignees?: { user: { id: string; name: string; email: string } }[];
  assignedToIds?: string[];
  documents?: { id: string; title: string; author: { name: string }; createdAt: string }[];
};

type ProjectMember = {
  id: string;
  userId: string;
  user: { id: string; name: string; email: string };
  role: 'OWNER' | 'EDITOR' | 'VIEWER';
};

type Project = {
  id: string;
  title: string;
  description?: string;
  color: string;
  user: { id: string; name: string; email: string };
  userRole?: 'OWNER' | 'EDITOR' | 'VIEWER';
};

type LeadershipTransfer = {
  id: string;
  project: { id: string; title: string };
  fromUser: { id: string; name: string; email: string };
};

export default function ProjectDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const [isClient, setIsClient] = useState(false);

  const [project, setProject] = useState<Project | null>(null);
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [memberEmail, setMemberEmail] = useState('');
  const [memberRole, setMemberRole] = useState<'EDITOR' | 'VIEWER'>('EDITOR');
  const [memberActionError, setMemberActionError] = useState('');
  const [leadershipTargetId, setLeadershipTargetId] = useState('');
  const [pendingLeadershipTransfers, setPendingLeadershipTransfers] = useState<LeadershipTransfer[]>([]);
  const [userSuggestions, setUserSuggestions] = useState<{ id: string; name: string; email: string }[]>([]);
  const [showUserSuggestions, setShowUserSuggestions] = useState(false);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
  const [detailedTaskDialog, setDetailedTaskDialog] = useState<{
    open: boolean;
    task?: Task;
  }>({ open: false });

  useEffect(() => {
    loadData();
  }, [projectId]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;
    try {
      const searchParams = useSearchParams();
      const taskId = searchParams.get('taskId');
      if (!taskId || tasks.length === 0) return;
      if (detailedTaskDialog.open && detailedTaskDialog.task?.id === taskId) return;
      const task = tasks.find((t) => t.id === taskId);
      if (task) {
        setDetailedTaskDialog({ open: true, task });
      }
    } catch (err) {
      // useSearchParams called outside of 'use client' or in SSR context, ignore
    }
  }, [tasks, detailedTaskDialog.open, detailedTaskDialog.task?.id, isClient]);

  async function loadData() {
    try {
      setLoading(true);
      const [projectData, statusesData, tasksData, membersData, transfersData] = await Promise.all([
        apiFetch(`/projects/collaborative/${projectId}`),
        apiFetch(`/projects/${projectId}/statuses`),
        apiFetch(`/tasks/projects/${projectId}`),
        apiFetch(`/projects/${projectId}/members`),
        apiFetch('/projects/leadership-transfers/pending'),
      ]);
      setProject(projectData);
      const enrichedStatuses = statusesData.map((status: Status) => ({
        ...status,
        _count: { tasks: tasksData.filter((t: Task) => t.statusId === status.id).length },
      }));
      setStatuses(enrichedStatuses);
      setTasks(tasksData);
      setMembers(membersData);
      setPendingLeadershipTransfers(
        (transfersData as LeadershipTransfer[]).filter((transfer) => transfer.project.id === projectId),
      );
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function createStatus() {
    if (!newStatusName.trim()) return;
    try {
      await apiFetch(`/projects/${projectId}/statuses`, {
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
      await apiFetch(`/projects/${projectId}/statuses/${id}`, { method: 'DELETE' });
      loadData();
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function createOrUpdateTask(data: Partial<Task>) {
    try {
      if (!data.statusId) {
        setError('Status é obrigatório.');
        return;
      }
      if (taskDialog.mode === 'edit' && taskDialog.task) {
        await apiFetch(`/tasks/projects/${projectId}/${taskDialog.task.id}`, {
          method: 'PATCH',
          body: JSON.stringify(data),
        });
      } else {
        await apiFetch(`/tasks/projects/${projectId}`, {
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
      await apiFetch(`/tasks/projects/${projectId}/${id}`, { method: 'DELETE' });
      loadData();
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function inviteMember() {
    if (!memberEmail.trim()) return;
    try {
      setMemberActionError('');
      await apiFetch(`/projects/${projectId}/invite`, {
        method: 'POST',
        body: JSON.stringify({ email: memberEmail.trim(), role: memberRole, projectId }),
      });
      setMemberEmail('');
      setMemberRole('EDITOR');
      loadData();
    } catch (err: any) {
      setMemberActionError(err.message);
    }
  }

  async function updateMemberRole(memberId: string, role: 'EDITOR' | 'VIEWER') {
    try {
      setMemberActionError('');
      await apiFetch(`/projects/${projectId}/members/${memberId}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role }),
      });
      loadData();
    } catch (err: any) {
      setMemberActionError(err.message);
    }
  }

  async function removeMember(memberId: string) {
    try {
      setMemberActionError('');
      await apiFetch(`/projects/${projectId}/members/${memberId}`, { method: 'DELETE' });
      loadData();
    } catch (err: any) {
      setMemberActionError(err.message);
    }
  }

  async function requestLeadershipTransfer() {
    if (!leadershipTargetId) return;
    try {
      setMemberActionError('');
      await apiFetch(`/projects/${projectId}/leadership-transfer`, {
        method: 'POST',
        body: JSON.stringify({ toUserId: leadershipTargetId }),
      });
      setLeadershipTargetId('');
      loadData();
    } catch (err: any) {
      setMemberActionError(err.message);
    }
  }

  async function respondLeadershipTransfer(transferId: string, status: 'ACCEPTED' | 'DECLINED') {
    try {
      setMemberActionError('');
      await apiFetch('/projects/leadership-transfers/respond', {
        method: 'POST',
        body: JSON.stringify({ transferId, status }),
      });
      loadData();
    } catch (err: any) {
      setMemberActionError(err.message);
    }
  }

  async function searchUsers(query: string) {
    if (!query || query.length < 2) {
      setUserSuggestions([]);
      setShowUserSuggestions(false);
      return;
    }

    setSuggestionsLoading(true);
    try {
      const results = await apiFetch(`/users/search?q=${encodeURIComponent(query)}`);
      setUserSuggestions(results);
      setShowUserSuggestions(true);
    } catch (err) {
      setUserSuggestions([]);
    } finally {
      setSuggestionsLoading(false);
    }
  }

  function handleMemberEmailChange(value: string) {
    setMemberEmail(value);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      searchUsers(value);
    }, 300);
  }

  function selectUserSuggestion(user: { id: string; name: string; email: string }) {
    setMemberEmail(user.email);
    setShowUserSuggestions(false);
    setUserSuggestions([]);
  }

  function handleDragStart(id: string) {
    setDraggedItem(id);
  }

  function handleDragEnd() {
    setDraggedItem(null);
    setDragOverStatus(null);
  }

  function handleStatusDragStart(id: string) {
    if (!canEditTasks) return;
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

    if (!canEditTasks) {
      setError('Não tem permissão para ordenar status.');
      handleStatusDragEnd();
      setTimeout(() => setError(''), 4000);
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
      await apiFetch(`/projects/${projectId}/statuses/reorder`, {
        method: 'PATCH',
        body: JSON.stringify({ statusIds: next.map((s) => s.id) }),
      });
    } catch (err: any) {
      setError(err.message || 'Erro ao ordenar status');
      loadData();
    }
  }

  async function handleDrop(statusId: string) {
    if (draggedStatusId) {
      return;
    }
    if (!draggedItem) return;

    if (!canEditTasks) {
      setError('Não tem permissão para mover tarefas. Apenas editores e líderes podem fazê-lo.');
      setDraggedItem(null);
      setDragOverStatus(null);
      setTimeout(() => setError(''), 4000);
      return;
    }

    try {
      await apiFetch(`/tasks/projects/${projectId}/${draggedItem}`, {
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

  function getPriorityBadge(priority?: Priority) {
    if (!priority) return null;
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

  const isLeader = project?.userRole === 'OWNER';
  const canEditTasks = project?.userRole === 'OWNER' || project?.userRole === 'EDITOR';

  if (loading) {
    return (
      <ProtectedRoute>
        <InternshipCheck>
          <div className="app-layout">
            <Sidebar />
            <main className="app-main bg-white min-h-screen flex items-center justify-center">
              <div className="text-gray-600">Carregando projeto...</div>
            </main>
          </div>
        </InternshipCheck>
      </ProtectedRoute>
    );
  }

  if (!project) {
    return (
      <ProtectedRoute>
        <InternshipCheck>
          <div className="app-layout">
            <Sidebar />
            <main className="app-main bg-white min-h-screen flex items-center justify-center">
              <div className="text-gray-600">Projeto não encontrado</div>
            </main>
          </div>
        </InternshipCheck>
      </ProtectedRoute>
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
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => router.push('/projects')}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5 text-gray-600" />
                  </button>
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <div
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: project.color }}
                      ></div>
                      <h1 className="text-4xl font-bold text-gray-900">{project.title}</h1>
                    </div>
                    {project.description && (
                      <p className="text-gray-500">{project.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-3">
                  {canEditTasks && (
                    <button
                      onClick={() => setStatusDialog(true)}
                      className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 font-medium"
                    >
                      + Status
                    </button>
                  )}
                  {canEditTasks && (
                    <Button
                      onClick={() =>
                        statuses.length === 0
                          ? setError('Crie um status antes de criar tarefas.')
                          : setTaskDialog({ open: true, mode: 'create' })
                      }
                      className="bg-gray-900 hover:bg-gray-800 flex items-center shadow-sm hover:shadow-md transition-all"
                    >
                      + Nova Tarefa
                    </Button>
                  )}
                </div>
              </header>

              {/* Members & Leadership */}
              <section className="mb-8 bg-gray-50 border border-gray-200 rounded-xl p-6">
                <div className="flex flex-col gap-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Equipa do Projeto</h2>
                      <p className="text-sm text-gray-600 mt-1">
                        Líder: <span className="font-semibold text-gray-900">{project.user.name}</span>{' '}
                        <span className="text-gray-500">({project.user.email})</span>
                      </p>
                    </div>
                    {isLeader && (
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-900 text-white">
                        Você é o líder
                      </span>
                    )}
                  </div>

                  {memberActionError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm">
                      {memberActionError}
                    </div>
                  )}

                  {pendingLeadershipTransfers.length > 0 && (
                    <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg text-sm">
                      <div className="font-semibold">Pedido de liderança pendente</div>
                      {pendingLeadershipTransfers.map((transfer) => (
                        <div key={transfer.id} className="mt-3 flex items-center justify-between gap-3">
                          <div>
                            {transfer.fromUser.name} ({transfer.fromUser.email}) quer transferir a liderança.
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => respondLeadershipTransfer(transfer.id, 'DECLINED')}
                              className="px-3 py-1.5 text-xs rounded-lg border border-amber-300 text-amber-800 hover:bg-amber-100"
                            >
                              Recusar
                            </button>
                            <button
                              onClick={() => respondLeadershipTransfer(transfer.id, 'ACCEPTED')}
                              className="px-3 py-1.5 text-xs rounded-lg bg-amber-600 text-white hover:bg-amber-700"
                            >
                              Aceitar liderança
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {members.map((member) => {
                      const isOwner = member.userId === project.user.id || member.role === 'OWNER';
                      return (
                        <div
                          key={member.id}
                          className="bg-white border border-gray-200 rounded-lg p-4 flex items-start justify-between gap-3"
                        >
                          <div>
                            <div className="font-semibold text-gray-900">{member.user.name}</div>
                            <div className="text-xs text-gray-500">{member.user.email}</div>
                            <div className="mt-2 text-xs">
                              {isOwner ? (
                                <span className="px-2 py-1 rounded-full bg-gray-900 text-white">Líder</span>
                              ) : (
                                <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                                  {member.role === 'EDITOR' ? 'Editor' : 'Leitor'}
                                </span>
                              )}
                            </div>
                          </div>

                          {isLeader && !isOwner && (
                            <div className="flex flex-col gap-2 items-end">
                              <select
                                value={member.role}
                                onChange={(e) => updateMemberRole(member.userId, e.target.value as 'EDITOR' | 'VIEWER')}
                                className="text-xs px-2 py-1 border border-gray-300 rounded-lg bg-white"
                              >
                                <option value="EDITOR">Editor</option>
                                <option value="VIEWER">Leitor</option>
                              </select>
                              <button
                                onClick={() => removeMember(member.userId)}
                                className="text-xs text-red-600 hover:text-red-700"
                              >
                                Remover
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {isLeader && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <h3 className="text-sm font-semibold text-gray-900 mb-3">Adicionar membro</h3>
                        <div className="flex flex-col gap-3">
                          <div className="relative">
                            <input
                              type="email"
                              value={memberEmail}
                              onChange={(e) => handleMemberEmailChange(e.target.value)}
                              onFocus={() => memberEmail.length >= 2 && setShowUserSuggestions(true)}
                              placeholder="Pesquise por nome ou email"
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-400"
                            />
                            
                            {showUserSuggestions && (
                              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-20 max-h-48 overflow-y-auto">
                                {suggestionsLoading ? (
                                  <div className="px-4 py-3 text-xs text-gray-500">Carregando...</div>
                                ) : userSuggestions.length > 0 ? (
                                  userSuggestions.map((user) => (
                                    <button
                                      key={user.id}
                                      type="button"
                                      onClick={() => selectUserSuggestion(user)}
                                      className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
                                    >
                                      <div className="font-medium text-sm text-gray-900">{user.name}</div>
                                      <div className="text-xs text-gray-500">{user.email}</div>
                                    </button>
                                  ))
                                ) : (
                                  <div className="px-4 py-3 text-xs text-gray-500">Nenhum utilizador encontrado</div>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="flex gap-3">
                            <select
                              value={memberRole}
                              onChange={(e) => setMemberRole(e.target.value as 'EDITOR' | 'VIEWER')}
                              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white"
                            >
                              <option value="EDITOR">Editor</option>
                              <option value="VIEWER">Leitor</option>
                            </select>
                            <button
                              onClick={inviteMember}
                              className="px-4 py-2 text-sm rounded-lg bg-gray-900 text-white hover:bg-gray-800"
                            >
                              Convidar
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <h3 className="text-sm font-semibold text-gray-900 mb-3">Transferir liderança</h3>
                        <div className="flex gap-3">
                          <select
                            value={leadershipTargetId}
                            onChange={(e) => setLeadershipTargetId(e.target.value)}
                            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white"
                          >
                            <option value="">Selecione um membro</option>
                            {members
                              .filter((member) => member.userId !== project.user.id)
                              .map((member) => (
                                <option key={member.id} value={member.userId}>
                                  {member.user.name} ({member.user.email})
                                </option>
                              ))}
                          </select>
                          <button
                            onClick={requestLeadershipTransfer}
                            className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                          >
                            Solicitar
                          </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          O membro precisa aceitar o convite para se tornar líder.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </section>

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
                        {canEditTasks && (
                          <div
                            className="p-1 rounded text-gray-400 hover:text-gray-600 cursor-move"
                            draggable
                            onDragStart={() => handleStatusDragStart(status.id)}
                            onDragEnd={handleStatusDragEnd}
                          >
                            <GripVertical className="w-4 h-4" />
                          </div>
                        )}
                        <div className="w-2 h-8 bg-gray-400 rounded-full"></div>
                        <h3 className="font-bold text-gray-900 text-lg">{status.name}</h3>
                        <span className="text-xs font-semibold text-gray-600 bg-gray-200 px-2.5 py-1 rounded-full">
                          {status._count?.tasks || 0}
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
                          draggable={canEditTasks}
                          onDragStart={() => canEditTasks && handleDragStart(task.id)}
                          onDragEnd={handleDragEnd}
                          onDoubleClick={() => setDetailedTaskDialog({ open: true, task })}
                          className={`bg-white rounded-lg p-3.5 ${canEditTasks ? 'cursor-move' : 'cursor-pointer'} hover:shadow-md transition-all duration-150 border border-gray-200 ${
                            draggedItem === task.id ? 'opacity-50' : ''
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className="text-sm font-bold text-gray-900 mb-2">{task.title}</p>
                              {task.description && (
                                <p className="text-xs text-gray-600 mb-2">{task.description}</p>
                              )}
                              <div className="flex gap-2">
                                {task.priority && getPriorityBadge(task.priority)}
                                {task.dueDate && (
                                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                    {new Date(task.dueDate).toLocaleDateString('pt-PT')}
                                  </span>
                                )}
                              </div>
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
                              {canEditTasks && (
                                <button
                                  onClick={() =>
                                    setOpenMenu(openMenu === task.id ? null : task.id)
                                  }
                                  className="p-1 hover:bg-gray-200 rounded transition-colors text-gray-500 hover:text-gray-700"
                                >
                                  <MoreHorizontal className="w-4 h-4" />
                                </button>
                              )}
                              {canEditTasks && openMenu === task.id && (
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
            members={members}
            onClose={() => setTaskDialog({ open: false, mode: 'create' })}
            onSave={createOrUpdateTask}
          />
        )}

        {/* Detailed Task Dialog (Read-only) */}
        {detailedTaskDialog.open && detailedTaskDialog.task && (
          <TaskDetailsDialog
            task={detailedTaskDialog.task}
            canEdit={canEditTasks}
            onClose={() => {
              setDetailedTaskDialog({ open: false });
              // Clear taskId from URL to prevent re-opening
              const url = new URL(window.location.href);
              if (url.searchParams.has('taskId')) {
                url.searchParams.delete('taskId');
                window.history.replaceState({}, '', url.pathname);
              }
            }}
            onEdit={() => {
              setTaskDialog({ open: true, mode: 'edit', task: detailedTaskDialog.task });
              setDetailedTaskDialog({ open: false });
              const url = new URL(window.location.href);
              if (url.searchParams.has('taskId')) {
                url.searchParams.delete('taskId');
                window.history.replaceState({}, '', url.pathname);
              }
            }}
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
  members,
  onClose,
  onSave,
}: {
  mode: 'create' | 'edit';
  task?: Task;
  statuses: Status[];
  members: ProjectMember[];
  onClose: () => void;
  onSave: (data: Partial<Task>) => void;
}) {
  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [statusId, setStatusId] = useState(task?.statusId || statuses[0]?.id || '');
  const [priority, setPriority] = useState<Priority | undefined>(task?.priority);
  const [dueDate, setDueDate] = useState(task?.dueDate || '');
  const [startDate, setStartDate] = useState(task?.startDate || '');
  const [assignedToIds, setAssignedToIds] = useState<string[]>(
    task?.assignees?.map((assignee) => assignee.user.id) || [],
  );

  function handleSubmit() {
    onSave({
      title,
      description,
      statusId,
      priority: priority || undefined,
      dueDate: dueDate || undefined,
      startDate: startDate || undefined,
      assignedToIds: assignedToIds.length > 0 ? assignedToIds : undefined,
    });
  }

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white border border-gray-200 rounded-xl p-8 w-[600px] shadow-lg max-h-[90vh] overflow-y-auto">
        <h3 className="text-2xl font-bold text-gray-900 mb-6">
          {mode === 'create' ? 'Criar Tarefa' : 'Editar Tarefa'}
        </h3>
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Título *</label>
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Status *</label>
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
              <label className="block text-sm font-semibold text-gray-700 mb-2">Prioridade</label>
              <select
                value={priority || ''}
                onChange={(e) => setPriority((e.target.value as Priority) || undefined)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent transition-all"
              >
                <option value="">Sem prioridade</option>
                <option value="LOW">Baixa</option>
                <option value="MEDIUM">Média</option>
                <option value="HIGH">Alta</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Data de Início
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Data de Conclusão
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Atribuir a
            </label>
            <div className="space-y-2">
              {members.map((member) => {
                const checked = assignedToIds.includes(member.userId);
                return (
                  <label key={member.id} className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setAssignedToIds((prev) => Array.from(new Set([...prev, member.userId])));
                        } else {
                          setAssignedToIds((prev) => prev.filter((id) => id !== member.userId));
                        }
                      }}
                      className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-400"
                    />
                    <span>
                      {member.user.name} <span className="text-gray-500">({member.user.email})</span>
                    </span>
                  </label>
                );
              })}
              {members.length === 0 && (
                <div className="text-xs text-gray-500">Sem membros para atribuir.</div>
              )}
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

function TaskDetailsDialog({
  task,
  canEdit,
  onClose,
  onEdit,
}: {
  task: Task;
  canEdit: boolean;
  onClose: () => void;
  onEdit: () => void;
}) {
  function getPriorityLabel(priority?: Priority) {
    const labels = { LOW: 'Baixa', MEDIUM: 'Média', HIGH: 'Alta' };
    return priority ? labels[priority] : '-';
  }

  function getPriorityColor(priority?: Priority) {
    const colors = {
      LOW: 'bg-blue-100 text-blue-800',
      MEDIUM: 'bg-amber-100 text-amber-800',
      HIGH: 'bg-red-100 text-red-800',
    };
    return priority ? colors[priority] : 'bg-gray-100 text-gray-800';
  }

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white border border-gray-200 rounded-xl p-8 w-[600px] shadow-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">{task.title}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 font-bold text-2xl"
          >
            ×
          </button>
        </div>

        <div className="space-y-6">
          {task.description && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Descrição</h3>
              <p className="text-gray-700 bg-gray-50 p-4 rounded-lg whitespace-pre-wrap">{task.description}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Prioridade</h3>
              <span className={`px-3 py-1.5 rounded-lg text-sm font-medium ${getPriorityColor(task.priority)}`}>
                {getPriorityLabel(task.priority)}
              </span>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Data de Conclusão</h3>
              <p className="text-gray-700">
                {task.dueDate
                  ? new Date(task.dueDate).toLocaleDateString('pt-PT', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })
                  : '-'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Data de Início</h3>
              <p className="text-gray-700">
                {task.startDate
                  ? new Date(task.startDate).toLocaleDateString('pt-PT', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })
                  : '-'}
              </p>
            </div>
          </div>

          {task.assignees && task.assignees.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Atribuído a</h3>
              <div className="flex flex-wrap gap-2">
                {task.assignees.map((assignee) => (
                  <div key={assignee.user.id} className="bg-gray-900 text-white px-3 py-2 rounded-lg text-sm">
                    <div className="font-medium">{assignee.user.name}</div>
                    <div className="text-xs text-gray-300">{assignee.user.email}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-8">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all font-medium"
          >
            Fechar
          </button>
          {canEdit && (
            <button
              onClick={onEdit}
              className="flex-1 px-4 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-all font-medium"
            >
              Editar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
