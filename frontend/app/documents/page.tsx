'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { documentsApi } from '@/lib/api';
import { Document } from '@/lib/types';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import ProtectedRoute from '@/components/ProtectedRoute';
import InternshipCheck from '@/components/InternshipCheck';
import { getCurrentUserId } from '@/lib/auth';
import { 
  FileText, 
  Plus, 
  Pin, 
  Edit2, 
  Trash2, 
  FolderKanban, 
  CheckSquare,
  Tag
} from 'lucide-react';

function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const data = await documentsApi.getAll();
      setDocuments(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja apagar este documento?')) return;

    try {
      await documentsApi.delete(id);
      setDocuments(documents.filter(doc => doc.id !== id));
    } catch (err: any) {
      alert('Erro ao apagar documento: ' + err.message);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-PT', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <InternshipCheck>
          <div className="flex">
            <Sidebar />
            <div className="flex-1 ml-20">
              <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            </div>
          </div>
        </InternshipCheck>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <InternshipCheck>
      <div className="flex">
        <Sidebar />
        <div className="flex-1 ml-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Documentos</h1>
          <p className="mt-2 text-gray-600">
            Gerir documentação de projetos e tarefas
          </p>
        </div>
        <Link
          href="/documents/new"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          Novo Documento
        </Link>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md text-red-800">
          {error}
        </div>
      )}

      {documents.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nenhum documento encontrado
          </h3>
          <p className="text-gray-600 mb-4">
            Comece criando o seu primeiro documento
          </p>
          <Link
            href="/documents/new"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <Plus className="w-5 h-5 mr-2" />
            Criar Documento
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-200 overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center">
                    <FileText className="w-5 h-5 text-blue-600 mr-2" />
                    {doc.isPinned && (
                      <Pin className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    )}
                  </div>
                  <div className="flex space-x-2">
                    {getCurrentUserId() === doc.authorId && (
                      <>
                        <Link
                          href={`/documents/${doc.id}/edit`}
                          className="text-gray-600 hover:text-blue-600"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(doc.id)}
                          className="text-gray-600 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <Link href={`/documents/${doc.id}`}>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 hover:text-blue-600 cursor-pointer">
                    {doc.title}
                  </h3>
                </Link>

                <div className="space-y-2 mb-4">
                  {doc.project && (
                    <div className="flex items-center text-sm text-gray-600">
                      <FolderKanban className="w-4 h-4 mr-2" />
                      <span>{doc.project.title}</span>
                    </div>
                  )}
                  {doc.task && (
                    <div className="flex items-center text-sm text-gray-600">
                      <CheckSquare className="w-4 h-4 mr-2" />
                      <span>{doc.task.title}</span>
                    </div>
                  )}
                </div>

                {doc.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {doc.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md"
                      >
                        <Tag className="w-3 h-3 mr-1" />
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between text-sm text-gray-500 pt-4 border-t">
                  <span>{doc.author.name}</span>
                  <span>{formatDate(doc.createdAt)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
          </div>
        </div>
      </div>
      </InternshipCheck>
    </ProtectedRoute>
  );
}

export default function DocumentsPageWrapper() {
  return <DocumentsPage />;
}
