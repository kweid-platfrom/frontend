// components/ai/AILoadingSpinner.jsx - Reusable loading component
import React from 'react';
import { Brain, Loader } from 'lucide-react';

export const AILoadingSpinner = ({ 
  message = 'AI is thinking...', 
  size = 'md',
  variant = 'default' 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6', 
    lg: 'w-8 h-8'
  };

  const containerClasses = {
    sm: 'py-2',
    md: 'py-4',
    lg: 'py-8'
  };

  if (variant === 'inline') {
    return (
      <div className="flex items-center space-x-2">
        <Loader className={`${sizeClasses[size]} animate-spin text-purple-500`} />
        <span className="text-sm text-gray-600">{message}</span>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center justify-center ${containerClasses[size]}`}>
      <div className="relative">
        <Brain className={`${sizeClasses[size]} text-purple-500 mb-2`} />
        <Loader className={`${sizeClasses[size]} animate-spin text-purple-400 absolute inset-0`} />
      </div>
      <p className="text-sm text-gray-600 text-center mt-2">{message}</p>
    </div>
  );
};