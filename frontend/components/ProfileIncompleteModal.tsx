'use client';

import { useState, useEffect } from 'react';
import { AlertCircle, ArrowRight } from 'lucide-react';

interface ProfileIncompleteModalProps {
  isOpen: boolean;
  onClose?: () => void;
  onNavigateToProfile?: () => void;
}

export default function ProfileIncompleteModal({
  isOpen,
  onClose,
  onNavigateToProfile,
}: ProfileIncompleteModalProps) {
  const [showModal, setShowModal] = useState(isOpen);

  useEffect(() => {
    setShowModal(isOpen);
  }, [isOpen]);

  if (!showModal) return null;

  const handleClose = () => {
    setShowModal(false);
    onClose?.();
  };

  const handleNavigate = () => {
    onNavigateToProfile?.();
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl border border-cyan-200 p-8 w-96 shadow-2xl shadow-cyan-500/10 max-w-[90vw]">
        {/* Header */}
        <div className="flex items-start gap-4 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-cyan-50 to-blue-50 rounded-full flex items-center justify-center flex-shrink-0 border border-cyan-200">
            <AlertCircle className="w-6 h-6 text-cyan-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Perfil Incompleto</h3>
            <p className="text-sm text-gray-500 mt-1">Completa o teu perfil para continuares</p>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-4 mb-8">
          <div className="bg-gradient-to-br from-cyan-50 to-blue-50 border border-cyan-100 rounded-xl p-4">
            <p className="text-sm text-gray-700 leading-relaxed">
              Precisamos de algumas informações essenciais para que possas aceder ao dashboard e a outras funcionalidades. Não demora mais de 2 minutos!
            </p>
          </div>

          {/* Info items */}
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <div className="w-2 h-2 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex-shrink-0"></div>
              <span className="text-gray-700">Informações pessoais e profissionais</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-2 h-2 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex-shrink-0"></div>
              <span className="text-gray-700">Dados do estágio (empresa, instituto, datas)</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-2 h-2 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex-shrink-0"></div>
              <span className="text-gray-700">Horas totais previstas</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleNavigate}
            className="w-full px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20"
          >
            Completar Perfil Agora
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
