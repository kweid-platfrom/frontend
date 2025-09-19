'use client';

import React, { useState } from 'react';
import { Terminal, Network, Bug, CheckCircle, AlertTriangle } from 'lucide-react';

const RecorderLeftPanel = ({ 
  consoleLogs, 
  networkLogs, 
  detectedIssues, 
  comments, 
  videoRef, 
  activeSuite, 
  firestoreService 
}) => {
  const [activeTab, setActiveTab] = useState('console');
  const [commentText, setCommentText] = useState('');
  const [selectedBugs, setSelectedBugs] = useState([]);

  const formatTime = (s) => {
    const sec = Math.floor(s % 60).toString().padStart(2, '0');
    const min = Math.floor(s / 60).toString();
    return `${min}:${sec}`;
  };

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
    comments.push(comment);
    setCommentText('');
  };

  const seekTo = (seconds) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = seconds;
    videoRef.current.play();
  };

  const createBugFromIssue = async (issue) => {
    if (!activeSuite?.id) {
      alert('Please select a test suite first.');
      return;
    }
    try {
      const bugData = {
        title: `Bug: ${issue.message}`,
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

  return (
    <div className="w-1/3 border-r border-gray-200 dark:border-gray-700 flex flex-col">
      <div className="h-[60%] border-b border-gray-200 dark:border-gray-700 p-3">
        <div className="text-sm font-medium mb-2">Comments</div>
        <div className="flex space-x-2 mb-3">
          <input
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Add a comment..."
            className="flex-1 text-xs border rounded px-2 py-1"
            onKeyPress={(e) => e.key === 'Enter' && addCommentAtCurrentTime(commentText)}
          />
          <button
            onClick={() => addCommentAtCurrentTime(commentText)}
            disabled={!commentText.trim()}
            className="px-2 py-1 text-xs bg-orange-500 text-white rounded disabled:opacity-50"
          >
            Comment at {videoRef.current ? formatTime(videoRef.current.currentTime || 0) : '0:00'}
          </button>
        </div>
        <div className="max-h-32 overflow-y-auto space-y-1">
          {comments.length === 0 ? (
            <div className="text-xs text-gray-500">No comments yet</div>
          ) : (
            comments.slice().reverse().map(comment => (
              <div key={comment.id} className="text-xs p-2 bg-gray-50 dark:bg-gray-800 rounded">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => seekTo(comment.time)}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    [{comment.timeStr}]
                  </button>
                  <span className="text-gray-400 text-[10px]">
                    {new Date(comment.createdAt).toLocaleTimeString()}
                  </span>
                </div>
                <div className="mt-1">{comment.text}</div>
              </div>
            ))
          )}
        </div>
      </div>
      <div className="h-[40%] flex flex-col">
        <div className="flex overflow-x-auto border-b border-gray-200 dark:border-gray-700">
          {['console', 'network', 'issues', 'info'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium border-b-2 ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab === 'console' && <Terminal className="w-4 h-4 inline mr-2" />}
              {tab === 'network' && <Network className="w-4 h-4 inline mr-2" />}
              {tab === 'issues' && <Bug className="w-4 h-4 inline mr-2" />}
              {tab === 'info' && <svg className="w-4 h-4 inline mr-2" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>}
              {tab.charAt(0).toUpperCase() + tab.slice(1)} ({tab === 'console' ? consoleLogs.length : tab === 'network' ? networkLogs.length : tab === 'issues' ? detectedIssues.length : 1})
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          {activeTab === 'console' && (
            <div className="space-y-1">
              {consoleLogs.length === 0 ? (
                <div className="text-gray-500 text-sm">No console logs</div>
              ) : (
                consoleLogs.slice().reverse().map((log, i) => (
                  <div key={i} className="text-xs border-b border-gray-100 dark:border-gray-700 pb-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-400 text-[10px]">
                        {new Date(log.time).toLocaleTimeString()}
                      </span>
                      <span className={`font-medium text-[10px] px-1 rounded ${
                        log.level === 'error' ? 'bg-red-100 text-red-700' :
                        log.level === 'warn' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {log.level}
                      </span>
                    </div>
                    <div className="mt-1 text-gray-700 dark:text-gray-300">{log.message}</div>
                  </div>
                ))
              )}
            </div>
          )}
          {activeTab === 'network' && (
            <div className="space-y-1">
              {networkLogs.length === 0 ? (
                <div className="text-gray-500 text-sm">No network requests</div>
              ) : (
                networkLogs.slice().reverse().map((req, i) => (
                  <div
                    key={req.id || i}
                    className="p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800 border border-gray-100 dark:border-gray-700"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className={`text-xs font-medium px-1 rounded ${
                          req.status >= 400 ? 'bg-red-100 text-red-700' :
                          req.status >= 300 ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {req.method}
                        </span>
                        <span className={`text-xs font-medium ${req.status >= 400 ? 'text-red-600' : 'text-gray-600'}`}>
                          {req.status}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">{req.duration}ms</span>
                    </div>
                    <div className="mt-1 text-xs text-gray-700 dark:text-gray-300 truncate">{req.url}</div>
                  </div>
                ))
              )}
            </div>
          )}
          {activeTab === 'issues' && (
            <div className="space-y-2">
              {detectedIssues.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
                    <div>No issues detected</div>
                  </div>
                </div>
              ) : (
                detectedIssues.map((issue) => (
                  <div
                    key={issue.id}
                    className={`p-3 rounded border-l-4 ${
                      issue.severity === 'high' ? 'border-red-500 bg-red-50' :
                      issue.severity === 'medium' ? 'border-yellow-500 bg-yellow-50' :
                      'border-blue-500 bg-blue-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <AlertTriangle className={`w-4 h-4 ${
                            issue.severity === 'high' ? 'text-red-600' :
                            issue.severity === 'medium' ? 'text-yellow-600' :
                            'text-blue-600'
                          }`} />
                          <span className="text-sm font-medium capitalize">
                            {issue.type.replace('_', ' ')}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded ${
                            issue.severity === 'high' ? 'bg-red-100 text-red-700' :
                            issue.severity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {issue.severity}
                          </span>
                        </div>
                        <div className="mt-1 text-xs text-gray-600">{issue.message}</div>
                        <div className="mt-1 text-xs text-gray-500">{new Date(issue.time).toLocaleTimeString()}</div>
                      </div>
                      <button
                        onClick={() => createBugFromIssue(issue)}
                        className="ml-2 px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
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
          {activeTab === 'info' && (
            <div className="text-xs space-y-1">
              <div><strong>URL:</strong> {window.location.href}</div>
              <div><strong>Timestamp:</strong> {new Date().toLocaleString()}</div>
              <div><strong>OS:</strong> {navigator.platform}</div>
              <div><strong>Browser:</strong> {navigator.userAgent}</div>
              <div><strong>Window Size:</strong> {window.innerWidth}x{window.innerHeight}</div>
              <div><strong>Country:</strong> {Intl.DateTimeFormat().resolvedOptions().timeZone}</div>
              <div><strong>Custom Metadata:</strong> None</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecorderLeftPanel;