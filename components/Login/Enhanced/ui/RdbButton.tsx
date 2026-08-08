"use client";
import React from 'react';

interface RdbButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline';
}

export default function RdbButton({
  onClick,
  children,
  className = '',
  variant = 'primary',
  disabled = false,
  ...rest
}: RdbButtonProps) {
  const baseClasses =
    "w-full max-w-[350px] cursor-pointer h-[50px] rounded-xl font-quicksand text-[14px] font-medium transition-all duration-200 flex items-center justify-center select-none active:scale-[0.98]";

  const variantClasses = {
    primary:
      "border border-[#70707026] bg-[#3066CC] text-white hover:bg-[#254E9E] shadow-sm disabled:opacity-50 disabled:cursor-not-allowed",
    secondary:
      "border border-[#70707026] bg-[#e7e3e326] text-[#404040] hover:bg-white border-[#707070] disabled:opacity-50 disabled:cursor-not-allowed",
    outline:
      "border border-[#3066CC] bg-transparent text-[#3066CC] hover:bg-[#3066CC]/5 disabled:opacity-50 disabled:cursor-not-allowed",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
