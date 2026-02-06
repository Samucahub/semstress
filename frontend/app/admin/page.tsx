'use client';

import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import ProtectedRoute from '@/components/ProtectedRoute';
import { apiFetch } from '@/lib/api';

type User = {
  id: string;
  name: string;
  email: string;
  role: 'USER' | 'ADMIN';
  createdAt: string;
};

export default function AdminPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    try {
      setError('');
      const data = await apiFetch('/admin/users');
      setUsers(data);
    } catch (err: any) {
      setError(err.message || 'Acesso negado');
    }
  }

  async function updateRole(userId: string, role: User['role']) {
    try {
      setError('');
      setLoading(true);
      await apiFetch(`/admin/users/${userId}`, {
        method: 'PATCH',
        body: JSON.stringify({ role }),
      });
      setLoading(false);
      loadUsers();
    } catch (err: any) {
      setLoading(false);
      setError(err.message || 'Erro ao atualizar role');
    }
  }

  async function removeUser(userId: string) {
    try {
      setError('');
      setLoading(true);
      await apiFetch(`/admin/users/${userId}`, { method: 'DELETE' });
      setLoading(false);
      loadUsers();
    } catch (err: any) {
      setLoading(false);
      setError(err.message || 'Erro ao remover utilizador');
    }
  }

  return (
    <ProtectedRoute>
      <div className="app-layout">
        <Sidebar />

        <main className="app-main">
          <div className="max-w-6xl mx-auto px-8 py-8 space-y-6">
        <header>
          <h1 className="text-3xl font-semibold">Admin</h1>
          <p className="text-gray-500 mt-1">Gerir utilizadores do sistema</p>
        </header>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded text-sm">
            {error}
          </div>
        )}

        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left">
                <tr className="border-b">
                  <th className="py-2">Nome</th>
                  <th className="py-2">Email</th>
                  <th className="py-2">Role</th>
                  <th className="py-2">Criado</th>
                  <th className="py-2"></th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b last:border-0">
                    <td className="py-2">{u.name}</td>
                    <td className="py-2">{u.email}</td>
                    <td className="py-2">
                      <select
                        value={u.role}
                        disabled={loading}
                        onChange={(e) => updateRole(u.id, e.target.value as User['role'])}
                        className="border rounded px-2 py-1"
                      >
                        <option value="USER">USER</option>
                        <option value="ADMIN">ADMIN</option>
                      </select>
                    </td>
                    <td className="py-2">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-2 text-right">
                      <Button
                        onClick={() => removeUser(u.id)}
                        className="bg-red-600 hover:bg-red-700"
                        disabled={loading}
                      >
                        Remover
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
