'use client'
import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  SkipBack,
  SkipForward
} from 'lucide-react';

const CustomVideoPlayer = ({
  videoUrl,
  onTimeUpdate,
  className = ''
}) => {
  const youtubePlayerRef = useRef(null);
  const containerRef = useRef(null);
  const progressBarRef = useRef(null);
  const volumeBarRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isBuffering, setIsBuffering] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [youtubeReady, setYoutubeReady] = useState(false);

  const controlsTimeoutRef = useRef(null);
  const timeUpdateIntervalRef = useRef(null);

  // Extract YouTube video ID from URL
  const getYouTubeVideoId = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const youtubeVideoId = getYouTubeVideoId(videoUrl);

  // Format time helper
  const formatTime = (seconds) => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Initialize YouTube Player
  useEffect(() => {
    if (!youtubeVideoId) return;

    // Load YouTube IFrame API
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
      if (youtubePlayerRef.current) return;

      youtubePlayerRef.current = new window.YT.Player('youtube-player', {
        videoId: youtubeVideoId,
        playerVars: {
          autoplay: 0,
          controls: 0,          // Hide YouTube controls
          modestbranding: 1,    // Minimal YouTube branding
          rel: 0,               // Don't show related videos
          showinfo: 0,          // Hide video info
          iv_load_policy: 3,    // Hide video annotations
          disablekb: 1,         // Disable keyboard controls (we'll handle them)
          fs: 0,                // Hide fullscreen button
          cc_load_policy: 0,    // Hide closed captions
          playsinline: 1        // Play inline on mobile
        },
        events: {
          onReady: (event) => {
            setYoutubeReady(true);
            setDuration(event.target.getDuration());
            setVolume(event.target.getVolume() / 100);
            setIsMuted(event.target.isMuted());
          },
          onStateChange: (event) => {
            setIsPlaying(event.data === window.YT.PlayerState.PLAYING);
            setIsBuffering(event.data === window.YT.PlayerState.BUFFERING);

            // Handle video end
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
      if (youtubePlayerRef.current && youtubePlayerRef.current.destroy) {
        youtubePlayerRef.current.destroy();
        youtubePlayerRef.current = null;
      }
    };
  }, [youtubeVideoId, duration]);

  // YouTube time update interval
  useEffect(() => {
    if (!youtubePlayerRef.current || !youtubeReady) return;

    const updateTime = () => {
      if (youtubePlayerRef.current && youtubePlayerRef.current.getCurrentTime) {
        const time = youtubePlayerRef.current.getCurrentTime();
        setCurrentTime(time);
        onTimeUpdate?.(time);
      }
    };

    timeUpdateIntervalRef.current = setInterval(updateTime, 100);

    return () => {
      if (timeUpdateIntervalRef.current) {
        clearInterval(timeUpdateIntervalRef.current);
      }
    };
  }, [youtubeReady, onTimeUpdate]);

  // Play/Pause toggle
  const togglePlay = useCallback(() => {
    if (!youtubePlayerRef.current || !youtubeReady) return;

    if (isPlaying) {
      youtubePlayerRef.current.pauseVideo();
    } else {
      youtubePlayerRef.current.playVideo();
    }
  }, [isPlaying, youtubeReady]);

  // Seek to time
  const seekTo = useCallback((time) => {
    if (!youtubePlayerRef.current || !youtubeReady) return;
    youtubePlayerRef.current.seekTo(time, true);
    setCurrentTime(time);
  }, [youtubeReady]);

  // Handle progress bar click
  const handleProgressClick = useCallback((e) => {
    if (!progressBarRef.current) return;

    const rect = progressBarRef.current.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    const time = pos * duration;
    seekTo(time);
  }, [duration, seekTo]);

  // Handle volume change
  const handleVolumeChange = useCallback((e) => {
    if (!volumeBarRef.current || !youtubePlayerRef.current || !youtubeReady) return;

    const rect = volumeBarRef.current.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setVolume(pos);
    youtubePlayerRef.current.setVolume(pos * 100);
    setIsMuted(pos === 0);
  }, [youtubeReady]);

  // Toggle mute
  const toggleMute = useCallback(() => {
    if (!youtubePlayerRef.current || !youtubeReady) return;

    if (isMuted) {
      youtubePlayerRef.current.unMute();
      youtubePlayerRef.current.setVolume((volume || 0.5) * 100);
      setIsMuted(false);
      if (volume === 0) setVolume(0.5);
    } else {
      youtubePlayerRef.current.mute();
      setIsMuted(true);
    }
  }, [isMuted, volume, youtubeReady]);

  // Toggle fullscreen
  // Toggle fullscreen
  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      } else if (containerRef.current.webkitRequestFullscreen) {
        containerRef.current.webkitRequestFullscreen();
      } else if (containerRef.current.msRequestFullscreen) {
        containerRef.current.msRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
    }
  }, []);

  // Skip forward/backward
  const skip = useCallback((seconds) => {
    const newTime = Math.max(0, Math.min(duration, currentTime + seconds));
    seekTo(newTime);
  }, [currentTime, duration, seekTo]);

  // Auto-hide controls
  const resetControlsTimeout = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  }, [isPlaying]);

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      switch (e.key) {
        case ' ':
        case 'k':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          skip(-5);
          break;
        case 'ArrowRight':
          e.preventDefault();
          skip(5);
          break;
        case 'm':
          e.preventDefault();
          toggleMute();
          break;
        case 'f':
          e.preventDefault();
          toggleFullscreen();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, skip, toggleMute, toggleFullscreen]);

  // Mouse move handler for controls
  const handleMouseMove = useCallback(() => {
    resetControlsTimeout();
  }, [resetControlsTimeout]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, []);

  const progressPercentage = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      className={`relative bg-black w-full h-full group ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      {/* YouTube Player with overlay to prevent interaction */}
      {youtubeVideoId && (
        <div className="relative w-full h-full">
          <div
            id="youtube-player"
            className="w-full h-full pointer-events-none"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%'
            }}
          ></div>
          {/* Invisible click layer */}
          <div
            className="absolute inset-0 z-10 cursor-pointer"
            onClick={togglePlay}
            style={{ background: 'transparent' }}
          />
        </div>
      )}

      {/* Error State */}
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

      {/* Buffering Indicator */}
      {isBuffering && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none z-20">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent"></div>
        </div>
      )}

      {/* Center Play Button (when paused) */}
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

      {/* Loading State */}
      {!youtubeReady && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-teal-500 border-t-transparent mx-auto mb-4"></div>
            <div className="text-white text-sm">Loading video...</div>
          </div>
        </div>
      )}

      {/* Controls Overlay */}
      <div
        className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent transition-opacity duration-300 z-30 ${showControls || !isPlaying ? 'opacity-100' : 'opacity-0'
          }`}
      >
        {/* Progress Bar */}
        <div className="px-4 pb-2">
          <div
            ref={progressBarRef}
            className="h-1.5 bg-white/20 rounded-full cursor-pointer hover:h-2 transition-all group/progress"
            onClick={handleProgressClick}
            onMouseDown={(e) => {
              setIsDragging(true);
              handleProgressClick(e);
            }}
            onMouseMove={(e) => {
              if (isDragging || e.buttons === 1) {
                handleProgressClick(e);
              }
            }}
            onMouseUp={() => setIsDragging(false)}
            onMouseLeave={() => setIsDragging(false)}
          >
            <div
              className="h-full bg-teal-500 rounded-full relative"
              style={{ width: `${progressPercentage}%` }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover/progress:opacity-100 transition-opacity"></div>
            </div>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-between px-4 pb-3">
          {/* Left Controls */}
          <div className="flex items-center space-x-3">
            {/* Play/Pause */}
            <button
              onClick={togglePlay}
              disabled={!youtubeReady}
              className="text-white hover:text-teal-400 transition-colors p-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPlaying ? (
                <Pause className="w-6 h-6" fill="currentColor" />
              ) : (
                <Play className="w-6 h-6" fill="currentColor" />
              )}
            </button>

            {/* Skip Back */}
            <button
              onClick={() => skip(-10)}
              disabled={!youtubeReady}
              className="text-white hover:text-teal-400 transition-colors p-1 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Rewind 10s"
            >
              <SkipBack className="w-5 h-5" />
            </button>

            {/* Skip Forward */}
            <button
              onClick={() => skip(10)}
              disabled={!youtubeReady}
              className="text-white hover:text-teal-400 transition-colors p-1 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Forward 10s"
            >
              <SkipForward className="w-5 h-5" />
            </button>

            {/* Volume */}
            <div className="flex items-center space-x-2 group/volume">
              <button
                onClick={toggleMute}
                disabled={!youtubeReady}
                className="text-white hover:text-teal-400 transition-colors p-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-5 h-5" />
                ) : (
                  <Volume2 className="w-5 h-5" />
                )}
              </button>

              {/* Volume Slider */}
              <div className="w-0 opacity-0 group-hover/volume:w-20 group-hover/volume:opacity-100 transition-all duration-200 overflow-hidden">
                <div
                  ref={volumeBarRef}
                  className="h-1 bg-white/20 rounded-full cursor-pointer hover:h-1.5 transition-all"
                  onClick={handleVolumeChange}
                >
                  <div
                    className="h-full bg-white rounded-full"
                    style={{ width: `${(isMuted ? 0 : volume) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Time Display */}
            <div className="text-white text-sm font-medium">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center space-x-2">
            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className="text-white hover:text-teal-400 transition-colors p-1"
            >
              {isFullscreen ? (
                <Minimize className="w-5 h-5" />
              ) : (
                <Maximize className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Keyboard Shortcuts Hint */}
      {!isPlaying && !hasError && youtubeReady && (
        <div className="absolute top-4 right-4 bg-black/70 backdrop-blur-sm text-white text-xs px-3 py-2 rounded-lg z-30">
          <div>Space: Play/Pause</div>
          <div>← →: Skip ±5s</div>
          <div>M: Mute | F: Fullscreen</div>
        </div>
      )}
    </div>
  );
};

export default CustomVideoPlayer;