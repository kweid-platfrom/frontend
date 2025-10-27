// components/viewer/RecordingViewerLeftPanel.jsx
'use client'

import React, { useState, useRef, useEffect } from 'react';
import { Terminal, Network, Bug, Info, MessageSquare, CheckCircle, AlertTriangle, Bot } from 'lucide-react';
import AIHighlights from '../recorder/AIHighlights';
import { useAIBugGenerator } from '@/context/AIBugGeneratorContext';

const RecordingViewerLeftPanel = ({ 
  recording,
  videoRef,
  onAddComment
}) => {
  const [activeTab, setActiveTab] = useState('comments');
  const [commentText, setCommentText] = useState('');
  const [currentVideoTime, setCurrentVideoTime] = useState(0);
  const [selectedBugs, setSelectedBugs] = useState([]);
  const [showAIInsights, setShowAIInsights] = useState(true);
  const [aiInsights, setAiInsights] = useState([]);
  const commentsEndRef = useRef(null);
  const { openGenerator } = useAIBugGenerator();

  const formatTime = (s) => {
    if (!s || isNaN(s)) return '0:00';
    const sec = Math.floor(s % 60).toString().padStart(2, '0');
    const min = Math.floor(s / 60).toString();
    return `${min}:${sec}`;
  };

  const seekTo = (seconds) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = seconds;
    if (videoRef.current.paused) {
      videoRef.current.play();
    }
  };

  // Update current video time
  useEffect(() => {
    const player = videoRef?.current;
    if (!player) return;

    const updateTime = () => {
      if (player.getCurrentTime && typeof player.getCurrentTime === 'function') {
        const time = player.getCurrentTime();
        if (time && !isNaN(time)) {
          setCurrentVideoTime(time);
        }
      }
    };

    const intervalId = setInterval(updateTime, 100);
    return () => clearInterval(intervalId);
  }, [videoRef]);

  // Scroll to latest comment
  useEffect(() => {
    if (activeTab === 'comments') {
      commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [recording?.comments, activeTab]);

  const addCommentAtCurrentTime = (text) => {
    if (!text.trim() || !videoRef.current) return;
    
    const currentTime = videoRef.current.currentTime;
    const comment = {
      id: `comment_${Date.now()}_${Math.random()}`,
      text: text.trim(),
      time: Number(currentTime.toFixed(1)),
      timeStr: formatTime(currentTime),
      createdAt: new Date().toISOString(),
    };
    
    if (onAddComment) {
      onAddComment(comment);
    }
    
    setCommentText('');
    setActiveTab('comments');
  };

  // Create bug from detected issue - just open AI modal with pre-filled data
  const createBugFromIssue = (issue) => {
    const issueDescription = `Detected Issue from Screen Recording

Issue Type: ${issue.type}
Severity: ${issue.severity}
Time Detected: ${formatTime(issue.time)}
Source: ${issue.source || 'Screen Recording'}

Details:
${issue.message}

${issue.requestData ? `
Network Request Details:
- URL: ${issue.requestData.url || 'N/A'}
- Method: ${issue.requestData.method || 'N/A'}
- Status: ${issue.requestData.status || 'N/A'}
- Error: ${issue.requestData.error || 'N/A'}
` : ''}`;

    const consoleErrorText = issue.source === 'console' ? issue.message : '';

    // Open AI Bug Generator with pre-filled data
    // The modal context handles everything else including bug creation
    openGenerator(
      (generatedBugData) => {
        // Mark this issue as processed
        setSelectedBugs(prev => [...prev, issue.id]);
        
        // Add recording metadata to the bug data
        return {
          ...generatedBugData,
          source: 'screen_recording',
          recordingData: {
            consoleLogs: issue.source === 'console' ? [issue] : [],
            networkLogs: issue.source === 'network' ? [issue.requestData] : [],
            issueId: issue.id,
            recordingTime: issue.time,
            recordingTitle: recording?.title || 'Untitled Recording',
            recordingId: recording?.id
          },
        };
      },
      {
        initialPrompt: issueDescription,
        initialConsoleError: consoleErrorText
      }
    );
  };

  // Handle AI insights actions
  const handleSaveInsights = (insights) => {
    console.log('Saving AI insights:', insights);
    setAiInsights(insights);
    
    const insightsData = {
      recordingId: recording?.id || `recording_${Date.now()}`,
      recordingTitle: recording?.title || 'Untitled Recording',
      timestamp: new Date().toISOString(),
      totalInsights: insights.length,
      insights: insights,
      metadata: {
        consoleLogs: recording?.consoleLogs?.length || 0,
        networkLogs: recording?.networkLogs?.length || 0,
        detectedIssues: recording?.detectedIssues?.length || 0,
        duration: recording?.duration || 0
      }
    };

    const blob = new Blob([JSON.stringify(insightsData, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-insights-${recording?.title || 'recording'}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Handle test case creation from AI insight
  const handleCreateTestCaseFromInsight = (insight) => {
    const testCasePrompt = `Create Test Case from AI Insight

Title: ${insight.title || 'Test Case'}
Description: ${insight.description}
Severity: ${insight.severity}
Category: ${insight.category || 'AI Generated'}
Recommendation: ${insight.recommendation || 'N/A'}

Recording Context:
- Recording: ${recording?.title || 'Untitled Recording'}
- Time: ${formatTime(insight.time || 0)}
- Confidence: ${(insight.confidence || 0) * 100}%`;

    openGenerator(
      (generatedData) => {
        return {
          ...generatedData,
          source: 'ai_insight',
          recordingData: {
            aiInsight: insight,
            recordingId: recording?.id,
            recordingTitle: recording?.title,
            recordingTime: insight.time
          }
        };
      },
      {
        initialPrompt: testCasePrompt
      }
    );
  };

  // Handle bug creation from AI insight
  const handleCreateBugFromInsight = (insight) => {
    const bugPrompt = `AI Detected Bug from Recording Analysis

Issue: ${insight.title || insight.description}
Severity: ${insight.severity}
Category: ${insight.category || 'AI Detected'}
Confidence: ${(insight.confidence || 0) * 100}%

Description:
${insight.description}

Recommendation:
${insight.recommendation || 'Review and fix the identified issue'}

Recording Details:
- Recording: ${recording?.title || 'Untitled Recording'}
- Time: ${formatTime(insight.time || 0)}
- Automation Potential: ${insight.automationPotential || 'medium'}`;

    openGenerator(
      (generatedData) => {
        return {
          ...generatedData,
          source: 'ai_insight',
          recordingData: {
            aiInsight: insight,
            relatedLogs: insight.relatedLogs || [],
            recordingId: recording?.id,
            recordingTitle: recording?.title,
            recordingTime: insight.time
          }
        };
      },
      {
        initialPrompt: bugPrompt
      }
    );
  };

  const toggleAIInsights = () => {
    setShowAIInsights(!showAIInsights);
  };

  const tabs = [
    { id: 'comments', label: 'Comments', icon: MessageSquare, count: recording?.comments?.length || 0 },
    { id: 'console', label: 'Console', icon: Terminal, count: recording?.consoleLogs?.length || 0 },
    { id: 'network', label: 'Network', icon: Network, count: recording?.networkLogs?.length || 0 },
    { id: 'issues', label: 'Issues', icon: Bug, count: recording?.detectedIssues?.length || 0 },
    { id: 'info', label: 'Info', icon: Info, count: 0 }
  ];

  const aiInsightCount = aiInsights.length;
  const criticalInsightCount = aiInsights.filter(insight => 
    insight.severity === 'critical' || insight.severity === 'high'
  ).length;

  return (
    <div className="w-full h-full flex flex-col">
      {/* AI Insights Section - 50% */}
      <div className="h-1/2 flex-shrink-0 border-b border-gray-200 dark:border-gray-700 flex flex-col">
        <div className="p-2 sm:p-3 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={toggleAIInsights}
            className="w-full flex items-center justify-between p-1.5 sm:p-2 rounded text-xs sm:text-sm font-medium transition-colors bg-gray-50 text-gray-600 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
          >
            <div className="flex items-center space-x-1 sm:space-x-2 min-w-0 flex-1">
              <Bot className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-500 flex-shrink-0" />
              <span className="truncate">AI Insights</span>
              {aiInsightCount > 0 && (
                <div className="flex items-center space-x-1 flex-shrink-0">
                  <span className="text-[10px] sm:text-xs bg-purple-100 text-purple-700 dark:bg-purple-800 dark:text-purple-300 px-1.5 sm:px-2 py-0.5 rounded-full">
                    {aiInsightCount}
                  </span>
                  {criticalInsightCount > 0 && (
                    <span className="hidden sm:inline-flex text-xs bg-red-100 text-red-700 dark:bg-red-800 dark:text-red-300 px-2 py-0.5 rounded-full">
                      {criticalInsightCount} critical
                    </span>
                  )}
                </div>
              )}
            </div>
            <div className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full bg-gray-200 text-gray-600 dark:bg-gray-600 dark:text-gray-400 flex-shrink-0 ml-2">
              {showAIInsights ? 'ON' : 'OFF'}
            </div>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {showAIInsights ? (
            <div className="p-2 sm:p-3">
              <AIHighlights
                consoleLogs={recording?.consoleLogs || []}
                networkLogs={recording?.networkLogs || []}
                detectedIssues={recording?.detectedIssues || []}
                duration={recording?.duration || 0}
                onSeekTo={seekTo}
                isEnabled={showAIInsights}
                onToggle={toggleAIInsights}
                onSaveHighlights={handleSaveInsights}
                onCreateTestCase={handleCreateTestCaseFromInsight}
                onCreateBug={handleCreateBugFromInsight}
                className="space-y-2"
              />
            </div>
          ) : (
            <div className="p-4 sm:p-6 text-center">
              <Bot className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 text-gray-400" />
              <div className="text-xs sm:text-sm text-gray-500 mb-1 sm:mb-2">AI Insights</div>
              <div className="text-[10px] sm:text-xs text-gray-400 mb-3 sm:mb-4 px-2">
                Toggle AI Insights ON to view intelligent analysis of your recording
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Comments/DevTools Section - 50% */}
      <div className="h-1/2 flex-shrink-0 flex flex-col">
        <div className="p-2 sm:p-3 border-b border-gray-200 dark:border-gray-700">
          <div className="flex space-x-1 sm:space-x-2">
            <input
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Add a comment at current time..."
              className="flex-1 text-[11px] sm:text-xs border border-gray-300 dark:border-gray-600 rounded px-2 py-1.5 sm:py-2 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-1 focus:ring-teal-500"
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  addCommentAtCurrentTime(commentText);
                }
              }}
            />
            <button
              onClick={() => addCommentAtCurrentTime(commentText)}
              disabled={!commentText.trim()}
              className="px-2 sm:px-3 py-1 text-[10px] sm:text-xs bg-orange-500 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-orange-600 transition-colors whitespace-nowrap flex-shrink-0"
            >
              @ {formatTime(currentVideoTime)}
            </button>
          </div>
        </div>

        <div className="flex overflow-x-auto overflow-y-hidden border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
          {tabs.map(({ id, label, icon: Icon, count }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex-shrink-0 px-2 sm:px-3 py-1.5 sm:py-2 text-[10px] sm:text-xs font-medium border-b-2 whitespace-nowrap flex items-center space-x-1 transition-colors ${
                activeTab === id
                  ? 'border-teal-500 text-teal-600 dark:text-teal-400 bg-white dark:bg-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <Icon className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
              <span className="hidden xs:inline sm:inline">{label}</span>
              {count > 0 && (
                <span className={`px-1 sm:px-1.5 py-0.5 text-[9px] sm:text-[10px] rounded-full ${
                  activeTab === id 
                    ? 'bg-teal-100 text-teal-600 dark:bg-teal-900 dark:text-teal-300' 
                    : 'bg-gray-200 text-gray-600 dark:bg-gray-600 dark:text-gray-400'
                }`}>
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-2 sm:p-3">
          {activeTab === 'comments' && (
            <div className="space-y-2">
              {(!recording?.comments || recording.comments.length === 0) ? (
                <div className="text-gray-500 text-xs sm:text-sm text-center py-6 sm:py-8">
                  <MessageSquare className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 opacity-50" />
                  <div>No comments added yet</div>
                  <div className="text-[10px] sm:text-xs mt-1">Add a comment above to get started</div>
                </div>
              ) : (
                <>
                  {recording.comments
                    .slice()
                    .sort((a, b) => a.time - b.time)
                    .map(comment => (
                      <div key={comment.id} className="p-2 sm:p-3 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between mb-1 sm:mb-2">
                          <button
                            onClick={() => seekTo(comment.time)}
                            className="text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300 font-medium text-xs sm:text-sm hover:underline"
                          >
                            [{comment.timeStr || formatTime(comment.time)}]
                          </button>
                          <span className="text-gray-400 text-[9px] sm:text-[10px]">
                            {new Date(comment.createdAt || comment.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <div className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 break-words">{comment.text}</div>
                      </div>
                    ))}
                  <div ref={commentsEndRef} />
                </>
              )}
            </div>
          )}

          {activeTab === 'console' && (
            <div className="space-y-1">
              {(!recording?.consoleLogs || recording.consoleLogs.length === 0) ? (
                <div className="text-gray-500 text-xs sm:text-sm text-center py-6 sm:py-8">
                  <Terminal className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 opacity-50" />
                  <div>No console logs captured</div>
                </div>
              ) : (
                recording.consoleLogs
                  .slice()
                  .reverse()
                  .map((log, i) => (
                    <div key={`${log.timestamp}-${i}`} className="text-[11px] sm:text-xs border border-gray-100 dark:border-gray-700 rounded p-1.5 sm:p-2 hover:bg-gray-50 dark:hover:bg-gray-800">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-gray-400 text-[9px] sm:text-[10px]">
                          {new Date(log.time || log.timestamp).toLocaleTimeString()}
                        </span>
                        <div className="flex items-center space-x-1">
                          <span className={`font-medium text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded ${
                            log.level === 'error' ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' :
                            log.level === 'warn' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' :
                            'bg-teal-100 text-teal-600 dark:bg-teal-900 dark:text-teal-300'
                          }`}>
                            {log.level?.toUpperCase() || 'LOG'}
                          </span>
                          {(log.count && log.count > 1) && (
                            <span className="text-[9px] sm:text-[10px] bg-gray-200 text-gray-600 px-1 rounded">
                              {log.count}x
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-gray-700 dark:text-gray-300 break-words">{log.message}</div>
                    </div>
                  ))
              )}
            </div>
          )}

          {activeTab === 'network' && (
            <div className="space-y-2">
              {(!recording?.networkLogs || recording.networkLogs.length === 0) ? (
                <div className="text-gray-500 text-xs sm:text-sm text-center py-6 sm:py-8">
                  <Network className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 opacity-50" />
                  <div>No network requests captured</div>
                </div>
              ) : (
                recording.networkLogs
                  .slice()
                  .reverse()
                  .map((req, i) => (
                    <div
                      key={req.id || `${req.timestamp}-${i}`}
                      className="p-1.5 sm:p-2 rounded border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center space-x-1 sm:space-x-2">
                          <span className={`text-[9px] sm:text-[10px] font-medium px-1.5 sm:px-2 py-0.5 rounded uppercase ${
                            req.status >= 400 || req.status === 'ERR' ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' :
                            req.status >= 300 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' :
                            'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                          }`}>
                            {req.method}
                          </span>
                          <span className={`text-[10px] sm:text-xs font-medium ${
                            req.status >= 400 || req.status === 'ERR' ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'
                          }`}>
                            {req.status}
                          </span>
                          {(req.count && req.count > 1) && (
                            <span className="text-[9px] sm:text-[10px] bg-gray-200 text-gray-600 px-1 rounded">
                              {req.count}x
                            </span>
                          )}
                        </div>
                        <span className="text-[9px] sm:text-[10px] text-gray-500">{req.duration}ms</span>
                      </div>
                      <div className="text-[10px] sm:text-[11px] text-gray-700 dark:text-gray-300 break-all">{req.url}</div>
                      {req.error && (
                        <div className="text-[9px] sm:text-[10px] text-red-500 dark:text-red-400 mt-1 truncate">
                          Error: {req.error}
                        </div>
                      )}
                    </div>
                  ))
              )}
            </div>
          )}

          {activeTab === 'issues' && (
            <div className="space-y-2">
              {(!recording?.detectedIssues || recording.detectedIssues.length === 0) ? (
                <div className="flex items-center justify-center text-gray-500 py-6 sm:py-8">
                  <div className="text-center">
                    <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 text-green-500" />
                    <div className="font-medium text-xs sm:text-sm">No issues detected</div>
                    <div className="text-[10px] sm:text-xs mt-1">Recording ran smoothly</div>
                  </div>
                </div>
              ) : (
                recording.detectedIssues.map((issue) => (
                  <div
                    key={issue.id}
                    className={`p-2 sm:p-3 rounded border-l-4 ${
                      issue.severity === 'high' ? 'border-red-500 bg-red-50 dark:bg-red-900/20' :
                      issue.severity === 'medium' ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20' :
                      'border-teal-500 bg-teal-50 dark:bg-teal-900/20'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center flex-wrap gap-1 sm:gap-2 mb-1">
                          <AlertTriangle className={`w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0 ${
                            issue.severity === 'high' ? 'text-red-600' :
                            issue.severity === 'medium' ? 'text-orange-500' :
                            'text-teal-600'
                          }`} />
                          <span className="text-xs sm:text-sm font-medium capitalize truncate">
                            {issue.type.replace('_', ' ')}
                          </span>
                          <span className={`text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 sm:py-1 rounded uppercase font-medium ${
                            issue.severity === 'high' ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' :
                            issue.severity === 'medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' :
                            'bg-teal-100 text-teal-600 dark:bg-teal-900 dark:text-teal-300'
                          }`}>
                            {issue.severity}
                          </span>
                          {(issue.count && issue.count > 1) && (
                            <span className="text-[9px] sm:text-[10px] bg-gray-200 text-gray-600 px-1 rounded">
                              {issue.count}x
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 mb-1 break-words">{issue.message}</div>
                        <button
                          onClick={() => seekTo(issue.time)}
                          className="text-[9px] sm:text-[10px] text-teal-600 hover:text-teal-700 dark:text-teal-400 hover:underline"
                        >
                          Jump to {formatTime(issue.time)}
                        </button>
                      </div>
                      <button
                        onClick={() => createBugFromIssue(issue)}
                        className={`flex-shrink-0 px-1.5 sm:px-2 py-1 text-[9px] sm:text-[10px] rounded transition-colors ${
                          selectedBugs.includes(issue.id)
                            ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                            : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700'
                        }`}
                        disabled={selectedBugs.includes(issue.id)}
                      >
                        {selectedBugs.includes(issue.id) ? 'Created' : 'AI Bug'}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'info' && (
            <div className="text-[11px] sm:text-xs space-y-2">
              <div className="grid grid-cols-1 gap-2">
                <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded">
                  <div className="font-medium text-gray-700 dark:text-gray-300 mb-1">Recording Statistics</div>
                  <div className="space-y-1 text-gray-600 dark:text-gray-400">
                    <div><strong>Console Logs:</strong> {recording?.consoleLogs?.length || 0}</div>
                    <div><strong>Network Requests:</strong> {recording?.networkLogs?.length || 0}</div>
                    <div><strong>Issues Found:</strong> {recording?.detectedIssues?.length || 0}</div>
                    <div><strong>Comments:</strong> {recording?.comments?.length || 0}</div>
                    <div><strong>Duration:</strong> {formatTime(recording?.duration || 0)}</div>
                  </div>
                </div>

                {aiInsightCount > 0 && (
                  <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded">
                    <div className="font-medium text-gray-700 dark:text-gray-300 mb-1">AI Analysis</div>
                    <div className="space-y-1 text-gray-600 dark:text-gray-400">
                      <div><strong>Total Insights:</strong> {aiInsightCount}</div>
                      <div><strong>Critical/High:</strong> {criticalInsightCount}</div>
                      <div><strong>Automation Ready:</strong> {aiInsights.filter(i => i.automationPotential === 'high').length}</div>
                      <div><strong>Avg Confidence:</strong> {
                        aiInsights.length > 0 
                          ? Math.round(aiInsights.reduce((sum, i) => sum + (i.confidence || 0), 0) / aiInsights.length * 100)
                          : 0
                      }%</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecordingViewerLeftPanel;