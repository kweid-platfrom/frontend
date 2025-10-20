'use client'

// components/viewer/RecordingViewerModal.jsx
import React, { useRef, useState, useMemo } from 'react';
import { X, Share2, Download } from 'lucide-react';
import RecordingViewerLeftPanel from '../viewer/RecordingViewerLeftPanel';
import RecorderTimeline from '../recorder/RecorderTimeline';
import CustomVideoPlayer from '../viewer/CustomVideoPlayer';

const RecordingViewerModal = ({
  recording,
  onClose
}) => {
  const videoRef = useRef(null);
  const [currentTime, setCurrentTime] = useState(0);

  const isYouTubeVideo = useMemo(() => {
    if (!recording?.videoUrl) return false;
    return recording.videoUrl.includes('youtube.com') || recording.videoUrl.includes('youtu.be');
  }, [recording?.videoUrl]);

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

  const handleTimeUpdate = (time) => {
    setCurrentTime(time);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4 md:p-6 lg:p-8">
      <div className="bg-white dark:bg-gray-900 rounded-lg sm:rounded-xl md:rounded-2xl shadow-2xl w-full h-full sm:w-[95vw] sm:h-[95vh] md:w-[90vw] md:h-[90vh] lg:w-[85vw] lg:h-[85vh] xl:w-[80vw] xl:h-[80vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0 bg-white dark:bg-gray-900">
          <div className="flex-1 min-w-0 mr-2 sm:mr-4">
            <h2 className="text-sm sm:text-base md:text-lg lg:text-xl font-semibold text-gray-900 dark:text-white truncate">
              {recording?.title || 'Recording Viewer'}
            </h2>
            {recording?.created_at && (
              <p className="text-[10px] sm:text-xs md:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                {new Date(recording.created_at.toDate ? recording.created_at.toDate() : recording.created_at).toLocaleDateString()}
              </p>
            )}
          </div>
          <div className="flex items-center gap-0.5 sm:gap-1 md:gap-2">
            <button
              onClick={handleShare}
              className="p-1.5 sm:p-2 text-gray-500 hover:text-teal-600 dark:text-gray-400 dark:hover:text-teal-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title="Share recording"
            >
              <Share2 className="w-4 h-4 sm:w-4 sm:h-4 md:w-5 md:h-5" />
            </button>
            {recording?.videoUrl && !isYouTubeVideo && (
              <button
                onClick={handleDownload}
                className="p-1.5 sm:p-2 text-gray-500 hover:text-teal-600 dark:text-gray-400 dark:hover:text-teal-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                title="Download recording"
              >
                <Download className="w-4 h-4 sm:w-4 sm:h-4 md:w-5 md:h-5" />
              </button>
            )}
            {onClose && (
              <button
                onClick={onClose}
                className="p-1.5 sm:p-2 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                title="Close viewer"
              >
                <X className="w-4 h-4 sm:w-4 sm:h-4 md:w-5 md:h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden min-h-0">

          {/* Right Panel - Video & Timeline (First on mobile) */}
          <div className="flex-none lg:flex-1 flex flex-col min-w-0 bg-gray-50 dark:bg-gray-950 lg:order-2 min-h-screen lg:min-h-0">

            {/* Video Player Container */}
            <div className="flex-1 p-2 sm:p-3 md:p-4 lg:p-6 flex items-center justify-center min-h-[50vh] lg:min-h-0">
              <div className="w-full h-full max-w-full max-h-full bg-black relative rounded-lg sm:rounded-xl overflow-hidden shadow-2xl">
                {recording?.videoUrl ? (
                  <CustomVideoPlayer
                    videoUrl={recording.videoUrl}
                    isYouTube={isYouTubeVideo}
                    onTimeUpdate={handleTimeUpdate}
                    className="w-full h-full"
                  />
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-400 dark:text-gray-600">
                    <div className="text-center p-4 sm:p-6">
                      <div className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl mb-3 sm:mb-4">🎥</div>
                      <div className="text-sm sm:text-base md:text-lg font-medium">No video available</div>
                      <div className="text-[10px] sm:text-xs md:text-sm text-gray-500 dark:text-gray-500 mt-1 sm:mt-2">
                        This recording doesn&apos;t have a video file
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Timeline Container */}
            <div className="flex-shrink-0 p-2 sm:p-3 md:p-4 lg:p-6 pt-0 lg:pt-0">
              <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                <RecorderTimeline
                  duration={recording?.duration || 0}
                  detectedIssues={recording?.detectedIssues || []}
                  videoRef={videoRef}
                  enableTrimming={false}
                />
              </div>
            </div>
          </div>

          {/* Left Panel - Metadata & Info (Second on mobile, scrollable) */}
          <div className="w-full lg:w-2/5 xl:w-1/3 flex-shrink-0 border-t lg:border-t-0 lg:border-r border-gray-200 dark:border-gray-700 lg:order-1 min-h-screen lg:min-h-0 lg:overflow-hidden">
            <RecordingViewerLeftPanel
              recording={recording}
              videoRef={videoRef}
              currentTime={currentTime}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecordingViewerModal;