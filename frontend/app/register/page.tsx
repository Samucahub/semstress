'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit(e?: React.FormEvent) {
    e?.preventDefault();
    if (!name || !email || !password) {
      setError('Por favor, preenche todos os campos');
      return;
    }

    try {
      setError('');
      setLoading(true);
      await apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password }),
      });
      setLoading(false);

      router.push('/login');
    } catch (err: any) {
      const message = err.message || 'Erro ao criar conta';
      // Improve validation error messages
      if (message.includes('email must be an email')) {
        setError('Por favor, insere um email válido');
      } else if (message.includes('password must be longer')) {
        setError('A password deve ter pelo menos 6 caracteres');
      } else {
        setError(message);
      }
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4">
      <div className="w-full max-w-md">
        {/* LOGO / BRAND */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">SEMSTRESS</h1>
          <p className="text-gray-500 text-sm">Gestão de Estágios</p>
        </div>

        {/* REGISTER CARD */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-gray-900">Criar conta</h2>
            <p className="text-gray-500 text-sm mt-1">Começa a usar o SEMSTRESS</p>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-start gap-3">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Nome Completo
              </label>
              <input
                id="name"
                type="text"
                placeholder="O teu nome"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent transition"
                required
                autoComplete="name"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="teu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent transition"
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent transition"
                required
                autoComplete="new-password"
                minLength={6}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gray-900 text-white rounded-lg py-3 font-medium hover:bg-gray-800 focus:ring-4 focus:ring-gray-300 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'A criar conta...' : 'Criar conta'}
            </button>
          </form>

          {/* DIVIDER */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">ou</span>
            </div>
          </div>

          {/* LOGIN LINK */}
          <Link
            href="/login"
            className="block w-full text-center border-2 border-gray-900 text-gray-900 rounded-lg py-3 font-medium hover:bg-gray-900 hover:text-white focus:ring-4 focus:ring-gray-300 transition"
          >
            Já tenho conta
          </Link>
        </div>

        {/* FOOTER */}
        <p className="text-center text-xs text-gray-500 mt-8">
          © 2026 SEMSTRESS. Gestão de estágios simplificada.
        </p>
      </div>
    </div>
  );
}
