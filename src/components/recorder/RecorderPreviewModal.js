'use client';

import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { X } from 'lucide-react';
import RecorderLeftPanel from './RecorderLeftPanel';
import RecorderTimeline from './RecorderTimeline';
import RecorderActions from './RecorderActions';

const RecorderPreviewModal = ({
  activeSuite,
  firestoreService,
  onClose,
  previewUrl,
  blob,
  duration,
  consoleLogs = [],
  networkLogs = [],
  detectedIssues = [],
  comments: initialComments = []
}) => {
  const videoRef = useRef(null);
  const renderCountRef = useRef(0);

  const [playerOverlayHidden, setPlayerOverlayHidden] = useState(false);
  const [comments, setComments] = useState(initialComments);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);
  const [hasTrimChanges, setHasTrimChanges] = useState(false);
  const [trimmedBlob] = useState(null);
  const [currentPreviewUrl] = useState(previewUrl);
  const [recordingTitle, setRecordingTitle] = useState('');

  renderCountRef.current += 1;

  // Initialize trimEnd to video duration when it's available
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      if (video.duration && trimEnd === 0) {
        setTrimEnd(video.duration);
      }
    };

    // If duration is already available
    if (video.duration && trimEnd === 0) {
      setTrimEnd(video.duration);
    }

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    return () => video.removeEventListener('loadedmetadata', handleLoadedMetadata);
  }, [trimEnd]);

  // Track trim changes
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const actualDuration = video.duration || duration;
    const hasTrimmed = trimStart > 0 || (trimEnd > 0 && trimEnd < actualDuration);
    setHasTrimChanges(hasTrimmed);
  }, [trimStart, trimEnd, duration]);

  if (renderCountRef.current <= 2) {
    console.log('RecorderPreviewModal rendered with:', {
      renderCount: renderCountRef.current,
      hasBlob: !!blob,
      blobSize: blob?.size,
      duration,
      consoleLogsCount: consoleLogs.length,
      networkLogsCount: networkLogs.length,
      detectedIssuesCount: detectedIssues.length,
      hasPreviewUrl: !!previewUrl,
      recordingTitle
    });
  }

  // FIXED: Memoize the stringified versions first to avoid complex expressions in dependencies
  const consoleLogsKey = useMemo(() => JSON.stringify(consoleLogs), [consoleLogs]);
  const networkLogsKey = useMemo(() => JSON.stringify(networkLogs), [networkLogs]);
  const detectedIssuesKey = useMemo(() => JSON.stringify(detectedIssues), [detectedIssues]);

  // Then use the keys as dependencies for stable references
  const stableConsoleLogs = useMemo(() => consoleLogs, [consoleLogsKey, consoleLogs]);
  const stableNetworkLogs = useMemo(() => networkLogs, [networkLogsKey, networkLogs]);
  const stableDetectedIssues = useMemo(() => detectedIssues, [detectedIssuesKey, detectedIssues]);

  const isYouTubeVideo = useMemo(() => {
    if (!currentPreviewUrl) return false;
    return currentPreviewUrl.includes('youtube.com') || currentPreviewUrl.includes('youtu.be');
  }, [currentPreviewUrl]);

  const youtubeVideoId = useMemo(() => {
    if (!isYouTubeVideo || !currentPreviewUrl) return null;
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /^([a-zA-Z0-9_-]{11})$/
    ];
    for (const pattern of patterns) {
      const match = currentPreviewUrl.match(pattern);
      if (match) return match[1];
    }
    return null;
  }, [isYouTubeVideo, currentPreviewUrl]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || isYouTubeVideo) return;

    const onPlay = () => setPlayerOverlayHidden(true);
    const onPause = () => setPlayerOverlayHidden(false);
    const onEnded = () => setPlayerOverlayHidden(false);

    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    video.addEventListener('ended', onEnded);

    return () => {
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('ended', onEnded);
    };
  }, [currentPreviewUrl, isYouTubeVideo]);

  useEffect(() => {
    return () => {
      console.log('Modal cleanup - not revoking blob URL to prevent save issues');
    };
  }, []);

  const addComment = useCallback((comment) => {
    setComments(prev => [...prev, comment]);
  }, []);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  const handleTitleChange = useCallback((newTitle) => {
    setRecordingTitle(newTitle);
    console.log('Recording title updated:', newTitle);
  }, []);

  const recordingData = useMemo(() => {
    // Get actual duration from video element if available
    const video = videoRef.current;
    let actualDuration = duration;

    if (video && video.duration && isFinite(video.duration)) {
      actualDuration = video.duration;
      console.log('Using video element duration:', actualDuration);
    } else if (typeof duration === 'number' && isFinite(duration)) {
      actualDuration = duration;
      console.log('Using provided duration:', actualDuration);
    } else {
      actualDuration = 0;
      console.warn('Duration not available, using 0');
    }

    const data = {
      duration: actualDuration,
      consoleLogs: stableConsoleLogs,
      networkLogs: stableNetworkLogs,
      comments,
      detectedIssues: stableDetectedIssues,
      blob: trimmedBlob || blob,
      title: recordingTitle.trim()
    };

    console.log('RecorderPreviewModal: Creating recordingData object:', {
      hasBlob: !!data.blob,
      blobSize: data.blob?.size,
      duration: data.duration,
      title: data.title,
      keys: Object.keys(data)
    });

    return data;
  }, [duration, stableConsoleLogs, stableNetworkLogs, comments, stableDetectedIssues, blob, trimmedBlob, recordingTitle]);

  const handlePlayClick = useCallback(() => {
    videoRef.current?.play();
  }, []);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4 md:p-6 lg:p-8">
      <div className="bg-white dark:bg-gray-900 rounded-xl sm:rounded-2xl shadow-2xl w-full h-full sm:w-[95%] sm:h-[95vh] md:w-[90%] md:h-[90vh] lg:w-[90%] lg:h-[85vh] max-w-[1600px] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0 bg-white dark:bg-gray-900">
          <div className="flex-1 min-w-0 mr-2 sm:mr-4">
            <h2 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 dark:text-white truncate">
              Recording Preview
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5 sm:mt-1">
              Review, trim, and save your recording
            </p>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <RecorderActions
              previewUrl={currentPreviewUrl}
              activeSuite={activeSuite}
              firestoreService={firestoreService}
              onClose={handleClose}
              recordingData={recordingData}
              hasTitle={!!recordingTitle.trim()}
              hasTrimChanges={hasTrimChanges}
            />
            {onClose && (
              <button
                onClick={handleClose}
                className="p-1.5 sm:p-2 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                title="Close preview"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden min-h-0">

          {/* Left Panel - Title, Logs & Comments (Full width on mobile, 28% on desktop) */}
          <div className="w-full lg:w-[28%] flex-shrink-0 border-b lg:border-b-0 lg:border-r border-gray-200 dark:border-gray-700 lg:overflow-hidden min-h-screen lg:min-h-0 lg:order-1">
            <RecorderLeftPanel
              consoleLogs={stableConsoleLogs}
              networkLogs={stableNetworkLogs}
              detectedIssues={stableDetectedIssues}
              comments={comments}
              onAddComment={addComment}
              videoRef={videoRef}
              activeSuite={activeSuite}
              firestoreService={firestoreService}
              isPreviewMode={true}
              initialTitle={recordingTitle}
              onTitleChange={handleTitleChange}
            />
          </div>

          {/* Right Panel - Video & Timeline (Full width on mobile, 72% on desktop) */}
          <div className="flex-1 flex flex-col min-w-0 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 lg:order-2 min-h-screen lg:min-h-0">

            {/* Video Player Container - Floating Effect */}
            <div className="flex-1 p-4 sm:p-6 md:p-8 flex items-center justify-center min-h-[50vh] lg:min-h-0">
              <div className="w-full sm:w-[95%] md:w-[90%] h-full max-w-full max-h-full bg-black relative rounded-lg sm:rounded-xl md:rounded-2xl overflow-hidden shadow-xl sm:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] dark:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.6)] dark:ring-gray-700/50 transform transition-transform">
                {currentPreviewUrl ? (
                  <> 
                    {isYouTubeVideo && youtubeVideoId ? (
                      <iframe
                        ref={videoRef}
                        src={`https://www.youtube.com/embed/${youtubeVideoId}?modestbranding=1&rel=0&controls=1&iv_load_policy=3&color=white&playsinline=1`}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        title="Recording preview"
                      />
                    ) : (
                      <>
                        <video
                          ref={videoRef}
                          src={currentPreviewUrl}
                          controls
                          className="w-full h-full object-contain"
                          preload="metadata"
                        />
                        {!playerOverlayHidden && (
                          <div
                            onClick={handlePlayClick}
                            className="absolute inset-0 flex items-center justify-center cursor-pointer bg-black/20 backdrop-blur-sm"
                          >
                            <div className="bg-white/90 dark:bg-gray-800/90 rounded-full p-4 sm:p-6 shadow-lg hover:bg-white dark:hover:bg-gray-800 transition-all hover:scale-110">
                              <svg className="w-8 h-8 sm:w-12 sm:h-12 text-gray-900 dark:text-white" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z" />
                              </svg>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-400 dark:text-gray-600">
                    <div className="text-center p-4 sm:p-6">
                      <div className="text-4xl sm:text-5xl md:text-6xl mb-3 sm:mb-4">🎥</div>
                      <div className="text-sm sm:text-base md:text-lg font-medium">No recording available</div>
                      <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-500 mt-1 sm:mt-2">
                        The recording preview could not be loaded
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Timeline Container */}
            <div className="flex-shrink-0 p-3 sm:p-4 md:p-6 pt-0">
              <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                <RecorderTimeline
                  duration={duration}
                  detectedIssues={stableDetectedIssues}
                  videoRef={videoRef}
                  trimStart={trimStart}
                  trimEnd={trimEnd}
                  onTrimStartChange={setTrimStart}
                  onTrimEndChange={setTrimEnd}
                  enableTrimming={true}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecorderPreviewModal;