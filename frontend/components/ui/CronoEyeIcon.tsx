import React from 'react';

interface EyeIconProps {
  isVisible: boolean;
  className?: string;
}

/**
 * Ícone de olho criativo inspirado no design do cronómetro
 * Usa formas circulares e precisão geométrica
 */
export function CronoEyeIcon({ isVisible, className = '' }: EyeIconProps) {
  if (isVisible) {
    // Olho aberto - design circular como um cronómetro
    return (
      <svg
        className={className}
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Contorno externo do olho */}
        <path
          d="M12 5C7 5 2.73 8.11 1 12.5C2.73 16.89 7 20 12 20C17 20 21.27 16.89 23 12.5C21.27 8.11 17 5 12 5Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Círculo externo da íris - como um cronómetro */}
        <circle
          cx="12"
          cy="12.5"
          r="3.5"
          stroke="currentColor"
          strokeWidth="2"
        />
        {/* Pupila - centro preciso */}
        <circle
          cx="12"
          cy="12.5"
          r="1.5"
          fill="currentColor"
        />
        {/* Ponteiro do cronómetro na pupila */}
        <line
          x1="12"
          y1="12.5"
          x2="12"
          y2="9.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    );
  } else {
    // Olho fechado - linha de tempo pausada
    return (
      <svg
        className={className}
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Contorno do olho fechado */}
        <path
          d="M12 5C7 5 2.73 8.11 1 12.5C2.73 16.89 7 20 12 20C17 20 21.27 16.89 23 12.5C21.27 8.11 17 5 12 5Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.4"
        />
        {/* Linha diagonal - cronómetro pausado/desativado */}
        <line
          x1="4"
          y1="4"
          x2="20"
          y2="20"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        {/* Círculos decorativos representando números do cronómetro */}
        <circle cx="8" cy="10" r="1" fill="currentColor" opacity="0.3" />
        <circle cx="16" cy="15" r="1" fill="currentColor" opacity="0.3" />
      </svg>
    );
  }
}
