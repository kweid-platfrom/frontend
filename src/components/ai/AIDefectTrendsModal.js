// components/ai/AIDefectTrendsModal.jsx
'use client'

import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  TrendingUp, 
  TrendingDown,
  BarChart3, 
  Calendar,
  Filter,
  Download,
  RefreshCw,
  AlertTriangle,
  Info,
  Target,
  Clock
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { useApp } from '../../context/AppProvider';

const AIDefectTrendsModal = ({ 
  isOpen, 
  onClose, 
  timeframe = 30, // days
  defectData = null,
  suiteId = null 
}) => {
  const { actions, bugs, testCases, recordings } = useApp();
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState(timeframe);
  const [activeChart, setActiveChart] = useState('trends');

  // Prepare defect data from app state if not provided
  const preparedDefectData = useMemo(() => {
    if (defectData) return defectData;
    
    // Combine bugs and failed test cases as defects
    const allDefects = [
      ...bugs.map(bug => ({
        ...bug,
        type: 'bug',
        createdAt: bug.created_at || bug.createdAt,
        severity: bug.severity || 'medium'
      })),
      ...testCases
        .filter(tc => tc.status === 'failed' || tc.status === 'blocked')
        .map(tc => ({
          ...tc,
          type: 'test_failure',
          createdAt: tc.created_at || tc.createdAt,
          severity: tc.priority === 'high' ? 'high' : 'medium'
        }))
    ];
    
    return allDefects;
  }, [defectData, bugs, testCases]);

  useEffect(() => {
    if (isOpen && preparedDefectData?.length > 0) {
      performAnalysis();
    }
  }, [isOpen, selectedTimeframe, preparedDefectData]);

  const performAnalysis = async () => {
    if (!preparedDefectData || preparedDefectData.length === 0) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await actions.ai.analyzeDefectTrends(preparedDefectData, selectedTimeframe);
      
      if (result.success) {
        setAnalysis(result.data);
      } else {
        setError(result.error?.message || 'Analysis failed');
      }
    } catch (err) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const exportAnalysis = () => {
    if (!analysis) return;
    
    const exportData = {
      timeframe: selectedTimeframe,
      defectCount: preparedDefectData.length,
      analysis: analysis,
      timestamp: new Date().toISOString(),
      suiteId
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `defect-trends-${selectedTimeframe}d-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Process chart data
  const chartData = useMemo(() => {
    if (!analysis || !analysis.timeSeriesData) return [];
    
    return analysis.timeSeriesData.map(item => ({
      date: new Date(item.date).toLocaleDateString(),
      defects: item.count,
      critical: item.critical || 0,
      high: item.high || 0,
      medium: item.medium || 0,
      low: item.low || 0
    }));
  }, [analysis]);

  const severityData = useMemo(() => {
    if (!analysis || !analysis.severityDistribution) return [];
    
    return Object.entries(analysis.severityDistribution).map(([severity, count]) => ({
      severity: severity.charAt(0).toUpperCase() + severity.slice(1),
      count,
      color: severity === 'critical' ? '#ef4444' : 
             severity === 'high' ? '#f97316' :
             severity === 'medium' ? '#eab308' : '#22c55e'
    }));
  }, [analysis]);

  const getTrendIcon = (trend) => {
    if (trend === 'increasing') return <TrendingUp className="w-4 h-4 text-red-500" />;
    if (trend === 'decreasing') return <TrendingDown className="w-4 h-4 text-green-500" />;
    return <Target className="w-4 h-4 text-gray-500" />;
  };

  const getRiskColor = (level) => {
    switch (level) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />
        
        <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-6xl">
          {/* Header */}
          <div className="bg-white px-6 pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                  <TrendingUp className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    AI Defect Trends Analysis
                  </h3>
                  <p className="text-sm text-gray-500">
                    {preparedDefectData?.length || 0} defects analyzed over {selectedTimeframe} days
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {/* Timeframe Selector */}
                <select
                  value={selectedTimeframe}
                  onChange={(e) => setSelectedTimeframe(Number(e.target.value))}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                >
                  <option value={7}>7 days</option>
                  <option value={14}>14 days</option>
                  <option value={30}>30 days</option>
                  <option value={60}>60 days</option>
                  <option value={90}>90 days</option>
                </select>
                
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
                
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Chart Type Selector */}
            <div className="mt-4 border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                {[
                  { key: 'trends', label: 'Trend Analysis', icon: TrendingUp },
                  { key: 'severity', label: 'Severity Distribution', icon: BarChart3 },
                  { key: 'patterns', label: 'Patterns', icon: Target },
                  { key: 'insights', label: 'AI Insights', icon: Info }
                ].map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => setActiveChart(key)}
                    className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                      activeChart === key
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {label}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-4">
            {loading && (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="mt-2 text-sm text-gray-500">Analyzing trends...</p>
                </div>
              </div>
            )}

            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="flex">
                  <AlertTriangle className="h-5 w-5 text-red-400" />
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Analysis Failed</h3>
                    <p className="mt-1 text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {analysis && !loading && (
              <div className="space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex items-center">
                      <BarChart3 className="h-8 w-8 text-blue-600" />
                      <div className="ml-3">
                        <p className="text-sm font-medium text-blue-900">Total Defects</p>
                        <p className="text-2xl font-bold text-blue-600">
                          {analysis.totalDefects || preparedDefectData?.length || 0}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="flex items-center">
                      {getTrendIcon(analysis.overallTrend)}
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">Trend</p>
                        <p className="text-lg font-semibold capitalize">
                          {analysis.overallTrend || 'stable'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-yellow-50 rounded-lg p-4">
                    <div className="flex items-center">
                      <AlertTriangle className="h-8 w-8 text-yellow-600" />
                      <div className="ml-3">
                        <p className="text-sm font-medium text-yellow-900">Risk Level</p>
                        <p className={`font-semibold px-2 py-1 rounded text-xs ${getRiskColor(analysis.riskLevel)}`}>
                          {analysis.riskLevel || 'medium'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-purple-50 rounded-lg p-4">
                    <div className="flex items-center">
                      <Clock className="h-8 w-8 text-purple-600" />
                      <div className="ml-3">
                        <p className="text-sm font-medium text-purple-900">Avg Resolution</p>
                        <p className="text-lg font-semibold text-purple-600">
                          {analysis.averageResolutionTime || 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Chart Content */}
                {activeChart === 'trends' && chartData.length > 0 && (
                  <div className="bg-white border rounded-lg p-6">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Defect Trends Over Time</h4>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip />
                          <Line 
                            type="monotone" 
                            dataKey="defects" 
                            stroke="#3b82f6" 
                            strokeWidth={2}
                            dot={{ fill: '#3b82f6' }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {activeChart === 'severity' && severityData.length > 0 && (
                  <div className="bg-white border rounded-lg p-6">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Severity Distribution</h4>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={severityData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="severity" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="count" fill="#3b82f6" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {activeChart === 'patterns' && (
                  <div className="bg-white border rounded-lg p-6">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Detected Patterns</h4>
                    <div className="space-y-4">
                      {analysis.patterns && analysis.patterns.length > 0 ? (
                        analysis.patterns.map((pattern, index) => (
                          <div key={index} className="border-l-4 border-blue-400 pl-4">
                            <h5 className="font-medium text-gray-900">{pattern.type}</h5>
                            <p className="text-sm text-gray-600 mt-1">{pattern.description}</p>
                            {pattern.impact && (
                              <p className="text-xs text-gray-500 mt-2">
                                Impact: {pattern.impact}
                              </p>
                            )}
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-500">No significant patterns detected in the current timeframe.</p>
                      )}
                    </div>
                  </div>
                )}

                {activeChart === 'insights' && (
                  <div className="bg-white border rounded-lg p-6">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">AI Insights & Recommendations</h4>
                    <div className="space-y-4">
                      {analysis.insights && analysis.insights.length > 0 ? (
                        analysis.insights.map((insight, index) => (
                          <div key={index} className="bg-gray-50 rounded-lg p-4">
                            <div className="flex items-start space-x-3">
                              <Info className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-sm text-gray-700">{insight}</p>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="space-y-3">
                          <div className="bg-gray-50 rounded-lg p-4">
                            <div className="flex items-start space-x-3">
                              <Target className="w-5 h-5 text-green-500 mt-0.5" />
                              <p className="text-sm text-gray-700">
                                Monitor high-severity defects more closely to prevent escalation
                              </p>
                            </div>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-4">
                            <div className="flex items-start space-x-3">
                              <TrendingUp className="w-5 h-5 text-blue-500 mt-0.5" />
                              <p className="text-sm text-gray-700">
                                Consider implementing additional testing for areas with recurring defects
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-3 flex justify-end">
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
  );
};

export default AIDefectTrendsModal;