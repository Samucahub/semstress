import { InputHTMLAttributes } from 'react';

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export default function Input({ className = '', ...props }: InputProps) {
  return (
    <input
      {...props}
      className={`
        w-full
        border border-gray-300
        rounded-lg
        p-2
        text-sm
        focus:border-gray-400
        ${className}
      `}
    />
  );
}
