'use client';

import React, { useRef, useState, useEffect } from 'react';
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
  comments: initialComments = []
}) => {
  const videoRef = useRef(null);
  const [playerOverlayHidden, setPlayerOverlayHidden] = useState(false);
  const [comments, setComments] = useState(initialComments);

  console.log('RecorderPreviewModal rendered with:', {
    hasBlob: !!blob,
    blobSize: blob?.size,
    duration,
    consoleLogsCount: consoleLogs.length,
    networkLogsCount: networkLogs.length,
    detectedIssuesCount: detectedIssues.length,
    hasPreviewUrl: !!previewUrl
  });

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

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
  }, [previewUrl]);

  // Manage blob URL lifecycle more carefully
  useEffect(() => {
    return () => {
      // Don't revoke blob URL here at all - let the parent component handle it
      // The save operation might still need access to the blob URL
      console.log('Modal cleanup - not revoking blob URL to prevent save issues');
    };
  }, []);

  const addComment = (comment) => {
    setComments(prev => [...prev, comment]);
  };

  // Handle the close function to ensure proper cleanup
  const handleClose = () => {
    // Don't revoke the blob URL here - let the cleanup effect handle it
    // or let the parent component manage the lifecycle
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-background/50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-card dark:bg-card rounded-lg shadow-xl w-full max-w-7xl max-h-[95vh] sm:max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-muted dark:border-muted flex-shrink-0">
          <div className="min-w-0 flex-1">
            <h2 className="text-lg sm:text-xl font-semibold text-foreground dark:text-foreground truncate">Recording Preview</h2>
            <p className="text-xs sm:text-sm text-muted-foreground dark:text-muted-foreground mt-1 hidden sm:block">
              Use controls to navigate the recording
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-muted-foreground hover:text-foreground dark:hover:text-foreground rounded-full hover:bg-muted/10 dark:hover:bg-muted/20 transition-colors flex-shrink-0 ml-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden min-h-0">
          {/* Left Panel - 40% width */}
          <div className="w-2/5 flex-shrink-0">
            <RecorderLeftPanel
              consoleLogs={consoleLogs}
              networkLogs={networkLogs}
              detectedIssues={detectedIssues}
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
            <div className="flex-1 bg-background relative min-h-[200px] sm:min-h-[300px]">
              {previewUrl ? (
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
                      onClick={() => videoRef.current?.play()}
                      className="absolute inset-0 flex items-center justify-center cursor-pointer bg-background/20 backdrop-blur-sm"
                    >
                      <div className="bg-card/90 dark:bg-card/90 rounded-full p-4 sm:p-6 shadow-lg hover:bg-card dark:hover:bg-card transition-colors">
                        <svg className="w-8 h-8 sm:w-12 sm:h-12 text-foreground dark:text-foreground" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z"/>
                        </svg>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
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
                detectedIssues={detectedIssues}
                videoRef={videoRef}
              />
            </div>

            {/* Actions */}
            <div className="flex-shrink-0">
              <RecorderActions
                previewUrl={previewUrl}
                activeSuite={activeSuite}
                firestoreService={firestoreService}
                onClose={handleClose}
                recordingData={(() => {
                  const recordingDataObj = { 
                    duration: duration, 
                    consoleLogs: consoleLogs, 
                    networkLogs: networkLogs, 
                    comments: comments, 
                    detectedIssues: detectedIssues, 
                    blob: blob // Make sure to pass the blob
                  };
                  console.log('RecorderPreviewModal: Creating recordingData object:', {
                    hasBlob: !!recordingDataObj.blob,
                    blobSize: recordingDataObj.blob?.size,
                    duration: recordingDataObj.duration,
                    keys: Object.keys(recordingDataObj)
                  });
                  return recordingDataObj;
                })()}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecorderPreviewModal;