import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'success' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  icon,
  ...props
}) => {
  const baseClasses = 'rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 flex items-center justify-center gap-2 shadow-soft hover:shadow-medium';

  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    secondary: 'bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white',
    outline: 'border-2 border-primary-600 text-primary-700 hover:bg-primary-600 hover:text-white bg-white shadow-sm',
    success: 'bg-gradient-to-r from-success-500 to-success-600 hover:from-success-600 hover:to-success-700 text-white',
    danger: 'bg-gradient-to-r from-danger-500 to-danger-600 hover:from-danger-600 hover:to-danger-700 text-white',
  };

  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-5 py-2.5 text-base',
    lg: 'px-8 py-4 text-lg',
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {icon && <span>{icon}</span>}
      {children}
    </button>
  );
};
