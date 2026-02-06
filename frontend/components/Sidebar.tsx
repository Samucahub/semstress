'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getRole, logout } from '@/lib/auth';

export default function Sidebar() {
  const [role, setRole] = useState<string | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    setRole(getRole());
  }, []);

  const links = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/tasks', label: 'Tarefas' },
    { href: '/time-entries', label: 'Horas' },
    { href: '/reports', label: 'Relatórios' },
    { href: '/profile', label: 'Perfil' },
  ];

  if (role === 'ADMIN') {
    links.push({ href: '/admin', label: 'Admin' });
  }

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-200 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-xl font-semibold text-gray-900">SEMSTRESS</h1>
        <p className="text-xs text-gray-500 mt-1">Gestão de Estágios</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {links.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`
                flex items-center px-4 py-2.5 rounded-lg text-sm font-medium transition-colors
                ${
                  isActive
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }
              `}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={logout}
          className="w-full flex items-center px-4 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
        >
          Sair
        </button>
      </div>
    </aside>
  );
}
