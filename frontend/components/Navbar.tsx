'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getRole, logout } from '@/lib/auth';

export default function Navbar() {
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    setRole(getRole());
  }, []);

  return (
    <nav className="flex justify-between items-center p-4 border-b">
      <span className="font-bold">SEMSTRESS</span>

      <div className="flex gap-4">
        <Link href="/dashboard">Dashboard</Link>
        <Link href="/tasks">Tarefas</Link>
        <Link href="/time-entries">Horas</Link>
        <Link href="/reports">Relatórios</Link>
        <Link href="/profile">Perfil</Link>
        {role === 'ADMIN' && <Link href="/admin">Admin</Link>}
        <button onClick={logout} className="text-red-500">
          Sair
        </button>
      </div>
    </nav>
  );
}
