import React, { useState, useEffect } from 'react';

const RecorderTimeline = ({ duration, detectedIssues, videoRef }) => {
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

  return (
    <div className="space-y-2 p-2">
      {/* Timeline */}
      <div className="h-6 bg-gray-200 dark:bg-gray-700 relative rounded cursor-pointer"
           onClick={(e) => {
             const rect = e.currentTarget.getBoundingClientRect();
             const clickX = e.clientX - rect.left;
             const percentage = clickX / rect.width;
             const seekTime = percentage * parsedDuration;
             seekTo(seekTime);
           }}>
        <div
          className="h-6 bg-blue-500 transition-all duration-300 rounded"
          style={{ 
            width: parsedDuration > 0 ? `${(currentTime / parsedDuration) * 100}%` : '0%' 
          }}
        />
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
              className="absolute w-2 h-6 bg-red-600 cursor-pointer hover:bg-red-700 transition-colors"
              style={{ left: `${Math.max(0, Math.min(100, leftPercentage))}%` }}
              title={`${issue.message} (${formatTime(issueTimeSeconds)})`}
            />
          );
        })}
        
        {/* Playhead indicator */}
        <div
          className="absolute top-0 w-0.5 h-6 bg-white shadow-md"
          style={{ 
            left: parsedDuration > 0 ? `${(currentTime / parsedDuration) * 100}%` : '0%' 
          }}
        />
      </div>
      
      {/* Time display */}
      <div className="text-sm text-gray-600 dark:text-gray-400 text-center">
        {formatTime(currentTime)} / {formatTime(parsedDuration)}
      </div>
    </div>
  );
};

export default RecorderTimeline;