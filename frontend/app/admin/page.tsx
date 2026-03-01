'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { markMemberFound, getFoundCount } from '@/lib/antixerox';

export default function FakeAdminPage() {
    // Função para baixar backup
    async function handleBackup() {
      try {
        const res = await fetch('/api/admin/backup');
        const result = await res.json();
        if (result.file && result.filename) {
          const link = document.createElement('a');
          link.href = `data:${result.mimetype};base64,${result.file}`;
          link.download = result.filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        } else {
          alert('Falha ao gerar backup.');
        }
      } catch (err) {
        alert('Erro ao baixar backup.');
      }
    }
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [foundCount, setFoundCount] = useState(0);

  useEffect(() => {
    setFoundCount(getFoundCount());
  }, []);

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    setTimeout(() => {
      setLoading(false);

      if (username === 'admin' && password === 'admin123') {
        markMemberFound('rafa');
        setFoundCount(getFoundCount());
        setRevealed(true);
      } else {
        setError('Credenciais inválidas. Tenta novamente.');
      }
    }, 1500);
  }

  // REVEAL PAGE — 0xadamastor (Cyan)
  if (revealed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black flex items-center justify-center p-6">
        <div className="max-w-md w-full space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full px-4 py-1.5">
              <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
              <span className="text-cyan-400 text-xs font-mono uppercase tracking-widest">Vulnerabilidade #1 — Weak Credentials!</span>
            </div>

            <h1 className="text-3xl md:text-4xl font-bold text-white leading-tight">
              Apanhaste-me!
            </h1>
            <p className="text-gray-400 text-lg leading-relaxed">
              Não sou o admin, até porque{' '}
              <span className="text-cyan-400 font-semibold">nunca teria uma password tão fraca</span>.
            </p>
            <p className="text-gray-400">
                Prazer em conhecer-te, sou o{' '}
                <span className="text-cyan-400 font-bold">0xAdamastor</span>, o Cibersegurança do grupo!
              </p>
          </div>

          {/* Member Card */}
          <div className="bg-gray-800/60 backdrop-blur-sm rounded-2xl border border-cyan-500/20 overflow-hidden shadow-2xl shadow-cyan-500/10">
            {/* Avatar + Info */}
            <div className="p-6 flex items-center gap-5">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-400 to-teal-500 flex items-center justify-center shrink-0 shadow-lg shadow-cyan-500/30">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-cyan-400 text-xs font-mono uppercase tracking-wider mb-1">admin123</p>
                <h2 className="text-xl font-bold text-white truncate">0xadamastor</h2>
                <p className="text-gray-400 text-sm">
                  O <span className="text-cyan-400 font-semibold">Cibersegurança</span> do grupo
                </p>
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />

            {/* GitHub Link */}
            <div className="p-4">
              <a
                href="https://github.com/0xadamastor"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 bg-gray-900/50 hover:bg-gray-900 border border-gray-700/50 hover:border-cyan-500/40 rounded-xl px-5 py-3.5 transition-all group"
              >
                <svg className="w-5 h-5 text-gray-400 group-hover:text-cyan-400 transition shrink-0" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-300 text-sm font-medium group-hover:text-cyan-400 transition flex-1">github.com/0xadamastor</span>
                <svg className="w-4 h-4 text-gray-600 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center space-y-3">
            <p className="text-gray-600 text-sm font-mono">
              <span className="text-cyan-400">{foundCount}</span>/4 membros encontrados
            </p>
            <Link
              href="/about"
              className="inline-flex items-center gap-2 text-gray-500 hover:text-cyan-400 text-sm font-mono transition group"
            >
              <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Voltar ao About
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // FAKE LOGIN PAGE
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 bg-gray-900 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Painel de Administração</h1>
          <p className="text-gray-500 text-sm">Acesso restrito. Introduz as tuas credenciais.</p>
        </div>

        <form onSubmit={handleLogin} className="bg-white rounded-2xl border border-gray-200 p-8 shadow-lg space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="admin" className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent" required />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-gray-900 text-white rounded-lg py-3 font-medium hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                A verificar...
              </span>
            ) : 'Entrar'}
          </button>
        </form>

        <div className="text-center">
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-900 transition">← Voltar ao site</Link>
        </div>
      </div>
    </div>
  );
}

