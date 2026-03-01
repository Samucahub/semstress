'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { documentsApi } from '@/lib/api';
import { Document } from '@/lib/types';
import { MarkdownViewer } from '@/components/MarkdownViewer';
import Sidebar from '@/components/Sidebar';
import ProtectedRoute from '@/components/ProtectedRoute';
import InternshipCheck from '@/components/InternshipCheck';
import Link from 'next/link';
import { getCurrentUserId } from '@/lib/auth';
import { 
  ArrowLeft, 
  Edit2, 
  Trash2, 
  Pin, 
  FolderKanban, 
  CheckSquare,
  Tag,
  Calendar,
  User
} from 'lucide-react';

export default function DocumentViewPage() {
  const params = useParams();
  const router = useRouter();
  const [document, setDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (params.id) {
      loadDocument(params.id as string);
    }
  }, [params.id]);

  const loadDocument = async (id: string) => {
    try {
      setLoading(true);
      const data = await documentsApi.getOne(id);
      setDocument(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!document || !confirm('Tem certeza que deseja apagar este documento?')) return;

    try {
      await documentsApi.delete(document.id);
      router.push('/documents');
    } catch (err: any) {
      alert('Erro ao apagar documento: ' + err.message);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-PT', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <ProtectedRoute><InternshipCheck>
        <div className="flex">
          <Sidebar />
          <div className="flex-1 ml-20">
            <div className="flex items-center justify-center min-h-screen">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          </div>
        </div>
      </InternshipCheck></ProtectedRoute>
    );
  }

  if (error || !document) {
    return (
      <ProtectedRoute><InternshipCheck>
        <div className="flex">
          <Sidebar />
          <div className="flex-1 ml-20">
            <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-red-800 text-lg font-semibold mb-2">Erro ao carregar documento</h2>
          <p className="text-red-600">{error || 'Documento não encontrado'}</p>
          <Link
            href="/documents"
            className="inline-block mt-4 text-blue-600 hover:text-blue-800"
          >
            ← Voltar aos documentos
          </Link>
        </div>
            </div>
          </div>
        </div>
      </InternshipCheck></ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute><InternshipCheck>
      <div className="flex">
        <Sidebar />
        <div className="flex-1 ml-20">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/documents"
          className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar aos documentos
        </Link>

        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-900">{document.title}</h1>
              {document.isPinned && (
                <Pin className="w-6 h-6 text-yellow-500 fill-yellow-500" />
              )}
            </div>

            {/* Metadata */}
            <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
              <div className="flex items-center">
                <User className="w-4 h-4 mr-2" />
                <span>{document.author.name}</span>
              </div>
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                <span>{formatDate(document.createdAt)}</span>
              </div>
              {document.createdAt !== document.updatedAt && (
                <span className="text-gray-500">
                  (Atualizado em {formatDate(document.updatedAt)})
                </span>
              )}
            </div>

            {/* Associations */}
            <div className="flex flex-wrap gap-3 mb-4">
              {document.project && (
                <Link
                  href={`/projects/${document.project.id}`}
                  className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200"
                >
                  <FolderKanban className="w-4 h-4 mr-2" />
                  {document.project.title}
                </Link>
              )}
              {document.task && (
                <Link
                  href={
                    document.task.projectId
                      ? document.task.project?.isCollaborative
                        ? `/projects/${document.task.projectId}?taskId=${document.task.id}`
                        : `/tasks?taskId=${document.task.id}`
                      : `/simple-tasks?taskId=${document.task.id}`
                  }
                  className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-md hover:bg-green-200"
                >
                  <CheckSquare className="w-4 h-4 mr-2" />
                  {document.task.title}
                </Link>
              )}
            </div>

            {/* Tags */}
            {document.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {document.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-700 text-sm rounded-md"
                  >
                    <Tag className="w-3 h-3 mr-1" />
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-2 ml-4">
            {getCurrentUserId() === document.authorId && (
              <>
                <Link
                  href={`/documents/${document.id}/edit`}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  <Edit2 className="w-4 h-4 mr-2" />
                  Editar
                </Link>
                <button
                  onClick={handleDelete}
                  className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Apagar
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-lg shadow-md p-8">
        <MarkdownViewer content={document.content} />
      </div>
          </div>
        </div>
      </div>
    </InternshipCheck></ProtectedRoute>
  );
}
