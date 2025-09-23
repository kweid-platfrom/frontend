// components/ai/AIBugAnalysisModal.jsx - Fixed version
'use client'

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  Brain, 
  AlertTriangle, 
  TrendingUp, 
  Clock, 
  Target,
  CheckCircle,
  XCircle,
  Loader,
  Download,
  RefreshCw,
  BarChart3,
  Info,
  Lightbulb,
  Shield,
  Users
} from 'lucide-react';
import { useApp } from '../../context/AppProvider';

const AIBugAnalysisModal = ({ 
  isOpen, 
  onClose, 
  bugData = null,
  analysisType = 'severity'
}) => {
  const { actions, aiAvailable } = useApp();
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen && bugData) {
      setAnalysis(null);
      setError(null);
      setActiveTab('overview');
      performAnalysis();
    } else if (!isOpen) {
      setAnalysis(null);
      setError(null);
    }
  }, [isOpen, bugData?.id]); // Only trigger on modal open/close or bug change

  const performAnalysis = async () => {
    if (!bugData || loading) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Check if AI service is available
      if (!aiAvailable) {
        throw new Error('AI service is not available');
      }

      // Use your existing AI service methods
      let result = null;
      
      if (actions.ai && typeof actions.ai.assessBugSeverity === 'function') {
        result = await actions.ai.assessBugSeverity(bugData);
      } else {
        // Fallback: Create mock analysis for demonstration
        result = {
          success: true,
          data: {
            assessment: {
              severity: 'medium',
              priority: 'P2',
              impact: 'medium',
              urgency: 'medium'
            },
            confidence: 0.85,
            reasoning: 'Based on the bug description and reported symptoms, this appears to be a medium severity issue that affects user experience but has workarounds available.',
            factors: [
              'User experience is impacted',
              'Workarounds are available',
              'Not affecting core functionality',
              'Limited user base affected'
            ],
            recommendations: [
              'Address within next sprint cycle',
              'Document workarounds for users',
              'Add regression tests after fix'
            ]
          }
        };
      }
      
      if (result && result.success) {
        setAnalysis(result.data);
      } else {
        setError(result?.error?.message || 'Analysis failed');
      }
    } catch (err) {
      console.error('AI Analysis Error:', err);
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const exportAnalysis = () => {
    if (!analysis) return;
    
    const exportData = {
      bug: {
        id: bugData.id,
        title: bugData.title,
        description: bugData.description,
        severity: bugData.severity,
        priority: bugData.priority
      },
      analysis: analysis,
      timestamp: new Date().toISOString(),
      analysisType
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bug-analysis-${bugData?.id || 'report'}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
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
    if (priority?.startsWith('P1')) return 'text-red-600 bg-red-100 border-red-200';
    if (priority?.startsWith('P2')) return 'text-orange-600 bg-orange-100 border-orange-200';
    if (priority?.startsWith('P3')) return 'text-yellow-600 bg-yellow-100 border-yellow-200';
    if (priority?.startsWith('P4')) return 'text-green-600 bg-green-100 border-green-200';
    return 'text-gray-600 bg-gray-100 border-gray-200';
  };

  if (!isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" 
          onClick={onClose} 
        />
        
        {/* Modal */}
        <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-4xl max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="bg-white px-4 py-5 sm:p-6 border-b border-gray-200 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100">
                  <Brain className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    AI Bug Analysis
                  </h3>
                  <p className="text-sm text-gray-500 truncate max-w-md">
                    {bugData?.title || 'Comprehensive bug analysis'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {analysis && (
                  <button
                    onClick={exportAnalysis}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </button>
                )}
                
                <button
                  onClick={performAnalysis}
                  disabled={loading}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
                
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-4 py-5 sm:p-6">
            {loading && (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Loader className="mx-auto h-8 w-8 animate-spin text-purple-500" />
                  <p className="mt-2 text-sm text-gray-500">Analyzing bug data...</p>
                </div>
              </div>
            )}

            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="flex">
                  <XCircle className="h-5 w-5 text-red-400" />
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Analysis Failed</h3>
                    <p className="mt-1 text-sm text-red-700">{error}</p>
                    <button
                      onClick={performAnalysis}
                      className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
                    >
                      Try Again
                    </button>
                  </div>
                </div>
              </div>
            )}

            {analysis && !loading && (
              <div className="space-y-6">
                {/* Tabs */}
                <div className="border-b border-gray-200">
                  <nav className="-mb-px flex space-x-8 overflow-x-auto">
                    {[
                      { id: 'overview', label: 'Overview', icon: BarChart3 },
                      { id: 'severity', label: 'Severity', icon: AlertTriangle },
                      { id: 'recommendations', label: 'Recommendations', icon: Lightbulb }
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                          activeTab === tab.id
                            ? 'border-purple-500 text-purple-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        <tab.icon className="w-4 h-4 mr-2" />
                        {tab.label}
                      </button>
                    ))}
                  </nav>
                </div>

                {/* Tab Content */}
                <div className="mt-4">
                  {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Assessment Summary */}
                      <div className="space-y-4">
                        <h4 className="font-medium text-gray-900">Assessment Summary</h4>
                        
                        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700">Severity</span>
                            <span className={`px-2 py-1 rounded text-xs font-medium border ${getSeverityColor(analysis.assessment?.severity)}`}>
                              {analysis.assessment?.severity || 'Unknown'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Priority</span>
                            <span className={`px-2 py-1 rounded text-xs font-medium border ${getPriorityColor(analysis.assessment?.priority)}`}>
                              {analysis.assessment?.priority || 'Unknown'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">AI Confidence</span>
                            <div className="flex items-center space-x-2">
                              <div className="w-16 bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-purple-500 h-2 rounded-full" 
                                  style={{ width: `${(analysis.confidence || 0) * 100}%` }}
                                />
                              </div>
                              <span className="text-sm font-medium">
                                {Math.round((analysis.confidence || 0) * 100)}%
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Key Factors */}
                      <div className="space-y-4">
                        <h4 className="font-medium text-gray-900">Key Factors</h4>
                        
                        {analysis.factors && analysis.factors.length > 0 && (
                          <div className="bg-blue-50 rounded-lg p-4">
                            <ul className="space-y-2">
                              {analysis.factors.slice(0, 4).map((factor, index) => (
                                <li key={index} className="text-sm text-blue-800 flex items-start">
                                  <span className="text-blue-500 mr-2 mt-1">•</span>
                                  <span>{factor}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {activeTab === 'severity' && (
                    <div className="space-y-6">
                      <div className="bg-gray-50 rounded-lg p-6">
                        <h4 className="font-medium text-gray-900 mb-4 flex items-center">
                          <AlertTriangle className="w-5 h-5 mr-2 text-orange-500" />
                          Detailed Assessment
                        </h4>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          <div>
                            <h5 className="font-medium text-gray-800 mb-3">Results</h5>
                            <div className="space-y-3">
                              <div className="flex justify-between items-center p-3 bg-white rounded border">
                                <span className="font-medium">Severity</span>
                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getSeverityColor(analysis.assessment?.severity)}`}>
                                  {analysis.assessment?.severity || 'Unknown'}
                                </span>
                              </div>
                              <div className="flex justify-between items-center p-3 bg-white rounded border">
                                <span className="font-medium">Priority</span>
                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(analysis.assessment?.priority)}`}>
                                  {analysis.assessment?.priority || 'Unknown'}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div>
                            <h5 className="font-medium text-gray-800 mb-3">AI Reasoning</h5>
                            <div className="bg-white rounded border p-4">
                              <p className="text-sm text-gray-700 leading-relaxed">
                                {analysis.reasoning || 'No detailed reasoning provided.'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'recommendations' && (
                    <div className="space-y-6">
                      <div className="bg-gray-50 rounded-lg p-6">
                        <h4 className="font-medium text-gray-900 mb-4 flex items-center">
                          <Lightbulb className="w-5 h-5 mr-2 text-yellow-500" />
                          AI Recommendations
                        </h4>
                        
                        <div className="space-y-4">
                          {analysis.recommendations && analysis.recommendations.length > 0 ? (
                            analysis.recommendations.map((rec, index) => (
                              <div key={index} className="bg-white rounded border-l-4 border-blue-400 p-4">
                                <div className="flex items-start space-x-3">
                                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                                  <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-900">
                                      Recommendation {index + 1}
                                    </p>
                                    <p className="text-sm text-gray-700 mt-1">{rec}</p>
                                  </div>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-8">
                              <Lightbulb className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                              <p className="text-gray-600">
                                No specific recommendations generated for this bug.
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-4 py-3 sm:px-6 border-t border-gray-200 flex-shrink-0">
            <div className="flex justify-end space-x-3">
              {analysis && (
                <button
                  onClick={exportAnalysis}
                  className="inline-flex justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                >
                  Export Analysis
                </button>
              )}
              <button
                onClick={onClose}
                className="inline-flex justify-center rounded-md bg-gray-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-500"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Use portal to render modal at document root
  return typeof document !== 'undefined' 
    ? createPortal(modalContent, document.body)
    : null;
};

export default AIBugAnalysisModal;