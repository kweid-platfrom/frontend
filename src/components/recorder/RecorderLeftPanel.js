'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Terminal, Network, Bug, CheckCircle, AlertTriangle, MessageSquare, Info } from 'lucide-react';

const RecorderLeftPanel = ({ 
  consoleLogs = [], 
  networkLogs = [], 
  detectedIssues = [], 
  comments = [], 
  onAddComment,
  videoRef, 
  activeSuite, 
  firestoreService 
}) => {
  const [activeTab, setActiveTab] = useState('console');
  const [commentText, setCommentText] = useState('');
  const [selectedBugs, setSelectedBugs] = useState([]);
  const [currentVideoTime, setCurrentVideoTime] = useState(0);
  const commentsEndRef = useRef(null);

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

  const addCommentAtCurrentTime = (text) => {
    if (!videoRef.current || !text.trim()) return;
    
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
  };

  const seekTo = (seconds) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = seconds;
    if (videoRef.current.paused) {
      videoRef.current.play();
    }
  };

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

  const getTabCount = (tab) => {
    switch (tab) {
      case 'console': return consoleLogs.length;
      case 'network': return networkLogs.length;
      case 'issues': return detectedIssues.length;
      case 'comments': return comments.length;
      default: return 0;
    }
  };

  const tabs = [
    { id: 'console', label: 'Console', icon: Terminal },
    { id: 'network', label: 'Network', icon: Network },
    { id: 'issues', label: 'Issues', icon: Bug },
    { id: 'comments', label: 'Comments', icon: MessageSquare },
    { id: 'info', label: 'Info', icon: Info },
  ];

  return (
    <div className="w-1/3 border-r border-gray-200 dark:border-gray-700 flex flex-col min-w-80">
      {/* Comments Section - Fixed Height */}
      <div className="h-48 border-b border-gray-200 dark:border-gray-700 p-3 flex flex-col">
        <div className="text-sm font-medium mb-2 flex items-center justify-between">
          <span>Add Comment</span>
          <span className="text-xs text-gray-500">{comments.length} comments</span>
        </div>
        
        <div className="flex space-x-2 mb-3">
          <input
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Add a comment at current time..."
            className="flex-1 text-xs border border-gray-300 dark:border-gray-600 rounded px-2 py-2 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-1 focus:ring-teal-500"
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
            className="px-3 py-1 text-xs bg-orange-500 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-orange-600 transition-colors whitespace-nowrap"
          >
            @ {formatTime(currentVideoTime)}
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto space-y-1">
          {comments.length === 0 ? (
            <div className="text-xs text-gray-500 text-center py-4">
              No comments yet. Add one to mark important moments.
            </div>
          ) : (
            <>
              {comments
                .slice()
                .sort((a, b) => b.time - a.time)
                .slice(0, 5)
                .map(comment => (
                <div key={comment.id} className="text-xs p-2 bg-gray-50 dark:bg-gray-800 rounded border">
                  <div className="flex items-center justify-between mb-1">
                    <button
                      onClick={() => seekTo(comment.time)}
                      className="text-primary hover:text-primary/80 dark:text-teal-400 dark:hover:text-teal-300 font-medium text-xs hover:underline"
                    >
                      [{comment.timeStr}]
                    </button>
                    <span className="text-gray-400 text-[10px]">
                      {new Date(comment.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="text-gray-700 dark:text-gray-300 break-words">{comment.text}</div>
                </div>
              ))}
              <div ref={commentsEndRef} />
            </>
          )}
        </div>
      </div>

      {/* Tabs Section - Flexible Height */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex overflow-x-auto border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          {tabs.map(({ id, label, icon: Icon }) => {
            const count = getTabCount(id);
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`px-3 py-2 text-xs font-medium border-b-2 whitespace-nowrap flex items-center space-x-1 transition-colors ${
                  activeTab === id
                    ? 'border-primary text-primary dark:text-orange-400 bg-white dark:bg-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <Icon className="w-3 h-3" />
                <span>{label}</span>
                {count > 0 && (
                  <span className={`px-1 py-0.5 text-[10px] rounded-full ${
                    activeTab === id 
                      ? 'bg-blue-100 text-primary dark:bg-primary dark:text-white' 
                      : 'bg-gray-200 text-gray-600 dark:bg-gray-600 dark:text-gray-400'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          {activeTab === 'console' && (
            <div className="space-y-1">
              {consoleLogs.length === 0 ? (
                <div className="text-gray-500 text-sm text-center py-8">
                  <Terminal className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <div>No console logs captured</div>
                </div>
              ) : (
                consoleLogs
                  .slice()
                  .reverse()
                  .map((log, i) => (
                    <div key={i} className="text-xs border border-gray-100 dark:border-gray-700 rounded p-2 hover:bg-gray-50 dark:hover:bg-gray-800">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-gray-400 text-[10px]">
                          {new Date(log.time).toLocaleTimeString()}
                        </span>
                        <span className={`font-medium text-[10px] px-2 py-0.5 rounded ${
                          log.level === 'error' ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' :
                          log.level === 'warn' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' :
                          'bg-teal-100 text-primary dark:bg-primary dark:text-white'
                        }`}>
                          {log.level.toUpperCase()}
                        </span>
                      </div>
                      <div className="text-gray-700 dark:text-gray-300 break-words">{log.message}</div>
                    </div>
                  ))
              )}
            </div>
          )}

          {activeTab === 'network' && (
            <div className="space-y-2">
              {networkLogs.length === 0 ? (
                <div className="text-gray-500 text-sm text-center py-8">
                  <Network className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <div>No network requests captured</div>
                </div>
              ) : (
                networkLogs
                  .slice()
                  .reverse()
                  .map((req, i) => (
                    <div
                      key={req.id || i}
                      className="p-2 rounded border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center space-x-2">
                          <span className={`text-[10px] font-medium px-2 py-0.5 rounded uppercase ${
                            req.status >= 400 || req.status === 'ERR' ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' :
                            req.status >= 300 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' :
                            'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                          }`}>
                            {req.method}
                          </span>
                          <span className={`text-xs font-medium ${
                            req.status >= 400 || req.status === 'ERR' ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'
                          }`}>
                            {req.status}
                          </span>
                        </div>
                        <span className="text-[10px] text-gray-500">{req.duration}ms</span>
                      </div>
                      <div className="text-[11px] text-gray-700 dark:text-gray-300 break-all">{req.url}</div>
                      {req.responseText && (
                        <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 truncate">
                          {req.responseText}
                        </div>
                      )}
                    </div>
                  ))
              )}
            </div>
          )}

          {activeTab === 'issues' && (
            <div className="space-y-2">
              {detectedIssues.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-500 py-8">
                  <div className="text-center">
                    <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
                    <div className="font-medium">No issues detected</div>
                    <div className="text-xs mt-1">Great job! Your app appears to be running smoothly.</div>
                  </div>
                </div>
              ) : (
                detectedIssues.map((issue) => (
                  <div
                    key={issue.id}
                    className={`p-3 rounded border-l-4 ${
                      issue.severity === 'high' ? 'border-red-500 bg-red-50 dark:bg-red-900/20' :
                      issue.severity === 'medium' ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20' :
                      'border-primary bg-teal-50 dark:bg-teal-900/20'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <AlertTriangle className={`w-4 h-4 flex-shrink-0 ${
                            issue.severity === 'high' ? 'text-red-600' :
                            issue.severity === 'medium' ? 'text-orange-500' :
                            'text-primary'
                          }`} />
                          <span className="text-sm font-medium capitalize truncate">
                            {issue.type.replace('_', ' ')}
                          </span>
                          <span className={`text-[10px] px-2 py-1 rounded uppercase font-medium ${
                            issue.severity === 'high' ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' :
                            issue.severity === 'medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' :
                            'bg-blue-100 text-primary dark:bg-primary/60 dark:text-white'
                          }`}>
                            {issue.severity}
                          </span>
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400 mb-1 break-words">{issue.message}</div>
                        <div className="text-[10px] text-gray-500">
                          {new Date(issue.time).toLocaleTimeString()}
                        </div>
                      </div>
                      <button
                        onClick={() => createBugFromIssue(issue)}
                        className={`ml-2 px-2 py-1 text-[10px] rounded transition-colors ${
                          selectedBugs.includes(issue.id)
                            ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                            : 'bg-red-600 text-white hover:bg-red-700'
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

          {activeTab === 'comments' && (
            <div className="space-y-2">
              {comments.length === 0 ? (
                <div className="text-gray-500 text-sm text-center py-8">
                  <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <div>No comments added yet</div>
                  <div className="text-xs mt-1">Add comments above to mark important moments</div>
                </div>
              ) : (
                <>
                  {comments
                    .slice()
                    .sort((a, b) => a.time - b.time)
                    .map(comment => (
                      <div key={comment.id} className="p-3 bg-gray-50 dark:bg-gray-800 rounded border">
                        <div className="flex items-center justify-between mb-2">
                          <button
                            onClick={() => seekTo(comment.time)}
                            className="text-primary hover:text-primary/80 dark:text-teal-400 dark:hover:text-teal-300 font-medium text-sm hover:underline"
                          >
                            [{comment.timeStr}]
                          </button>
                          <span className="text-gray-400 text-[10px]">
                            {new Date(comment.createdAt).toLocaleTimeString()}
                          </span>
                        </div>
                        <div className="text-sm text-gray-700 dark:text-gray-300 break-words">{comment.text}</div>
                      </div>
                    ))}
                  <div ref={commentsEndRef} />
                </>
              )}
            </div>
          )}

          {activeTab === 'info' && (
            <div className="text-xs space-y-2">
              <div className="grid grid-cols-1 gap-2">
                <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded">
                  <div className="font-medium text-gray-700 dark:text-gray-300 mb-1">Recording Details</div>
                  <div className="space-y-1 text-gray-600 dark:text-gray-400">
                    <div><strong>URL:</strong> {window.location.href}</div>
                    <div><strong>Timestamp:</strong> {new Date().toLocaleString()}</div>
                    <div><strong>Duration:</strong> {formatTime(videoRef.current?.duration || 0)}</div>
                  </div>
                </div>
                <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded">
                  <div className="font-medium text-gray-700 dark:text-gray-300 mb-1">Environment</div>
                  <div className="space-y-1 text-gray-600 dark:text-gray-400">
                    <div><strong>Platform:</strong> {navigator.platform}</div>
                    <div><strong>Browser:</strong> {navigator.userAgent.split(' ').slice(-2).join(' ')}</div>
                    <div><strong>Screen:</strong> {window.innerWidth}x{window.innerHeight}</div>
                    <div><strong>Timezone:</strong> {Intl.DateTimeFormat().resolvedOptions().timeZone}</div>
                  </div>
                </div>
                <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded">
                  <div className="font-medium text-gray-700 dark:text-gray-300 mb-1">Statistics</div>
                  <div className="space-y-1 text-gray-600 dark:text-gray-400">
                    <div><strong>Console Logs:</strong> {consoleLogs.length}</div>
                    <div><strong>Network Requests:</strong> {networkLogs.length}</div>
                    <div><strong>Issues Found:</strong> {detectedIssues.length}</div>
                    <div><strong>Comments:</strong> {comments.length}</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecorderLeftPanel;