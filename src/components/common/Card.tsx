import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  gradient?: boolean;
  hover?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  title,
  gradient = false,
  hover = true
}) => {
  return (
    <div className={`
      bg-white rounded-2xl shadow-medium border border-gray-100 p-6
      ${hover ? 'hover:shadow-large transition-all duration-300 hover:-translate-y-1' : ''}
      ${gradient ? 'bg-gradient-to-br from-white to-blue-50' : ''}
      animate-scale-in
      ${className}
    `}>
      {title && (
        <div className="flex items-center mb-4 pb-3 border-b border-gray-200">
          <h3 className="text-xl font-bold text-gray-900 flex-1">{title}</h3>
          <div className="h-1 w-12 bg-blue-500 rounded-full"></div>
        </div>
      )}
      {children}
    </div>
  );
};
