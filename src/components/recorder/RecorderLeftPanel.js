import React, { useState } from 'react';
import { Info } from 'lucide-react';

const RecorderLeftPanel = ({ 
  consoleLogs = [], 
  networkLogs = [], 
  detectedIssues = [], 
  videoRef,
  initialTitle = '',
  onTitleChange
}) => {
  const [title, setTitle] = useState(initialTitle);

  const formatTime = (s) => {
    if (!s || isNaN(s)) return '0:00';
    const sec = Math.floor(s % 60).toString().padStart(2, '0');
    const min = Math.floor(s / 60).toString();
    return `${min}:${sec}`;
  };

  const handleTitleChange = (e) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    if (onTitleChange) {
      onTitleChange(newTitle);
    }
  };

  return (
    <div className="w-full h-full flex flex-col">
      {/* Title Input Section - Top 50% */}
      <div className="h-1/2 flex-shrink-0 border-b border-gray-200 dark:border-gray-700 flex flex-col">
        <div className="p-4 flex-1 overflow-y-auto">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Recording Title
          </label>
          <input
            type="text"
            value={title}
            onChange={handleTitleChange}
            placeholder="Enter a title for this recording..."
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg 
                     bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                     focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent
                     placeholder-gray-400 dark:placeholder-gray-500"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Give your recording a descriptive title before saving
          </p>
        </div>
      </div>

      {/* Info Tab Section - Bottom 50% */}
      <div className="h-1/2 flex-shrink-0 flex flex-col">
        {/* Tab Header */}
        <div className="flex overflow-x-auto border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <button
            className="flex-shrink-0 px-3 py-2 text-xs font-medium border-b-2 border-teal-500 text-teal-600 dark:text-teal-400 bg-white dark:bg-gray-900 whitespace-nowrap flex items-center space-x-1 transition-colors"
          >
            <Info className="w-3 h-3" />
            <span>Info</span>
          </button>
        </div>

        {/* Tab Content - Vertically Scrollable */}
        <div className="flex-1 overflow-y-auto p-3">
          <div className="text-xs space-y-2">
            {/* Preview Note - Top */}
            <div className="p-3 bg-teal-50 dark:bg-primary/20 rounded-lg border border-teal-200 dark:border-primary">
              <div className="text-xs text-primary dark:text-teal-300">
                <strong>📝 Preview Mode:</strong> After saving, you&aposll be able to view detailed logs, add timestamped comments, 
                and get AI-powered insights about your recording.
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {/* Recording Statistics */}
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="font-medium text-sm text-gray-700 dark:text-gray-300 mb-2">Recording Statistics</div>
                <div className="space-y-1 text-gray-600 dark:text-gray-400">
                  <div><strong>Console Logs:</strong> {consoleLogs.length}</div>
                  <div><strong>Network Requests:</strong> {networkLogs.length}</div>
                  <div><strong>Issues Found:</strong> {detectedIssues.length}</div>
                  <div><strong>Duration:</strong> {formatTime(videoRef?.current?.duration || 0)}</div>
                </div>
              </div>

              {/* Issues Breakdown (if any) */}
              {detectedIssues.length > 0 && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                  <div className="font-medium text-sm text-gray-700 dark:text-gray-300 mb-2">Issues Breakdown</div>
                  <div className="space-y-1 text-gray-600 dark:text-gray-400">
                    <div><strong>High Severity:</strong> {detectedIssues.filter(i => i.severity === 'high').length}</div>
                    <div><strong>Medium Severity:</strong> {detectedIssues.filter(i => i.severity === 'medium').length}</div>
                    <div><strong>Low Severity:</strong> {detectedIssues.filter(i => i.severity === 'low').length}</div>
                  </div>
                </div>
              )}

              {/* Network Summary (if any) */}
              {networkLogs.length > 0 && (
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="font-medium text-sm text-gray-700 dark:text-gray-300 mb-2">Network Summary</div>
                  <div className="space-y-1 text-gray-600 dark:text-gray-400">
                    <div><strong>Successful (2xx):</strong> {networkLogs.filter(r => r.status >= 200 && r.status < 300).length}</div>
                    <div><strong>Client Errors (4xx):</strong> {networkLogs.filter(r => r.status >= 400 && r.status < 500).length}</div>
                    <div><strong>Server Errors (5xx):</strong> {networkLogs.filter(r => r.status >= 500).length}</div>
                  </div>
                </div>
              )}

              {/* Console Logs Summary (if any) */}
              {consoleLogs.length > 0 && (
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="font-medium text-sm text-gray-700 dark:text-gray-300 mb-2">Console Logs Summary</div>
                  <div className="space-y-1 text-gray-600 dark:text-gray-400">
                    <div><strong>Errors:</strong> {consoleLogs.filter(l => l.level === 'error').length}</div>
                    <div><strong>Warnings:</strong> {consoleLogs.filter(l => l.level === 'warn').length}</div>
                    <div><strong>Info/Logs:</strong> {consoleLogs.filter(l => !l.level || l.level === 'log' || l.level === 'info').length}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecorderLeftPanel;