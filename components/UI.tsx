import React from 'react';

export const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'success' }> = ({ 
  className = '', 
  variant = 'primary', 
  children, 
  ...props 
}) => {
  const baseStyle = "px-6 py-3 rounded-2xl font-bold text-lg transition-transform active:scale-95 shadow-[0_4px_0_rgb(0,0,0,0.2)] active:shadow-none active:translate-y-[4px]";
  
  const variants = {
    primary: "bg-blue-500 text-white hover:bg-blue-600",
    secondary: "bg-white text-blue-500 border-2 border-blue-100 hover:bg-blue-50",
    success: "bg-green-500 text-white hover:bg-green-600",
  };

  return (
    <button className={`${baseStyle} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

export const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`bg-white rounded-3xl shadow-xl border-4 border-blue-100 p-6 ${className}`}>
    {children}
  </div>
);

export const NumberBadge: React.FC<{ num: number | string; highlight?: boolean; color?: string }> = ({ num, highlight, color = "bg-gray-100" }) => (
  <span className={`inline-flex items-center justify-center min-w-[40px] h-[40px] px-2 rounded-lg text-2xl font-bold font-mono mx-0.5 ${highlight ? 'bg-yellow-300 scale-110 transform transition-transform' : color}`}>
    {num}
  </span>
);
