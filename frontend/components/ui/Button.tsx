import { ButtonHTMLAttributes } from 'react';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

export default function Button({ className = '', ...props }: ButtonProps) {
  return (
    <button
      {...props}
      className={`
        bg-gray-900 text-white
        px-4 py-2 rounded-lg
        hover:bg-gray-800
        transition
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
    />
  );
}
