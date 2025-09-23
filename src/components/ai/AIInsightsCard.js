// components/ai/AIInsightsCard.jsx - Fixed version
'use client'

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Brain, 
  TrendingUp, 
  Target, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  BarChart3,
  Lightbulb,
  RefreshCw,
  Eye,
  EyeOff,
  ChevronRight,
  Info
} from 'lucide-react';
import { useApp } from '../../context/AppProvider';
import { useAIInsights } from '../../hooks/useAIInsights';

const AIInsightsCard = ({ 
  title = "AI Insights",
  className = "",
  refreshInterval = null,
  showMetrics = true,
  showSuggestions = true,
  showTrends = true,
  maxInsights = 5,
  autoRefresh = false
}) => {
  const { bugs, testCases } = useApp();
  const [collapsed, setCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Use the fixed AI insights hook
  const { insights, loading, lastRefresh, refreshInsights } = useAIInsights({
    refreshInterval: refreshInterval || 10,
    autoRefresh: autoRefresh,
    maxInsights: maxInsights,
    includeMetrics: showMetrics
  });

  // Memoize metrics to prevent recalculation
  const metrics = useMemo(() => {
    const bugsArray = Array.isArray(bugs) ? bugs : [];
    const testCasesArray = Array.isArray(testCases) ? testCases : [];
    
    return {
      totalBugs: bugsArray.length,
      totalTestCases: testCasesArray.length,
      criticalBugs: bugsArray.filter(b => b.severity === 'critical').length,
      passRate: testCasesArray.length > 0 
        ? Math.round((testCasesArray.filter(tc => tc.status === 'passed').length / testCasesArray.length) * 100)
        : 0
    };
  }, [bugs?.length, testCases?.length]);

  const handleInsightAction = (insight) => {
    // Handle insight actions without causing re-renders
    switch (insight.data?.type || insight.type) {
      case 'alert':
        console.log('Navigate to critical bugs:', insight.data);
        break;
      case 'trend':
        console.log('Open trends analysis:', insight.data);
        break;
      case 'warning':
        console.log('Show test improvement suggestions:', insight.data);
        break;
      case 'info':
        console.log('Show blocked tests:', insight.data);
        break;
      default:
        console.log('Handle insight:', insight);
    }
  };

  return (
    <div className={`bg-white rounded-lg border shadow-sm ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-2">
          <Brain className="w-5 h-5 text-purple-500" />
          <h3 className="font-medium text-gray-900">{title}</h3>
          {insights.length > 0 && (
            <span className="px-2 py-1 text-xs bg-purple-100 text-purple-600 rounded-full">
              {insights.length}
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-500">
            Updated {lastRefresh.toLocaleTimeString()}
          </span>
          
          <button
            onClick={refreshInsights}
            disabled={loading}
            className="p-1 text-gray-400 hover:text-gray-600 disabled:animate-spin"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 text-gray-400 hover:text-gray-600"
          >
            {collapsed ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {!collapsed && (
        <div>
          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex px-4">
              {[
                { key: 'overview', label: 'Overview', icon: BarChart3 },
                { key: 'suggestions', label: 'Suggestions', icon: Lightbulb },
                { key: 'trends', label: 'Trends', icon: TrendingUp }
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`flex items-center px-3 py-2 text-sm font-medium border-b-2 ${
                    activeTab === key
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-1" />
                  {label}
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="p-4">
            {loading && (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <RefreshCw className="mx-auto h-6 w-6 animate-spin text-purple-500" />
                  <p className="mt-2 text-sm text-gray-500">Generating insights...</p>
                </div>
              </div>
            )}

            {!loading && (
              <>
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                  <div className="space-y-4">
                    {showMetrics && (
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="bg-blue-50 rounded-lg p-3">
                          <div className="flex items-center">
                            <BarChart3 className="h-6 w-6 text-blue-600" />
                            <div className="ml-2">
                              <p className="text-sm font-medium text-blue-900">Active Issues</p>
                              <p className="text-lg font-bold text-blue-600">
                                {metrics.totalBugs}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="bg-green-50 rounded-lg p-3">
                          <div className="flex items-center">
                            <CheckCircle className="h-6 w-6 text-green-600" />
                            <div className="ml-2">
                              <p className="text-sm font-medium text-green-900">Test Cases</p>
                              <p className="text-lg font-bold text-green-600">
                                {metrics.totalTestCases}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {insights.length > 0 ? (
                      <div className="space-y-3">
                        {insights.map((insight) => {
                          const getSeverityColor = (severity) => {
                            switch (severity) {
                              case 'high': return 'border-red-200 bg-red-50 text-red-800';
                              case 'medium': return 'border-yellow-200 bg-yellow-50 text-yellow-800';
                              case 'low': return 'border-blue-200 bg-blue-50 text-blue-800';
                              default: return 'border-gray-200 bg-gray-50 text-gray-800';
                            }
                          };

                          const getInsightIcon = () => {
                            switch (insight.type) {
                              case 'alert': return AlertTriangle;
                              case 'trend': return TrendingUp;
                              case 'warning': return Target;
                              case 'info': return Info;
                              case 'suggestion': return Lightbulb;
                              default: return CheckCircle;
                            }
                          };

                          const Icon = getInsightIcon();

                          return (
                            <div
                              key={insight.id}
                              className={`border rounded-lg p-3 ${getSeverityColor(insight.severity)}`}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex items-start space-x-3">
                                  <Icon className="w-5 h-5 mt-0.5" />
                                  <div className="flex-1">
                                    <h4 className="font-medium text-sm">{insight.title}</h4>
                                    <p className="text-sm mt-1 opacity-90">{insight.message}</p>
                                  </div>
                                </div>
                                
                                {insight.actionable && (
                                  <button
                                    onClick={() => handleInsightAction(insight)}
                                    className="flex items-center text-xs hover:underline ml-2"
                                  >
                                    View
                                    <ChevronRight className="w-3 h-3 ml-1" />
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-3" />
                        <h4 className="font-medium text-gray-900">All Good!</h4>
                        <p className="text-sm text-gray-500 mt-1">
                          No immediate issues detected in your test suite
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Suggestions Tab */}
                {activeTab === 'suggestions' && showSuggestions && (
                  <div className="space-y-3">
                    {insights.filter(i => i.type === 'suggestion').length > 0 ? (
                      insights.filter(i => i.type === 'suggestion').slice(0, 3).map((suggestion) => (
                        <div key={suggestion.id} className="border rounded-lg p-3">
                          <div className="flex items-start space-x-3">
                            <Lightbulb className="w-5 h-5 text-yellow-500 mt-0.5" />
                            <div className="flex-1">
                              <p className="text-sm font-medium">{suggestion.message}</p>
                              <div className="flex items-center justify-between mt-2">
                                <span className="text-xs text-gray-500">AI Generated</span>
                                {suggestion.actionable && (
                                  <button
                                    onClick={() => handleInsightAction(suggestion)}
                                    className="text-xs text-gray-400 hover:text-gray-600"
                                  >
                                    Apply
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <Lightbulb className="mx-auto h-12 w-12 text-yellow-500 mb-3" />
                        <h4 className="font-medium text-gray-900">No Active Suggestions</h4>
                        <p className="text-sm text-gray-500 mt-1">
                          AI will provide suggestions as you work
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Trends Tab */}
                {activeTab === 'trends' && showTrends && (
                  <div className="space-y-4">
                    <div className="text-center py-8">
                      <TrendingUp className="mx-auto h-12 w-12 text-blue-500 mb-3" />
                      <h4 className="font-medium text-gray-900">Trend Analysis</h4>
                      <p className="text-sm text-gray-500 mt-1 mb-4">
                        View detailed trend analysis and patterns
                      </p>
                      <button
                        onClick={() => console.log('Open trends modal')}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                      >
                        <BarChart3 className="w-4 h-4 mr-2" />
                        Open Trends Analysis
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AIInsightsCard;