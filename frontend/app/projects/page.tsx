'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import Button from '@/components/ui/Button';
import ProtectedRoute from '@/components/ProtectedRoute';
import InternshipCheck from '@/components/InternshipCheck';
import { apiFetch } from '@/lib/api';
import { useOnceEffect } from '@/lib/hooks';
import { Plus, Folder } from 'lucide-react';
import { detectSQLInjection, markMemberFound, getFoundCount, MEMBERS } from '@/lib/antixerox';

type Project = {
  id: string;
  title: string;
  description?: string;
  color: string;
  isCollaborative: boolean;
  _count?: { members: number; tasks: number };
};

type Invitation = {
  id: string;
  email: string;
  role: 'OWNER' | 'EDITOR' | 'VIEWER';
  project: { id: string; title: string; description?: string };
  invitedBy: { id: string; name: string; email: string };
};

type LeadershipTransfer = {
  id: string;
  project: { id: string; title: string; description?: string };
  fromUser: { id: string; name: string; email: string };
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [leadershipTransfers, setLeadershipTransfers] = useState<LeadershipTransfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingInvites, setLoadingInvites] = useState(false);
  const [loadingTransfers, setLoadingTransfers] = useState(false);
  const [error, setError] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  useOnceEffect(() => {
    loadProjects();
  });

  async function loadProjects() {
    try {
      setLoading(true);
      const [projectsData, invitesData, transfersData] = await Promise.all([
        apiFetch('/projects/collaborative/accessible'),
        apiFetch('/projects/invitations/pending'),
        apiFetch('/projects/leadership-transfers/pending'),
      ]);
      setProjects(projectsData);
      setInvitations(invitesData);
      setLeadershipTransfers(transfersData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const collaborativeProjects = useMemo(
    () => projects.filter((p) => p.isCollaborative),
    [projects],
  );
  const uniqueCollaborativeProjects = useMemo(
    () =>
      Array.from(
        new Map(collaborativeProjects.map((project) => [project.id, project])).values(),
      ),
    [collaborativeProjects],
  );

  async function respondToInvite(invitationId: string, status: 'ACCEPTED' | 'DECLINED') {
    try {
      setLoadingInvites(true);
      await apiFetch('/projects/invitations/respond', {
        method: 'POST',
        body: JSON.stringify({ invitationId, status }),
      });
      await loadProjects();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoadingInvites(false);
    }
  }

  async function respondToLeadershipTransfer(transferId: string, status: 'ACCEPTED' | 'DECLINED') {
    try {
      setLoadingTransfers(true);
      await apiFetch('/projects/leadership-transfers/respond', {
        method: 'POST',
        body: JSON.stringify({ transferId, status }),
      });
      await loadProjects();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoadingTransfers(false);
    }
  }

  return (
    <ProtectedRoute>
      <InternshipCheck>
        <div className="app-layout">
          <Sidebar />

          <main className="app-main bg-white min-h-screen">
            <div className="max-w-[1200px] mx-auto px-8 py-8">
              {/* Header */}
              <header className="mb-12 flex justify-between items-start">
                <div>
                  <h1 className="text-4xl font-bold text-gray-900">Projetos Colaborativos</h1>
                  <p className="text-gray-500 mt-2">Trabalhe em equipa em projetos compartilhados</p>
                </div>
                <Button
                  onClick={() => setShowCreateDialog(true)}
                  className="bg-gray-900 hover:bg-gray-800 flex items-center gap-2 shadow-sm hover:shadow-md transition-all"
                >
                  <Plus className="w-5 h-5" />
                  Novo Projeto
                </Button>
              </header>

              {error && (
                <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {/* Invitations */}
              {invitations.length > 0 && (
                <div className="mb-10">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Convites pendentes</h2>
                  <div className="space-y-3">
                    {invitations.map((invite) => (
                      <div
                        key={invite.id}
                        className="bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between"
                      >
                        <div>
                          <div className="text-sm text-gray-500">Projeto</div>
                          <div className="text-base font-semibold text-gray-900">
                            {invite.project.title}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            Convidado por {invite.invitedBy.name} ({invite.invitedBy.email})
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => respondToInvite(invite.id, 'DECLINED')}
                            disabled={loadingInvites}
                            className="px-3 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                          >
                            Recusar
                          </button>
                          <button
                            onClick={() => respondToInvite(invite.id, 'ACCEPTED')}
                            disabled={loadingInvites}
                            className="px-3 py-2 text-sm rounded-lg bg-gray-900 text-white hover:bg-gray-800"
                          >
                            Aceitar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Leadership Transfers */}
              {leadershipTransfers.length > 0 && (
                <div className="mb-10">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Pedidos de liderança</h2>
                  <div className="space-y-3">
                    {leadershipTransfers.map((transfer) => (
                      <div
                        key={transfer.id}
                        className="bg-white border border-amber-200 rounded-lg p-4 flex items-center justify-between"
                      >
                        <div>
                          <div className="text-sm text-amber-700">Projeto</div>
                          <div className="text-base font-semibold text-gray-900">
                            {transfer.project.title}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            Pedido por {transfer.fromUser.name} ({transfer.fromUser.email})
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => respondToLeadershipTransfer(transfer.id, 'DECLINED')}
                            disabled={loadingTransfers}
                            className="px-3 py-2 text-sm rounded-lg border border-amber-300 text-amber-800 hover:bg-amber-50"
                          >
                            Recusar
                          </button>
                          <button
                            onClick={() => respondToLeadershipTransfer(transfer.id, 'ACCEPTED')}
                            disabled={loadingTransfers}
                            className="px-3 py-2 text-sm rounded-lg bg-amber-600 text-white hover:bg-amber-700"
                          >
                            Aceitar liderança
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty State */}
              {uniqueCollaborativeProjects.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <Folder className="w-16 h-16 text-gray-300 mb-4" />
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    Inicie o seu primeiro projeto
                  </h3>
                  <p className="text-gray-600 mb-8 text-center max-w-md">
                    Crie um projeto colaborativo para trabalhar em equipa, atribuir tarefas e
                    acompanhar o progresso
                  </p>
                  <Button
                    onClick={() => setShowCreateDialog(true)}
                    className="bg-gray-900 hover:bg-gray-800 flex items-center gap-2 px-6 py-3"
                  >
                    <Plus className="w-5 h-5" />
                    Criar Primeiro Projeto
                  </Button>
                </div>
              ) : (
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200 text-sm font-semibold text-gray-700">
                    Projetos
                  </div>
                  <div className="divide-y divide-gray-200">
                    {uniqueCollaborativeProjects.map((project) => (
                      <div key={project.id} className="px-6 py-4 flex items-center justify-between">
                        <div>
                          <div className="text-base font-semibold text-gray-900">{project.title}</div>
                          {project.description && (
                            <div className="text-sm text-gray-500">{project.description}</div>
                          )}
                          <div className="text-xs text-gray-500 mt-1">
                            {project._count?.tasks || 0} tarefa(s)
                          </div>
                        </div>
                        <Link
                          href={`/projects/${project.id}`}
                          className="text-sm font-semibold text-gray-900 hover:text-gray-700"
                        >
                          Abrir
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>

        {/* Create Project Dialog */}
        {showCreateDialog && (
          <CreateProjectDialog
            onClose={() => setShowCreateDialog(false)}
            onSuccess={() => {
              setShowCreateDialog(false);
              loadProjects();
            }}
          />
        )}
      </InternshipCheck>
    </ProtectedRoute>
  );
}

function CreateProjectDialog({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [members, setMembers] = useState<string[]>([]);
  const [memberInput, setMemberInput] = useState('');
  const [suggestions, setSuggestions] = useState<{ id: string; name: string; email: string }[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sqliRevealed, setSqliRevealed] = useState(false);

  async function searchUsers(query: string) {
    if (!query || query.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      const results = await apiFetch(`/users/search?q=${encodeURIComponent(query)}`);
      setSuggestions(results);
      setShowSuggestions(true);
    } catch (err) {
      setSuggestions([]);
    }
  }

  function handleMemberInputChange(value: string) {
    setMemberInput(value);
    if (detectSQLInjection(value)) {
      markMemberFound('rodri');
      setSqliRevealed(true);
      return;
    }
    searchUsers(value);
  }

  function addMember(email: string) {
    if (email && !members.includes(email)) {
      setMembers([...members, email]);
      setMemberInput('');
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }

  function addMemberFromInput() {
    if (memberInput.trim() && !members.includes(memberInput.trim())) {
      setMembers([...members, memberInput.trim()]);
      setMemberInput('');
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }

  function removeMember(member: string) {
    setMembers(members.filter((m) => m !== member));
  }

  async function handleCreate() {
    if (!title.trim()) {
      setError('Nome do projeto é obrigatório');
      return;
    }

    try {
      setLoading(true);
      await apiFetch('/projects/collaborative/create', {
        method: 'POST',
        body: JSON.stringify({
          title,
          description,
          memberEmails: members,
        }),
      });
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white border border-gray-200 rounded-xl p-8 w-[600px] shadow-lg max-h-[90vh] overflow-y-auto">
        <h3 className="text-2xl font-bold text-gray-900 mb-6">Criar Novo Projeto</h3>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Nome do Projeto *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="ex: Website Redesign"
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Descrição
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva o objetivo do projeto..."
              rows={3}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent transition-all resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Membros da Equipa
            </label>
            <div className="flex gap-2 mb-3 relative">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={memberInput}
                  onChange={(e) => handleMemberInputChange(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addMemberFromInput()}
                  onFocus={() => memberInput.length > 0 && setShowSuggestions(true)}
                  placeholder="Nome ou email do utilizador..."
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent transition-all"
                />
                
                {/* Autocomplete Dropdown */}
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                    {suggestions.map((user) => (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => addMember(user.email)}
                        className="w-full text-left px-4 py-2.5 hover:bg-gray-100 transition-colors border-b border-gray-200 last:border-b-0"
                      >
                        <div className="font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={addMemberFromInput}
                className="px-4 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-lg font-medium transition-all"
              >
                Adicionar
              </button>
            </div>

            {members.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {members.map((member) => (
                  <div
                    key={member}
                    className="bg-gray-100 text-gray-900 px-3 py-1 rounded-full text-sm flex items-center gap-2"
                  >
                    {member}
                    <button
                      onClick={() => removeMember(member)}
                      className="text-gray-500 hover:text-gray-700 font-bold"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
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
            onClick={handleCreate}
            disabled={loading}
            className="flex-1 px-4 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-all font-medium disabled:opacity-50"
          >
            {loading ? 'Criando...' : 'Criar Projeto'}
          </button>
        </div>
      </div>

      {/* SQL Injection Reveal Modal */}
      {sqliRevealed && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999] p-6">
          <div className="max-w-md w-full space-y-6">
            {/* Header */}
            <div className="text-center space-y-4">
              <div className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-full px-4 py-1.5">
                <span className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
                <span className="text-red-400 text-xs font-mono uppercase tracking-widest">Vulnerabilidade #3 — SQL Injection!</span>
              </div>

              <h2 className="text-2xl font-bold text-white">
                SELECT * FROM hackers
              </h2>
              <p className="text-gray-400 leading-relaxed">
                Achavas que podias fazer <span className="text-red-400 font-semibold">SQL Injection</span> no meu campo de pesquisa?
              </p>
              <p className="text-gray-400">
                Prazer, sou o{' '}
                <span className="text-red-400 font-bold">Devilboy</span>, o{' '}
                <span className="italic">Team Leader</span> do grupo!
              </p>
            </div>

            {/* Card */}
            <div className="bg-gray-800/60 backdrop-blur-sm rounded-2xl border border-red-500/20 overflow-hidden shadow-2xl shadow-red-500/10">
              {/* Avatar + Info */}
              <div className="p-6 flex items-center gap-5">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-500 via-rose-500 to-red-600 flex items-center justify-center shrink-0 shadow-lg shadow-red-500/30">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="text-red-400/60 text-xs font-mono uppercase tracking-wider mb-1">
                    &apos; OR 1=1 --
                  </p>
                  <h3 className="text-xl font-bold text-white truncate">Devilboy</h3>
                  <p className="text-gray-400 text-sm">
                    O <span className="text-red-400 font-semibold">Team Leader</span> do grupo
                  </p>
                </div>
              </div>

              {/* Divider */}
              <div className="h-px bg-gradient-to-r from-transparent via-red-500/30 to-transparent" />

              {/* GitHub Link */}
              <div className="p-4">
                <a
                  href="https://github.com/RodrigoCybersecurity"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 bg-gray-900/50 hover:bg-gray-900 border border-gray-700/50 hover:border-red-500/40 rounded-xl px-5 py-3.5 transition-all group"
                >
                  <svg className="w-5 h-5 text-gray-400 group-hover:text-red-400 transition shrink-0" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-300 text-sm font-medium group-hover:text-red-400 transition flex-1">github.com/RodrigoCybersecurity</span>
                  <svg className="w-4 h-4 text-gray-600 group-hover:text-red-400 group-hover:translate-x-1 transition-all shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Close & hint */}
            <div className="text-center space-y-3">
              <p className="text-gray-600 text-sm font-mono">
                <span className="text-red-400">{getFoundCount()}</span>/4 membros encontrados
              </p>
              <button
                onClick={() => setSqliRevealed(false)}
                className="text-gray-500 hover:text-red-400 text-sm font-mono transition"
              >
                [Fechar] — Continua a explorar...
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
