'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { markMemberFound, getFoundCount } from '@/lib/antixerox';

export default function AntiXeroxSecretPage() {
  const [revealed, setRevealed] = useState(false);
  const [glitch, setGlitch] = useState(true);

  useEffect(() => {
    // Mark Zé as found
    markMemberFound('ze');

    // Glitch animation then reveal
    const timer = setTimeout(() => {
      setGlitch(false);
      setRevealed(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black flex items-center justify-center p-6">
      {/* Glitch intro */}
      {glitch && (
        <div className="text-center space-y-4 animate-pulse">
          <div className="font-mono text-white text-lg space-y-1">
            <p className="opacity-80">[ACESSO NÃO AUTORIZADO]</p>
            <p className="text-sm text-white/60">A verificar credenciais...</p>
            <p className="text-sm text-white/60">Origem: view-source://inspecionar</p>
          </div>
          <div className="w-48 h-1 bg-gray-800 rounded-full mx-auto overflow-hidden">
            <div className="h-full bg-white rounded-full" style={{
              animation: 'loading 2s ease-in-out forwards',
            }} />
          </div>
          <style jsx>{`
            @keyframes loading {
              0% { width: 0%; }
              100% { width: 100%; }
            }
          `}</style>
        </div>
      )}

      {/* Reveal */}
      {revealed && (
        <div className="max-w-md w-full space-y-6 animate-in">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5">
              <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
              <span className="text-white text-xs font-mono uppercase tracking-widest">Vulnerabilidade #4 — Source Inspection!</span>
            </div>

            <h2 className="text-2xl font-bold text-white">
              Fogo nem eu tinha a paciência de procurar!
            </h2>
            <p className="text-gray-400 leading-relaxed">
              A maioria das pessoas nunca olha para o <span className="text-white font-semibold">código-fonte</span> de uma página...
            </p>
            <p className="text-gray-400">
              Mas tu não és a maioria! Prazer, sou o{' '}
              <span className="text-white font-bold">ManWithThatHat</span>, o{' '}
              <span className="italic">Designer</span> do grupo!
            </p>
          </div>

          {/* Card */}
          <div className="bg-gray-800/60 backdrop-blur-sm rounded-2xl border border-white/20 overflow-hidden shadow-2xl shadow-white/10">
            {/* Avatar + Info */}
            <div className="p-6 flex items-center gap-5">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-200 via-white to-gray-300 flex items-center justify-center shrink-0 shadow-lg shadow-white/30">
                <svg className="w-8 h-8 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-white/60 text-xs font-mono uppercase tracking-wider mb-1">
                  &lt;!-- hidden in source --&gt;
                </p>
                <h3 className="text-xl font-bold text-white truncate">ManWithThatHat</h3>
                <p className="text-gray-400 text-sm">
                  O <span className="text-white font-semibold">Designer</span> do grupo
                </p>
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

            {/* GitHub Link */}
            <div className="p-4">
              <a
                href="https://github.com/ManWithThatHat"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 bg-gray-900/50 hover:bg-gray-900 border border-gray-700/50 hover:border-white/40 rounded-xl px-5 py-3.5 transition-all group"
              >
                <svg className="w-5 h-5 text-gray-400 group-hover:text-white transition shrink-0" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-300 text-sm font-medium group-hover:text-white transition flex-1">github.com/ManWithThatHat</span>
                <svg className="w-4 h-4 text-gray-600 group-hover:text-white group-hover:translate-x-1 transition-all shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>
            </div>
          </div>

          {/* Close & hint */}
          <div className="text-center space-y-3">
            <p className="text-gray-600 text-sm font-mono">
              <span className="text-white">{getFoundCount()}</span>/4 membros encontrados
            </p>
            <Link
              href="/about"
              className="inline-block text-gray-500 hover:text-white text-sm font-mono transition"
            >
              [Ver equipa] — Volta à página About
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
