const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

import { Document, CreateDocumentDto, UpdateDocumentDto } from './types';
import { getToken } from './auth';

export async function apiFetch(
  path: string,
  options: RequestInit = {},
) {
  const token = getToken();

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });

  if (!res.ok) {
    let errorMessage = 'Erro inesperado';
    let errorDetails = null;
    
    try {
      const error = await res.json();
      if (typeof error.message === 'string') {
        errorMessage = error.message;
      } else if (Array.isArray(error.message)) {
        errorMessage = error.message[0];
      } else if (error.error) {
        errorMessage = error.error;
      }
      errorDetails = error;
    } catch (e) {
      errorMessage = `${res.status} ${res.statusText}`;
    }

    if (process.env.NODE_ENV === 'development') {
      console.error(`API Error (${res.status}):`, errorDetails || errorMessage);
    }

    throw new Error(errorMessage);
  }

  return res.json();
}

export const documentsApi = {
  getAll: async (filters?: { projectId?: string; taskId?: string }): Promise<Document[]> => {
    const params = new URLSearchParams();
    if (filters?.projectId) params.append('projectId', filters.projectId);
    if (filters?.taskId) params.append('taskId', filters.taskId);
    
    const query = params.toString();
    return apiFetch(`/documents${query ? `?${query}` : ''}`);
  },

  getOne: async (id: string): Promise<Document> => {
    return apiFetch(`/documents/${id}`);
  },

  create: async (data: CreateDocumentDto): Promise<Document> => {
    return apiFetch('/documents', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: string, data: UpdateDocumentDto): Promise<Document> => {
    return apiFetch(`/documents/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string): Promise<{ message: string }> => {
    return apiFetch(`/documents/${id}`, {
      method: 'DELETE',
    });
  },
};
