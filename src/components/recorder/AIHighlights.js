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
  Target,
  Zap
} from 'lucide-react';

// Import the AI Context instead of service
import { useAI } from '@/context/AIContext';

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
  const [analysisError, setAnalysisError] = useState(null);
  const intervalRef = useRef(null);
  const analysisTriggeredRef = useRef(false);

  // Get AI context
  const { generatePlainTextContent, isReady } = useAI();

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
    Target,
    Zap
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

  // Parse AI response to extract insights
  const parseAIInsights = (aiResponse) => {
    try {
      console.log('Parsing AI response...');
      
      // Try to extract JSON if wrapped in markdown code blocks
      let jsonText = aiResponse.trim();
      
      // Remove markdown code blocks if present
      const jsonMatch = aiResponse.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        jsonText = jsonMatch[1].trim();
        console.log('Extracted JSON from markdown block');
      }

      const parsed = JSON.parse(jsonText);
      console.log('Parsed JSON successfully:', parsed);
      
      // Validate and normalize the insights
      if (parsed.insights && Array.isArray(parsed.insights)) {
        console.log(`Found ${parsed.insights.length} insights`);
        return parsed.insights.map((insight, index) => ({
          id: insight.id || `insight_${Date.now()}_${index}`,
          type: insight.type || 'info',
          severity: insight.severity || 'medium',
          title: insight.title || 'Untitled Insight',
          description: insight.description || '',
          time: parseFloat(insight.time) || 0,
          icon: insight.icon || 'Lightbulb',
          color: insight.color || 'purple',
          confidence: parseFloat(insight.confidence) || 0.8,
          recommendations: Array.isArray(insight.recommendations) ? insight.recommendations : [],
          testCaseRecommendations: Array.isArray(insight.testCaseRecommendations) ? insight.testCaseRecommendations : [],
          category: insight.category || 'general'
        }));
      }
      
      console.warn('No insights array found in parsed JSON');
      return [];
    } catch (error) {
      console.error('Failed to parse AI insights:', error);
      console.error('AI Response was:', aiResponse);
      return [];
    }
  };

  // Analyze recording data using AI Context
  const analyzeRecordingWithAI = useCallback(async () => {
    // Prevent duplicate analysis
    if (analysisTriggeredRef.current || isAnalyzing) {
      return;
    }

    // Check if there's data to analyze
    const hasData = consoleLogs.length > 0 || networkLogs.length > 0 || detectedIssues.length > 0;
    if (!hasData) {
      setHasAnalyzed(true);
      return;
    }

    // Check AI readiness
    if (!isReady) {
      console.warn('AI service not ready');
      setAnalysisError('AI service is not ready. Please check your API configuration.');
      setHasAnalyzed(true);
      return;
    }

    analysisTriggeredRef.current = true;
    setIsAnalyzing(true);
    setAnalysisError(null);

    console.log('🤖 Starting AI analysis with:', {
      consoleLogs: consoleLogs.length,
      networkLogs: networkLogs.length,
      detectedIssues: detectedIssues.length,
      duration
    });

    try {
      // Prepare summary of recording data
      const errorLogs = consoleLogs.filter(log => log.type === 'error');
      const warnLogs = consoleLogs.filter(log => log.type === 'warn');
      const failedRequests = networkLogs.filter(log => log.status >= 400);
      const slowRequests = networkLogs.filter(log => log.duration > 3000);

      // Build analysis prompt - focused on INVESTIGATION not testing
      const analysisPrompt = `You are a senior developer analyzing a recorded QA session. Investigate what went wrong and provide actionable debugging insights.

## Recording Data Summary:
- Duration: ${duration} seconds
- Console Errors: ${errorLogs.length}
- Console Warnings: ${warnLogs.length}
- Failed Network Requests: ${failedRequests.length}
- Slow Network Requests (>3s): ${slowRequests.length}
- Detected Issues: ${detectedIssues.length}

## Actual Errors Found:
${errorLogs.length > 0 ? errorLogs.slice(0, 8).map(log => `[${formatTime(log.time)}] ${log.type.toUpperCase()}: ${log.message}${log.stack ? `\nStack: ${log.stack.substring(0, 200)}` : ''}`).join('\n\n') : 'No console errors'}

## Failed Network Requests:
${failedRequests.length > 0 ? failedRequests.slice(0, 8).map(req => `[${formatTime(req.time)}] ${req.method} ${req.url}
Status: ${req.status} ${req.statusText || ''}
${req.error ? `Error: ${req.error}` : ''}`).join('\n\n') : 'No failed requests'}

## Slow Network Requests (>3s):
${slowRequests.length > 0 ? slowRequests.slice(0, 5).map(req => `[${formatTime(req.time)}] ${req.method} ${req.url}
Duration: ${req.duration}ms
Status: ${req.status}`).join('\n\n') : 'No slow requests'}

## Other Detected Issues:
${detectedIssues.length > 0 ? detectedIssues.slice(0, 5).map(issue => `[${formatTime(issue.time)}] ${issue.type}: ${issue.message}${issue.details ? `\nDetails: ${JSON.stringify(issue.details)}` : ''}`).join('\n\n') : 'No other issues'}

## Console Warnings:
${warnLogs.length > 0 ? warnLogs.slice(0, 5).map(log => `[${formatTime(log.time)}] ${log.message}`).join('\n') : 'No warnings'}

---

**IMPORTANT**: Analyze ONLY the actual errors, failures, and issues listed above. Do NOT suggest what should be tested. Focus on:

1. **Root Cause Analysis**: What likely caused each error?
2. **Impact Assessment**: How does this affect users/functionality?
3. **Technical Investigation**: What should developers check?
4. **Error Patterns**: Are multiple errors related?
5. **Performance Issues**: Why are requests slow?
6. **Data Flow Problems**: Are there API or state management issues?

For each insight, provide:
- **What happened** (the actual error/issue)
- **Why it likely happened** (root cause hypothesis)
- **What to investigate** (specific debugging steps for developers)
- **Business impact** (how this affects users)

Return ONLY valid JSON in this exact format (no markdown code blocks, no explanations outside JSON):
{
  "insights": [
    {
      "id": "error_001",
      "type": "error|warning|performance|network",
      "severity": "critical|high|medium|low",
      "title": "Clear description of what went wrong",
      "description": "Detailed investigation of the root cause, impact on users, and what specifically failed. Focus on technical details developers need.",
      "time": 0.0,
      "icon": "AlertTriangle|Network|Clock|Code|Shield",
      "color": "red|yellow|blue|purple",
      "confidence": 0.85,
      "recommendations": [
        "Check server logs for /api/endpoint errors",
        "Verify database connection pool settings",
        "Review authentication token expiration"
      ],
      "testCaseRecommendations": [],
      "category": "error|performance|network"
    }
  ]
}

Prioritize insights by severity and user impact. Include 3-10 insights maximum.`;

      // Call AI service
      const result = await generatePlainTextContent(analysisPrompt, {
        temperature: 0.7,
        maxTokens: 3000
      });

      console.log('AI Analysis result:', result);

      if (result.success) {
        // The response can be in result.content or result.data
        const aiResponse = result.content || result.data;
        
        if (aiResponse) {
          const parsedInsights = parseAIInsights(aiResponse);
          
          if (parsedInsights.length > 0) {
            console.log(`✅ Generated ${parsedInsights.length} insights from AI`);
            setInsights(parsedInsights);
          } else {
            console.warn('No valid insights parsed from AI response');
            console.log('AI Response:', aiResponse);
            setInsights([]);
            setAnalysisError('Could not parse insights from AI response');
          }
        } else {
          console.warn('AI response is empty');
          setInsights([]);
          setAnalysisError('AI returned empty response');
        }
        setHasAnalyzed(true);
      } else {
        console.error('AI analysis failed:', result.error);
        setInsights([]);
        setHasAnalyzed(true);
        setAnalysisError(result.error || 'Failed to analyze recording');
      }
    } catch (err) {
      console.error('❌ AI analysis exception:', err);
      setInsights([]);
      setHasAnalyzed(true);
      setAnalysisError(err.message || 'Analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  }, [consoleLogs, networkLogs, detectedIssues, duration, isAnalyzing, isReady, generatePlainTextContent]);

  // Progressive display logic
  const startProgressiveDisplay = useCallback(() => {
    if (insights.length === 0) return;

    console.log(`Starting progressive display of ${insights.length} insights`);
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

  // Update displayed insights as index changes
  useEffect(() => {
    if (displayIndex > 0 && insights.length > 0) {
      setDisplayedInsights(insights.slice(0, displayIndex));
    }
  }, [displayIndex, insights]);

  // Trigger analysis when data is available
  useEffect(() => {
    const hasData = consoleLogs.length > 0 || networkLogs.length > 0 || detectedIssues.length > 0;
    if (hasData && !hasAnalyzed && !isAnalyzing) {
      analyzeRecordingWithAI();
    }
  }, [consoleLogs.length, networkLogs.length, detectedIssues.length, hasAnalyzed, isAnalyzing, analyzeRecordingWithAI]);

  // Start progressive display when enabled
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
        <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Analyzing captured data...</div>
        <div className="flex items-center justify-center space-x-1">
          <div className="w-1 h-1 bg-purple-400 rounded-full animate-bounce"></div>
          <div className="w-1 h-1 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-1 h-1 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
      </div>
    );
  }

  if (analysisError) {
    return (
      <div className={`text-center py-4 ${className}`}>
        <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
        <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Analysis Error</div>
        <div className="text-[10px] text-gray-500">{analysisError}</div>
        <button
          onClick={() => {
            analysisTriggeredRef.current = false;
            setHasAnalyzed(false);
            setAnalysisError(null);
            analyzeRecordingWithAI();
          }}
          className="mt-2 text-[10px] px-3 py-1 bg-purple-100 text-purple-700 dark:bg-purple-800 dark:text-purple-300 rounded hover:bg-purple-200 dark:hover:bg-purple-700 transition-colors"
        >
          Retry Analysis
        </button>
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
            AI Insights
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
              Save All
            </button>
          </div>
        )}
      </div>

      {/* Insights List */}
      <div className="space-y-1.5 max-h-96 overflow-y-auto">
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
                      <div className="text-[11px] text-gray-600 dark:text-gray-400 mb-1">
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
                      
                      {/* Recommendations */}
                      {insight.recommendations && insight.recommendations.length > 0 && (
                        <div className="mt-1 text-[10px] text-gray-600 dark:text-gray-400">
                          <div className="font-medium mb-0.5">Recommendations:</div>
                          <ul className="list-disc list-inside space-y-0.5">
                            {insight.recommendations.slice(0, 2).map((rec, i) => (
                              <li key={i}>{rec}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
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
                  <div className="w-1 h-1 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-1 h-1 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
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
            <span>Medium: {displayedInsights.filter(i => i.severity === 'medium').length}</span>
            <span>
              {displayedInsights.length}
              {insights.length > displayedInsights.length && `/${insights.length}`}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIHighlights;