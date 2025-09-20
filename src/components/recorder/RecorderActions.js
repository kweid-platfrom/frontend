'use client';

import React, { useState } from 'react';
import { Link, Save } from 'lucide-react';

const RecorderActions = ({ previewUrl, activeSuite, firestoreService, onClose, recordingData }) => {
  const [saving, setSaving] = useState(false);
  const [shareLink, setShareLink] = useState(null);

  const generateShareLink = () => {
    if (shareLink) {
      return shareLink;
    }

    // Generate a shareable link even without saving
    if (previewUrl) {
      const temporaryShareLink = `${window.location.origin}/recordings/preview/${Date.now()}`;
      setShareLink(temporaryShareLink);
      return temporaryShareLink;
    }

    return null;
  };

  const copyShareLink = () => {
    const linkToShare = generateShareLink();
    if (linkToShare) {
      navigator.clipboard.writeText(linkToShare).then(() => {
        alert('Recording link copied to clipboard!');
      }).catch(() => {
        alert(`Failed to copy link. URL: ${linkToShare}`);
      });
    } else {
      alert('No recording available to share.');
    }
  };

  // Get actual duration from video blob
  const getVideoDuration = async (url) => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      
      video.onloadedmetadata = () => {
        const duration = video.duration;
        URL.revokeObjectURL(video.src);
        resolve(isFinite(duration) ? duration : 0);
      };
      
      video.onerror = () => {
        URL.revokeObjectURL(video.src);
        resolve(0);
      };
      
      video.src = url;
    });
  };

  // Format duration properly
  const formatDuration = (seconds) => {
    if (!isFinite(seconds) || seconds < 0) return "0:00";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const saveRecording = async () => {
    if (!previewUrl) {
      alert('No recording to save.');
      return;
    }
    if (!activeSuite?.id) {
      alert('Please select a test suite first.');
      return;
    }

    setSaving(true);
    try {
      // Get actual video duration from the blob
      const actualDuration = await getVideoDuration(previewUrl);
      const formattedDuration = formatDuration(actualDuration);
      
      console.log('Video duration:', actualDuration, 'formatted:', formattedDuration);

      // Get the blob from the preview URL
      const response = await fetch(previewUrl);
      const blob = await response.blob();

      console.log('Blob details:', {
        size: blob.size,
        type: blob.type,
        duration: actualDuration
      });

      // Import and use the recording service
      const recordingService = (await import('../../services/recordingService')).default;

      // Check service status
      console.log('Checking YouTube service status...');
      const serviceStatus = await recordingService.getServiceStatus();
      console.log('Service Status:', serviceStatus);
      
      if (!serviceStatus.youtube.available) {
        throw new Error('YouTube service is not available. Please check API credentials.');
      }

      // Validate the video blob
      const validation = await recordingService.validateVideoBlob(blob);
      if (!validation.valid) {
        throw new Error(`Invalid video: ${validation.errors.join(', ')}`);
      }

      console.log('Video validation passed:', validation);

      // Upload to YouTube with enhanced metadata
      const uploadResult = await recordingService.uploadToYouTubeWithRetry(
        blob,
        {
          title: `${activeSuite.name} - ${new Date().toLocaleDateString()}`,
          description: `Screen recording for test suite: ${activeSuite.name}\n\nDuration: ${formattedDuration}\nCaptured Issues: ${recordingData.detectedIssues?.length || 0}\nConsole Logs: ${recordingData.consoleLogs?.length || 0}\nNetwork Errors: ${recordingData.networkLogs?.length || 0}`,
          tags: ['qa-testing', 'screen-recording', activeSuite.name.replace(/\s+/g, '-').toLowerCase()],
          privacy: 'private',
          suiteId: activeSuite.id,
          suiteName: activeSuite.name,
          duration: actualDuration
        },
        (progress) => {
          console.log(`Upload progress: ${progress}%`);
        }
      );

      if (!uploadResult.success) {
        throw new Error(uploadResult.error?.message || 'Failed to upload video to YouTube');
      }

      console.log('YouTube upload successful:', uploadResult.data);

      // Prepare enhanced data for Firestore using your existing service structure
      const recordingDataToSave = {
        // Basic info
        title: `${activeSuite.name} - ${new Date().toLocaleDateString()}`,
        description: `Screen recording with ${recordingData.detectedIssues?.length || 0} detected issues`,
        duration: formattedDuration,
        durationSeconds: actualDuration,

        // YouTube video information
        youtubeId: uploadResult.data.videoId,
        videoUrl: uploadResult.data.url,
        embedUrl: uploadResult.data.embedUrl,
        thumbnailUrl: uploadResult.data.thumbnailUrl,
        privacyStatus: uploadResult.data.privacyStatus || 'private',
        playlistId: uploadResult.data.playlistId,
        playlistUrl: uploadResult.data.playlistUrl,

        // Recording analysis data
        consoleLogs: recordingData.consoleLogs || [],
        networkLogs: recordingData.networkLogs || [],
        detectedIssues: recordingData.detectedIssues || [],
        comments: recordingData.comments || [],

        // Metadata matching your existing schema
        platform: navigator.userAgent,
        suiteId: activeSuite.id,
        suiteName: activeSuite.name,
        status: 'active',
        recordedAt: new Date(),
        uploadedAt: uploadResult.data.uploadedAt,
        provider: 'youtube',

        // Video file info
        fileSize: blob.size,
        fileType: blob.type,
        
        // Analytics
        issueCount: recordingData.detectedIssues?.length || 0,
        consoleErrorCount: recordingData.consoleLogs?.filter(log => log.level === 'error').length || 0,
        networkErrorCount: recordingData.networkLogs?.length || 0
      };

      console.log('Saving to Firestore using existing service:', recordingDataToSave);

      // Use your existing Firestore service structure
      // Check if firestoreService has the right method based on your implementation
      let firestoreResult;
      if (typeof firestoreService.createRecording === 'function') {
        // Direct method if available
        firestoreResult = await firestoreService.createRecording(activeSuite.id, recordingDataToSave);
      } else if (typeof firestoreService.recordings?.create === 'function') {
        // Nested service structure
        firestoreResult = await firestoreService.recordings.create(activeSuite.id, recordingDataToSave);
      } else {
        // Generic asset creation method (based on your AssetService pattern)
        const FirestoreService = (await import('../../services')).default;
        firestoreResult = await FirestoreService.createRecording(activeSuite.id, recordingDataToSave);
      }

      if (firestoreResult.success) {
        const permanentShareLink = uploadResult.data.url;
        setShareLink(permanentShareLink);
        
        console.log('Recording saved successfully:', {
          firestoreId: firestoreResult.data?.id,
          youtubeId: uploadResult.data.videoId,
          playlistId: uploadResult.data.playlistId
        });
        
        alert(`Recording saved successfully! 
        
Video ID: ${uploadResult.data.videoId}
Duration: ${formattedDuration}
${uploadResult.data.playlistId ? `Added to playlist: ${uploadResult.data.playlistId}` : ''}
        
The recording has been saved to your test suite.`);
        
        setTimeout(() => onClose(), 1500);
      } else {
        // If Firestore save fails, clean up the YouTube video
        console.error('Failed to save recording metadata to Firestore:', firestoreResult.error);
        
        // Attempt to delete the YouTube video since metadata save failed
        try {
          await recordingService.deleteRecording({ 
            youtubeId: uploadResult.data.videoId,
            playlistId: uploadResult.data.playlistId
          });
          console.log('Cleaned up YouTube video due to Firestore failure');
        } catch (cleanupError) {
          console.error('Failed to cleanup YouTube video:', cleanupError);
        }
        
        throw new Error(`Failed to save recording to database: ${firestoreResult.error?.message || 'Unknown database error'}`);
      }
    } catch (err) {
      console.error('Failed to save recording:', err);
      alert(`Failed to save recording: ${err.message}

Please check:
1. YouTube API credentials are configured
2. Internet connection is stable  
3. Video file is valid and not corrupted
4. Database connection is working

Error details: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
      <div className="text-sm text-gray-600 dark:text-gray-400">
        {saving ? 'Saving to YouTube and database...' : 
         shareLink ? 'Recording link ready to share' : 
         'Click share to generate link'}
      </div>
      <div className="flex space-x-2">
        <button
          onClick={copyShareLink}
          disabled={saving}
          className="flex items-center space-x-2 px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 disabled:opacity-50 transition-colors"
          title="Generate and copy shareable link"
        >
          <Link className="w-4 h-4" />
          <span>Share</span>
        </button>
        <button
          onClick={saveRecording}
          disabled={saving || !previewUrl}
          className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 disabled:opacity-50 transition-colors"
          title="Save recording to YouTube and database"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving...' : 'Save'}</span>
        </button>
      </div>
    </div>
  );
};

export default RecorderActions;