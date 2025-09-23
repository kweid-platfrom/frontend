// components/ai/AISeverityAssessmentTooltip.jsx
'use client'

import React, { useState, useRef, useEffect } from 'react';
import { 
  Brain, 
  AlertTriangle, 
  Info, 
  Loader, 
  CheckCircle,
  Target,
  Clock,
  Zap
} from 'lucide-react';
import { useApp } from '../../context/AppProvider';

const AISeverityAssessmentTooltip = ({ 
  children, 
  bugData, 
  onAssessmentComplete = null,
  triggerOnHover = true,
  position = 'top' // 'top', 'bottom', 'left', 'right'
}) => {
  const { actions, aiGenerating } = useApp();
  const [isVisible, setIsVisible] = useState(false);
  const [assessment, setAssessment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const tooltipRef = useRef(null);
  const triggerRef = useRef(null);

  // Auto-assess on hover if enabled
  const handleMouseEnter = () => {
    if (triggerOnHover && !assessment && !loading) {
      performAssessment();
    }
    setIsVisible(true);
  };

  const handleMouseLeave = () => {
    setIsVisible(false);
  };

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target) &&
          triggerRef.current && !triggerRef.current.contains(event.target)) {
        setIsVisible(false);
      }
    };

    if (isVisible) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isVisible]);

  const performAssessment = async () => {
    if (!bugData || loading) return;

    setLoading(true);
    setError(null);

    try {
      const result = await actions.ai.assessBugSeverity(bugData);
      
      if (result.success) {
        setAssessment(result.data);
        onAssessmentComplete?.(result.data);
      } else {
        setError(result.error?.message || 'Assessment failed');
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical':
        return 'text-red-600 bg-red-100 border-red-200';
      case 'high':
        return 'text-orange-600 bg-orange-100 border-orange-200';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'low':
        return 'text-green-600 bg-green-100 border-green-200';
      default:
        return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getPriorityColor = (priority) => {
    if (priority?.startsWith('P1')) return 'text-red-600 bg-red-100';
    if (priority?.startsWith('P2')) return 'text-orange-600 bg-orange-100';
    if (priority?.startsWith('P3')) return 'text-yellow-600 bg-yellow-100';
    if (priority?.startsWith('P4')) return 'text-green-600 bg-green-100';
    return 'text-gray-600 bg-gray-100';
  };

  const getTooltipPosition = () => {
    switch (position) {
      case 'top':
        return 'bottom-full left-1/2 transform -translate-x-1/2 mb-2';
      case 'bottom':
        return 'top-full left-1/2 transform -translate-x-1/2 mt-2';
      case 'left':
        return 'right-full top-1/2 transform -translate-y-1/2 mr-2';
      case 'right':
        return 'left-full top-1/2 transform -translate-y-1/2 ml-2';
      default:
        return 'bottom-full left-1/2 transform -translate-x-1/2 mb-2';
    }
  };

  const getArrowPosition = () => {
    switch (position) {
      case 'top':
        return 'top-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-t-gray-800';
      case 'bottom':
        return 'bottom-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-b-gray-800';
      case 'left':
        return 'left-full top-1/2 transform -translate-y-1/2 border-t-transparent border-b-transparent border-l-gray-800';
      case 'right':
        return 'right-full top-1/2 transform -translate-y-1/2 border-t-transparent border-b-transparent border-r-gray-800';
      default:
        return 'top-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-t-gray-800';
    }
  };

  return (
    <div className="relative inline-block">
      <div
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={() => {
          if (!triggerOnHover) {
            if (!assessment && !loading) performAssessment();
            setIsVisible(!isVisible);
          }
        }}
        className="cursor-pointer"
      >
        {children}
      </div>

      {isVisible && (
        <div
          ref={tooltipRef}
          className={`absolute z-50 ${getTooltipPosition()}`}
        >
          <div className="bg-gray-800 text-white rounded-lg shadow-lg p-4 min-w-80 max-w-sm">
            {/* Arrow */}
            <div className={`absolute w-0 h-0 border-4 ${getArrowPosition()}`} />

            {/* Header */}
            <div className="flex items-center space-x-2 mb-3">
              <Brain className="w-4 h-4 text-purple-400" />
              <span className="font-medium text-sm">AI Severity Assessment</span>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="flex items-center justify-center py-6">
                <div className="text-center">
                  <Loader className="mx-auto h-6 w-6 animate-spin text-purple-400" />
                  <p className="mt-2 text-xs text-gray-300">Analyzing...</p>
                </div>
              </div>
            )}

            {/* Error State */}
            {error && !loading && (
              <div className="flex items-start space-x-2 text-red-300">
                <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-medium">Assessment Failed</p>
                  <p className="text-xs text-gray-400 mt-1">{error}</p>
                  <button
                    onClick={performAssessment}
                    className="text-xs text-purple-400 hover:text-purple-300 mt-2"
                  >
                    Retry Assessment
                  </button>
                </div>
              </div>
            )}

            {/* Assessment Results */}
            {assessment && !loading && (
              <div className="space-y-3">
                {/* Main Assessment */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-300">Severity:</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(assessment.assessment?.severity)} text-gray-800`}>
                      {assessment.assessment?.severity || 'Unknown'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-300">Priority:</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(assessment.assessment?.priority)} text-gray-800`}>
                      {assessment.assessment?.priority || 'Unknown'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-300">Confidence:</span>
                    <div className="flex items-center space-x-1">
                      <div className="w-16 bg-gray-600 rounded-full h-2">
                        <div 
                          className="bg-purple-400 h-2 rounded-full" 
                          style={{ width: `${(assessment.confidence || 0) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-white">
                        {Math.round((assessment.confidence || 0) * 100)}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Reasoning (truncated) */}
                {assessment.reasoning && (
                  <div className="border-t border-gray-600 pt-3">
                    <div className="flex items-start space-x-2">
                      <Info className="w-3 h-3 text-blue-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-300 font-medium">AI Reasoning:</p>
                        <p className="text-xs text-gray-400 mt-1 line-clamp-3">
                          {assessment.reasoning.length > 120 
                            ? `${assessment.reasoning.substring(0, 120)}...`
                            : assessment.reasoning
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Key Factors */}
                {assessment.factors && assessment.factors.length > 0 && (
                  <div className="border-t border-gray-600 pt-3">
                    <div className="flex items-start space-x-2">
                      <Target className="w-3 h-3 text-green-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-300 font-medium">Key Factors:</p>
                        <ul className="text-xs text-gray-400 mt-1 space-y-1">
                          {assessment.factors.slice(0, 2).map((factor, index) => (
                            <li key={index} className="flex items-start space-x-1">
                              <span className="text-gray-500">•</span>
                              <span>{factor}</span>
                            </li>
                          ))}
                          {assessment.factors.length > 2 && (
                            <li className="text-purple-400">
                              +{assessment.factors.length - 2} more factors
                            </li>
                          )}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {/* Quick Actions */}
                <div className="border-t border-gray-600 pt-3">
                  <div className="flex justify-between items-center">
                    <button
                      onClick={performAssessment}
                      className="text-xs text-purple-400 hover:text-purple-300 flex items-center space-x-1"
                    >
                      <Zap className="w-3 h-3" />
                      <span>Re-assess</span>
                    </button>
                    
                    <div className="flex items-center space-x-1 text-xs text-gray-400">
                      <Clock className="w-3 h-3" />
                      <span>Just now</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Default State */}
            {!assessment && !loading && !error && (
              <div className="text-center py-4">
                <Brain className="mx-auto h-8 w-8 text-purple-400 mb-2" />
                <p className="text-xs text-gray-300 mb-3">
                  Get AI-powered severity assessment
                </p>
                <button
                  onClick={performAssessment}
                  className="inline-flex items-center space-x-1 px-3 py-1 bg-purple-600 hover:bg-purple-700 rounded text-xs font-medium text-white transition-colors"
                >
                  <Zap className="w-3 h-3" />
                  <span>Analyze Now</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AISeverityAssessmentTooltip;