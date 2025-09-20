'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Brain, 
  Zap, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Network, 
  Code,
  Shield,
  User,
  TrendingUp,
  Wifi
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
  className = ""
}) => {
  const [highlights, setHighlights] = useState([]);
  const [displayedHighlights, setDisplayedHighlights] = useState([]);
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
    Wifi
  };

  const formatTime = (seconds) => {
    const sec = Math.floor(seconds % 60).toString().padStart(2, '0');
    const min = Math.floor(seconds / 60).toString();
    return `${min}:${sec}`;
  };

  const getIconComponent = (iconName) => {
    return iconMapping[iconName] || Brain;
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

  // Pre-analyze and store insights in background when data is available
  const preAnalyzeInsights = useCallback(async () => {
    if (hasAnalyzed || (consoleLogs.length === 0 && networkLogs.length === 0 && detectedIssues.length === 0)) {
      return;
    }

    try {
      const recordingData = {
        id: `recording_${Date.now()}`,
        duration,
        consoleLogs: consoleLogs.map(log => ({
          level: log.level,
          message: log.message,
          timestamp: log.timestamp || log.time,
          count: log.count || 1
        })),
        networkLogs: networkLogs.map(req => ({
          method: req.method,
          url: req.url,
          status: req.status,
          duration: req.duration,
          error: req.error,
          timestamp: req.timestamp || req.time
        })),
        detectedIssues: detectedIssues.map(issue => ({
          type: issue.type,
          message: issue.message,
          severity: issue.severity,
          timestamp: issue.timestamp || issue.time
        })),
        metadata: {
          totalLogs: consoleLogs.length,
          totalRequests: networkLogs.length,
          totalIssues: detectedIssues.length,
          recordingDuration: duration
        }
      };

      const result = await aiInsightService.analyzeRecording(recordingData);

      console.log('Debug - AI service result:', result);

      if (result.success && result.data?.insights) {
        setHighlights(result.data.insights);
        setHasAnalyzed(true);
      } else if (result.fallbackData?.insights) {
        setHighlights(result.fallbackData.insights);
        setHasAnalyzed(true);
      } else {
        // Force fallback analysis if AI returns empty
        const fallbackInsights = generateBasicFallback(recordingData);
        setHighlights(fallbackInsights);
        setHasAnalyzed(true);
      }

    } catch (err) {
      console.error('AI pre-analysis failed:', err);
      setHasAnalyzed(true);
    }
  }, [consoleLogs, networkLogs, detectedIssues, duration, hasAnalyzed]);

  // Progressive display of insights when toggled on
  const startProgressiveDisplay = useCallback(() => {
    if (highlights.length === 0) return;

    setDisplayedHighlights([]);
    setDisplayIndex(0);
    
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Start progressive display
    intervalRef.current = setInterval(() => {
      setDisplayIndex(prev => {
        const nextIndex = prev + 1;
        if (nextIndex >= highlights.length) {
          clearInterval(intervalRef.current);
          return prev;
        }
        return nextIndex;
      });
    }, 800); // Display one insight every 800ms for smooth AI-like generation

  }, [highlights]);

  // Update displayed insights when displayIndex changes
  useEffect(() => {
    if (displayIndex > 0 && highlights.length > 0) {
      setDisplayedHighlights(highlights.slice(0, displayIndex));
    }
  }, [displayIndex, highlights]);

  // Pre-analyze in background when data is available
  useEffect(() => {
    if (consoleLogs.length > 0 || networkLogs.length > 0 || detectedIssues.length > 0) {
      preAnalyzeInsights();
    }
  }, [preAnalyzeInsights]);

  // Handle toggle on/off
  useEffect(() => {
    if (isEnabled && hasAnalyzed && highlights.length > 0) {
      startProgressiveDisplay();
    } else if (!isEnabled) {
      // Reset display when toggled off
      setDisplayedHighlights([]);
      setDisplayIndex(0);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
  }, [isEnabled, hasAnalyzed, highlights, startProgressiveDisplay]);

  // Cleanup interval on unmount
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
        <div className="text-xs text-gray-500">AI Insights Disabled</div>
        {hasAnalyzed && highlights.length > 0 && (
          <div className="text-[10px] text-purple-500 mt-1">
            {highlights.length} insights ready
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Compact Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <Zap className="w-4 h-4 text-purple-500" />
          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
            AI Insights
          </span>
          {displayedHighlights.length > 0 && (
            <span className="text-xs bg-purple-100 dark:bg-purple-800 text-purple-700 dark:text-purple-300 px-1.5 py-0.5 rounded">
              {displayedHighlights.length}
              {displayIndex < highlights.length && (
                <span className="ml-1 animate-pulse">...</span>
              )}
            </span>
          )}
        </div>
      </div>

      {/* Insights List with Progressive Display */}
      <div className="space-y-1.5">
        {displayedHighlights.length === 0 && highlights.length === 0 ? (
          <div className="text-center py-4">
            <CheckCircle className="w-6 h-6 mx-auto mb-1 text-green-500" />
            <div className="text-xs text-gray-600 dark:text-gray-400">No issues detected</div>
          </div>
        ) : (
          <>
            {displayedHighlights.map((highlight, index) => {
              const IconComponent = getIconComponent(highlight.icon);
              const colorClasses = getColorClasses(highlight.color);
              const severityBadge = getSeverityBadge(highlight.severity);
              const isLatest = index === displayedHighlights.length - 1 && displayIndex < highlights.length;

              return (
                <div
                  key={highlight.id}
                  className={`p-2 rounded border-l-2 cursor-pointer hover:bg-opacity-70 transition-all ${colorClasses} ${
                    isLatest ? 'animate-fadeIn' : ''
                  }`}
                  onClick={() => onSeekTo && onSeekTo(highlight.time)}
                >
                  <div className="flex items-start space-x-2">
                    <IconComponent className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-xs truncate">{highlight.title}</span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-medium ${severityBadge}`}>
                          {highlight.severity}
                        </span>
                      </div>
                      <div className="text-[11px] text-gray-600 dark:text-gray-400 mb-1 truncate">
                        {highlight.description}
                      </div>
                      <div className="flex items-center justify-between text-[9px] text-gray-500">
                        <span>@ {formatTime(highlight.time)}</span>
                        <span className="truncate max-w-20">{highlight.evidence}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {displayIndex < highlights.length && (
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

      {/* Quick Stats Footer */}
      {displayedHighlights.length > 0 && (
        <div className="text-[10px] text-gray-500 pt-2 border-t border-gray-200 dark:border-gray-700">
          <div className="flex justify-between">
            <span>Critical: {displayedHighlights.filter(i => i.severity === 'critical').length}</span>
            <span>High: {displayedHighlights.filter(i => i.severity === 'high').length}</span>
            <span>
              {displayedHighlights.length}
              {highlights.length > displayedHighlights.length && `/${highlights.length}`}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIHighlights;