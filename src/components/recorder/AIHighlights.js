import React, { useState, useEffect, useCallback } from 'react';
import { Brain, Zap, AlertTriangle, CheckCircle, Clock, Network, Code, Loader2 } from 'lucide-react';
import { useApp } from '../../context/AppProvider';

const AIHighlights = ({ 
  consoleLogs = [], 
  networkLogs = [], 
  detectedIssues = [], 
  duration = 0,
  onSeekTo,
  isEnabled = true,
  onToggle,
  onSaveHighlights,
  className = ""
}) => {
  const { 
    actions: { ai: { generateTestCasesWithAI } },
    state: { 
      aiAvailable: canGenerate, 
      aiGenerating: isGenerating, 
      aiError: aiError,
      isLoading: isInitializing
    }
  } = useApp();

  const [highlights, setHighlights] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [error, setError] = useState(null);

  const formatTime = (seconds) => {
    const sec = Math.floor(seconds % 60).toString().padStart(2, '0');
    const min = Math.floor(seconds / 60).toString();
    return `${min}:${sec}`;
  };

  const getLogTime = (log) => {
    if (log.time) return typeof log.time === 'number' ? log.time : 0;
    if (log.timestamp) {
      const date = new Date(log.timestamp);
      return isNaN(date.getTime()) ? Math.random() * duration : (date.getTime() % (duration * 1000)) / 1000;
    }
    return Math.random() * duration;
  };

  const getUrlDomain = (url) => {
    try {
      return new URL(url).hostname;
    } catch {
      return url.split('/')[0] || 'unknown';
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'high': return AlertTriangle;
      case 'medium': return Clock;
      case 'low': return CheckCircle;
      case 'dev_tool': return Code;
      default: return Brain;
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return 'red';
      case 'medium': return 'yellow';
      case 'low': return 'blue';
      case 'dev_tool': return 'purple';
      default: return 'purple';
    }
  };

  const generateHighlights = useCallback(async () => {
    if (!canGenerate || !isEnabled || isAnalyzing) {
      console.log('Cannot generate highlights:', { canGenerate, isEnabled, isAnalyzing });
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setAnalysisComplete(false);

    try {
      const recordingData = {
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

      const analysisPrompt = `
Analyze this screen recording session data and provide key insights for timeline-based highlights:

Recording Duration: ${duration} seconds
Console Logs: ${consoleLogs.length} entries
Network Requests: ${networkLogs.length} entries  
Detected Issues: ${detectedIssues.length} entries

Console Error Summary:
${consoleLogs.filter(log => log.level === 'error').map(log => `- ${log.message}`).join('\n').substring(0, 500)}

Network Issues Summary:
${networkLogs.filter(req => req.status >= 400).map(req => `- ${req.method} ${req.url} (${req.status})`).join('\n').substring(0, 500)}

Please identify the most critical issues, performance problems, and positive aspects. Return insights in JSON format with: id, type, title, description, time, severity, confidence, impact, recommendation, tags. Ensure insights are tied to specific timestamps for timeline-based highlights.
      `.trim();

      const result = await generateTestCasesWithAI(analysisPrompt, 'Recording Analysis', {
        temperature: 0.3,
        maxTokens: 2000,
        framework: 'Recording Analysis'
      });

      if (result.success && result.data?.testCases) {
        const aiHighlights = result.data.testCases.map((testCase, index) => {
          const insight = parseAIInsight(testCase, index);
          return {
            id: `ai-${index}`,
            type: insight.type || 'general_insight',
            category: insight.category || 'analysis',
            title: insight.title || testCase.name || 'AI Insight',
            description: insight.description || testCase.description || 'AI detected an important pattern',
            time: insight.time || (duration * Math.random()),
            severity: insight.severity || 'medium',
            confidence: insight.confidence || 0.8,
            impact: insight.impact || 'May affect user experience',
            recommendation: insight.recommendation || 'Review and address if needed',
            tags: insight.tags || ['ai-generated'],
            icon: getSeverityIcon(insight.severity || 'medium'),
            color: getSeverityColor(insight.severity || 'medium'),
            aiGenerated: true,
            source: 'ai-analysis'
          };
        });

        setHighlights(aiHighlights);
        setAnalysisComplete(true);
        console.log(`Generated ${aiHighlights.length} AI highlights`);
      } else {
        throw new Error(result.error || 'AI analysis failed');
      }

    } catch (err) {
      console.error('AI highlight generation failed:', err);
      setError(err.message || 'Failed to generate AI insights');
      
      const fallbackHighlights = generateBasicHighlights();
      setHighlights(fallbackHighlights);
      setAnalysisComplete(true);
    } finally {
      setIsAnalyzing(false);
    }
  }, [generateTestCasesWithAI, canGenerate, isEnabled, isAnalyzing, consoleLogs, networkLogs, detectedIssues, duration]);

  const parseAIInsight = (testCase, index) => {
    try {
      const description = testCase.description || '';
      const severityMatch = description.match(/severity[:\s]*(high|medium|low|dev_tool)/i);
      const timeMatch = description.match(/time[:\s]*(\d+)/);
      const typeMatch = description.match(/type[:\s]*(\w+)/i);
      
      return {
        type: typeMatch ? typeMatch[1].toLowerCase() : 'insight',
        severity: severityMatch ? severityMatch[1].toLowerCase() : 'medium',
        time: timeMatch ? parseInt(timeMatch[1]) : duration * Math.random(),
        title: testCase.name || `AI Insight ${index + 1}`,
        description: description,
        confidence: 0.85
      };
    } catch (err) {
      console.warn('Failed to parse AI insight:', err);
      return {};
    }
  };

  const generateBasicHighlights = () => {
    const basicHighlights = [];

    const errors = consoleLogs.filter(log => log.level === 'error');
    if (errors.length > 0) {
      basicHighlights.push({
        id: 'basic-errors',
        type: 'error_summary',
        category: 'errors',
        title: `${errors.length} Console Errors`,
        description: `Found ${errors.length} JavaScript errors that may impact functionality`,
        time: getLogTime(errors[0]),
        severity: 'high',
        confidence: 1.0,
        impact: 'May break application functionality',
        recommendation: 'Review and fix JavaScript errors',
        tags: ['javascript', 'errors'],
        icon: AlertTriangle,
        color: 'red'
      });
    }

    const failedRequests = networkLogs.filter(req => req.status >= 400);
    if (failedRequests.length > 0) {
      basicHighlights.push({
        id: 'basic-network',
        type: 'network_summary',
        category: 'network',
        title: `${failedRequests.length} Failed Requests`,
        description: `Detected ${failedRequests.length} failed network requests`,
        time: getLogTime(failedRequests[0]),
        severity: 'medium',
        confidence: 1.0,
        impact: 'May affect data loading',
        recommendation: 'Check API endpoints and error handling',
        tags: ['network', 'api'],
        icon: Network,
        color: 'yellow'
      });
    }

    const devToolIssues = detectedIssues.filter(issue => issue.type.includes('dev_tool'));
    if (devToolIssues.length > 0) {
      basicHighlights.push({
        id: 'basic-dev-tools',
        type: 'dev_tool_summary',
        category: 'dev_tools',
        title: `${devToolIssues.length} Dev Tool Issues`,
        description: `Detected ${devToolIssues.length} developer tool-related issues`,
        time: getLogTime(devToolIssues[0]),
        severity: 'dev_tool',
        confidence: 1.0,
        impact: 'May require developer attention',
        recommendation: 'Review developer tool configurations',
        tags: ['dev_tools', 'configuration'],
        icon: Code,
        color: 'purple'
      });
    }

    if (basicHighlights.length === 0) {
      basicHighlights.push({
        id: 'basic-positive',
        type: 'positive_feedback',
        category: 'performance',
        title: 'Clean Recording Session',
        description: 'No critical issues detected in this recording',
        time: duration * 0.5,
        severity: 'info',
        confidence: 1.0,
        impact: 'Good application health',
        recommendation: 'Continue monitoring for potential issues',
        tags: ['positive', 'clean'],
        icon: CheckCircle,
        color: 'green'
      });
    }

    return basicHighlights;
  };

  useEffect(() => {
    if (isEnabled && (consoleLogs.length > 0 || networkLogs.length > 0)) {
      generateHighlights();
    }
  }, [isEnabled, consoleLogs.length, networkLogs.length, generateHighlights]);

  if (isAnalyzing) {
    return (
      <div className={`space-y-3 ${className}`}>
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-purple-500 mx-auto mb-3" />
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {isInitializing ? 'Initializing AI service...' : 'AI analyzing recording...'}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {isInitializing ? 'Please wait while we prepare the AI' : 'Identifying key moments and insights'}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || aiError) {
    return (
      <div className={`space-y-3 ${className}`}>
        <div className="text-center py-8">
          <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-red-400" />
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            AI Analysis Failed
          </div>
          <div className="text-xs text-red-500 mb-4">
            {error || aiError?.message || 'Unknown error'}
          </div>
          <button
            onClick={generateHighlights}
            className="px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors"
          >
            Retry Analysis
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Brain className="w-5 h-5 text-purple-400" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            AI Timeline Highlights
          </span>
        </div>
        <div className="flex items-center space-x-2">
          {highlights.length > 0 && (
            <button
              onClick={() => onSaveHighlights?.(highlights)}
              className="px-3 py-1 text-xs bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors"
            >
              Save Highlights
            </button>
          )}
          <button
            onClick={onToggle}
            className={`px-3 py-1 text-xs rounded transition-colors ${
              isEnabled
                ? 'bg-purple-600 text-white hover:bg-purple-700'
                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
            }`}
          >
            {isEnabled ? 'Hide AI Highlights' : 'Show AI Highlights'}
          </button>
        </div>
      </div>

      {!analysisComplete && highlights.length === 0 && (
        <div className="text-center py-8">
          <Brain className="w-12 h-12 mx-auto mb-3 text-purple-400" />
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            AI Insights Ready
          </div>
          <div className="text-xs text-gray-500 mb-4">
            {canGenerate 
              ? 'Click to analyze this recording with AI'
              : 'AI service not available - check configuration'
            }
          </div>
          {canGenerate && (
            <button
              onClick={generateHighlights}
              className="px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors"
            >
              Generate AI Insights
            </button>
          )}
        </div>
      )}

      {highlights.length > 0 && (
        <>
          <div className="text-xs text-gray-600 dark:text-gray-400 mb-3 p-2 bg-purple-50 dark:bg-purple-900/20 rounded border-l-4 border-purple-400">
            <div className="flex items-center space-x-2">
              <Zap className="w-3 h-3" />
              <span className="font-medium">
                {analysisComplete ? 'AI Analysis Complete' : 'AI Insights'}
              </span>
            </div>
            <div className="mt-1">
              Found {highlights.length} key insights from your recording
            </div>
          </div>
          
          {highlights.map((highlight) => {
            const IconComponent = highlight.icon || Brain;
            const colorClasses = {
              red: 'border-red-500 bg-red-50/50 dark:bg-red-900/10',
              yellow: 'border-yellow-500 bg-yellow-50/50 dark:bg-yellow-900/10', 
              green: 'border-green-500 bg-green-50/50 dark:bg-green-900/10',
              blue: 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/10',
              purple: 'border-purple-500 bg-purple-50/50 dark:bg-purple-900/10'
            };

            return (
              <div
                key={highlight.id}
                className={`p-3 rounded-lg border-l-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${
                  colorClasses[highlight.color] || colorClasses.purple
                }`}
                onClick={() => onSeekTo && onSeekTo(highlight.time)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <IconComponent className="w-4 h-4 text-purple-600" />
                      <span className="font-medium text-sm">{highlight.title}</span>
                      <span className={`text-[10px] px-2 py-1 rounded uppercase font-medium ${
                        highlight.severity === 'high' ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' :
                        highlight.severity === 'medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' :
                        highlight.severity === 'low' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' :
                        highlight.severity === 'dev_tool' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300' :
                        'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
                      }`}>
                        {highlight.severity}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                      {highlight.description}
                    </div>
                    {highlight.recommendation && (
                      <div className="text-xs text-gray-700 dark:text-gray-300 mb-2 italic">
                        💡 {highlight.recommendation}
                      </div>
                    )}
                    <div className="flex items-center space-x-3 text-[10px] text-gray-500">
                      <span>@ {formatTime(highlight.time)}</span>
                      <span>Confidence: {Math.round(highlight.confidence * 100)}%</span>
                      <div className="flex space-x-1">
                        {highlight.tags?.map(tag => (
                          <span key={tag} className="bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded">
                            {tag}
                          </span>
                        ))}
                        {highlight.aiGenerated && (
                          <span className="bg-purple-100 dark:bg-purple-800 text-purple-700 dark:text-purple-300 px-1 py-0.5 rounded">
                            AI
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
};

export default AIHighlights;