'use client';

import React, { useState, useEffect } from 'react';
import { FileText, Plus, X, Eye } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import Link from 'next/link';

interface Document {
  id: string;
  title: string;
  createdAt: string;
}

interface TaskDocument {
  id: string;
  title: string;
  author: {
    name: string;
  };
  createdAt: string;
}

type Priority = 'LOW' | 'MEDIUM' | 'HIGH';

interface Task {
  id: string;
  title: string;
  description?: string;
  priority?: Priority;
  statusId: string;
  projectId?: string;
  documents?: TaskDocument[];
}

interface Status {
  id: string;
  name: string;
}

interface Project {
  id: string;
  title: string;
}

export default function TaskDialog({
  mode,
  task,
  statuses,
  projects,
  onClose,
  onSave,
}: {
  mode: 'create' | 'edit';
  task?: Task;
  statuses: Status[];
  projects: Project[];
  onClose: () => void;
  onSave: (data: Partial<Task>) => void;
}) {
  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [statusId, setStatusId] = useState(task?.statusId || statuses[0]?.id || '');
  const [projectId, setProjectId] = useState(task?.projectId || '');
  const [priority, setPriority] = useState<Priority>(task?.priority || 'MEDIUM');
  const [documents, setDocuments] = useState<TaskDocument[]>([]);
  const [availableDocuments, setAvailableDocuments] = useState<Document[]>([]);
  const [showDocumentSelect, setShowDocumentSelect] = useState(false);
  const [loadingDocuments, setLoadingDocuments] = useState(false);

  useEffect(() => {
    if (mode === 'edit' && task?.id) {
      console.log('[TaskDialog] Loading task:', task?.id, 'Documents:', task?.documents);
      setDocuments(task?.documents || []);
    }
  }, [mode, task?.id, task?.documents]);

  useEffect(() => {
    if (mode === 'edit' && task?.id) {
      loadAvailableDocuments();
    }
  }, [mode, task?.id]);

  const loadAvailableDocuments = async () => {
    try {
      setLoadingDocuments(true);
      const data = await apiFetch('/documents');
      const attached = documents.map(d => d.id);
      const available = data.filter((doc: Document) => !attached.includes(doc.id));
      setAvailableDocuments(available);
    } catch (err) {
      console.error('Erro ao carregar documentos:', err);
    } finally {
      setLoadingDocuments(false);
    }
  };

  const handleAddDocument = async (docId: string) => {
    try {
      const selectedDoc = availableDocuments.find(d => d.id === docId);
      if (!selectedDoc) return;

      await apiFetch(`/documents/${docId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          taskId: task?.id,
        }),
      });

      setDocuments([
        ...documents,
        {
          id: selectedDoc.id,
          title: selectedDoc.title,
          author: { name: 'Você' },
          createdAt: selectedDoc.createdAt,
        },
      ]);

      setAvailableDocuments(availableDocuments.filter(d => d.id !== docId));
    } catch (err: any) {
      console.error('Erro ao adicionar documento:', err);
      alert('Erro ao adicionar documento: ' + err.message);
    }
  };

  const handleRemoveDocument = async (docId: string) => {
    try {
      await apiFetch(`/documents/${docId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          taskId: null,
        }),
      });

      const removed = documents.find(d => d.id === docId);
      setDocuments(documents.filter(d => d.id !== docId));

      if (removed) {
        setAvailableDocuments([
          ...availableDocuments,
          {
            id: removed.id,
            title: removed.title,
            createdAt: removed.createdAt,
          },
        ]);
      }
    } catch (err: any) {
      console.error('Erro ao remover documento:', err);
      alert('Erro ao remover documento: ' + err.message);
    }
  };

  function handleSubmit() {
    onSave({ title, description, statusId, projectId: projectId || undefined, priority });
  }

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white border border-gray-200 rounded-xl p-8 w-[600px] max-h-[90vh] overflow-y-auto shadow-lg">
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
            <label className="block text-sm font-semibold text-gray-700 mb-2">Projeto</label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent transition-all"
            >
              <option value="">Sem projeto</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
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
            <label className="block text-sm font-semibold text-gray-700 mb-2">Prioridade</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as Priority)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent transition-all"
            >
              <option value="LOW">Baixa</option>
              <option value="MEDIUM">Média</option>
              <option value="HIGH">Alta</option>
            </select>
          </div>

          {mode === 'edit' && task?.id && (
            <div className="pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Documentos
                </label>
                {availableDocuments.length > 0 && (
                  <button
                    onClick={() => setShowDocumentSelect(!showDocumentSelect)}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    Adicionar
                  </button>
                )}
              </div>

              {documents.length > 0 ? (
                <div className="space-y-2 mb-4">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <FileText className="w-4 h-4 text-blue-600 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{doc.title}</p>
                          <p className="text-xs text-gray-600">
                            por {doc.author.name} · {new Date(doc.createdAt).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/documents/${doc.id}`}
                          className="p-1 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                          title="Visualizar documento"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleRemoveDocument(doc.id)}
                          className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
                          title="Remover documento"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 mb-4">Nenhum documento anexado</p>
              )}

              {showDocumentSelect && availableDocuments.length > 0 && (
                <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <label className="block text-xs font-semibold text-gray-700 mb-2">
                    Selecione um documento para anexar:
                  </label>
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        handleAddDocument(e.target.value);
                        e.target.value = '';
                      }
                    }}
                    disabled={loadingDocuments}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent transition-all disabled:opacity-50"
                  >
                    <option value="">
                      {loadingDocuments ? 'Carregando...' : 'Escolher documento'}
                    </option>
                    {availableDocuments.map((doc) => (
                      <option key={doc.id} value={doc.id}>
                        {doc.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {availableDocuments.length === 0 && documents.length === 0 && (
                <p className="text-xs text-gray-500">
                  Nenhum documento disponível. {' '}
                  <Link href="/documents/new" className="text-blue-600 hover:text-blue-700 font-medium">
                    Criar novo
                  </Link>
                </p>
              )}
            </div>
          )}
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
