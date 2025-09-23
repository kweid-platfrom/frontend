// components/ai/AISeverityBadge.jsx - Reusable severity indicator
import React from 'react';
import { aiHelpers } from '../../utils/aiHelpers';

export const AISeverityBadge = ({ 
  severity, 
  confidence = null,
  showConfidence = false,
  size = 'sm'
}) => {
  const sizeClasses = {
    xs: 'px-1 py-0.5 text-xs',
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm'
  };

  return (
    <div className="flex items-center space-x-2">
      <span className={`inline-flex items-center rounded-full font-medium border ${aiHelpers.getSeverityStyle(severity)} ${sizeClasses[size]}`}>
        {severity || 'Unknown'}
      </span>
      {showConfidence && confidence !== null && (
        <span className="text-xs text-gray-500">
          {aiHelpers.formatConfidence(confidence)}
        </span>
      )}
    </div>
  );
};