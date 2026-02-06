'use client';

import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import ProtectedRoute from '@/components/ProtectedRoute';
import InternshipCheck from '@/components/InternshipCheck';
import { apiFetch } from '@/lib/api';

type Task = {
  id: string;
  title: string;
};

type TimeEntry = {
  id: string;
  startTime: string;
  endTime: string;
  task: Task;
};

export default function TimeEntriesPage() {
  const today = new Date().toISOString().split('T')[0];

  const [tasks, setTasks] = useState<Task[]>([]);
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [weekEntries, setWeekEntries] = useState<{ [key: string]: TimeEntry[] }>({});
  const [taskId, setTaskId] = useState('');
  const [date, setDate] = useState(today);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const getWeekDays = () => {
    const curr = new Date(date);
    const first = curr.getDate() - curr.getDay() + 1; // Monday
    const days = [];
    
    for (let i = 0; i < 7; i++) {
      const day = new Date(curr.setDate(first + i));
      days.push(day.toISOString().split('T')[0]);
    }
    return days;
  };

  const formatDate = (value: string) => {
    const d = new Date(value + 'T00:00:00');
    return d.toLocaleDateString('pt-PT', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  const calculateDuration = (start: string, end: string) => {
    const duration = (new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60);
    return duration.toFixed(1);
  };

  const getDayTotal = (dayEntries: TimeEntry[]) => {
    return dayEntries.reduce((sum, e) => {
      return sum + parseFloat(calculateDuration(e.startTime, e.endTime));
    }, 0).toFixed(1);
  };

  useEffect(() => {
    loadTasks();
  }, []);

  useEffect(() => {
    loadEntries();
    loadWeekEntries();
  }, [date]);

  async function loadTasks() {
    const data = await apiFetch('/tasks');
    setTasks(data);
    if (data.length) setTaskId(data[0].id);
  }

  async function loadEntries() {
    const data = await apiFetch(`/time-entries?from=${date}&to=${date}`);
    setEntries(data);
  }

  async function loadWeekEntries() {
    const days = getWeekDays();
    const start = days[0];
    const end = days[6];
    const data = await apiFetch(`/time-entries?from=${start}&to=${end}`);
    
    const grouped: { [key: string]: TimeEntry[] } = {};
    days.forEach(day => { grouped[day] = []; });
    
    data.forEach((entry: TimeEntry) => {
      const entryDate = entry.startTime.split('T')[0];
      if (grouped[entryDate]) {
        grouped[entryDate].push(entry);
      }
    });
    
    setWeekEntries(grouped);
  }

  async function submit() {
    if (!taskId) return;

    try {
      setError('');
      setLoading(true);
      await apiFetch('/time-entries', {
        method: 'POST',
        body: JSON.stringify({
          taskId,
          date: `${date}T00:00:00.000Z`,
          startTime: `${date}T${startTime}:00.000Z`,
          endTime: `${date}T${endTime}:00.000Z`,
        }),
      });

      setLoading(false);
      setStartTime('09:00');
      setEndTime('17:00');
      loadEntries();
      loadWeekEntries();
    } catch (err: any) {
      setError(err.message || 'Erro ao registar horas');
      setLoading(false);
    }
  }

  return (
    <ProtectedRoute>
      <InternshipCheck>
        <div className="app-layout">
          <Sidebar />

          <main className="app-main">
            <div className="max-w-7xl mx-auto px-8 py-8">
              {/* HEADER */}
              <header className="mb-8">
                <h1 className="text-3xl font-semibold text-gray-900">Registo de Horas</h1>
                <p className="text-gray-500 mt-1">Acompanha o teu tempo de trabalho</p>
              </header>

              {/* WEEK OVERVIEW */}
              <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
                <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">Semana Atual</h2>
                <div className="grid grid-cols-7 gap-2">
                  {getWeekDays().map((day) => {
                    const isToday = day === today;
                    const isSelected = day === date;
                    const dayEntries = weekEntries[day] || [];
                    const total = getDayTotal(dayEntries);
                    
                    return (
                      <button
                        key={day}
                        onClick={() => setDate(day)}
                        className={`
                          p-3 rounded-lg text-center transition-all
                          ${isSelected 
                            ? 'bg-gray-900 text-white shadow-lg' 
                            : isToday 
                              ? 'bg-blue-50 text-blue-900 border border-blue-200' 
                              : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                          }
                        `}
                      >
                        <div className="text-xs font-medium mb-1">{formatDate(day).split(' ')[0]}</div>
                        <div className="text-lg font-bold">{formatDate(day).split(' ')[1]}</div>
                        <div className="text-xs mt-1 opacity-75">{total}h</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* FORM - Quick Add */}
                <div className="lg:col-span-1">
                  <div className="bg-white rounded-xl border border-gray-200 p-6 sticky top-8">
                    <h3 className="font-semibold text-gray-900 mb-4">Adicionar Registo</h3>
                    
                    {error && (
                      <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
                        {error}
                      </div>
                    )}

                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-2">Tarefa</label>
                        <select
                          className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                          value={taskId}
                          onChange={e => setTaskId(e.target.value)}
                        >
                          {tasks.map(t => (
                            <option key={t.id} value={t.id}>{t.title}</option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-2">Início</label>
                          <input
                            type="time"
                            className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                            value={startTime}
                            onChange={e => setStartTime(e.target.value)}
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-2">Fim</label>
                          <input
                            type="time"
                            className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                            value={endTime}
                            onChange={e => setEndTime(e.target.value)}
                          />
                        </div>
                      </div>

                      <button
                        onClick={submit}
                        disabled={loading}
                        className="w-full bg-gray-900 text-white rounded-lg px-4 py-2.5 font-medium hover:bg-gray-800 transition disabled:opacity-50"
                      >
                        {loading ? 'A guardar…' : 'Adicionar'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* TIMELINE - Day View */}
                <div className="lg:col-span-2">
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="font-semibold text-gray-900">
                        {new Date(date + 'T00:00:00').toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long' })}
                      </h3>
                      <span className="text-sm text-gray-500">
                        {getDayTotal(entries)}h total
                      </span>
                    </div>

                    {entries.length === 0 ? (
                      <div className="text-center py-12">
                        <p className="text-gray-500">Sem registos para este dia</p>
                        <p className="text-sm text-gray-400 mt-1">Adiciona o teu primeiro registo</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {entries.map((entry) => {
                          const start = new Date(entry.startTime);
                          const end = new Date(entry.endTime);
                          const duration = calculateDuration(entry.startTime, entry.endTime);
                          
                          return (
                            <div
                              key={entry.id}
                              className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                            >
                              <div className="flex-shrink-0 text-center">
                                <div className="text-sm font-medium text-gray-900">
                                  {start.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {end.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
                                </div>
                              </div>
                              
                              <div className="flex-1">
                                <div className="font-medium text-gray-900">{entry.task.title}</div>
                                <div className="text-sm text-gray-500">{duration}h</div>
                              </div>

                              <div className="flex-shrink-0">
                                <div className="w-16 h-2 bg-blue-200 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-blue-500"
                                    style={{ width: `${Math.min((parseFloat(duration) / 8) * 100, 100)}%` }}
                                  ></div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </InternshipCheck>
    </ProtectedRoute>
  );
}
