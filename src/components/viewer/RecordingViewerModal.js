import React, { useRef, useState, useMemo, useEffect, useCallback } from 'react';
import { X, Share2, Download, Play, Pause, Maximize, Minimize } from 'lucide-react';
import RecordingViewerLeftPanel from '../viewer/RecordingViewerLeftPanel';

const RecordingViewerModal = ({
  recording,
  onClose
}) => {
  const youtubePlayerRef = useRef(null);
  const timelineRef = useRef(null);
  const videoContainerRef = useRef(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);

  const isYouTubeVideo = useMemo(() => {
    if (!recording?.videoUrl) return false;
    return recording.videoUrl.includes('youtube.com') || recording.videoUrl.includes('youtu.be');
  }, [recording?.videoUrl]);

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const sec = Math.floor(seconds % 60).toString().padStart(2, '0');
    const min = Math.floor(seconds / 60).toString();
    return `${min}:${sec}`;
  };

  const parsedDuration = useMemo(() => {
    if (duration > 0) return duration;
    if (typeof recording?.duration === 'string' && recording.duration.includes(':')) {
      const parts = recording.duration.split(':');
      return parseInt(parts[0]) * 60 + parseInt(parts[1]);
    }
    if (typeof recording?.duration === 'number') return recording.duration;
    return 0;
  }, [recording?.duration, duration]);

  const handleShare = () => {
    const shareUrl = `${window.location.origin}/recordings/${recording.id}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      alert('Link copied to clipboard!');
    }).catch(() => {
      alert(`Share URL: ${shareUrl}`);
    });
  };

  const handleDownload = () => {
    if (recording?.videoUrl && !isYouTubeVideo) {
      const a = document.createElement('a');
      a.href = recording.videoUrl;
      a.download = `${recording.title || 'recording'}.webm`;
      a.click();
    }
  };

  const handleTimeUpdate = useCallback((time) => {
    setCurrentTime(time);
  }, []);

  // Get duration from YouTube player when ready
  useEffect(() => {
    const checkDuration = setInterval(() => {
      if (youtubePlayerRef.current && youtubePlayerRef.current.getDuration) {
        const dur = youtubePlayerRef.current.getDuration();
        if (dur > 0 && duration === 0) {
          setDuration(dur);
          clearInterval(checkDuration);
        }
      }
    }, 500);

    return () => clearInterval(checkDuration);
  }, [duration]);

  // Monitor playing state and current time
  useEffect(() => {
    const checkPlayerState = setInterval(() => {
      if (youtubePlayerRef.current && youtubePlayerRef.current.getPlayerState) {
        const state = youtubePlayerRef.current.getPlayerState();
        setIsPlaying(state === 1); // 1 = playing
        
        // Also update current time
        if (youtubePlayerRef.current.getCurrentTime) {
          const time = youtubePlayerRef.current.getCurrentTime();
          if (time && !isNaN(time)) {
            setCurrentTime(time);
          }
        }
      }
    }, 100);

    return () => clearInterval(checkPlayerState);
  }, []);

  // Monitor fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const seekTo = (seconds) => {
    if (!youtubePlayerRef.current) return;
    const clampedTime = Math.max(0, Math.min(seconds, parsedDuration));
    
    if (youtubePlayerRef.current.seekTo) {
      youtubePlayerRef.current.seekTo(clampedTime, true);
    }
  };

  const togglePlayPause = () => {
    if (!youtubePlayerRef.current) return;
    
    if (youtubePlayerRef.current.getPlayerState) {
      const state = youtubePlayerRef.current.getPlayerState();
      if (state === 1) { // Playing
        youtubePlayerRef.current.pauseVideo();
      } else {
        youtubePlayerRef.current.playVideo();
      }
    }
  };

  const toggleFullscreen = () => {
    if (!videoContainerRef.current) return;

    if (!document.fullscreenElement) {
      videoContainerRef.current.requestFullscreen().catch(err => {
        console.error('Error attempting to enable fullscreen:', err);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const changePlaybackSpeed = (speed) => {
    setPlaybackSpeed(speed);
    setShowSpeedMenu(false);
    
    if (youtubePlayerRef.current && youtubePlayerRef.current.setPlaybackRate) {
      youtubePlayerRef.current.setPlaybackRate(speed);
    }
  };

  const handleTimelineClick = (e) => {
    if (!timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const seekTime = percentage * parsedDuration;
    seekTo(seekTime);
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

  const detectedIssues = recording?.detectedIssues || [];
  const speedOptions = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 md:p-6 lg:p-8">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-[90%] max-w-[1600px] h-[85vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0 bg-white dark:bg-gray-900">
          <div className="flex-1 min-w-0 mr-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
              {recording?.title || 'Recording Viewer'}
            </h2>
            {recording?.created_at && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {new Date(recording.created_at.toDate ? recording.created_at.toDate() : recording.created_at).toLocaleDateString()}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="p-2 text-gray-500 hover:text-teal-600 dark:text-gray-400 dark:hover:text-teal-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title="Share recording"
            >
              <Share2 className="w-5 h-5" />
            </button>
            {recording?.videoUrl && !isYouTubeVideo && (
              <button
                onClick={handleDownload}
                className="p-2 text-gray-500 hover:text-teal-600 dark:text-gray-400 dark:hover:text-teal-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                title="Download recording"
              >
                <Download className="w-5 h-5" />
              </button>
            )}
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                title="Close viewer"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex overflow-hidden min-h-0">

          {/* Left Panel - Metadata & Info (28% width) */}
          <div className="w-[28%] flex-shrink-0 border-r border-gray-200 dark:border-gray-700 overflow-hidden">
            <RecordingViewerLeftPanel
              recording={recording}
              videoRef={youtubePlayerRef}
              currentTime={currentTime}
            />
          </div>

          {/* Right Panel - Video & Timeline (72% width) */}
          <div className="flex-1 flex flex-col min-w-0 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900">

            {/* Video Player Container - Floating Effect */}
            <div className="flex-1 p-8 flex items-center justify-center">
              <div 
                ref={videoContainerRef}
                className="w-[90%] h-full max-w-full max-h-full bg-black relative rounded-2xl overflow-hidden shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] dark:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.6)] dark:ring-gray-700/50 transform transition-transform group"
              >
                {recording?.videoUrl ? (
                  <>
                    <CustomVideoPlayerWrapper
                      videoUrl={recording.videoUrl}
                      onTimeUpdate={handleTimeUpdate}
                      playerRef={youtubePlayerRef}
                      className="w-full h-full"
                    />
                    
                    {/* Video Controls Overlay */}
                    <div className="absolute bottom-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-30">
                      {/* Playback Speed Button */}
                      <div className="relative">
                        <button
                          onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                          className="px-3 py-2 bg-black/80 hover:bg-black/90 text-white rounded-lg text-sm font-medium transition-colors backdrop-blur-sm border border-white/20"
                          title="Playback speed"
                        >
                          {playbackSpeed}x
                        </button>
                        
                        {/* Speed Menu */}
                        {showSpeedMenu && (
                          <div className="absolute bottom-full right-0 mb-2 bg-black/90 backdrop-blur-sm rounded-lg border border-white/20 shadow-xl overflow-hidden">
                            {speedOptions.map(speed => (
                              <button
                                key={speed}
                                onClick={() => changePlaybackSpeed(speed)}
                                className={`block w-full px-4 py-2 text-sm text-left transition-colors ${
                                  speed === playbackSpeed
                                    ? 'bg-teal-600 text-white'
                                    : 'text-white hover:bg-white/10'
                                }`}
                              >
                                {speed}x
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Fullscreen Button */}
                      <button
                        onClick={toggleFullscreen}
                        className="p-2 bg-black/80 hover:bg-black/90 text-white rounded-lg transition-colors backdrop-blur-sm border border-white/20"
                        title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                      >
                        {isFullscreen ? (
                          <Minimize className="w-5 h-5" />
                        ) : (
                          <Maximize className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-400 dark:text-gray-600">
                    <div className="text-center p-6">
                      <div className="text-6xl mb-4">🎥</div>
                      <div className="text-lg font-medium">No video available</div>
                      <div className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                        This recording doesn't have a video file
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Timeline Container */}
            <div className="flex-shrink-0 p-6 pt-0">
              <div className="overflow-hidden">
                <div className="space-y-3 p-3">
                  {/* Timeline Controls & Progress Bar */}
                  <div className="flex items-center gap-3">
                    {/* Play/Pause Button */}
                    <button
                      onClick={togglePlayPause}
                      className="flex-shrink-0 p-2 text-primary rounded-lg transition-colors shadow-md"
                      title={isPlaying ? 'Pause' : 'Play'}
                    >
                      {isPlaying ? (
                        <Pause className="w-5 h-5" fill="currentColor" />
                      ) : (
                        <Play className="w-5 h-5" fill="currentColor" />
                      )}
                    </button>

                    {/* Timeline */}
                    <div 
                      ref={timelineRef}
                      className="flex-1 h-6 relative rounded-lg cursor-pointer select-none"
                      onClick={handleTimelineClick}
                    >
                      {/* Background track */}
                      <div className="absolute inset-0 border-2 border-primary dark:border-primary/50 rounded" />

                      {/* Error/Issue markers - small red X icons at the top */}
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
                            className="absolute -top-3 -translate-x-1/2 cursor-pointer z-20 group"
                            style={{ left: `${Math.max(0, Math.min(100, leftPercentage))}%` }}
                            title={`Error: ${issue.message} (${formatTime(issueTimeSeconds)})`}
                          >
                            <div className="w-4 h-4 bg-red-600 rounded-sm flex items-center justify-center shadow-md group-hover:bg-red-700 transition-colors border border-white">
                              <X className="w-3 h-3 text-white" strokeWidth={3} />
                            </div>
                          </div>
                        );
                      })}
                      
                      {/* Current time indicator - vertical orange line that cuts across the bar */}
                      <div
                        className="absolute top-1/2 -translate-y-1/2 w-1 h-10 bg-orange-500 dark:bg-orange-400 shadow-lg z-30 rounded-full"
                        style={{ 
                          left: parsedDuration > 0 ? `${(currentTime / parsedDuration) * 100}%` : '0%' 
                        }}
                      />
                    </div>
                  </div>
                  
                  {/* Time Display and Info */}
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex-1"></div>
                    <div className="flex-1 text-center text-gray-700 dark:text-gray-300 font-mono text-base font-semibold">
                      {formatTime(currentTime)} / {formatTime(parsedDuration)}
                    </div>
                    <div className="flex-1"></div>
                    <div className="flex items-center space-x-4">
                      {detectedIssues.length > 0 && (
                        <div className="flex items-center space-x-1.5">
                          <div className="w-3 h-3 bg-red-600 rounded-sm flex items-center justify-center">
                            <X className="w-2 h-2 text-white" strokeWidth={3} />
                          </div>
                          <span className="text-gray-500 dark:text-gray-400">
                            Errors ({detectedIssues.length})
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Wrapper component to expose YouTube player reference
const CustomVideoPlayerWrapper = ({ videoUrl, onTimeUpdate, playerRef, className }) => {
  const containerRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isBuffering, setIsBuffering] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [youtubeReady, setYoutubeReady] = useState(false);

  const timeUpdateIntervalRef = useRef(null);

  const getYouTubeVideoId = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const youtubeVideoId = getYouTubeVideoId(videoUrl);

  useEffect(() => {
    if (!youtubeVideoId) return;

    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

      window.onYouTubeIframeAPIReady = () => {
        initYouTubePlayer();
      };
    } else {
      initYouTubePlayer();
    }

    function initYouTubePlayer() {
      if (playerRef.current) return;

      playerRef.current = new window.YT.Player('youtube-player-wrapper', {
        videoId: youtubeVideoId,
        playerVars: {
          autoplay: 0,
          controls: 0,
          modestbranding: 1,
          rel: 0,
          showinfo: 0,
          iv_load_policy: 3,
          disablekb: 1,
          fs: 0,
          cc_load_policy: 0,
          playsinline: 1
        },
        events: {
          onReady: (event) => {
            setYoutubeReady(true);
            setDuration(event.target.getDuration());
          },
          onStateChange: (event) => {
            setIsPlaying(event.data === window.YT.PlayerState.PLAYING);
            setIsBuffering(event.data === window.YT.PlayerState.BUFFERING);

            if (event.data === window.YT.PlayerState.ENDED) {
              setIsPlaying(false);
              setCurrentTime(duration);
            }
          },
          onError: (event) => {
            console.error('YouTube player error:', event.data);
            setHasError(true);
          }
        }
      });
    }

    return () => {
      if (playerRef.current && playerRef.current.destroy) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, [youtubeVideoId, duration, playerRef]);

  useEffect(() => {
    if (!playerRef.current || !youtubeReady) return;

    const updateTime = () => {
      if (playerRef.current && playerRef.current.getCurrentTime) {
        const time = playerRef.current.getCurrentTime();
        setCurrentTime(time);
        if (onTimeUpdate) {
          onTimeUpdate(time);
        }
      }
    };

    // Initial update
    updateTime();
    
    // Set up interval for continuous updates
    timeUpdateIntervalRef.current = setInterval(updateTime, 100);

    return () => {
      if (timeUpdateIntervalRef.current) {
        clearInterval(timeUpdateIntervalRef.current);
      }
    };
  }, [youtubeReady, onTimeUpdate, playerRef]);

  const togglePlay = () => {
    if (!playerRef.current || !youtubeReady) return;

    if (isPlaying) {
      playerRef.current.pauseVideo();
    } else {
      playerRef.current.playVideo();
    }
  };

  return (
    <div ref={containerRef} className={`relative bg-black w-full h-full ${className}`}>
      {youtubeVideoId && (
        <div className="relative w-full h-full">
          <div
            id="youtube-player-wrapper"
            className="w-full h-full pointer-events-none"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%'
            }}
          ></div>
          <div
            className="absolute inset-0 z-10 cursor-pointer"
            onClick={togglePlay}
            style={{ background: 'transparent' }}
          />
        </div>
      )}

      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-20">
          <div className="text-center p-6">
            <div className="text-5xl mb-4">⚠️</div>
            <div className="text-white text-lg font-medium mb-2">Unable to load video</div>
            <div className="text-gray-400 text-sm">
              YouTube video may be unavailable, restricted, or embeds disabled
            </div>
          </div>
        </div>
      )}

      {isBuffering && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none z-20">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent"></div>
        </div>
      )}

      {!isPlaying && !isBuffering && !hasError && youtubeReady && (
        <div
          className="absolute inset-0 flex items-center justify-center cursor-pointer bg-black/20 hover:bg-black/30 transition-colors z-20"
          onClick={togglePlay}
        >
          <div className="bg-white/95 rounded-full p-6 shadow-2xl hover:scale-105 transition-transform">
            <Play className="w-12 h-12 text-gray-800" fill="currentColor" />
          </div>
        </div>
      )}

      {!youtubeReady && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-teal-500 border-t-transparent mx-auto mb-4"></div>
            <div className="text-white text-sm">Loading video...</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecordingViewerModal;