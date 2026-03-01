'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getToken, logout } from '@/lib/auth';
import { getFoundMembers, MEMBERS, type MemberId } from '@/lib/antixerox';

const MEMBER_ORDER: MemberId[] = ['rafa', 'samu', 'rodri', 'ze'];

const MEMBER_COLORS: Record<MemberId, { text: string; bg: string; border: string }> = {
  rafa: { text: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/30' },
  samu: { text: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30' },
  ze: { text: 'text-white', bg: 'bg-white/10', border: 'border-white/20' },
  rodri: { text: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30' },
};

export default function AboutPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [foundMembers, setFoundMembers] = useState<MemberId[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setIsLoggedIn(!!getToken());
    setFoundMembers(getFoundMembers());
  }, []);

  useEffect(() => {
    function onFocus() {
      setFoundMembers(getFoundMembers());
    }

    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  if (!mounted) {
    return null;
  }

  const foundCount = foundMembers.length;

  return (
    <div className="min-h-screen bg-[#0b0f1a] text-white">
      <nav className="flex items-center justify-between px-8 py-5 border-b border-[#1f2937] bg-[#0b0f1a]/95">
        <Link href={isLoggedIn ? '/dashboard' : '/'} className="text-xl font-bold tracking-[0.2em] text-[#0bb3b3]">
          CROMÓMETRO
        </Link>

        <div className="flex items-center gap-4">
          {isLoggedIn ? (
            <>
              <Link href="/dashboard" className="text-sm text-gray-400 hover:text-white transition">
                Dashboard
              </Link>
              <button
                onClick={logout}
                className="text-sm bg-red-600 hover:bg-red-500 px-4 py-2 rounded-md font-medium transition"
              >
                Sair
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm text-gray-400 hover:text-white transition">
                Entrar
              </Link>
              <Link
                href="/register"
                className="text-sm bg-[#0bb3b3] hover:bg-[#0e9a9a] px-4 py-2 rounded-md font-medium transition"
              >
                Criar conta
              </Link>
            </>
          )}
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-16">
        <div className="text-center mb-14">
          <p className="text-sm text-[#0bb3b3] font-mono mb-2">about --team</p>
          <h1 className="text-5xl md:text-7xl font-black tracking-tight text-red-500">AntiXerox</h1>
          <div className="flex items-center justify-center gap-3 text-gray-500 text-sm font-mono mt-3">
            <span className="text-[#0bb3b3]">$</span>
            <span>whoami</span>
          </div>
        </div>

        <div className="relative">
          <div className="rounded-xl border border-[#1f2937] bg-[#0f172a] shadow-2xl overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-[#1f2937] bg-[#111827]">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="ml-3 text-xs text-gray-500 font-mono">antixerox@cromometro:~</span>
            </div>

            <div className="p-8 font-mono text-sm leading-relaxed space-y-4">
              <div className="flex gap-2">
                <span className="text-[#0bb3b3] shrink-0">antixerox@cromometro:~$</span>
                <span className="text-gray-300">cat /etc/motd</span>
              </div>

              <div className="space-y-3">
                <p className="text-gray-400">
                  <span className="text-yellow-400">[!]</span> Achas que é assim tão fácil?
                </p>
                <p className="text-gray-300">
                  Os <span className="text-red-400 font-bold">AntiXerox</span> são hackers de renome e para saber mais sobre nós tens de encontrar as{' '}
                  <span className="text-red-400 font-bold">vulnerabilidades</span> espalhadas pelo site!
                </p>
              </div>

              <div className="border-t border-[#1f2937] pt-4 space-y-2">
                <div className="flex gap-2">
                  <span className="text-[#0bb3b3] shrink-0">antixerox@cromometro:~$</span>
                  <span className="text-gray-300">ls ./members/</span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {MEMBER_ORDER.map((memberId) => {
                    const isFound = foundMembers.includes(memberId);
                    const member = MEMBERS[memberId];
                    const colors = MEMBER_COLORS[memberId];

                    if (isFound) {
                      return (
                        <div
                          key={memberId}
                          className={`${colors.bg} border ${colors.border} rounded-lg p-4 text-center space-y-2`}
                        >
                          <div className={`w-12 h-12 mx-auto rounded-full overflow-hidden border ${colors.border}`}>
                            <img src={member.image} alt={member.alias} className="w-full h-full object-cover" />
                          </div>
                          <p className={`text-xs font-bold ${colors.text} truncate`}>{member.alias}</p>
                          <p className={`text-[10px] ${colors.text} opacity-70`}>{member.role}</p>
                        </div>
                      );
                    }

                    return (
                      <div key={memberId} className="bg-[#0b1220] border border-[#1f2937] rounded-lg p-4 text-center space-y-2">
                        <div className="w-12 h-12 mx-auto bg-[#1f2937] rounded-full flex items-center justify-center">
                          <span className="text-gray-500 text-lg">?</span>
                        </div>
                        <p className="text-gray-500 text-xs">LOCKED</p>
                        <p className="text-gray-600 text-[10px]">Vulnerabilidade #{member.vulnNumber}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="border-t border-[#1f2937] pt-4 space-y-2">
                <div className="flex gap-2">
                  <span className="text-[#0bb3b3] shrink-0">antixerox@cromometro:~$</span>
                  <span className="text-gray-300">echo &quot;Progresso: {foundCount}/4&quot;</span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 bg-[#111827] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-red-500 to-rose-500 rounded-full transition-all duration-500"
                      style={{ width: `${(foundCount / 4) * 100}%` }}
                    />
                  </div>
                  <span className="text-gray-400 text-xs">{foundCount}/4</span>
                </div>

                {foundCount === 4 && (
                  <p className="text-green-400 text-xs">Parabéns, por perderes o teu tempo em vez de apontar as tuas horas de estágio!</p>
                )}
              </div>

              <div className="border-t border-[#1f2937] pt-4 space-y-2">
                <div className="flex gap-2">
                  <span className="text-[#0bb3b3] shrink-0">antixerox@cromometro:~$</span>
                  <span className="text-gray-300">echo &quot;Boa sorte... vais precisar.&quot;</span>
                </div>
                <p className="text-yellow-400/80 italic">Boa sorte... vais precisar.</p>
              </div>

              <div className="flex gap-2 items-center">
                <span className="text-[#0bb3b3] shrink-0">antixerox@cromometro:~$</span>
                <span className="w-2 h-5 bg-[#0bb3b3] animate-pulse" />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-14 text-center space-y-3">
          <p className="text-gray-500 text-sm font-mono">
            <span className="text-[#0bb3b3]">HINT:</span> Pensa como um hacker. Testa, explora, e não confies em nada.
          </p>
          <p className="text-gray-600 text-xs font-mono">4 membros • 4 vulnerabilidades • 0 pistas fáceis</p>
        </div>

        <div className="mt-14 text-center">
          <Link
            href={isLoggedIn ? '/dashboard' : '/'}
            className="inline-flex items-center gap-2 text-gray-500 hover:text-[#0bb3b3] text-sm font-mono transition"
          >
            <span>←</span>
            cd /home
          </Link>
        </div>
      </main>

      <footer className="border-t border-[#1f2937] py-6 text-center">
        <p className="text-xs text-gray-600 font-mono">
          © 2026 CROMÓMETRO • <span className="text-red-500/70">AntiXerox</span>
        </p>
      </footer>
    </div>
  );
}
