import React, { useState, useEffect } from 'react';

const RecorderTimeline = ({ 
  duration, 
  detectedIssues, 
  videoRef, 
  aiHighlights = [], 
  showAiHighlights = true 
}) => {
  const [currentTime, setCurrentTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const sec = Math.floor(seconds % 60).toString().padStart(2, '0');
    const min = Math.floor(seconds / 60).toString();
    return `${min}:${sec}`;
  };

  // Update current time and duration from video element
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateTime = () => setCurrentTime(video.currentTime || 0);
    const updateDuration = () => setVideoDuration(video.duration || 0);

    video.addEventListener('timeupdate', updateTime);
    video.addEventListener('loadedmetadata', updateDuration);
    video.addEventListener('durationchange', updateDuration);

    // Initial values
    if (video.duration) setVideoDuration(video.duration);
    if (video.currentTime) setCurrentTime(video.currentTime);

    return () => {
      video.removeEventListener('timeupdate', updateTime);
      video.removeEventListener('loadedmetadata', updateDuration);
      video.removeEventListener('durationchange', updateDuration);
    };
  }, [videoRef]);

  // Parse duration prop as fallback
  const parsedDuration = React.useMemo(() => {
    if (videoDuration > 0) return videoDuration;
    
    if (typeof duration === 'string' && duration.includes(':')) {
      const parts = duration.split(':');
      return parseInt(parts[0]) * 60 + parseInt(parts[1]);
    }
    
    if (typeof duration === 'number') return duration;
    
    return 0;
  }, [duration, videoDuration]);

  const seekTo = (seconds) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = seconds;
    if (videoRef.current.paused) {
      videoRef.current.play();
    }
  };

  // Convert issue time to seconds for timeline positioning
  const getIssueTimeInSeconds = (issueTime) => {
    if (typeof issueTime === 'number') return issueTime;
    if (typeof issueTime === 'string') {
      // Try parsing as timestamp
      const date = new Date(issueTime);
      if (!isNaN(date.getTime())) {
        // Convert to seconds from start of recording (this is approximate)
        return (date.getTime() - Date.now()) / 1000 + currentTime;
      }
    }
    return 0;
  };

  // Get marker color based on type and severity
  const getMarkerColor = (item, type) => {
    if (type === 'ai' && item.color) {
      const colorMap = {
        red: 'bg-red-600 hover:bg-red-700',
        yellow: 'bg-yellow-600 hover:bg-yellow-700',
        green: 'bg-green-600 hover:bg-green-700',
        blue: 'bg-blue-600 hover:bg-blue-700',
        purple: 'bg-purple-600 hover:bg-purple-700'
      };
      return colorMap[item.color] || 'bg-purple-600 hover:bg-purple-700';
    }
    
    if (type === 'issue') {
      return 'bg-red-600 hover:bg-red-700';
    }
    
    return 'bg-gray-600 hover:bg-gray-700';
  };

  return (
    <div className="space-y-2 p-2 border-t border-gray-200 dark:border-gray-700">
      {/* Timeline */}
      <div className="h-8 bg-gray-200 dark:bg-gray-700 relative rounded cursor-pointer"
           onClick={(e) => {
             const rect = e.currentTarget.getBoundingClientRect();
             const clickX = e.clientX - rect.left;
             const percentage = clickX / rect.width;
             const seekTime = percentage * parsedDuration;
             seekTo(seekTime);
           }}>
        
        {/* Progress bar */}
        <div
          className="h-8 bg-blue-500 transition-all duration-300 rounded"
          style={{ 
            width: parsedDuration > 0 ? `${(currentTime / parsedDuration) * 100}%` : '0%' 
          }}
        />
        
        {/* Traditional detected issues markers */}
        {detectedIssues.map(issue => {
          const issueTimeSeconds = getIssueTimeInSeconds(issue.time);
          const leftPercentage = parsedDuration > 0 ? (issueTimeSeconds / parsedDuration) * 100 : 0;
          
          return (
            <div
              key={issue.id}
              onClick={(e) => {
                e.stopPropagation();
                seekTo(issueTimeSeconds);
              }}
              className="absolute w-2 h-8 bg-red-600 cursor-pointer hover:bg-red-700 transition-colors z-10"
              style={{ left: `${Math.max(0, Math.min(100, leftPercentage))}%` }}
              title={`Issue: ${issue.message} (${formatTime(issueTimeSeconds)})`}
            />
          );
        })}

        {/* AI highlights markers */}
        {showAiHighlights && aiHighlights.map(highlight => {
          const leftPercentage = parsedDuration > 0 ? (highlight.time / parsedDuration) * 100 : 0;
          
          return (
            <div
              key={highlight.id}
              onClick={(e) => {
                e.stopPropagation();
                seekTo(highlight.time);
              }}
              className={`absolute w-3 h-8 cursor-pointer transition-colors z-20 rounded-t ${
                getMarkerColor(highlight, 'ai')
              }`}
              style={{ 
                left: `${Math.max(0, Math.min(100, leftPercentage))}%`,
                clipPath: 'polygon(0 0, 100% 0, 50% 70%, 0 70%)', // Triangle pointer shape
              }}
              title={`AI: ${highlight.title} - ${highlight.description} (${formatTime(highlight.time)})`}
            />
          );
        })}
        
        {/* Playhead indicator */}
        <div
          className="absolute top-0 w-0.5 h-8 bg-white shadow-md z-30"
          style={{ 
            left: parsedDuration > 0 ? `${(currentTime / parsedDuration) * 100}%` : '0%' 
          }}
        />
      </div>
      
      {/* Legend */}
      <div className="flex items-center justify-between text-xs">
        {/* Time display */}
        <div className="text-gray-600 dark:text-gray-400">
          {formatTime(currentTime)} / {formatTime(parsedDuration)}
        </div>
        
        {/* Markers legend */}
        <div className="flex items-center space-x-4">
          {detectedIssues.length > 0 && (
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-red-600 rounded"></div>
              <span className="text-gray-500 dark:text-gray-400">Issues ({detectedIssues.length})</span>
            </div>
          )}
          
          {showAiHighlights && aiHighlights.length > 0 && (
            <div className="flex items-center space-x-1">
              <div className="w-3 h-2 bg-purple-600 rounded" 
                   style={{ clipPath: 'polygon(0 0, 100% 0, 50% 100%)' }}></div>
              <span className="text-gray-500 dark:text-gray-400">AI Insights ({aiHighlights.length})</span>
            </div>
          )}
        </div>
      </div>

      {/* Hover tooltip area - shows details when hovering over timeline */}
      <div className="relative h-0">
        <div className="absolute inset-x-0 top-0 h-8 pointer-events-none">
          {/* This space can be used for dynamic tooltips on hover */}
        </div>
      </div>
    </div>
  );
};

export default RecorderTimeline;