'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import Card from '@/components/ui/Card';
import ProtectedRoute from '@/components/ProtectedRoute';
import InternshipCheck from '@/components/InternshipCheck';
import { apiFetch } from '@/lib/api';

export default function ReportsPage() {
  const [period, setPeriod] = useState<'WEEK' | 'MONTH'>('WEEK');
  const [report, setReport] = useState('');
  const [loading, setLoading] = useState(false);

  async function generate() {
    setLoading(true);
    const data = await apiFetch(`/reports?period=${period}`);
    setReport(data.text);
    setLoading(false);
  }

  function copy() {
    navigator.clipboard.writeText(report);
    alert('Relatório copiado ✨');
  }

  return (
    <ProtectedRoute>
      <InternshipCheck>
        <div className="app-layout">
          <Sidebar />

          <main className="app-main">
            <div className="max-w-4xl mx-auto px-8 py-8 space-y-8">
        {/* HEADER */}
        <header>
          <h1 className="text-3xl font-semibold">Relatórios</h1>
          <p className="text-gray-500 mt-1">
            Gera um relatório pronto a enviar.
          </p>
        </header>

        {/* GENERATOR */}
        <Card>
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm text-gray-500 mb-1">
                Período
              </label>
              <select
                value={period}
                onChange={e => setPeriod(e.target.value as any)}
                className="w-full border border-gray-300 rounded-lg p-2"
              >
                <option value="WEEK">Semana atual</option>
                <option value="MONTH">Mês atual</option>
              </select>
            </div>

            <button
              onClick={generate}
              disabled={loading}
              className="bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition"
            >
              {loading ? 'A gerar…' : 'Gerar relatório'}
            </button>
          </div>
        </Card>

        {/* RESULT */}
        {report && (
          <Card>
            <textarea
              readOnly
              value={report}
              rows={10}
              className="w-full border border-gray-200 rounded-lg p-3 text-sm text-gray-800 resize-none"
            />

            <div className="flex justify-end mt-4">
              <button
                onClick={copy}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Copiar texto
              </button>
            </div>
          </Card>
        )}
            </div>
          </main>
        </div>
      </InternshipCheck>
    </ProtectedRoute>
  );
}
