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
  blob, // The Blob object
  duration,
  consoleLogs = [],
  networkLogs = [],
  detectedIssues = [],
  comments: initialComments = [],
  isSavedRecording = false // NEW: Flag to indicate if this is already saved
}) => {
  const videoRef = useRef(null);
  const [playerOverlayHidden, setPlayerOverlayHidden] = useState(false);
  const [comments, setComments] = useState(initialComments);

  // Track if this is the first render to reduce console noise
  const renderCountRef = useRef(0);
  renderCountRef.current += 1;

  if (renderCountRef.current <= 2) {
    console.log('RecorderPreviewModal rendered with:', {
      renderCount: renderCountRef.current,
      hasBlob: !!blob,
      blobSize: blob?.size,
      duration,
      consoleLogsCount: consoleLogs.length,
      networkLogsCount: networkLogs.length,
      detectedIssuesCount: detectedIssues.length,
      hasPreviewUrl: !!previewUrl
    });
  }

  // Stabilize array props to prevent unnecessary re-renders
  const stableConsoleLogs = useMemo(() => consoleLogs, [JSON.stringify(consoleLogs)]);
  const stableNetworkLogs = useMemo(() => networkLogs, [JSON.stringify(networkLogs)]);
  const stableDetectedIssues = useMemo(() => detectedIssues, [JSON.stringify(detectedIssues)]);

  // Determine if this is a YouTube video
  const isYouTubeVideo = useMemo(() => {
    if (!previewUrl) return false;
    return previewUrl.includes('youtube.com') || previewUrl.includes('youtu.be');
  }, [previewUrl]);

  // Extract YouTube video ID
  const youtubeVideoId = useMemo(() => {
    if (!isYouTubeVideo || !previewUrl) return null;
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /^([a-zA-Z0-9_-]{11})$/ // Direct video ID
    ];
    for (const pattern of patterns) {
      const match = previewUrl.match(pattern);
      if (match) return match[1];
    }
    return null;
  }, [isYouTubeVideo, previewUrl]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || isYouTubeVideo) return; // Skip event listeners for YouTube embeds

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
  }, [previewUrl, isYouTubeVideo]);

  // Manage blob URL lifecycle more carefully
  useEffect(() => {
    return () => {
      // Don't revoke blob URL here at all - let the parent component handle it
      // The save operation might still need access to the blob URL
      console.log('Modal cleanup - not revoking blob URL to prevent save issues');
    };
  }, []);

  // Memoize the addComment callback to prevent unnecessary re-renders
  const addComment = useCallback((comment) => {
    setComments(prev => [...prev, comment]);
  }, []);

  // Memoize the close handler
  const handleClose = useCallback(() => {
    // Don't revoke the blob URL here - let the cleanup effect handle it
    // or let the parent component manage the lifecycle
    onClose();
  }, [onClose]);

  // Memoize the recordingData object to prevent creating new references on every render
  const recordingData = useMemo(() => {
    const data = {
      duration,
      consoleLogs: stableConsoleLogs,
      networkLogs: stableNetworkLogs,
      comments,
      detectedIssues: stableDetectedIssues,
      blob
    };
    
    if (renderCountRef.current <= 2) {
      console.log('RecorderPreviewModal: Creating recordingData object:', {
        hasBlob: !!data.blob,
        blobSize: data.blob?.size,
        duration: data.duration,
        keys: Object.keys(data)
      });
    }
    
    return data;
  }, [duration, stableConsoleLogs, stableNetworkLogs, comments, stableDetectedIssues, blob]);

  // Memoize the play handler
  const handlePlayClick = useCallback(() => {
    videoRef.current?.play();
  }, []);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-7xl max-h-[95vh] sm:max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="min-w-0 flex-1">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white truncate">Recording Preview</h2>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1 hidden sm:block">
              Use controls to navigate the recording
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex-shrink-0 ml-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden min-h-0">
          {/* Left Panel - 40% width */}
          <div className="w-2/5 flex-shrink-0">
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
            />
          </div>

          {/* Right Panel - 60% width */}
          <div className="w-3/5 flex-shrink-0 flex flex-col min-w-0">
            {/* Video Container */}
            <div className="flex-1 bg-black relative min-h-[200px] sm:min-h-[300px]">
              {previewUrl ? (
                <>
                  {isYouTubeVideo && youtubeVideoId ? (
                    // YouTube embed with minimal branding
                    <iframe
                      ref={videoRef}
                      src={`https://www.youtube.com/embed/${youtubeVideoId}?modestbranding=1&rel=0&controls=1&iv_load_policy=3&color=white&playsinline=1`}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      title="Recording video"
                    />
                  ) : (
                    // Regular video player
                    <>
                      <video
                        ref={videoRef}
                        src={previewUrl}
                        controls
                        className="w-full h-full object-contain"
                        preload="metadata"
                      />
                      {!playerOverlayHidden && (
                        <div
                          onClick={handlePlayClick}
                          className="absolute inset-0 flex items-center justify-center cursor-pointer bg-black/20 backdrop-blur-sm"
                        >
                          <div className="bg-white/90 dark:bg-gray-800/90 rounded-full p-4 sm:p-6 shadow-lg hover:bg-white dark:hover:bg-gray-800 transition-colors">
                            <svg className="w-8 h-8 sm:w-12 sm:h-12 text-gray-800 dark:text-white" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z"/>
                            </svg>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">
                  <div className="text-center p-4">
                    <div className="text-4xl sm:text-6xl mb-4">🎥</div>
                    <div className="text-base sm:text-lg">No recording available</div>
                    <div className="text-xs sm:text-sm mt-2">The recording preview could not be loaded</div>
                  </div>
                </div>
              )}
            </div>

            {/* Timeline */}
            <div className="flex-shrink-0">
              <RecorderTimeline
                duration={duration}
                detectedIssues={stableDetectedIssues}
                videoRef={videoRef}
              />
            </div>

            {/* Actions */}
            <div className="flex-shrink-0">
              {!isSavedRecording ? (
                <RecorderActions
                  previewUrl={previewUrl}
                  activeSuite={activeSuite}
                  firestoreService={firestoreService}
                  onClose={handleClose}
                  recordingData={recordingData}
                />
              ) : (
                // For saved recordings, show share and other view-only actions
                <div className="p-3 sm:p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Saved recording
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          const shareUrl = `${window.location.origin}/recordings/${previewUrl.split('/').pop()}`;
                          navigator.clipboard.writeText(shareUrl).then(() => {
                            alert('Link copied to clipboard!');
                          }).catch(() => {
                            alert(`Share URL: ${shareUrl}`);
                          });
                        }}
                        className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg transition-colors text-sm font-medium"
                      >
                        Share
                      </button>
                    </div>
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

export default RecorderPreviewModal;