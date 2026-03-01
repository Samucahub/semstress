'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import ProtectedRoute from '@/components/ProtectedRoute';
import InternshipCheck from '@/components/InternshipCheck';
import { apiFetch } from '@/lib/api';
import { useOnceEffect } from '@/lib/hooks';
import { ChevronLeft, ChevronRight, Search, Save, Trash2 } from 'lucide-react';

type Task = {
  id: string;
  title: string;
  projectId?: string;
  project?: { id: string; title: string } | null;
};

type TimeEntry = {
  id: string;
  startTime: string;
  endTime: string;
  task: Task;
};

type DraftEntry = {
  id: string;
  taskId: string;
  date: string;
  startMinutes: number;
  endMinutes: number;
};

type ViewMode = 'day' | 'week' | 'month' | 'last30';

const START_HOUR = 6;
const END_HOUR = 22;
const HOUR_HEIGHT = 56;
const MINUTE_STEP = 15;

const toISODate = (value: Date) => value.toISOString().split('T')[0];

const addDays = (value: string, amount: number) => {
  const d = new Date(`${value}T00:00:00`);
  d.setDate(d.getDate() + amount);
  return toISODate(d);
};

const getWeekStart = (value: string) => {
  const d = new Date(`${value}T00:00:00`);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return toISODate(d);
};

const getWeekEnd = (value: string) => addDays(getWeekStart(value), 6);

const getMonthRange = (value: string) => {
  const d = new Date(`${value}T00:00:00`);
  const start = new Date(d.getFullYear(), d.getMonth(), 1);
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  return { start: toISODate(start), end: toISODate(end) };
};

const getDaysBetween = (start: string, end: string) => {
  const days: string[] = [];
  const current = new Date(`${start}T00:00:00`);
  const endDate = new Date(`${end}T00:00:00`);
  while (current <= endDate) {
    days.push(toISODate(current));
    current.setDate(current.getDate() + 1);
  }
  return days;
};

const formatRange = (start: string, end: string) => {
  const startDate = new Date(`${start}T00:00:00`);
  const endDate = new Date(`${end}T00:00:00`);
  const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
  return `${startDate.toLocaleDateString('pt-PT', opts)} - ${endDate.toLocaleDateString('pt-PT', opts)}`;
};

const minutesFromDate = (value: Date) => value.getHours() * 60 + value.getMinutes();

const formatMinutes = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
};

const clamp = (min: number, value: number, max: number) => Math.min(Math.max(value, min), max);

export default function TimeEntriesPage() {
  const today = toISODate(new Date());

  const [tasks, setTasks] = useState<Task[]>([]);
  const [entriesByDate, setEntriesByDate] = useState<Record<string, TimeEntry[]>>({});
  const [drafts, setDrafts] = useState<DraftEntry[]>([]);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [date, setDate] = useState(today);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dragAction, setDragAction] = useState<
    | null
    | {
        id: string;
        type: 'draft' | 'entry';
        mode: 'move' | 'resize';
        startY: number;
        baseStart: number;
        baseEnd: number;
      }
  >(null);
  const [entryOverrides, setEntryOverrides] = useState<
    Record<string, { startMinutes: number; endMinutes: number }>
  >({});

  const timelineRef = useRef<HTMLDivElement | null>(null);
  const entryOverridesRef = useRef(entryOverrides);

  useEffect(() => {
    entryOverridesRef.current = entryOverrides;
  }, [entryOverrides]);

  const range = useMemo(() => {
    if (viewMode === 'day') {
      return { start: date, end: date };
    }
    if (viewMode === 'week') {
      return { start: getWeekStart(date), end: getWeekEnd(date) };
    }
    if (viewMode === 'last30') {
      return { start: addDays(today, -29), end: today };
    }
    return getMonthRange(date);
  }, [date, today, viewMode]);

  const calendarDays = useMemo(() => {
    if (viewMode === 'month') {
      const monthRange = getMonthRange(date);
      const gridStart = getWeekStart(monthRange.start);
      const gridEnd = getWeekEnd(monthRange.end);
      return getDaysBetween(gridStart, gridEnd);
    }
    if (viewMode === 'last30') {
      const start = range.start;
      const startDate = new Date(`${start}T00:00:00`);
      const padStart = startDate.getDay() === 0 ? 6 : startDate.getDay() - 1;
      const days = getDaysBetween(range.start, range.end);
      const grid: (string | null)[] = [...Array(padStart).fill(null), ...days];
      const remainder = grid.length % 7;
      if (remainder) {
        grid.push(...Array(7 - remainder).fill(null));
      }
      return grid;
    }
    return [];
  }, [date, range.end, range.start, viewMode]);

  const weekDays = useMemo(() => {
    if (viewMode !== 'week') return [];
    return getDaysBetween(range.start, range.end);
  }, [range.end, range.start, viewMode]);

  const dayEntries = entriesByDate[date] ?? [];
  const dayDrafts = drafts.filter((draft) => draft.date === date);

  const simpleTasks = useMemo(() => tasks.filter((t) => !t.projectId), [tasks]);
  const projectTasks = useMemo(() => tasks.filter((t) => t.projectId), [tasks]);

  const filteredSimpleTasks = useMemo(() => {
    if (!searchTerm.trim()) return simpleTasks;
    const term = searchTerm.toLowerCase();
    return simpleTasks.filter((t) => t.title.toLowerCase().includes(term));
  }, [searchTerm, simpleTasks]);

  const groupedProjectTasks = useMemo(() => {
    const grouped: Record<string, Task[]> = {};
    projectTasks.forEach((task) => {
      const label = task.project?.title || 'Projeto';
      if (!grouped[label]) grouped[label] = [];
      grouped[label].push(task);
    });
    if (!searchTerm.trim()) return grouped;
    const term = searchTerm.toLowerCase();
    const filtered: Record<string, Task[]> = {};
    Object.entries(grouped).forEach(([label, items]) => {
      const matches = items.filter((t) => t.title.toLowerCase().includes(term));
      if (matches.length) filtered[label] = matches;
    });
    return filtered;
  }, [projectTasks, searchTerm]);

  useOnceEffect(() => {
    loadTasks().catch((error) => {
      console.error('Failed to load tasks:', error);
      // Set empty tasks instead of crashing
      setTasks([]);
    });
  });

  useEffect(() => {
    loadEntries(range.start, range.end).catch((error) => {
      console.error('Failed to load entries:', error);
      // Set empty entries instead of crashing
      setEntriesByDate({});
    });
  }, [range.end, range.start]);

  useEffect(() => {
    if (!dragAction) return;

    const handleMove = (event: MouseEvent) => {
      const pxPerMinute = HOUR_HEIGHT / 60;
      const deltaY = event.clientY - dragAction.startY;
      const deltaMinutes = Math.round(deltaY / pxPerMinute / MINUTE_STEP) * MINUTE_STEP;

      if (dragAction.type === 'draft') {
        setDrafts((prev) =>
          prev.map((draft) => {
            if (draft.id !== dragAction.id) return draft;
            if (dragAction.mode === 'resize') {
              const nextEnd = clamp(
                draft.startMinutes + MINUTE_STEP,
                dragAction.baseEnd + deltaMinutes,
                END_HOUR * 60,
              );
              return { ...draft, endMinutes: nextEnd };
            }
            const duration = draft.endMinutes - draft.startMinutes;
            const nextStart = clamp(
              START_HOUR * 60,
              dragAction.baseStart + deltaMinutes,
              END_HOUR * 60 - duration,
            );
            return { ...draft, startMinutes: nextStart, endMinutes: nextStart + duration };
          }),
        );
      }

      if (dragAction.type === 'entry') {
        setEntryOverrides((prev) => {
          const current = prev[dragAction.id] ?? {
            startMinutes: dragAction.baseStart,
            endMinutes: dragAction.baseEnd,
          };
          if (dragAction.mode === 'resize') {
            const nextEnd = clamp(
              current.startMinutes + MINUTE_STEP,
              dragAction.baseEnd + deltaMinutes,
              END_HOUR * 60,
            );
            return { ...prev, [dragAction.id]: { ...current, endMinutes: nextEnd } };
          }
          const duration = current.endMinutes - current.startMinutes;
          const nextStart = clamp(
            START_HOUR * 60,
            dragAction.baseStart + deltaMinutes,
            END_HOUR * 60 - duration,
          );
          return {
            ...prev,
            [dragAction.id]: { startMinutes: nextStart, endMinutes: nextStart + duration },
          };
        });
      }
    };

    const handleUp = async () => {
      if (dragAction.type === 'entry') {
        const override = entryOverridesRef.current[dragAction.id];
        if (override) {
          await updateEntryTime(dragAction.id, override.startMinutes, override.endMinutes);
        }
      }
      setDragAction(null);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [dragAction]);

  async function loadTasks() {
    const data = await apiFetch('/tasks?includeCollaborative=true');
    setTasks(data);
  }

  async function loadEntries(from: string, to: string) {
    const data = await apiFetch(`/time-entries?from=${from}&to=${to}`);
    const grouped: Record<string, TimeEntry[]> = {};
    data.forEach((entry: TimeEntry) => {
      const entryDate = entry.startTime.split('T')[0];
      grouped[entryDate] ??= [];
      grouped[entryDate].push(entry);
    });
    setEntriesByDate(grouped);
  }

  async function updateEntryTime(entryId: string, startMinutes: number, endMinutes: number) {
    const entry = entriesList.find((item) => item.id === entryId);
    if (!entry) return;
    const entryDate = entry.startTime.split('T')[0];
    try {
      await apiFetch(`/time-entries/${entryId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          startTime: `${entryDate}T${formatMinutes(startMinutes)}:00.000Z`,
          endTime: `${entryDate}T${formatMinutes(endMinutes)}:00.000Z`,
          date: `${entryDate}T00:00:00.000Z`,
        }),
      });
      setEntryOverrides((prev) => {
        const next = { ...prev };
        delete next[entryId];
        return next;
      });
      await loadEntries(range.start, range.end);
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar registo');
    }
  }

  async function deleteEntry(entryId: string) {
    try {
      await apiFetch(`/time-entries/${entryId}`, { method: 'DELETE' });
      await loadEntries(range.start, range.end);
    } catch (err: any) {
      setError(err.message || 'Erro ao eliminar registo');
    }
  }

  async function saveDrafts() {
    if (!drafts.length) return;
    try {
      setError('');
      setLoading(true);
      await Promise.all(
        drafts.map((draft) =>
          apiFetch('/time-entries', {
            method: 'POST',
            body: JSON.stringify({
              taskId: draft.taskId,
              date: `${draft.date}T00:00:00.000Z`,
              startTime: `${draft.date}T${formatMinutes(draft.startMinutes)}:00.000Z`,
              endTime: `${draft.date}T${formatMinutes(draft.endMinutes)}:00.000Z`,
            }),
          }),
        ),
      );
      setDrafts([]);
      await loadEntries(range.start, range.end);
    } catch (err: any) {
      setError(err.message || 'Erro ao registar horas');
    } finally {
      setLoading(false);
    }
  }

  function shiftDate(amount: number) {
    const current = new Date(`${date}T00:00:00`);
    if (viewMode === 'day') current.setDate(current.getDate() + amount);
    if (viewMode === 'week') current.setDate(current.getDate() + amount * 7);
    if (viewMode === 'month') current.setMonth(current.getMonth() + amount);
    if (viewMode === 'last30') current.setDate(current.getDate() + amount * 30);
    setDate(toISODate(current));
  }

  function getDayTotal(entries: TimeEntry[]) {
    const total = entries.reduce((sum, entry) => {
      const duration =
        (new Date(entry.endTime).getTime() - new Date(entry.startTime).getTime()) /
        (1000 * 60 * 60);
      return sum + duration;
    }, 0);
    return total.toFixed(1);
  }

  function handleTaskDragStart(taskId: string, event: any) {
    setDraggedTaskId(taskId);
    event.dataTransfer.setData('text/plain', taskId);
  }

  function handleTaskDragEnd() {
    setDraggedTaskId(null);
  }

  function createDraft(taskId: string, draftDate: string, startMinutes: number) {
    const start = clamp(START_HOUR * 60, startMinutes, END_HOUR * 60 - 30);
    const end = clamp(start + 60, start + MINUTE_STEP, END_HOUR * 60);
    setDrafts((prev) => [
      ...prev,
      {
        id: `${taskId}-${Date.now()}`,
        taskId,
        date: draftDate,
        startMinutes: start,
        endMinutes: end,
      },
    ]);
  }

  function handleDayDrop(event: any) {
    event.preventDefault();
    const taskId = event.dataTransfer.getData('text/plain') || draggedTaskId;
    if (!taskId || !timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const y = event.clientY - rect.top;
    const pxPerMinute = HOUR_HEIGHT / 60;
    const minutesFromStart = Math.round(y / pxPerMinute / MINUTE_STEP) * MINUTE_STEP;
    const startMinutes = START_HOUR * 60 + minutesFromStart;
    createDraft(taskId, date, startMinutes);
  }

  function handleWeekDrop(event: any, dropDate: string) {
    event.preventDefault();
    const taskId = event.dataTransfer.getData('text/plain') || draggedTaskId;
    if (!taskId) return;
    createDraft(taskId, dropDate, 9 * 60);
  }

  const viewLabel = {
    day: 'Dia',
    week: 'Semana',
    month: 'Mês',
    last30: 'Último mês',
  }[viewMode];

  const dayHours = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i);
  const entriesList = useMemo(() => Object.values(entriesByDate).flat(), [entriesByDate]);

  return (
    <ProtectedRoute>
      <InternshipCheck>
        <div className="app-layout">
          <Sidebar />

          <main className="app-main">
            <div className="max-w-[1500px] mx-auto px-8 py-8">
              <header className="mb-8 flex flex-col gap-2">
                <h1 className="text-3xl font-semibold text-gray-900">Registo de Horas</h1>
                <p className="text-gray-500">Planeia, arrasta tarefas e regista o teu tempo.</p>
              </header>

              <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-6 shadow-sm">
                <div className="flex flex-wrap items-center gap-4 justify-between">
                  <div className="flex items-center gap-2">
                    {(['day', 'week', 'month', 'last30'] as ViewMode[]).map((mode) => (
                      <button
                        key={mode}
                        onClick={() => setViewMode(mode)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                          viewMode === mode
                            ? 'bg-gray-900 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {{ day: 'Dia', week: 'Semana', month: 'Mês', last30: 'Último mês' }[mode]}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => shiftDate(-1)}
                      className="p-2 rounded-lg border border-gray-200 hover:bg-gray-100"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDate(today)}
                      className="px-3 py-2 text-sm font-medium rounded-lg border border-gray-200 hover:bg-gray-100"
                    >
                      Hoje
                    </button>
                    <button
                      onClick={() => shiftDate(1)}
                      className="p-2 rounded-lg border border-gray-200 hover:bg-gray-100"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    <input
                      type="date"
                      className="ml-2 border border-gray-200 rounded-lg px-3 py-2 text-sm"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-sm text-gray-500">{viewLabel} · {formatRange(range.start, range.end)}</div>
                    <button
                      onClick={saveDrafts}
                      disabled={!drafts.length || loading}
                      className="inline-flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" />
                      Guardar rascunhos
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
                    {error}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6">
                <aside className="bg-white rounded-2xl border border-gray-200 p-4 h-[calc(100vh-12rem)] sticky top-6 overflow-y-auto">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <Search className="w-4 h-4 text-gray-500" />
                    </div>
                    <input
                      type="text"
                      placeholder="Pesquisar tarefas"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm"
                    />
                  </div>

                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xs font-semibold uppercase text-gray-500 mb-3">Tarefas simples</h3>
                      <div className="space-y-2">
                        {filteredSimpleTasks.length === 0 && (
                          <p className="text-sm text-gray-400">Sem tarefas simples</p>
                        )}
                        {filteredSimpleTasks.map((task) => (
                          <div
                            key={task.id}
                            draggable
                            onDragStart={(event) => handleTaskDragStart(task.id, event)}
                            onDragEnd={handleTaskDragEnd}
                            className={`cursor-grab rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50 ${
                              draggedTaskId === task.id ? 'opacity-50' : ''
                            }`}
                          >
                            {task.title}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-xs font-semibold uppercase text-gray-500 mb-3">Projetos</h3>
                      {Object.keys(groupedProjectTasks).length === 0 && (
                        <p className="text-sm text-gray-400">Sem tarefas de projeto</p>
                      )}
                      <div className="space-y-4">
                        {Object.entries(groupedProjectTasks).map(([projectTitle, items]) => (
                          <div key={projectTitle}>
                            <p className="text-sm font-semibold text-gray-800 mb-2">{projectTitle}</p>
                            <div className="space-y-2">
                              {items.map((task) => (
                                <div
                                  key={task.id}
                                  draggable
                                  onDragStart={(event) => handleTaskDragStart(task.id, event)}
                                  onDragEnd={handleTaskDragEnd}
                                  className={`cursor-grab rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50 ${
                                    draggedTaskId === task.id ? 'opacity-50' : ''
                                  }`}
                                >
                                  {task.title}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </aside>

                <section className="space-y-6">
                  {viewMode === 'day' && (
                    <div className="bg-white rounded-2xl border border-gray-200 p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h2 className="text-lg font-semibold text-gray-900">
                            {new Date(`${date}T00:00:00`).toLocaleDateString('pt-PT', {
                              weekday: 'long',
                              day: 'numeric',
                              month: 'long',
                            })}
                          </h2>
                          <p className="text-sm text-gray-500">Arrasta tarefas para criar blocos no cronograma.</p>
                        </div>
                        <div className="text-sm text-gray-500">{getDayTotal(dayEntries)}h registadas</div>
                      </div>

                      <div
                        ref={timelineRef}
                        onDragOver={(event) => event.preventDefault()}
                        onDrop={handleDayDrop}
                        className="relative border border-dashed border-gray-200 rounded-xl overflow-hidden"
                        style={{ height: (END_HOUR - START_HOUR + 1) * HOUR_HEIGHT }}
                      >
                        <div className="absolute top-0 left-0 bottom-0 w-14 bg-white/80 border-r border-gray-100" />
                        {dayHours.map((hour) => (
                          <div
                            key={hour}
                            className="absolute left-0 right-0 border-t border-gray-100"
                            style={{ top: (hour - START_HOUR) * HOUR_HEIGHT }}
                          >
                            <span className="absolute left-2 top-1 text-xs font-semibold text-gray-500">
                              {`${String(hour).padStart(2, '0')}:00`}
                            </span>
                          </div>
                        ))}

                        {dayEntries.map((entry) => {
                          const start = new Date(entry.startTime);
                          const end = new Date(entry.endTime);
                          const override = entryOverrides[entry.id];
                          const startMinutes = override?.startMinutes ?? minutesFromDate(start);
                          const endMinutes = override?.endMinutes ?? minutesFromDate(end);
                          const top = ((startMinutes - START_HOUR * 60) / 60) * HOUR_HEIGHT;
                          const height = ((endMinutes - startMinutes) / 60) * HOUR_HEIGHT;
                          const safeTop = clamp(0, top, (END_HOUR - START_HOUR + 1) * HOUR_HEIGHT);
                          const safeHeight = Math.max(28, height);

                          return (
                            <div
                              key={entry.id}
                              onMouseDown={(event) =>
                                setDragAction({
                                  id: entry.id,
                                  type: 'entry',
                                  mode: 'move',
                                  startY: event.clientY,
                                  baseStart: startMinutes,
                                  baseEnd: endMinutes,
                                })
                              }
                              className="absolute left-16 right-6 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-sm cursor-grab"
                              style={{ top: safeTop, height: safeHeight }}
                            >
                              <div className="flex items-start justify-between">
                                <div>
                                  <div className="font-semibold text-blue-900">{entry.task.title}</div>
                                  <div className="text-xs text-blue-700">{formatMinutes(startMinutes)} - {formatMinutes(endMinutes)}</div>
                                </div>
                                <button
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    deleteEntry(entry.id);
                                  }}
                                  className="text-blue-700 hover:text-blue-900"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                              <div
                                onMouseDown={(event) => {
                                  event.stopPropagation();
                                  setDragAction({
                                    id: entry.id,
                                    type: 'entry',
                                    mode: 'resize',
                                    startY: event.clientY,
                                    baseStart: startMinutes,
                                    baseEnd: endMinutes,
                                  });
                                }}
                                className="absolute bottom-1 right-2 left-2 h-2 cursor-ns-resize bg-blue-200 rounded-full"
                              />
                            </div>
                          );
                        })}

                        {dayDrafts.map((draft) => {
                          const top = ((draft.startMinutes - START_HOUR * 60) / 60) * HOUR_HEIGHT;
                          const height = ((draft.endMinutes - draft.startMinutes) / 60) * HOUR_HEIGHT;
                          const task = tasks.find((t) => t.id === draft.taskId);
                          return (
                            <div
                              key={draft.id}
                              onMouseDown={(event) =>
                                setDragAction({
                                  id: draft.id,
                                  type: 'draft',
                                  mode: 'move',
                                  startY: event.clientY,
                                  baseStart: draft.startMinutes,
                                  baseEnd: draft.endMinutes,
                                })
                              }
                              className="absolute left-16 right-6 bg-gray-900 text-white rounded-lg px-3 py-2 text-sm shadow-lg cursor-grab"
                              style={{ top, height: Math.max(32, height) }}
                            >
                              <div className="flex items-start justify-between">
                                <div>
                                  <div className="font-semibold">{task?.title || 'Tarefa'}</div>
                                  <div className="text-xs text-gray-300">{formatMinutes(draft.startMinutes)} - {formatMinutes(draft.endMinutes)}</div>
                                </div>
                                <button
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    setDrafts((prev) => prev.filter((item) => item.id !== draft.id));
                                  }}
                                  className="text-xs text-gray-300 hover:text-white"
                                >
                                  Remover
                                </button>
                              </div>
                              <div
                                onMouseDown={(event) => {
                                  event.stopPropagation();
                                  setDragAction({
                                    id: draft.id,
                                    type: 'draft',
                                    mode: 'resize',
                                    startY: event.clientY,
                                    baseStart: draft.startMinutes,
                                    baseEnd: draft.endMinutes,
                                  });
                                }}
                                className="absolute bottom-1 right-2 left-2 h-2 cursor-ns-resize bg-white/30 rounded-full"
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {viewMode === 'week' && (
                    <div className="bg-white rounded-2xl border border-gray-200 p-6">
                      <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
                        {weekDays.map((day) => {
                          const dayEntries = entriesByDate[day] ?? [];
                          const dayDrafts = drafts.filter((draft) => draft.date === day);
                          const isSelected = day === date;
                          return (
                            <div
                              key={day}
                              onDragOver={(event) => event.preventDefault()}
                              onDrop={(event) => handleWeekDrop(event, day)}
                              className={`border rounded-xl p-3 min-h-[180px] ${
                                isSelected ? 'border-gray-900 bg-gray-50' : 'border-gray-200'
                              }`}
                            >
                              <button
                                onClick={() => setDate(day)}
                                className="text-left w-full"
                              >
                                <div className="text-xs text-gray-500 uppercase">
                                  {new Date(`${day}T00:00:00`).toLocaleDateString('pt-PT', { weekday: 'short' })}
                                </div>
                                <div className="text-lg font-semibold text-gray-900">
                                  {new Date(`${day}T00:00:00`).getDate()}
                                </div>
                                <div className="text-xs text-gray-500">{getDayTotal(dayEntries)}h</div>
                              </button>

                              <div className="mt-3 space-y-2">
                                {dayEntries.map((entry) => (
                                  <div
                                    key={entry.id}
                                    className="rounded-lg border border-gray-200 px-2 py-1 text-xs text-gray-700"
                                  >
                                    <div className="font-semibold">{entry.task.title}</div>
                                    <div>
                                      {new Date(entry.startTime).toLocaleTimeString('pt-PT', {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                      })}
                                    </div>
                                  </div>
                                ))}
                                {dayDrafts.map((draft) => {
                                  const task = tasks.find((t) => t.id === draft.taskId);
                                  return (
                                    <div
                                      key={draft.id}
                                      className="rounded-lg bg-gray-900 text-white px-2 py-1 text-xs"
                                    >
                                      <div className="font-semibold">{task?.title || 'Tarefa'}</div>
                                      <div>{formatMinutes(draft.startMinutes)}</div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {(viewMode === 'month' || viewMode === 'last30') && (
                    <div className="bg-white rounded-2xl border border-gray-200 p-6">
                      <div className="grid grid-cols-7 gap-3 text-xs text-gray-400 mb-2">
                        {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map((label) => (
                          <div key={label} className="text-center">
                            {label}
                          </div>
                        ))}
                      </div>
                      <div className="grid grid-cols-7 gap-3">
                        {calendarDays.map((day, index) => {
                          if (!day) {
                            return <div key={`empty-${index}`} className="h-24" />;
                          }
                          const dayEntries = entriesByDate[day] ?? [];
                          const total = getDayTotal(dayEntries);
                          const isToday = day === today;
                          return (
                            <button
                              key={day}
                              onClick={() => {
                                setDate(day);
                                setViewMode('day');
                              }}
                              className={`h-24 rounded-xl border text-left p-2 transition ${
                                isToday ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
                              }`}
                            >
                              <div className="text-sm font-semibold text-gray-900">{new Date(`${day}T00:00:00`).getDate()}</div>
                              <div className="text-xs text-gray-500 mt-2">{total}h</div>
                              <div className="text-[10px] text-gray-400 mt-1">{dayEntries.length} registos</div>
                            </button>
                          );
                        })}
                      </div>
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
