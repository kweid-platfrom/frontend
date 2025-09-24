import React, { useState, useRef, useEffect } from 'react';
import { Terminal, Network, Bug, CheckCircle, AlertTriangle, MessageSquare, Info, Bot, } from 'lucide-react';
import { useRecording } from '../../hooks/useRecording';
import AIHighlights from './AIHighlights';

const RecorderLeftPanel = ({ 
  consoleLogs = [], 
  networkLogs = [], 
  detectedIssues = [], 
  comments = [], 
  onAddComment,
  videoRef, 
  activeSuite, 
  firestoreService,
  isPreviewMode = false,
  aiHighlightEnabled = false,
  onToggleAiHighlight,
  onSaveInsights,
  onCreateTestCaseFromInsight,
  onCreateBugFromInsight
}) => {
  const [activeTab, setActiveTab] = useState(isPreviewMode ? 'comments' : 'console');
  const [commentText, setCommentText] = useState('');
  const [selectedBugs, setSelectedBugs] = useState([]);
  const [currentVideoTime, setCurrentVideoTime] = useState(0);
  const [showAIInsights, setShowAIInsights] = useState(aiHighlightEnabled);
  const [aiInsights, setAiInsights] = useState([]);
  const commentsEndRef = useRef(null);
  
  // Get recording orchestrator for adding comments during live recording
  const { actions: recordingActions, isActive } = useRecording();

  const formatTime = (s) => {
    const sec = Math.floor(s % 60).toString().padStart(2, '0');
    const min = Math.floor(s / 60).toString();
    return `${min}:${sec}`;
  };

  // Update current video time
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateTime = () => setCurrentVideoTime(video.currentTime);
    video.addEventListener('timeupdate', updateTime);
    return () => video.removeEventListener('timeupdate', updateTime);
  }, [videoRef]);

  // Scroll to latest comment
  useEffect(() => {
    if (activeTab === 'comments') {
      commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [comments, activeTab]);

  // Sync AI insights visibility with prop
  useEffect(() => {
    setShowAIInsights(aiHighlightEnabled);
  }, [aiHighlightEnabled]);

  const addCommentAtCurrentTime = (text) => {
    if (!text.trim()) return;
    
    let comment;
    
    // If recording is active, add to live recording
    if (isActive && recordingActions) {
      comment = recordingActions.addComment(text, currentVideoTime);
    } 
    // Otherwise, add to preview data
    else if (videoRef.current) {
      const currentTime = videoRef.current.currentTime;
      comment = {
        id: `comment_${Date.now()}_${Math.random()}`,
        text: text.trim(),
        time: Number(currentTime.toFixed(1)),
        timeStr: formatTime(currentTime),
        createdAt: new Date().toISOString(),
      };
      
      if (onAddComment) {
        onAddComment(comment);
      }
    }
    
    setCommentText('');
    // Switch to comments tab immediately
    setActiveTab('comments');
    return comment;
  };

  const seekTo = (seconds) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = seconds;
    if (videoRef.current.paused) {
      videoRef.current.play();
    }
  };

  // Create bug from detected issue (for recording issues)
  const createBugFromIssue = async (issue) => {
    if (!activeSuite?.id) {
      alert('Please select a test suite first.');
      return;
    }
    
    try {
      const bugData = {
        title: `Bug: ${issue.message.substring(0, 100)}${issue.message.length > 100 ? '...' : ''}`,
        description: `Automatically detected issue from screen recording\n\nType: ${issue.type}\nSeverity: ${issue.severity}\nTime: ${issue.time}\n\nDetails: ${issue.message}`,
        severity: issue.severity,
        status: 'open',
        source: 'screen_recording',
        recordingData: {
          consoleLogs: issue.source === 'console' ? [issue] : [],
          networkLogs: issue.source === 'network' ? [issue.requestData] : [],
        },
      };
      
      const result = await firestoreService.createBug(activeSuite.id, bugData);
      if (result.success) {
        setSelectedBugs(prev => [...prev, issue.id]);
        alert('Bug created successfully!');
      } else {
        throw new Error(result.error?.message || 'Failed to create bug');
      }
    } catch (err) {
      console.error('Failed to create bug:', err);
      alert('Failed to create bug: ' + err.message);
    }
  };

  // Handle AI insights actions
  const handleSaveInsights = (insights) => {
    console.log('Saving AI insights:', insights);
    setAiInsights(insights);
    
    if (onSaveInsights) {
      onSaveInsights(insights);
    } else {
      // Default behavior: create a downloadable JSON file
      const insightsData = {
        recordingId: `recording_${Date.now()}`,
        timestamp: new Date().toISOString(),
        totalInsights: insights.length,
        insights: insights,
        metadata: {
          consoleLogs: consoleLogs.length,
          networkLogs: networkLogs.length,
          detectedIssues: detectedIssues.length,
          duration: videoRef.current?.duration || 0
        }
      };

      const blob = new Blob([JSON.stringify(insightsData, null, 2)], { 
        type: 'application/json' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ai-insights-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  // Handle test case creation from AI insight
  const handleCreateTestCaseFromInsight = async (insight) => {
    console.log('Creating test case from insight:', insight);
    
    if (onCreateTestCaseFromInsight) {
      // Use parent component's handler
      onCreateTestCaseFromInsight(insight);
    } else {
      // Default behavior: create test case using firestoreService
      if (!activeSuite?.id) {
        alert('Please select a test suite first.');
        return;
      }

      try {
        const testCaseData = {
          title: insight.title || `Test: ${insight.description.substring(0, 80)}...`,
          description: insight.description,
          priority: insight.severity === 'critical' ? 'Critical' : 
                   insight.severity === 'high' ? 'High' :
                   insight.severity === 'medium' ? 'Medium' : 'Low',
          category: insight.category || 'AI Generated',
          steps: [
            'Navigate to the affected area identified by AI analysis',
            'Reproduce the scenario that triggered the insight',
            'Verify the expected behavior matches requirements'
          ],
          expectedResult: insight.recommendation || 'System should behave as expected without issues',
          tags: [...(insight.tags || []), 'ai-generated', 'from-recording'],
          source: 'ai_insight',
          automationPotential: insight.automationPotential || 'medium',
          confidence: insight.confidence || 0,
          recordingTime: insight.time || 0
        };

        const result = await firestoreService.createTestCase(activeSuite.id, testCaseData);
        if (result.success) {
          alert(`Test case created successfully: ${testCaseData.title}`);
        } else {
          throw new Error(result.error?.message || 'Failed to create test case');
        }
      } catch (error) {
        console.error('Failed to create test case from insight:', error);
        alert('Failed to create test case: ' + error.message);
      }
    }
  };

  // Handle bug creation from AI insight
  const handleCreateBugFromInsight = async (insight) => {
    console.log('Creating bug from insight:', insight);
    
    if (onCreateBugFromInsight) {
      // Use parent component's handler
      onCreateBugFromInsight(insight);
    } else {
      // Default behavior: create bug using firestoreService
      if (!activeSuite?.id) {
        alert('Please select a test suite first.');
        return;
      }

      try {
        const bugData = {
          title: `AI Bug: ${insight.title || insight.description.substring(0, 80)}...`,
          description: `Bug identified by AI analysis\n\n${insight.description}\n\nRecommendation: ${insight.recommendation || 'Review and fix the identified issue'}`,
          severity: insight.severity || 'medium',
          status: 'open',
          source: 'ai_insight',
          category: insight.category || 'AI Detected',
          tags: [...(insight.tags || []), 'ai-detected', 'from-recording'],
          confidence: insight.confidence || 0,
          recordingTime: insight.time || 0,
          automationPotential: insight.automationPotential || 'medium',
          recordingData: {
            aiInsight: insight,
            relatedLogs: insight.relatedLogs || [],
            timestamp: new Date().toISOString()
          }
        };

        const result = await firestoreService.createBug(activeSuite.id, bugData);
        if (result.success) {
          alert(`Bug created successfully: ${bugData.title}`);
        } else {
          throw new Error(result.error?.message || 'Failed to create bug');
        }
      } catch (error) {
        console.error('Failed to create bug from insight:', error);
        alert('Failed to create bug: ' + error.message);
      }
    }
  };

  const toggleAIInsights = () => {
    const newState = !showAIInsights;
    setShowAIInsights(newState);
    
    if (onToggleAiHighlight) {
      onToggleAiHighlight(newState);
    }
  };

  const getTabCount = (tab) => {
    switch (tab) {
      case 'console': return consoleLogs.length;
      case 'network': return networkLogs.length;
      case 'issues': return detectedIssues.length;
      case 'comments': return comments.length;
      default: return 0;
    }
  };

  // Define tabs based on preview mode
  const tabs = [
    { id: 'comments', label: 'Comments', icon: MessageSquare },
    // Show dev tool tabs only when not in preview mode
    ...(isPreviewMode ? [] : [
      { id: 'console', label: 'Console', icon: Terminal },
      { id: 'network', label: 'Network', icon: Network },
      { id: 'issues', label: 'Issues', icon: Bug },
      { id: 'info', label: 'Info', icon: Info }
    ])
  ];

  // Get AI insights count for display
  const aiInsightCount = aiInsights.length;
  const criticalInsightCount = aiInsights.filter(insight => 
    insight.severity === 'critical' || insight.severity === 'high'
  ).length;

  return (
    <div className="w-full h-full border-r border-muted dark:border-muted flex flex-col">
      {/* AI Insights Section - 50% */}
      <div className="h-1/2 flex-shrink-0 border-b border-muted dark:border-muted flex flex-col">
        {/* AI Toggle Button with Stats */}
        <div className="p-3 border-b border-muted dark:border-muted">
          <button
            onClick={toggleAIInsights}
            className="w-full flex items-center justify-between p-2 rounded text-sm font-medium transition-colors bg-muted text-muted-foreground hover:bg-muted/90 dark:hover:bg-muted/80"
          >
            <div className="flex items-center space-x-2">
              <Bot className="w-4 h-4 text-purple-500" />
              <span>AI Insights</span>
              {aiInsightCount > 0 && (
                <div className="flex items-center space-x-1">
                  <span className="text-xs bg-purple-100 text-purple-700 dark:bg-purple-800 dark:text-purple-300 px-2 py-0.5 rounded-full">
                    {aiInsightCount}
                  </span>
                  {criticalInsightCount > 0 && (
                    <span className="text-xs bg-error/20 text-error dark:bg-error/30 dark:text-error px-2 py-0.5 rounded-full">
                      {criticalInsightCount} critical
                    </span>
                  )}
                </div>
              )}
            </div>
            <div className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground dark:bg-muted dark:text-muted-foreground">
              {showAIInsights ? 'ON' : 'OFF'}
            </div>
          </button>
        </div>

        {/* AI Insights Content - Scrollable */}
        <div className="flex-1 overflow-y-auto">
          {showAIInsights ? (
            <div className="p-3">
              <AIHighlights
                consoleLogs={consoleLogs}
                networkLogs={networkLogs}
                detectedIssues={detectedIssues}
                duration={videoRef.current?.duration || 0}
                onSeekTo={seekTo}
                isEnabled={showAIInsights}
                onToggle={onToggleAiHighlight}
                onSaveHighlights={handleSaveInsights}
                onCreateTestCase={handleCreateTestCaseFromInsight}
                onCreateBug={handleCreateBugFromInsight}
                className="space-y-2"
              />
            </div>
          ) : (
            <div className="p-6 text-center">
              <Bot className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
              <div className="text-sm text-muted-foreground mb-2">AI Insights</div>
              <div className="text-xs text-muted-foreground mb-4">
                Toggle AI Insights ON to view intelligent analysis of your recording
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Comments/DevTools Section - 50% */}
      <div className="h-1/2 flex-shrink-0 flex flex-col">
        {/* Comment Input - Above tabs */}
        <div className="p-3 border-b border-muted dark:border-muted">
          <div className="flex space-x-2">
            <input
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Add a comment at current time..."
              className="flex-1 text-xs border border-muted dark:border-muted rounded px-2 py-2 dark:bg-background dark:text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
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
              className="px-3 py-1 text-xs bg-orange-500 text-orange-50 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-orange-600 transition-colors whitespace-nowrap"
            >
              @ {formatTime(currentVideoTime)}
            </button>
          </div>
        </div>

        {/* Tabs - Horizontal/Vertical Scrollable */}
        <div className="flex overflow-x-auto overflow-y-hidden border-b border-muted dark:border-muted bg-muted dark:bg-muted">
          {tabs.map(({ id, label, icon: Icon }) => {
            const count = getTabCount(id);
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex-shrink-0 px-3 py-2 text-xs font-medium border-b-2 whitespace-nowrap flex items-center space-x-1 transition-colors ${
                  activeTab === id
                    ? 'border-primary text-primary dark:text-primary bg-card dark:bg-card'
                    : 'border-transparent text-muted-foreground hover:text-foreground dark:hover:text-foreground'
                }`}
              >
                <Icon className="w-3 h-3" />
                <span>{label}</span>
                {count > 0 && (
                  <span className={`px-1 py-0.5 text-[10px] rounded-full ${
                    activeTab === id 
                      ? 'bg-teal-100 text-primary dark:bg-primary dark:text-foreground' 
                      : 'bg-muted text-muted-foreground dark:bg-muted dark:text-muted-foreground'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Content - Vertically Scrollable */}
        <div className="flex-1 overflow-y-auto p-3">
          {/* Comments Tab */}
          {activeTab === 'comments' && (
            <div className="space-y-2">
              {comments.length === 0 ? (
                <div className="text-muted-foreground text-sm text-center py-8">
                  <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <div>No comments added yet</div>
                  <div className="text-xs mt-1">Add a comment above to get started</div>
                </div>
              ) : (
                <>
                  {comments
                    .slice()
                    .sort((a, b) => a.time - b.time)
                    .map(comment => (
                      <div key={comment.id} className="p-3 bg-muted dark:bg-muted rounded border">
                        <div className="flex items-center justify-between mb-2">
                          <button
                            onClick={() => seekTo(comment.time)}
                            className="text-primary hover:text-primary/80 dark:text-primary dark:hover:text-primary/80 font-medium text-sm hover:underline"
                          >
                            [{comment.timeStr || formatTime(comment.time)}]
                          </button>
                          <span className="text-muted-foreground text-[10px]">
                            {new Date(comment.createdAt || comment.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <div className="text-sm text-foreground dark:text-foreground break-words">{comment.text}</div>
                      </div>
                    ))}
                  <div ref={commentsEndRef} />
                </>
              )}
            </div>
          )}

          {/* Developer Tool Tabs - Only shown when not in preview mode */}
          {!isPreviewMode && activeTab === 'console' && (
            <div className="space-y-1">
              {consoleLogs.length === 0 ? (
                <div className="text-muted-foreground text-sm text-center py-8">
                  <Terminal className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <div>No console logs captured</div>
                </div>
              ) : (
                consoleLogs
                  .slice()
                  .reverse()
                  .map((log, i) => (
                    <div key={`${log.timestamp}-${i}`} className="text-xs border border-muted dark:border-muted rounded p-2 hover:bg-muted/10 dark:hover:bg-muted/20">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-muted-foreground text-[10px]">
                          {new Date(log.time || log.timestamp).toLocaleTimeString()}
                        </span>
                        <div className="flex items-center space-x-1">
                          <span className={`font-medium text-[10px] px-2 py-0.5 rounded ${
                            log.level === 'error' ? 'bg-error/20 text-error dark:bg-error/30 dark:text-error' :
                            log.level === 'warn' ? 'bg-warning/20 text-warning dark:bg-warning/30 dark:text-warning' :
                            'bg-teal-100 text-primary dark:bg-primary dark:text-foreground'
                          }`}>
                            {log.level?.toUpperCase() || 'LOG'}
                          </span>
                          {(log.count && log.count > 1) && (
                            <span className="text-[10px] bg-muted text-muted-foreground px-1 rounded">
                              {log.count}x
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-foreground dark:text-foreground break-words">{log.message}</div>
                    </div>
                  ))
              )}
            </div>
          )}

          {!isPreviewMode && activeTab === 'network' && (
            <div className="space-y-2">
              {networkLogs.length === 0 ? (
                <div className="text-muted-foreground text-sm text-center py-8">
                  <Network className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <div>No network requests captured</div>
                </div>
              ) : (
                networkLogs
                  .slice()
                  .reverse()
                  .map((req, i) => (
                    <div
                      key={req.id || `${req.timestamp}-${i}`}
                      className="p-2 rounded border border-muted dark:border-muted hover:bg-muted/10 dark:hover:bg-muted/20"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center space-x-2">
                          <span className={`text-[10px] font-medium px-2 py-0.5 rounded uppercase ${
                            req.status >= 400 || req.status === 'ERR' ? 'bg-error/20 text-error dark:bg-error/30 dark:text-error' :
                            req.status >= 300 ? 'bg-warning/20 text-warning dark:bg-warning/30 dark:text-warning' :
                            'bg-success/20 text-success dark:bg-success/30 dark:text-success'
                          }`}>
                            {req.method}
                          </span>
                          <span className={`text-xs font-medium ${
                            req.status >= 400 || req.status === 'ERR' ? 'text-error dark:text-error' : 'text-muted-foreground dark:text-muted-foreground'
                          }`}>
                            {req.status}
                          </span>
                          {(req.count && req.count > 1) && (
                            <span className="text-[10px] bg-muted text-muted-foreground px-1 rounded">
                              {req.count}x
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-muted-foreground">{req.duration}ms</span>
                      </div>
                      <div className="text-[11px] text-foreground dark:text-foreground break-all">{req.url}</div>
                      {req.error && (
                        <div className="text-[10px] text-error dark:text-error mt-1 truncate">
                          Error: {req.error}
                        </div>
                      )}
                    </div>
                  ))
              )}
            </div>
          )}

          {!isPreviewMode && activeTab === 'issues' && (
            <div className="space-y-2">
              {detectedIssues.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground py-8">
                  <div className="text-center">
                    <CheckCircle className="w-8 h-8 mx-auto mb-2 text-success" />
                    <div className="font-medium">No issues detected</div>
                    <div className="text-xs mt-1">Your app appears to be running smoothly.</div>
                  </div>
                </div>
              ) : (
                detectedIssues.map((issue) => (
                  <div
                    key={issue.id}
                    className={`p-3 rounded border-l-4 ${
                      issue.severity === 'high' ? 'border-error bg-error/10 dark:bg-error/20' :
                      issue.severity === 'medium' ? 'border-warning bg-warning/10 dark:bg-warning/20' :
                      'border-primary bg-teal-50 dark:bg-teal-900/20'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <AlertTriangle className={`w-4 h-4 flex-shrink-0 ${
                            issue.severity === 'high' ? 'text-error' :
                            issue.severity === 'medium' ? 'text-warning' :
                            'text-primary'
                          }`} />
                          <span className="text-sm font-medium capitalize truncate">
                            {issue.type.replace('_', ' ')}
                          </span>
                          <span className={`text-[10px] px-2 py-1 rounded uppercase font-medium ${
                            issue.severity === 'high' ? 'bg-error/20 text-error dark:bg-error/30 dark:text-error' :
                            issue.severity === 'medium' ? 'bg-warning/20 text-warning dark:bg-warning/30 dark:text-warning' :
                            'bg-teal-100 text-primary dark:bg-primary/60 dark:text-foreground'
                          }`}>
                            {issue.severity}
                          </span>
                          {(issue.count && issue.count > 1) && (
                            <span className="text-[10px] bg-muted text-muted-foreground px-1 rounded">
                              {issue.count}x
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground dark:text-muted-foreground mb-1 break-words">{issue.message}</div>
                        <div className="text-[10px] text-muted-foreground">
                          {new Date(issue.time || issue.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                      <button
                        onClick={() => createBugFromIssue(issue)}
                        className={`ml-2 px-2 py-1 text-[10px] rounded transition-colors ${
                          selectedBugs.includes(issue.id)
                            ? 'bg-muted text-muted-foreground cursor-not-allowed'
                            : 'bg-error text-error-foreground hover:bg-error/90'
                        }`}
                        disabled={selectedBugs.includes(issue.id)}
                      >
                        {selectedBugs.includes(issue.id) ? 'Created' : 'Create Bug'}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {!isPreviewMode && activeTab === 'info' && (
            <div className="text-xs space-y-2">
              <div className="grid grid-cols-1 gap-2">
                <div className="p-2 bg-muted dark:bg-muted rounded">
                  <div className="font-medium text-foreground dark:text-foreground mb-1">Recording Statistics</div>
                  <div className="space-y-1 text-muted-foreground dark:text-muted-foreground">
                    <div><strong>Console Logs:</strong> {consoleLogs.length}</div>
                    <div><strong>Network Requests:</strong> {networkLogs.length}</div>
                    <div><strong>Issues Found:</strong> {detectedIssues.length}</div>
                    <div><strong>Comments:</strong> {comments.length}</div>
                    <div><strong>Duration:</strong> {formatTime(videoRef.current?.duration || 0)}</div>
                  </div>
                </div>

                {aiInsightCount > 0 && (
                  <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded">
                    <div className="font-medium text-foreground dark:text-foreground mb-1">AI Analysis</div>
                    <div className="space-y-1 text-muted-foreground dark:text-muted-foreground">
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

export default RecorderLeftPanel;