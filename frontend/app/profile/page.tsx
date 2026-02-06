'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import ProtectedRoute from '@/components/ProtectedRoute';
import { apiFetch } from '@/lib/api';

type Internship = {
  id: string;
  company: string;
  institute: string;
  companyMentor?: string;
  instituteMentor?: string;
  totalHours?: number;
  startDate: string;
  endDate: string;
};

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [company, setCompany] = useState('');
  const [institute, setInstitute] = useState('');
  const [companyMentor, setCompanyMentor] = useState('');
  const [instituteMentor, setInstituteMentor] = useState('');
  const [totalHours, setTotalHours] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    loadInternship();
  }, []);

  async function loadInternship() {
    try {
      const data: Internship = await apiFetch('/internship');
      if (data) {
        setCompany(data.company);
        setInstitute(data.institute);
        setCompanyMentor(data.companyMentor || '');
        setInstituteMentor(data.instituteMentor || '');
        setTotalHours(data.totalHours?.toString() || '');
        setStartDate(data.startDate.split('T')[0]);
        setEndDate(data.endDate.split('T')[0]);
      }
    } catch (err) {
      // Internship não existe ainda
    }
  }

  async function submit() {
    if (!company.trim() || !institute.trim() || !startDate || !endDate) {
      setError('Preenche os campos obrigatórios');
      return;
    }

    try {
      setError('');
      setSuccess('');
      setLoading(true);

      await apiFetch('/internship', {
        method: 'POST',
        body: JSON.stringify({
          company,
          institute,
          companyMentor: companyMentor || undefined,
          instituteMentor: instituteMentor || undefined,
          totalHours: totalHours ? parseInt(totalHours) : undefined,
          startDate: `${startDate}T00:00:00.000Z`,
          endDate: `${endDate}T23:59:59.999Z`,
        }),
      });

      setLoading(false);
      setSuccess('Dados de estágio guardados!');
    } catch (err: any) {
      setLoading(false);
      setError(err.message || 'Erro ao guardar');
    }
  }

  return (
    <ProtectedRoute>
      <div className="app-layout">
        <Sidebar />

        <main className="app-main">
          <div className="max-w-4xl mx-auto px-8 py-8">
            {/* HEADER */}
            <header className="mb-8">
              <h1 className="text-3xl font-semibold text-gray-900">Perfil de Estágio</h1>
              <p className="text-gray-500 mt-1">Configura os dados do teu estágio</p>
            </header>

            {/* MESSAGES */}
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}
            {success && (
              <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
                {success}
              </div>
            )}

            <div className="space-y-6">
              {/* INFORMAÇÕES DA EMPRESA */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">Informações da Empresa</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nome da Empresa <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: TechCorp"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Orientador na Empresa
                    </label>
                    <input
                      type="text"
                      placeholder="Nome do orientador (opcional)"
                      value={companyMentor}
                      onChange={(e) => setCompanyMentor(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* INFORMAÇÕES DO INSTITUTO */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">Informações do Instituto</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nome do Instituto <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: ISCTE"
                      value={institute}
                      onChange={(e) => setInstitute(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Orientador no Instituto
                    </label>
                    <input
                      type="text"
                      placeholder="Nome do orientador (opcional)"
                      value={instituteMentor}
                      onChange={(e) => setInstituteMentor(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* PERÍODO E DURAÇÃO */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">Período e Duração</h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Data de Início <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Data de Fim <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Total de Horas Previstas
                    </label>
                    <input
                      type="number"
                      placeholder="Ex: 500 horas (opcional)"
                      value={totalHours}
                      onChange={(e) => setTotalHours(e.target.value)}
                      min="1"
                      className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">Total de horas que deves cumprir no estágio</p>
                  </div>
                </div>
              </div>

              {/* ACTIONS */}
              <div className="flex justify-end">
                <button
                  onClick={submit}
                  disabled={loading}
                  className="bg-gray-900 text-white rounded-lg px-6 py-2.5 font-medium hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'A guardar…' : 'Guardar Alterações'}
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
