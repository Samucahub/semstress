'use client';

import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import ProtectedRoute from '@/components/ProtectedRoute';
import InternshipCheck from '@/components/InternshipCheck';
import { apiFetch } from '@/lib/api';

type Task = {
  id: string;
  title: string;
  description?: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
};

type TimeEntry = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  task: {
    id: string;
    title: string;
  };
};

export default function DashboardPage() {
  const [weekHours, setWeekHours] = useState<number>(0);
  const [todayHours, setTodayHours] = useState<number>(0);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [recentEntries, setRecentEntries] = useState<TimeEntry[]>([]);

  useEffect(() => {
    loadSummary();
    loadTasks();
    loadRecentEntries();
  }, []);

  async function loadSummary() {
    try {
      const data = await apiFetch('/reports/summary');
      setWeekHours(data.weekHours || 0);
      setTodayHours(data.todayHours || 0);
    } catch (error) {
      console.error('Erro ao carregar resumo:', error);
    }
  }

  async function loadTasks() {
    try {
      const data = await apiFetch('/tasks?status=IN_PROGRESS');
      setTasks(data || []);
    } catch (error) {
      console.error('Erro ao carregar tarefas:', error);
      setTasks([]);
    }
  }

  async function loadRecentEntries() {
    try {
      // Get last 30 days
      const to = new Date();
      const from = new Date();
      from.setDate(from.getDate() - 30);
      
      const fromStr = from.toISOString().split('T')[0];
      const toStr = to.toISOString().split('T')[0];
      
      const data = await apiFetch(`/time-entries?from=${fromStr}&to=${toStr}`);
      setRecentEntries((data || []).slice(0, 5));
    } catch (error) {
      console.error('Erro ao carregar registos:', error);
      setRecentEntries([]);
    }
  }

  function formatDate(dateStr: string) {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('pt-PT', { 
      day: '2-digit', 
      month: 'short',
      year: 'numeric'
    }).format(date);
  }

  function calculateHours(startTime: string, endTime: string): number {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const diff = end.getTime() - start.getTime();
    return Math.round((diff / (1000 * 60 * 60)) * 10) / 10;
  }

  return (
    <ProtectedRoute>
      <InternshipCheck>
        <div className="app-layout">
          <Sidebar />

          <main className="app-main">
            <div className="max-w-7xl mx-auto px-8 py-8 space-y-8">
              {/* HEADER */}
              <header>
                <h1 className="text-3xl font-semibold text-gray-900">Dashboard</h1>
                <p className="text-gray-500 mt-1">
                  Visão geral do teu progresso
                </p>
              </header>

              {/* SUMMARY CARDS */}
              <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Esta Semana</span>
                    <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-4xl font-bold text-gray-900">{weekHours}h</p>
                  <p className="text-sm text-gray-500 mt-2">Horas registadas</p>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Hoje</span>
                    <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-4xl font-bold text-gray-900">{todayHours}h</p>
                  <p className="text-sm text-gray-500 mt-2">Horas de trabalho</p>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Tarefas Ativas</span>
                    <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-4xl font-bold text-gray-900">{tasks.length}</p>
                  <p className="text-sm text-gray-500 mt-2">Em progresso</p>
                </div>
              </section>

              {/* MAIN CONTENT GRID */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* ACTIVE TASKS */}
                <section className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Tarefas em Progresso</h2>
                    <span className="text-xs text-gray-500">{tasks.length} {tasks.length === 1 ? 'tarefa' : 'tarefas'}</span>
                  </div>
                  {tasks.length === 0 ? (
                    <div className="py-12 text-center">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                      </div>
                      <p className="text-gray-500 font-medium text-sm">Nenhuma tarefa em progresso</p>
                      <p className="text-xs text-gray-400 mt-1">Vai a Tarefas para começar</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-80 overflow-y-auto">
                      {tasks.map((task) => (
                        <div key={task.id} className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                                <span className="font-medium text-gray-900 text-sm">{task.title}</span>
                              </div>
                              {task.description && (
                                <p className="text-xs text-gray-500 line-clamp-2 ml-3.5">{task.description}</p>
                              )}
                            </div>
                            <span className="text-xs font-medium bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full whitespace-nowrap">
                              Em Progresso
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                {/* RECENT TIME ENTRIES */}
                <section className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Registos Recentes</h2>
                    <span className="text-xs text-gray-500">{recentEntries.length > 0 ? 'Últimos 5' : ''}</span>
                  </div>
                  {recentEntries.length === 0 ? (
                    <div className="py-12 text-center">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <p className="text-gray-500 font-medium text-sm">Nenhum registo de horas</p>
                      <p className="text-xs text-gray-400 mt-1">Vai a Horas para registar</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-80 overflow-y-auto">
                      {recentEntries.map((entry) => {
                        const hours = calculateHours(entry.startTime, entry.endTime);
                        return (
                          <div key={entry.id} className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-medium text-gray-500">{formatDate(entry.date)}</span>
                              <span className="text-sm font-semibold text-gray-900">{hours}h</span>
                            </div>
                            <p className="text-xs text-gray-600 line-clamp-2">{entry.task.title}</p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>
              </div>
            </div>
          </main>
        </div>
      </InternshipCheck>
    </ProtectedRoute>
  );
}
