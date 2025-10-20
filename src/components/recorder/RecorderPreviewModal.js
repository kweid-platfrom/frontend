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
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-card w-full h-full lg:rounded-2xl lg:shadow-2xl lg:w-[85vw] lg:h-[85vh] xl:w-[80vw] xl:h-[80vh] flex flex-col overflow-hidden border-0 lg:border border-border">

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 lg:px-6 lg:py-4 border-b border-border flex-shrink-0 bg-card">
          <div className="flex-1 min-w-0 mr-4">
            <h2 className="text-lg lg:text-xl font-semibold text-foreground truncate">
              Recording Preview
            </h2>
            <p className="text-xs lg:text-sm text-muted-foreground mt-0.5 hidden sm:block">
              {!recordingTitle.trim() && (
                <span className="text-amber-600 font-medium">
                  ⚠️ Scroll down to enter a title before saving
                </span>
              )}
              {recordingTitle.trim() && (
                <span>Review, trim, and save your recording</span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {onClose && (
              <button
                onClick={handleClose}
                className="p-2 text-muted-foreground hover:text-destructive rounded-lg hover:bg-secondary transition-colors"
                title="Close preview"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Main Content Area - Mobile: Scrollable vertical layout, Desktop: Side-by-side */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden min-h-0">

          {/* Mobile & Tablet: Video and Timeline First (Top) */}
          <div className="flex-1 flex flex-col min-w-0 bg-muted lg:order-2">

            {/* Video Player Container */}
            <div className="flex-shrink-0 p-4 lg:flex-1 lg:p-6 flex items-center justify-center">
              <div className="w-full aspect-video lg:h-full lg:max-w-full lg:max-h-full bg-black relative rounded-xl overflow-hidden shadow-xl border border-border">
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
                            <div className="bg-card/90 rounded-full p-4 lg:p-6 shadow-lg hover:bg-card transition-colors">
                              <svg className="w-10 h-10 lg:w-12 lg:h-12 text-foreground" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z" />
                              </svg>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    <div className="text-center p-6">
                      <div className="text-5xl lg:text-7xl mb-4">🎥</div>
                      <div className="text-base lg:text-lg font-medium text-foreground">No recording available</div>
                      <div className="text-xs lg:text-sm text-muted-foreground mt-2">
                        The recording preview could not be loaded
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Timeline Container */}
            <div className="flex-shrink-0 px-4 pb-4 lg:p-6 lg:pt-0">
              <div className="bg-card rounded-xl shadow-lg border border-border overflow-hidden">
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

            {/* Actions Container */}
            <div className="flex-shrink-0 px-4 pb-4 lg:p-6 lg:pt-0">
              <RecorderActions
                previewUrl={currentPreviewUrl}
                activeSuite={activeSuite}
                firestoreService={firestoreService}
                onClose={handleClose}
                recordingData={recordingData}
                hasTitle={!!recordingTitle.trim()}
                hasTrimChanges={hasTrimChanges}
              />
            </div>
          </div>

          {/* Left Panel - Title, Logs & Comments (Bottom on mobile, Left on desktop) */}
          <div className="w-full lg:w-2/5 xl:w-1/3 flex-shrink-0 border-t lg:border-t-0 lg:border-r border-border bg-card lg:overflow-hidden lg:order-1">
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
        </div>
      </div>
    </div>
  );
};

export default RecorderPreviewModal;