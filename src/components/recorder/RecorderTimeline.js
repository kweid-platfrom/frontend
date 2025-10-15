import React, { useState, useEffect, useMemo } from 'react';
import { ChevronRight, ChevronLeft, X } from 'lucide-react';

const RecorderTimeline = ({ 
  duration, 
  detectedIssues = [], 
  videoRef, 
  aiHighlights = [], 
  showAiHighlights = true,
  trimStart = 0,
  trimEnd = 0,
  onTrimStartChange,
  onTrimEndChange,
  enableTrimming = true // Control whether to show trim handles
}) => {
  const [currentTime, setCurrentTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [draggingTrim, setDraggingTrim] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const sec = Math.floor(seconds % 60).toString().padStart(2, '0');
    const min = Math.floor(seconds / 60).toString();
    return `${min}:${sec}`;
  };

  const parsedDuration = useMemo(() => {
    if (videoDuration > 0) return videoDuration;
    if (typeof duration === 'string' && duration.includes(':')) {
      const parts = duration.split(':');
      return parseInt(parts[0]) * 60 + parseInt(parts[1]);
    }
    if (typeof duration === 'number') return duration;
    return 0;
  }, [duration, videoDuration]);

  const effectiveTrimStart = enableTrimming ? trimStart : 0;
  const effectiveTrimEnd = enableTrimming && (trimEnd > 0 && trimEnd <= parsedDuration) ? trimEnd : parsedDuration;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateTime = () => {
      const time = video.currentTime || 0;
      setCurrentTime(time);
      
      // Only restrict playback if trimming is enabled
      if (enableTrimming) {
        if (time < effectiveTrimStart) {
          video.currentTime = effectiveTrimStart;
        } else if (time >= effectiveTrimEnd && effectiveTrimEnd > 0) {
          video.currentTime = effectiveTrimEnd;
          video.pause();
        }
      }
    };
    
    const updateDuration = () => setVideoDuration(video.duration || 0);

    video.addEventListener('timeupdate', updateTime);
    video.addEventListener('loadedmetadata', updateDuration);
    video.addEventListener('durationchange', updateDuration);

    if (video.duration) setVideoDuration(video.duration);
    if (video.currentTime) setCurrentTime(video.currentTime);

    return () => {
      video.removeEventListener('timeupdate', updateTime);
      video.removeEventListener('loadedmetadata', updateDuration);
      video.removeEventListener('durationchange', updateDuration);
    };
  }, [videoRef, effectiveTrimStart, effectiveTrimEnd, enableTrimming]);

  const seekTo = (seconds) => {
    if (!videoRef.current) return;
    const clampedTime = enableTrimming 
      ? Math.max(effectiveTrimStart, Math.min(seconds, effectiveTrimEnd))
      : Math.max(0, Math.min(seconds, parsedDuration));
    videoRef.current.currentTime = clampedTime;
    if (videoRef.current.paused) {
      videoRef.current.play();
    }
  };

  const getIssueTimeInSeconds = (issueTime) => {
    if (typeof issueTime === 'number') return issueTime;
    if (typeof issueTime === 'string') {
      const date = new Date(issueTime);
      if (!isNaN(date.getTime())) {
        return (date.getTime() - Date.now()) / 1000 + currentTime;
      }
    }
    return 0;
  };

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

  const handleMouseMove = (e) => {
    if (!draggingTrim || !enableTrimming) return;
    setIsDragging(true);
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));
    const time = percentage * parsedDuration;
    
    if (draggingTrim === 'start') {
      const newStart = Math.min(time, effectiveTrimEnd - 0.5);
      onTrimStartChange(Math.max(0, newStart));
      if (videoRef.current) {
        videoRef.current.currentTime = Math.max(0, newStart);
      }
    } else if (draggingTrim === 'end') {
      const newEnd = Math.max(time, effectiveTrimStart + 0.5);
      onTrimEndChange(Math.min(parsedDuration, newEnd));
    }
  };

  const handleMouseUp = () => {
    setDraggingTrim(null);
    setIsDragging(false);
  };

  useEffect(() => {
    if (draggingTrim) {
      document.addEventListener('mouseup', handleMouseUp);
      return () => document.removeEventListener('mouseup', handleMouseUp);
    }
  }, [draggingTrim]);

  const hasTrimmed = enableTrimming && (effectiveTrimStart > 0 || effectiveTrimEnd < parsedDuration);

  return (
    <div className="space-y-2 p-3">
      {hasTrimmed && (
        <div className="flex items-center justify-between text-xs bg-teal-50 dark:bg-teal-900/20 p-2 rounded-lg">
          <div className="flex items-center space-x-4">
            <div>
              <span className="text-gray-600 dark:text-gray-400">Start: </span>
              <span className="font-mono font-semibold text-teal-600 dark:text-teal-400">
                {formatTime(effectiveTrimStart)}
              </span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">End: </span>
              <span className="font-mono font-semibold text-teal-600 dark:text-teal-400">
                {formatTime(effectiveTrimEnd)}
              </span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Duration: </span>
              <span className="font-mono font-semibold text-teal-600 dark:text-teal-400">
                {formatTime(Math.max(0, effectiveTrimEnd - effectiveTrimStart))}
              </span>
            </div>
          </div>
          <div className="text-gray-500 dark:text-gray-400 italic text-xs">
            Video trimmed
          </div>
        </div>
      )}
      
      <div 
        className="h-8 relative rounded-lg cursor-pointer select-none"
        onClick={(e) => {
          if (draggingTrim || isDragging) return;
          const rect = e.currentTarget.getBoundingClientRect();
          const clickX = e.clientX - rect.left;
          const percentage = clickX / rect.width;
          const seekTime = percentage * parsedDuration;
          seekTo(seekTime);
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => {
          if (!isDragging) setDraggingTrim(null);
        }}
      >
        {/* Background track */}
        <div className="absolute inset-0 border-2 border-teal-500 dark:border-teal-400 rounded-lg bg-gray-100 dark:bg-gray-700" />
        
        {/* Trimmed out regions - only show if trimming is enabled */}
        {enableTrimming && (
          <>
            <div
              className="absolute top-0 h-full bg-gray-400/60 dark:bg-gray-600/60 rounded-l-lg pointer-events-none"
              style={{
                left: 0,
                width: `${(effectiveTrimStart / parsedDuration) * 100}%`
              }}
            />
            <div
              className="absolute top-0 h-full bg-gray-400/60 dark:bg-gray-600/60 rounded-r-lg pointer-events-none"
              style={{
                left: `${(effectiveTrimEnd / parsedDuration) * 100}%`,
                width: `${((parsedDuration - effectiveTrimEnd) / parsedDuration) * 100}%`
              }}
            />
          </>
        )}

        {/* Video playback progress */}
        {enableTrimming ? (
          <div
            className="absolute top-0 h-full bg-teal-500/30 dark:bg-teal-400/30 transition-all duration-100 pointer-events-none rounded-lg"
            style={{ 
              left: 0,
              width: `${(currentTime / parsedDuration) * 100}%`
            }}
          />
        ) : null}
        
        {/* Start trim handle - ALWAYS VISIBLE when trimming enabled */}
        {enableTrimming && (
          <div
            className="absolute top-1/2 -translate-y-1/2 -ml-3 w-6 h-10 cursor-ew-resize z-40 group"
            style={{ left: `${(effectiveTrimStart / parsedDuration) * 100}%` }}
            onMouseDown={(e) => {
              e.stopPropagation();
              setDraggingTrim('start');
            }}
            title="Drag to trim from start"
          >
            <div className="w-full h-full bg-teal-500 dark:bg-teal-400 rounded-lg shadow-lg group-hover:bg-teal-600 dark:group-hover:bg-teal-300 transition-colors flex items-center justify-center border-2 border-white">
              <ChevronRight className="w-3 h-3 text-white" strokeWidth={3} />
            </div>
            {draggingTrim === 'start' && (
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                {formatTime(effectiveTrimStart)}
              </div>
            )}
          </div>
        )}

        {/* End trim handle - ALWAYS VISIBLE when trimming enabled */}
        {enableTrimming && (
          <div
            className="absolute top-1/2 -translate-y-1/2 -ml-3 w-6 h-10 cursor-ew-resize z-40 group"
            style={{ left: `${(effectiveTrimEnd / parsedDuration) * 100}%` }}
            onMouseDown={(e) => {
              e.stopPropagation();
              setDraggingTrim('end');
            }}
            title="Drag to trim from end"
          >
            <div className="w-full h-full bg-teal-500 dark:bg-teal-400 rounded-lg shadow-lg group-hover:bg-teal-600 dark:group-hover:bg-teal-300 transition-colors flex items-center justify-center border-2 border-white">
              <ChevronLeft className="w-3 h-3 text-white" strokeWidth={3} />
            </div>
            {draggingTrim === 'end' && (
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                {formatTime(effectiveTrimEnd)}
              </div>
            )}
          </div>
        )}
        
        {/* Error/Issue markers */}
        {enableTrimming ? (
          // Recorder mode: vertical red bars
          detectedIssues.map(issue => {
            const issueTimeSeconds = getIssueTimeInSeconds(issue.time);
            const leftPercentage = parsedDuration > 0 ? (issueTimeSeconds / parsedDuration) * 100 : 0;
            
            return (
              <div
                key={issue.id}
                onClick={(e) => {
                  e.stopPropagation();
                  seekTo(issueTimeSeconds);
                }}
                className="absolute w-1.5 h-8 bg-red-600 hover:bg-red-700 cursor-pointer transition-colors z-10 rounded-sm"
                style={{ left: `${Math.max(0, Math.min(100, leftPercentage))}%` }}
                title={`Issue: ${issue.message} (${formatTime(issueTimeSeconds)})`}
              />
            );
          })
        ) : (
          // Viewer mode: small red X icons at the top of the progress bar
          detectedIssues.map(issue => {
            const issueTimeSeconds = getIssueTimeInSeconds(issue.time);
            const leftPercentage = parsedDuration > 0 ? (issueTimeSeconds / parsedDuration) * 100 : 0;
            
            return (
              <div
                key={issue.id}
                onClick={(e) => {
                  e.stopPropagation();
                  seekTo(issueTimeSeconds);
                }}
                className="absolute -top-3 -translate-x-1/2 cursor-pointer z-20 group"
                style={{ left: `${Math.max(0, Math.min(100, leftPercentage))}%` }}
                title={`Error: ${issue.message} (${formatTime(issueTimeSeconds)})`}
              >
                <div className="w-4 h-4 bg-red-600 rounded-sm flex items-center justify-center shadow-md group-hover:bg-red-700 transition-colors border border-white">
                  <X className="w-3 h-3 text-white" strokeWidth={3} />
                </div>
              </div>
            );
          })
        )}

        {/* AI highlights - only shown when trimming is enabled */}
        {enableTrimming && showAiHighlights && aiHighlights.map(highlight => {
          const leftPercentage = parsedDuration > 0 ? (highlight.time / parsedDuration) * 100 : 0;
          
          return (
            <div
              key={highlight.id}
              onClick={(e) => {
                e.stopPropagation();
                seekTo(highlight.time);
              }}
              className={`absolute w-2 h-8 cursor-pointer transition-colors z-20 ${
                getMarkerColor(highlight, 'ai')
              }`}
              style={{ 
                left: `${Math.max(0, Math.min(100, leftPercentage))}%`,
                clipPath: 'polygon(0 0, 100% 0, 50% 70%, 0 70%)',
              }}
              title={`AI: ${highlight.title} - ${highlight.description} (${formatTime(highlight.time)})`}
            />
          );
        })}
        
        {/* Current time indicator - vertical line */}
        <div
          className={`absolute -top-2 ${
            enableTrimming 
              ? 'w-0.5 h-12 bg-white' 
              : 'w-1 h-12 bg-orange-500 dark:bg-orange-400'
          } shadow-lg z-30 rounded-full transition-all duration-100`}
          style={{ 
            left: parsedDuration > 0 ? `${(currentTime / parsedDuration) * 100}%` : '0%' 
          }}
        />
      </div>
      
      <div className="flex items-center justify-between text-xs">
        <div className="text-gray-600 dark:text-gray-400 font-mono">
          {formatTime(currentTime)} / {formatTime(parsedDuration)}
        </div>
        
        <div className="flex items-center space-x-4">
          {detectedIssues.length > 0 && (
            <div className="flex items-center space-x-1.5">
              {enableTrimming ? (
                <div className="w-1.5 h-1.5 bg-red-600 rounded-full"></div>
              ) : (
                <div className="w-3 h-3 bg-red-600 rounded-sm flex items-center justify-center">
                  <X className="w-2 h-2 text-white" strokeWidth={3} />
                </div>
              )}
              <span className="text-gray-500 dark:text-gray-400">
                {enableTrimming ? 'Issues' : 'Errors'} ({detectedIssues.length})
              </span>
            </div>
          )}
          
          {enableTrimming && showAiHighlights && aiHighlights.length > 0 && (
            <div className="flex items-center space-x-1.5">
              <div className="w-2 h-1.5 bg-purple-600 rounded-sm" 
                   style={{ clipPath: 'polygon(0 0, 100% 0, 50% 100%)' }}></div>
              <span className="text-gray-500 dark:text-gray-400">AI Insights ({aiHighlights.length})</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecorderTimeline;