'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [requiresVerification, setRequiresVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const submitInProgressRef = useRef(false);

  async function submit(e?: React.FormEvent) {
    e?.preventDefault();
    
    // Previne múltiplas chamadas simultâneas
    if (submitInProgressRef.current) {
      return;
    }
    
    if (!username || !email || !password) {
      setError('Por favor, preenche todos os campos');
      return;
    }

    if (username.trim().length < 3) {
      setError('Username deve ter pelo menos 3 caracteres');
      return;
    }

    try {
      submitInProgressRef.current = true;
      setError('');
      setLoading(true);
      const res = await apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ username, email, password }),
      });
      setLoading(false);

      if (res.requiresVerification) {
        setRequiresVerification(true);
      }
    } catch (err: any) {
      const message = err.message || 'Erro ao criar conta';
      if (message.includes('email must be an email')) {
        setError('Por favor, insere um email válido');
      } else if (message.includes('password must be longer')) {
        setError('A password deve ter pelo menos 6 caracteres');
      } else if (message.includes('username') || message.includes('Username')) {
        setError(message);
      } else {
        setError(message);
      }
      setLoading(false);
    } finally {
      submitInProgressRef.current = false;
    }
  }

  async function handleVerifyEmail(e?: React.FormEvent) {
    e?.preventDefault();
    
    // Previne múltiplas chamadas simultâneas
    if (submitInProgressRef.current) {
      return;
    }
    
    if (!verificationCode) {
      setError('Por favor, insere o código de verificação');
      return;
    }

    try {
      submitInProgressRef.current = true;
      setError('');
      setLoading(true);
      await apiFetch('/auth/verify-email', {
        method: 'POST',
        body: JSON.stringify({ email, code: verificationCode }),
      });
      setLoading(false);
      router.push('/login');
    } catch (err: any) {
      setError(err.message || 'Código inválido');
      setLoading(false);
    } finally {
      submitInProgressRef.current = false;
    }
  }

  async function handleResendCode() {
    // Previne múltiplas chamadas simultâneas
    if (submitInProgressRef.current) {
      return;
    }
    
    try {
      submitInProgressRef.current = true;
      setError('');
      setLoading(true);
      await apiFetch('/auth/resend-code', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      setLoading(false);
      alert('Novo código enviado para o teu email');
    } catch (err: any) {
      setError(err.message || 'Erro ao reenviar código');
      setLoading(false);
    } finally {
      submitInProgressRef.current = false;
    }
  }

  function handleGoogleLogin() {
    window.location.href = '/api/auth/google';
  }

  function handleGithubLogin() {
    window.location.href = '/api/auth/github';
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4">
      <div className="w-full max-w-md">
        {/* LOGO / BRAND */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">CROMOMETRO</h1>
          <p className="text-gray-500 text-sm">Gestão de Estágios</p>
        </div>

        {/* REGISTER CARD */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-gray-900">Criar conta</h2>
            <p className="text-gray-500 text-sm mt-1">Começa a usar o CROMOMETRO</p>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-start gap-3">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {!requiresVerification ? (
            <>
              <form onSubmit={submit} className="space-y-4">
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                    Username
                  </label>
                  <input
                    id="username"
                    type="text"
                    placeholder="Mínimo 3 caracteres (ex: seu.nome)"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent transition"
                    required
                    autoComplete="username"
                    minLength={3}
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
                  <span className="px-4 bg-white text-gray-500">ou continua com</span>
                </div>
              </div>

              {/* OAUTH BUTTONS */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <button
                  onClick={handleGoogleLogin}
                  className="flex items-center justify-center gap-2 border border-gray-300 rounded-lg py-3 hover:bg-gray-50 transition font-medium text-sm"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Google
                </button>

                <button
                  onClick={handleGithubLogin}
                  className="flex items-center justify-center gap-2 border border-gray-300 rounded-lg py-3 hover:bg-gray-50 transition font-medium text-sm"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.868-.013-1.703-2.782.603-3.369-1.343-3.369-1.343-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.545 2.914 1.209.092-.937.349-1.546.635-1.9-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.647 0 0 .84-.27 2.75 1.025A9.578 9.578 0 0110 4.817c.85.004 1.705.114 2.504.336 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.578.688.48C17.138 18.192 20 14.435 20 10.017 20 4.484 15.522 0 10 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  GitHub
                </button>
              </div>

              {/* LOGIN LINK */}
              <Link
                href="/login"
                className="block w-full text-center border-2 border-gray-900 text-gray-900 rounded-lg py-3 font-medium hover:bg-gray-900 hover:text-white focus:ring-4 focus:ring-gray-300 transition"
              >
                Já tenho conta
              </Link>
            </>
          ) : (
            <form onSubmit={handleVerifyEmail} className="space-y-4">
              <p className="text-sm text-gray-600 mb-4">
                Enviámos um código de verificação para <span className="font-medium">{email}</span>
              </p>

              <div>
                <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
                  Código de Verificação
                </label>
                <input
                  id="code"
                  type="text"
                  placeholder="000000"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm text-center text-2xl font-mono focus:ring-2 focus:ring-gray-900 focus:border-transparent transition"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gray-900 text-white rounded-lg py-3 font-medium hover:bg-gray-800 focus:ring-4 focus:ring-gray-300 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'A verificar...' : 'Verificar Email'}
              </button>

              <button
                type="button"
                onClick={handleResendCode}
                disabled={loading}
                className="w-full text-gray-600 hover:text-gray-900 text-sm font-medium transition"
              >
                Não recebeste o código? Reenviar
              </button>

              <button
                type="button"
                onClick={() => {
                  setRequiresVerification(false);
                  setVerificationCode('');
                }}
                className="w-full text-gray-500 hover:text-gray-700 text-sm transition"
              >
                Voltar
              </button>
            </form>
          )}
        </div>

        {/* FOOTER */}
        <p className="text-center text-xs text-gray-500 mt-8">
          © 2026 CROMOMETRO. Gestão de estágios simplificada.
        </p>
      </div>
    </div>
  );
}
