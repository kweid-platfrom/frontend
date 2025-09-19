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
  existingRecording,
  previewUrl,
  duration,
  consoleLogs = [],
  networkLogs = [],
  detectedIssues = [],
  comments: initialComments = []
}) => {
  const videoRef = useRef(null);
  const [playerOverlayHidden, setPlayerOverlayHidden] = useState(false);
  const [comments, setComments] = useState(initialComments);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onPlay = () => setPlayerOverlayHidden(true);
    const onPause = () => setPlayerOverlayHidden(false);
    const onEnded = () => setPlayerOverlayHidden(false);

    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("ended", onEnded);

    return () => {
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("ended", onEnded);
    };
  }, [previewUrl]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (!videoRef.current) return;
      
      switch (e.key) {
        case ' ':
          e.preventDefault();
          if (videoRef.current.paused) {
            videoRef.current.play();
          } else {
            videoRef.current.pause();
          }
          break;
        case 'ArrowLeft':
          e.preventDefault();
          videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10);
          break;
        case 'ArrowRight':
          e.preventDefault();
          videoRef.current.currentTime = Math.min(videoRef.current.duration, videoRef.current.currentTime + 10);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, []);

  const addComment = (comment) => {
    setComments(prev => [...prev, comment]);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-7xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Recording Preview</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Use spacebar to play/pause, arrow keys to seek ±10s
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 flex overflow-hidden">
          <RecorderLeftPanel
            consoleLogs={consoleLogs}
            networkLogs={networkLogs}
            detectedIssues={detectedIssues}
            comments={comments}
            onAddComment={addComment}
            videoRef={videoRef}
            activeSuite={activeSuite}
            firestoreService={firestoreService}
          />
          <div className="flex-1 flex flex-col min-w-0">
            <div className="flex-1 bg-black relative">
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
                      className="absolute inset-0 flex items-center justify-center cursor-pointer bg-black/20 backdrop-blur-sm"
                    >
                      <div className="bg-white/90 dark:bg-gray-800/90 rounded-full p-6 shadow-lg hover:bg-white dark:hover:bg-gray-800 transition-colors">
                        <svg className="w-12 h-12 text-gray-800 dark:text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z"/>
                        </svg>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <div className="text-6xl mb-4">🎥</div>
                    <div className="text-lg">No recording available</div>
                    <div className="text-sm mt-2">The recording preview could not be loaded</div>
                  </div>
                </div>
              )}
            </div>
            <RecorderTimeline
              duration={duration}
              detectedIssues={detectedIssues}
              videoRef={videoRef}
            />
            <RecorderActions
              previewUrl={previewUrl}
              activeSuite={activeSuite}
              firestoreService={firestoreService}
              onClose={onClose}
              recordingData={{ duration, consoleLogs, networkLogs, comments, detectedIssues }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecorderPreviewModal;