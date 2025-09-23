// components/ai/AIActionButton.jsx - Reusable action button with AI loading states
import React from 'react';
import { Brain, Zap, Loader } from 'lucide-react';

export const AIActionButton = ({ 
  onClick,
  loading = false,
  disabled = false,
  children,
  variant = 'primary',
  size = 'md',
  icon: Icon = Brain,
  className = ''
}) => {
  const baseClasses = 'inline-flex items-center font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-purple-600 text-white hover:bg-purple-700 focus:ring-purple-500',
    secondary: 'bg-white text-purple-600 border border-purple-600 hover:bg-purple-50 focus:ring-purple-500',
    ghost: 'text-purple-600 hover:bg-purple-50 focus:ring-purple-500'
  };

  const sizes = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-2 text-sm', 
    lg: 'px-4 py-2 text-base'
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {loading ? (
        <Loader className={`${iconSizes[size]} mr-2 animate-spin`} />
      ) : (
        <Icon className={`${iconSizes[size]} mr-2`} />
      )}
      {children}
    </button>
  );
};