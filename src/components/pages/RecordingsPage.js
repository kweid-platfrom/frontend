'use client';
import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { 
  Video, 
  Play, 
  Trash2,
  Search,
  Grid,
  List,
  AlertCircle,
  Link2,
  CheckSquare,
  Square,
  Bug
} from 'lucide-react';
import EnhancedScreenRecorder from '../recorder/EnhancedScreenRecorder';
import ScreenRecorderButton from '../recorder/ScreenRecorderButton';
import { useRecordings } from '@/hooks/useRecording';
import Image from 'next/image';
import { useUI } from '@/hooks/useUI';

// Utility function to extract YouTube video ID
const getYouTubeVideoId = (url) => {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/ // Direct video ID
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
};

// Check if URL is a YouTube URL
const isYouTubeUrl = (url) => {
  if (!url) return false;
  return url.includes('youtube.com') || url.includes('youtu.be');
};

// Recording Card Component
const RecordingCard = ({ 
  recording, 
  viewMode, 
  onView, 
  onShare, 
  onDelete, 
  formatDuration,
  formatDate,
  isSelected,
  onToggleSelect
}) => {
  const [isHovering, setIsHovering] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [thumbnailError, setThumbnailError] = useState(false);
  const videoRef = useRef(null);
  const hoverTimerRef = useRef(null);
  
  // Extract YouTube video ID if available
  const youtubeVideoId = useMemo(() => 
    getYouTubeVideoId(recording.videoUrl), 
    [recording.videoUrl]
  );
  const isYouTubeVideo = isYouTubeUrl(recording.videoUrl);

  const handleMouseEnter = () => {
    setIsHovering(true);
    // Start playing after 5 seconds
    hoverTimerRef.current = setTimeout(() => {
      if (!isYouTubeVideo && videoRef.current && recording.videoUrl) {
        videoRef.current.play().catch(err => {
          console.log('Video play failed:', err);
        });
      }
      setIsPlaying(true);
    }, 5000);
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    // Clear timer and pause video
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
    }
    if (!isYouTubeVideo && videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
    setIsPlaying(false);
  };

  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current);
      }
    };
  }, []);

  if (viewMode === 'list') {
    return (
      <div 
        className={`flex items-center p-4 rounded-lg border transition-all ${
          isSelected 
            ? 'bg-teal-50 dark:bg-primary/20 border-primary dark:border-bg-primary/30 shadow-md' 
            : 'bg-card border-border hover:shadow-lg'
        }`}
      >
        {/* Checkbox - Always visible when selected */}
        <div 
          className={`mr-3 transition-opacity ${isSelected || isHovering ? 'opacity-100' : 'opacity-0'}`}
          onClick={(e) => {
            e.stopPropagation();
            onToggleSelect(recording.id);
          }}
        >
          <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
            {isSelected ? (
              <CheckSquare className="w-5 h-5 text-primary dark:text-primary" />
            ) : (
              <Square className="w-5 h-5 text-gray-400" />
            )}
          </button>
        </div>

        <div className="w-16 h-12 bg-muted rounded flex items-center justify-center mr-4 overflow-hidden flex-shrink-0">
          {isYouTubeVideo && youtubeVideoId ? (
            <Image
              src={`https://img.youtube.com/vi/${youtubeVideoId}/default.jpg`}
              alt="Video thumbnail"
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextElementSibling.style.display = 'flex';
              }}
            />
          ) : null}
          <div className={`w-full h-full flex items-center justify-center ${isYouTubeVideo && youtubeVideoId ? 'hidden' : ''}`}>
            <Video className="w-6 h-6 text-muted-foreground" />
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h3 className="font-medium text-foreground truncate">
                {recording.title || 'Untitled Recording'}
              </h3>
              <div className="text-sm text-muted-foreground">
                {formatDate(recording.created_at)} • {formatDuration(recording.duration)}
              </div>
            </div>
            <div className="flex items-center space-x-2 flex-shrink-0">
              {recording.detectedIssues?.length > 0 && (
                <div className="flex items-center space-x-1 text-red-600 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded text-sm">
                  <Bug className="w-3 h-3" />
                  <span>{recording.detectedIssues.length}</span>
                </div>
              )}
              <button
                onClick={() => onView(recording)}
                className="px-3 py-1 text-primary hover:bg-blue-50 dark:hover:bg-primary/20 rounded text-sm"
              >
                View
              </button>
              <button
                onClick={() => onShare(recording)}
                className="p-1.5 text-muted-foreground hover:bg-muted rounded"
              >
                <Link2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDelete(recording.id)}
                className="p-1.5 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Grid view - Two row card
  return (
    <div 
      className={`rounded-lg border overflow-hidden transition-all duration-300 ${
        isSelected 
          ? 'bg-teal-50 dark:bg-primary/20 border-primary dark:border-primary shadow-xl ring-1 ring-primary/50' 
          : 'bg-card border-border hover:shadow-xl'
      }`}
    >
      {/* First Row - Video Preview */}
      <div 
        className="relative aspect-video bg-muted cursor-pointer group"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={() => onView(recording)}
      >
        {isYouTubeVideo && youtubeVideoId ? (
          <>
            {/* YouTube Thumbnail (shown when not playing) */}
            {!isPlaying && (
              <>
                <img
                  src={`https://img.youtube.com/vi/${youtubeVideoId}/maxresdefault.jpg`}
                  alt="Video thumbnail"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Try different thumbnail qualities in order
                    if (e.target.src.includes('maxresdefault')) {
                      e.target.src = `https://img.youtube.com/vi/${youtubeVideoId}/sddefault.jpg`;
                    } else if (e.target.src.includes('sddefault')) {
                      e.target.src = `https://img.youtube.com/vi/${youtubeVideoId}/hqdefault.jpg`;
                    } else if (e.target.src.includes('hqdefault')) {
                      e.target.src = `https://img.youtube.com/vi/${youtubeVideoId}/mqdefault.jpg`;
                    } else {
                      setThumbnailError(true);
                    }
                  }}
                  style={{ display: thumbnailError ? 'none' : 'block' }}
                />
                {thumbnailError && (
                  <div className="absolute inset-0 flex items-center justify-center bg-muted">
                    <div className="text-center">
                      <Video className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">Processing video...</p>
                    </div>
                  </div>
                )}
              </>
            )}
            
            {/* YouTube Embed (shown when playing) */}
            {isPlaying && (
              <iframe
                src={`https://www.youtube.com/embed/${youtubeVideoId}?autoplay=1&mute=1&controls=1&modestbranding=1`}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            )}
          </>
        ) : recording.videoUrl ? (
          <video
            ref={videoRef}
            src={recording.videoUrl}
            className="w-full h-full object-cover"
            muted
            loop
            playsInline
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Play className="w-12 h-12 text-muted-foreground" />
          </div>
        )}
        
        {/* Overlay for non-playing state */}
        {!isPlaying && (
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center group-hover:bg-black/30 transition-colors">
            <Play className="w-12 h-12 text-white/80" />
          </div>
        )}

        {/* Select checkbox - Top Left (always visible when selected or hovering) */}
        <div 
          className={`absolute top-3 left-3 transition-opacity duration-200 ${
            isSelected || isHovering ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={(e) => {
            e.stopPropagation();
            onToggleSelect(recording.id);
          }}
        >
          <button className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm p-1.5 rounded hover:bg-white dark:hover:bg-gray-700 transition-colors shadow-lg">
            {isSelected ? (
              <CheckSquare className="w-5 h-5 text-primary dark:text-primary" />
            ) : (
              <Square className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            )}
          </button>
        </div>

        {/* Copy Link Button - Top Right (visible on hover) */}
        <div 
          className={`absolute top-3 right-3 transition-opacity duration-200 ${
            isHovering ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={(e) => {
            e.stopPropagation();
            onShare(recording);
          }}
        >
          <button className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm p-1.5 rounded hover:bg-white dark:hover:bg-gray-700 transition-colors shadow-lg">
            <Link2 className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </button>
        </div>

        {/* Duration - Bottom Left (glassy background) */}
        <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm text-white text-xs font-medium px-2.5 py-1 rounded">
          {formatDuration(recording.duration)}
        </div>

        {/* Issues Badge - Bottom Right */}
        {recording.detectedIssues?.length > 0 && (
          <div className="absolute bottom-3 right-3 bg-red-600/90 backdrop-blur-sm text-white text-xs font-medium px-2 py-1 rounded flex items-center space-x-1">
            <Bug className="w-3 h-3" />
            <span>{recording.detectedIssues.length}</span>
          </div>
        )}
      </div>

      {/* Second Row - Info */}
      <div className="p-4">
        {/* Console Stats and Delete Icon */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-4 text-xs text-muted-foreground">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-primary rounded-full"></div>
              <span>{recording.consoleLogs?.length || 0} logs</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>{recording.networkLogs?.length || 0} requests</span>
            </div>
          </div>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(recording.id);
            }}
            className="p-1.5 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Date */}
        <div className="text-xs text-muted-foreground mb-2">
          {formatDate(recording.created_at)}
        </div>

        {/* Title */}
        <h3 className="font-medium text-foreground text-sm line-clamp-2">
          {recording.title || 'Untitled Recording'}
        </h3>
      </div>
    </div>
  );
};

const Recordings = () => {
  // Get data from hooks
  const recordingsHook = useRecordings();
  const uiHook = useUI();

  const [viewingRecording, setViewingRecording] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [selectedRecordings, setSelectedRecordings] = useState([]);

  const recordings = recordingsHook.recordings || [];
  const activeSuite = recordingsHook.activeSuite;
  const isLoading = recordingsHook.loading;
  const isTrialActive = recordingsHook.isTrialActive;

  const hasActiveSuite = activeSuite?.id;
  const isSubscriptionActive = isTrialActive;

  // Filter recordings
  const filteredRecordings = useMemo(() => {
    return recordings.filter(recording => {
      const matchesSearch = recording.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           recording.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filterStatus === 'all' || recording.status === filterStatus;
      return matchesSearch && matchesFilter;
    });
  }, [recordings, searchTerm, filterStatus]);

  const handleViewRecording = useCallback((recording) => {
    setViewingRecording(recording);
  }, []);

  const handleDeleteRecording = useCallback(async (recordingId) => {
    if (!hasActiveSuite) return;
    if (!confirm('Are you sure you want to delete this recording? This action cannot be undone.')) {
      return;
    }
    try {
      await recordingsHook.deleteRecording(recordingId);
      // Remove from selected if it was selected
      setSelectedRecordings(prev => prev.filter(id => id !== recordingId));
      uiHook.addNotification?.({
        type: 'success',
        title: 'Success',
        message: 'Recording deleted successfully',
      });
    } catch (err) {
      console.error('Error deleting recording:', err);
      uiHook.addNotification?.({
        type: 'error',
        title: 'Error',
        message: `Failed to delete recording: ${err.message}`,
      });
    }
  }, [hasActiveSuite, recordingsHook.deleteRecording, uiHook.addNotification]);

  const handleShareRecording = useCallback((recording) => {
    const shareUrl = `${window.location.origin}/recordings/${recording.id}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      uiHook.addNotification?.({
        type: 'success',
        title: 'Link Copied',
        message: 'Recording link copied to clipboard!',
      });
    }).catch(() => {
      uiHook.addNotification?.({
        type: 'error',
        title: 'Error',
        message: `Failed to copy link. URL: ${shareUrl}`,
      });
    });
  }, [uiHook.addNotification]);

  const handleToggleSelect = useCallback((recordingId) => {
    setSelectedRecordings(prev => {
      if (prev.includes(recordingId)) {
        return prev.filter(id => id !== recordingId);
      } else {
        return [...prev, recordingId];
      }
    });
  }, []);

  const formatDuration = (duration) => {
    if (typeof duration === 'string') return duration;
    if (typeof duration === 'number') {
      const minutes = Math.floor(duration / 60);
      const seconds = Math.floor(duration % 60);
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    return '0:00';
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString();
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-foreground">Loading recordings...</p>
        </div>
      </div>
    );
  }

  // Subscription check
  if (!isSubscriptionActive) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-foreground">Recordings</h1>
          </div>
          <div className="bg-card shadow-theme-md rounded-lg p-6">
            <div className="flex items-center text-red-600">
              <AlertCircle className="w-12 h-12 mr-4 opacity-50" />
              <div>
                <div className="text-lg font-medium mb-2">Subscription Required</div>
                <div className="text-sm">Your subscription is not active. Please upgrade to access recordings.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // No active suite
  if (!hasActiveSuite) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-foreground">Recordings</h1>
          </div>
          <div className="bg-card shadow-theme-md rounded-lg p-6">
            <div className="flex items-center text-muted-foreground">
              <AlertCircle className="w-12 h-12 mr-4 opacity-50" />
              <div>
                <div className="text-lg font-medium mb-2">No Suite Selected</div>
                <div className="text-sm">Please select a test suite to view recordings</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-full mx-auto py-6 sm:px-6 lg:px-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center">
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">Recordings</h1>
            <span className="ml-2 px-2 py-1 bg-muted rounded-full text-xs font-normal text-muted-foreground">
              {filteredRecordings.length} {filteredRecordings.length === 1 ? 'recording' : 'recordings'}
            </span>
            {selectedRecordings.length > 0 && (
              <span className="ml-2 px-2 py-1 bg-teal-100 dark:bg-primary/30 text-primary dark:text-primary/80 rounded-full text-xs font-medium">
                {selectedRecordings.length} selected
              </span>
            )}
          </div>
          <ScreenRecorderButton
            variant="contained"
            isPrimary={true}
          />
        </div>
        
        <div className="flex items-center justify-between mb-6 bg-card p-4 rounded-lg border border-border shadow-sm">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <input
                type="text"
                placeholder="Search recordings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
              />
            </div>
            <div className="relative">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="appearance-none px-4 py-2 pr-8 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded transition-colors ${
                viewMode === 'grid' 
                  ? 'bg-teal-100 text-primary dark:bg-primary/30 dark:text-primary' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded transition-colors ${
                viewMode === 'list' 
                  ? 'bg-teal-100 text-primary dark:bg-primary/30 dark:text-primary' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        <div className="bg-card rounded-lg border border-border shadow-sm min-h-96">
          {filteredRecordings.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center text-muted-foreground">
                <Video className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <div className="text-lg font-medium mb-2">No recordings found</div>
                {searchTerm || filterStatus !== 'all' ? (
                  <div className="text-sm">Try adjusting your search or filter</div>
                ) : (
                  <div className="text-sm">Create your first recording to get started</div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-6">
              <div className={viewMode === 'grid' 
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" 
                : "space-y-4"
              }>
                {filteredRecordings.map((recording) => (
                  <RecordingCard
                    key={recording.id}
                    recording={recording}
                    viewMode={viewMode}
                    onView={handleViewRecording}
                    onShare={handleShareRecording}
                    onDelete={handleDeleteRecording}
                    formatDuration={formatDuration}
                    formatDate={formatDate}
                    isSelected={selectedRecordings.includes(recording.id)}
                    onToggleSelect={handleToggleSelect}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {viewingRecording && (
        <EnhancedScreenRecorder
          mode="viewer"
          activeSuite={activeSuite}
          existingRecording={viewingRecording}
          onClose={() => setViewingRecording(null)}
        />
      )}
    </div>
  );
};

export default Recordings;