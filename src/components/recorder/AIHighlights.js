'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Brain,
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Network, 
  Code,
  Shield,
  User,
  TrendingUp,
  Wifi,
  Lightbulb,
  Target
} from 'lucide-react';

// Import the AI insight service
import aiInsightService from '../../services/AIInsightService';

const AIHighlights = ({ 
  consoleLogs = [], 
  networkLogs = [], 
  detectedIssues = [], 
  duration = 0,
  onSeekTo,
  isEnabled = false,
  onSaveHighlights,
  onCreateTestCase,
  onCreateBug,
  className = ""
}) => {
  const [insights, setInsights] = useState([]);
  const [displayedInsights, setDisplayedInsights] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);
  const [displayIndex, setDisplayIndex] = useState(0);
  const intervalRef = useRef(null);

  // Icon mapping for different insight types
  const iconMapping = {
    AlertTriangle,
    CheckCircle,
    Clock,
    Network,
    Code,
    Brain,
    Shield,
    User,
    TrendingUp,
    Wifi,
    Lightbulb,
    Target
  };

  const formatTime = (seconds) => {
    const sec = Math.floor(seconds % 60).toString().padStart(2, '0');
    const min = Math.floor(seconds / 60).toString();
    return `${min}:${sec}`;
  };

  const getIconComponent = (iconName) => {
    return iconMapping[iconName] || Lightbulb;
  };

  const getColorClasses = (color) => {
    const classes = {
      red: 'border-red-400 bg-red-50/80 dark:bg-red-900/20 text-red-700 dark:text-red-300',
      yellow: 'border-yellow-400 bg-yellow-50/80 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300',
      green: 'border-green-400 bg-green-50/80 dark:bg-green-900/20 text-green-700 dark:text-green-300',
      blue: 'border-blue-400 bg-blue-50/80 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300',
      purple: 'border-purple-400 bg-purple-50/80 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300'
    };
    return classes[color] || classes.purple;
  };

  const getSeverityBadge = (severity) => {
    const badges = {
      critical: 'bg-red-500 text-white',
      high: 'bg-red-400 text-white',
      medium: 'bg-yellow-500 text-white',
      low: 'bg-blue-500 text-white',
      info: 'bg-green-500 text-white'
    };
    return badges[severity] || 'bg-gray-500 text-white';
  };

  // Analyze existing captured issues using real AI service instead of generating new ones
  const analyzeExistingIssues = useCallback(async () => {
    if (hasAnalyzed || (consoleLogs.length === 0 && networkLogs.length === 0 && detectedIssues.length === 0)) {
      return;
    }

    setIsAnalyzing(true);

    try {
      // Construct recordingData as expected by analyzeRecording
      const recordingData = {
        id: `recording_${Date.now()}`, // Generate a temporary ID if not provided
        duration,
        consoleLogs,
        networkLogs,
        detectedIssues,
        metadata: {
          totalLogs: consoleLogs.length,
          totalRequests: networkLogs.length
        }
      };

      // Use the real AI service to analyze captured data
      const analysisResult = await aiInsightService.analyzeRecording(recordingData);

      if (analysisResult.success) {
        setInsights(analysisResult.data.insights || []);
      } else if (analysisResult.fallbackData) {
        setInsights(analysisResult.fallbackData.insights || []);
      } else {
        setInsights([]);
      }
      setHasAnalyzed(true);
    } catch (err) {
      console.error('AI analysis failed:', err);
      // Don't show fake insights when AI fails
      setInsights([]);
      setHasAnalyzed(true);
    } finally {
      setIsAnalyzing(false);
    }
  }, [consoleLogs, networkLogs, detectedIssues, duration, hasAnalyzed]);

  // Progressive display logic
  const startProgressiveDisplay = useCallback(() => {
    if (insights.length === 0) return;

    setDisplayedInsights([]);
    setDisplayIndex(0);
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      setDisplayIndex(prev => {
        const nextIndex = prev + 1;
        if (nextIndex >= insights.length) {
          clearInterval(intervalRef.current);
          return prev;
        }
        return nextIndex;
      });
    }, 800);

  }, [insights.length]);

  // Handle saving insights
  const handleSaveInsights = useCallback(() => {
    if (onSaveHighlights && insights.length > 0) {
      onSaveHighlights(insights);
    }
  }, [onSaveHighlights, insights]);

  // Handle creating test case from insight
  const handleCreateTestCase = useCallback((insight) => {
    if (onCreateTestCase) {
      onCreateTestCase(insight);
    }
  }, [onCreateTestCase]);

  // Handle creating bug from insight
  const handleCreateBug = useCallback((insight) => {
    if (onCreateBug) {
      onCreateBug(insight);
    }
  }, [onCreateBug]);

  useEffect(() => {
    if (displayIndex > 0 && insights.length > 0) {
      setDisplayedInsights(insights.slice(0, displayIndex));
    }
  }, [displayIndex, insights]);

  useEffect(() => {
    if (consoleLogs.length > 0 || networkLogs.length > 0 || detectedIssues.length > 0) {
      analyzeExistingIssues();
    }
  }, [consoleLogs.length, networkLogs.length, detectedIssues.length, analyzeExistingIssues]);

  useEffect(() => {
    if (isEnabled && hasAnalyzed && insights.length > 0) {
      startProgressiveDisplay();
    } else if (!isEnabled) {
      setDisplayedInsights([]);
      setDisplayIndex(0);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
  }, [isEnabled, hasAnalyzed, insights.length, startProgressiveDisplay]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  if (!isEnabled) {
    return (
      <div className={`text-center py-4 ${className}`}>
        <Brain className="w-8 h-8 mx-auto mb-2 text-gray-400" />
        <div className="text-xs text-gray-500">AI Analysis Disabled</div>
        {hasAnalyzed && insights.length > 0 && (
          <div className="text-[10px] text-purple-500 mt-1">
            {insights.length} insights ready
          </div>
        )}
      </div>
    );
  }

  if (isAnalyzing) {
    return (
      <div className={`text-center py-4 ${className}`}>
        <Brain className="w-8 h-8 mx-auto mb-2 text-purple-500 animate-pulse" />
        <div className="text-xs text-gray-600 mb-1">Analyzing captured data...</div>
        <div className="flex items-center justify-center space-x-1">
          <div className="w-1 h-1 bg-purple-400 rounded-full animate-bounce"></div>
          <div className="w-1 h-1 bg-purple-400 rounded-full animate-bounce delay-100"></div>
          <div className="w-1 h-1 bg-purple-400 rounded-full animate-bounce delay-200"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <Lightbulb className="w-4 h-4 text-purple-500" />
          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
            AI Analysis
          </span>
          {displayedInsights.length > 0 && (
            <span className="text-xs bg-purple-100 dark:bg-purple-800 text-purple-700 dark:text-purple-300 px-1.5 py-0.5 rounded">
              {displayedInsights.length}
              {displayIndex < insights.length && (
                <span className="ml-1 animate-pulse">...</span>
              )}
            </span>
          )}
        </div>
        
        {/* Action buttons */}
        {displayedInsights.length > 0 && (
          <div className="flex items-center space-x-1">
            <button
              onClick={handleSaveInsights}
              className="text-[10px] px-2 py-1 bg-purple-100 text-purple-700 dark:bg-purple-800 dark:text-purple-300 rounded hover:bg-purple-200 dark:hover:bg-purple-700 transition-colors"
            >
              Save
            </button>
          </div>
        )}
      </div>

      {/* Insights List */}
      <div className="space-y-1.5">
        {displayedInsights.length === 0 && insights.length === 0 ? (
          <div className="text-center py-4">
            <CheckCircle className="w-6 h-6 mx-auto mb-1 text-green-500" />
            <div className="text-xs text-gray-600 dark:text-gray-400">No issues detected</div>
            <div className="text-[10px] text-gray-500 mt-1">Your application is running smoothly</div>
          </div>
        ) : (
          <>
            {displayedInsights.map((insight, index) => {
              const IconComponent = getIconComponent(insight.icon);
              const colorClasses = getColorClasses(insight.color);
              const severityBadge = getSeverityBadge(insight.severity);
              const isLatest = index === displayedInsights.length - 1 && displayIndex < insights.length;

              return (
                <div
                  key={insight.id}
                  className={`p-2 rounded border-l-2 cursor-pointer hover:bg-opacity-70 transition-all ${colorClasses} ${
                    isLatest ? 'animate-fadeIn' : ''
                  }`}
                  onClick={() => onSeekTo && onSeekTo(insight.time)}
                >
                  <div className="flex items-start space-x-2">
                    <IconComponent className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-xs truncate">{insight.title}</span>
                        <div className="flex items-center space-x-1">
                          <span className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-medium ${severityBadge}`}>
                            {insight.severity}
                          </span>
                        </div>
                      </div>
                      <div className="text-[11px] text-gray-600 dark:text-gray-400 mb-1 line-clamp-2">
                        {insight.description}
                      </div>
                      <div className="flex items-center justify-between text-[9px] text-gray-500 mb-1">
                        <span>@ {formatTime(insight.time)}</span>
                        {insight.confidence && (
                          <span className="truncate max-w-20">
                            {Math.round(insight.confidence * 100)}% confident
                          </span>
                        )}
                      </div>
                      
                      {/* Action buttons for each insight */}
                      <div className="flex items-center space-x-1 mt-1">
                        {(insight.type === 'error' || insight.severity === 'critical' || insight.severity === 'high') && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCreateBug(insight);
                            }}
                            className="text-[9px] px-2 py-0.5 bg-red-100 text-red-700 dark:bg-red-800 dark:text-red-300 rounded hover:bg-red-200 dark:hover:bg-red-700 transition-colors"
                          >
                            Create Bug
                          </button>
                        )}
                        {insight.testCaseRecommendations && insight.testCaseRecommendations.length > 0 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCreateTestCase(insight);
                            }}
                            className="text-[9px] px-2 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-800 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-700 transition-colors"
                          >
                            Create Test
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {displayIndex < insights.length && (
              <div className="text-center py-2">
                <div className="flex items-center justify-center space-x-1">
                  <div className="w-1 h-1 bg-purple-400 rounded-full animate-bounce"></div>
                  <div className="w-1 h-1 bg-purple-400 rounded-full animate-bounce delay-100"></div>
                  <div className="w-1 h-1 bg-purple-400 rounded-full animate-bounce delay-200"></div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Stats Footer */}
      {displayedInsights.length > 0 && (
        <div className="text-[10px] text-gray-500 pt-2 border-t border-gray-200 dark:border-gray-700">
          <div className="flex justify-between">
            <span>Critical: {displayedInsights.filter(i => i.severity === 'critical').length}</span>
            <span>High: {displayedInsights.filter(i => i.severity === 'high').length}</span>
            <span>
              Analyzed {displayedInsights.length}
              {insights.length > displayedInsights.length && `/${insights.length}`}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIHighlights;