'use client';

import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import ProtectedRoute from '@/components/ProtectedRoute';
import { apiFetch } from '@/lib/api';
import { useOnceEffect } from '@/lib/hooks';

type Task = {
  id: string;
  title: string;
  description?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  status: {
    id: string;
    name: string;
  };
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
  
  // Internship stats
  const [internship, setInternship] = useState<any>(null);

  useOnceEffect(() => {
    loadSummary();
    loadTasks();
    loadRecentEntries();
    loadInternshipSummary();
  });

  async function loadSummary() {
    try {
      const data = await apiFetch('/reports/summary');
      setWeekHours(data.weekHours || 0);
      setTodayHours(data.todayHours || 0);
    } catch (error) {
      console.error('Erro ao carregar resumo:', error);
    }
  }

  async function loadInternshipSummary() {
    try {
      const data = await apiFetch('/reports/internship-summary');
      setInternship(data);
    } catch (error) {
      console.error('Erro ao carregar resumo do estágio:', error);
      setInternship(null);
    }
  }

  async function loadTasks() {
    try {
      const data = await apiFetch('/tasks');
      // Filter tasks that are "In Progress" or similar
      const filtered = (data || []).filter((task: Task) => 
        task.status.name.toLowerCase().includes('progress') ||
        task.status.name.toLowerCase().includes('in progress') ||
        task.status.name === 'In Progress'
      );
      setTasks(filtered);
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

              {/* INTERNSHIP PROGRESS SECTION */}
              {internship?.hasInternship && (
                <section className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-8">
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900 mb-2">Progresso do Estágio</h2>
                      <p className="text-sm text-gray-600">Acompanha o teu progresso em relação às horas previstas</p>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-3">
                      <div className="flex items-end justify-between">
                        <div>
                          <p className="text-2xl font-bold text-gray-900">{internship.hoursLogged}h</p>
                          <p className="text-xs text-gray-600 mt-1">de {internship.totalPlanned}h previstas</p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-indigo-600">{internship.progress}%</p>
                          <p className="text-xs text-gray-600 mt-1">Concluído</p>
                        </div>
                      </div>
                      
                      {/* Progress Bar Visual */}
                      <div className="w-full bg-white rounded-full h-3 overflow-hidden shadow-sm">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(internship.progress, 100)}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-4 pt-4">
                      <div className="bg-white rounded-lg p-4 border border-blue-100">
                        <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Horas Restantes</p>
                        <p className="text-2xl font-bold text-indigo-600">{internship.hoursRemaining}h</p>
                      </div>
                      
                      <div className="bg-white rounded-lg p-4 border border-blue-100">
                        <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Dias Restantes</p>
                        <p className="text-2xl font-bold text-blue-600">{internship.daysRemaining}</p>
                      </div>
                      
                      <div className="bg-white rounded-lg p-4 border border-blue-100">
                        <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Média Diária</p>
                        <p className="text-2xl font-bold text-purple-600">{internship.hoursPerDay}h</p>
                      </div>
                    </div>

                    {/* Recommendation */}
                    {internship.hoursPerDay > 0 && (
                      <div className="bg-white rounded-lg p-4 border border-blue-200">
                        <p className="text-xs font-semibold text-gray-700 mb-2">📊 RECOMENDAÇÃO</p>
                        <p className="text-sm text-gray-600">
                          Para completares o estágio a tempo, precisas registar <strong className="text-indigo-600">{internship.hoursPerDay} horas por dia</strong> nos próximos <strong>{internship.daysRemaining}</strong> dias.
                        </p>
                      </div>
                    )}
                  </div>
                </section>
              )}

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
                              {task.status.name}
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
    </ProtectedRoute>
  );
}
