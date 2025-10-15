'use client';

import React, { useState } from 'react';
import { Link, Save } from 'lucide-react';
import { toast } from 'sonner';

const RecorderActions = ({ 
  previewUrl, 
  activeSuite, 
  firestoreService, 
  onClose, 
  recordingData,
  hasTitle
}) => {
  const [saving, setSaving] = useState(false);
  const [shareLink, setShareLink] = useState(null);

  const generateShareLink = () => {
    if (shareLink) {
      return shareLink;
    }

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
        toast.success('Recording link copied to clipboard!');
      }).catch(() => {
        toast.error(`Failed to copy link. URL: ${linkToShare}`);
      });
    } else {
      toast.error('No recording available to share.');
    }
  };

  // FIXED: Return '0:00' as default instead of '0:30'
  const formatDuration = (seconds) => {
    if (!isFinite(seconds) || seconds < 0 || isNaN(seconds)) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Helper function to get video duration from blob
  const getVideoDuration = (blob) => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      
      video.onloadedmetadata = () => {
        const duration = video.duration;
        URL.revokeObjectURL(video.src);
        if (isFinite(duration) && duration > 0) {
          resolve(duration);
        } else {
          reject(new Error('Invalid duration'));
        }
      };
      
      video.onerror = () => {
        URL.revokeObjectURL(video.src);
        reject(new Error('Failed to load video metadata'));
      };
      
      video.src = URL.createObjectURL(blob);
    });
  };

  const saveRecording = async () => {
    console.log('=== RECORDING SAVE PROCESS START ===');
    console.log('saveRecording called with recordingData:', {
      hasRecordingData: !!recordingData,
      recordingDataKeys: recordingData ? Object.keys(recordingData) : [],
      title: recordingData?.title,
      hasBlob: !!recordingData?.blob,
      blobSize: recordingData?.blob?.size,
      duration: recordingData?.duration,
      hasPreviewUrl: !!previewUrl,
      activeSuiteId: activeSuite?.id,
      activeSuiteName: activeSuite?.name
    });

    // FIXED: Validate title is provided and not empty
    if (!recordingData?.title || !recordingData.title.trim()) {
      toast.error('Please enter a title for your recording', {
        description: 'A title is required before saving'
      });
      return;
    }

    if (!recordingData?.blob && !previewUrl) {
      toast.error('No recording to save.');
      return;
    }
    if (!activeSuite?.id) {
      toast.error('Please select a test suite first.');
      return;
    }

    setSaving(true);

    try {
      let blob = recordingData?.blob;
      let actualDuration = recordingData?.duration;

      // If no blob, fetch from preview URL
      if (!blob && previewUrl) {
        console.log('Fetching blob from preview URL...');
        const response = await fetch(previewUrl);
        if (!response.ok) throw new Error(`Failed to fetch blob: ${response.statusText}`);
        blob = await response.blob();
      }
      if (!blob) throw new Error('No recording data available');

      // FIXED: Better duration handling
      if (typeof actualDuration === 'string') {
        // Parse formatted time string (e.g., "2:30")
        const parts = actualDuration.split(':');
        if (parts.length === 2) {
          const minutes = parseInt(parts[0], 10);
          const seconds = parseInt(parts[1], 10);
          actualDuration = minutes * 60 + seconds;
        } else {
          // Try to parse as number
          const parsed = parseFloat(actualDuration);
          actualDuration = !isNaN(parsed) && isFinite(parsed) ? parsed : 0;
        }
      }

      // FIXED: If duration is still invalid, try to get it from the blob
      if (!isFinite(actualDuration) || actualDuration <= 0 || isNaN(actualDuration)) {
        console.warn('Invalid duration detected, attempting to calculate from blob...');
        
        if (blob) {
          try {
            actualDuration = await getVideoDuration(blob);
            console.log('✅ Calculated duration from blob:', actualDuration);
          } catch (err) {
            console.warn('⚠️ Could not calculate duration from blob:', err);
            actualDuration = 0; // FIXED: Default to 0 instead of 30
          }
        } else {
          actualDuration = 0; // FIXED: Default to 0 instead of 30
        }
      }

      console.log('Final duration:', actualDuration, 'seconds');

      const formattedDuration = formatDuration(actualDuration);

      // FIXED: Always use the user-provided title
      const recordingTitle = recordingData.title.trim();

      console.log('🎬 Using title:', recordingTitle);

      // STEP 1: Upload to YouTube first
      console.log('=== STEP 1: YOUTUBE UPLOAD ===');
      const recordingService = (await import('../../services/recordingService')).default;

      const uploadResult = await recordingService.uploadToYouTubeWithRetry(
        blob,
        {
          title: recordingTitle,
          description: `Screen recording for test suite: ${activeSuite.name}\n\nDuration: ${formattedDuration}\n\nCaptured Data:\n- Console Logs: ${recordingData.consoleLogs?.length || 0}\n- Network Requests: ${recordingData.networkLogs?.length || 0}\n- Issues Detected: ${recordingData.detectedIssues?.length || 0}`,
          tags: ['qa-testing', 'screen-recording', activeSuite.name.replace(/\s+/g, '-').toLowerCase()],
          privacy: 'unlisted', // FIXED: Lowercase
          suiteId: activeSuite.id,
          suiteName: activeSuite.name,
          duration: actualDuration
        },
        (progress) => {
          console.log(`📊 Upload progress: ${progress}%`);
        },
        2 // maxRetries
      );

      if (!uploadResult.success) {
        throw new Error(uploadResult.error?.message || 'Failed to upload video');
      }

      console.log('✅ YouTube upload successful:', uploadResult.data);

      // STEP 2: Prepare CORRECT data structure for Firestore
      console.log('=== STEP 2: PREPARE FIRESTORE DATA ===');

      const recordingDataToSave = {
        suite_id: activeSuite.id,
        title: recordingTitle,
        description: `Screen recording with ${recordingData.detectedIssues?.length || 0} detected issues`,
        
        // FIXED: Save both formatted and numeric duration
        duration: formattedDuration,
        durationSeconds: actualDuration,

        // YouTube/Provider fields
        youtubeId: uploadResult.data.youtubeId || uploadResult.data.videoId,
        videoId: uploadResult.data.videoId || uploadResult.data.youtubeId,
        videoUrl: uploadResult.data.url || uploadResult.data.videoUrl,
        url: uploadResult.data.videoUrl || uploadResult.data.url,
        embedUrl: uploadResult.data.embedUrl,
        thumbnailUrl: uploadResult.data.thumbnailUrl,
        privacyStatus: uploadResult.data.privacyStatus || 'unlisted',
        provider: 'youtube',

        // File information
        filename: `recording_${Date.now()}.webm`,
        size: blob.size,

        // Session data
        consoleLogs: recordingData.consoleLogs || [],
        networkLogs: recordingData.networkLogs || [],
        detectedIssues: recordingData.detectedIssues || [],
        comments: recordingData.comments || [],

        platform: navigator.userAgent,
        status: 'active',

        metadata: {
          recordingStartTime: new Date().toISOString(),
          recordingEndTime: new Date().toISOString(),
          browserInfo: {
            userAgent: navigator.userAgent,
            viewport: {
              width: window.innerWidth || 1920,
              height: window.innerHeight || 1080
            }
          },
          uploadInfo: {
            uploadedAt: new Date().toISOString(),
            provider: 'youtube',
            originalFilename: `recording_${Date.now()}.webm`,
            fileSize: blob.size
          },
          statistics: {
            totalLogs: (recordingData.consoleLogs?.length || 0) + (recordingData.networkLogs?.length || 0),
            issuesDetected: recordingData.detectedIssues?.length || 0,
            commentsCount: recordingData.comments?.length || 0
          }
        }
      };

      console.log('Final recording data structure:', {
        title: recordingDataToSave.title,
        duration: recordingDataToSave.duration,
        durationSeconds: recordingDataToSave.durationSeconds,
        hasSuiteId: !!recordingDataToSave.suite_id,
        hasYouTubeId: !!recordingDataToSave.youtubeId
      });

      // STEP 3: Save to Firestore
      console.log('=== STEP 3: FIRESTORE SAVE ===');

      const firestoreResult = await firestoreService.recordings.createRecording(
        activeSuite.id,
        recordingDataToSave,
        null
      );

      console.log('Firestore operation result:', firestoreResult);

      if (!firestoreResult || typeof firestoreResult !== 'object') {
        throw new Error('Invalid result from Firestore service');
      }

      // STEP 4: Handle the result
      console.log('=== STEP 4: HANDLE RESULT ===');

      if (firestoreResult.success) {
        console.log('✅ Recording saved successfully:', firestoreResult.data?.id);

        toast.success('Recording saved successfully!', {
          description: `"${recordingTitle}" (${formattedDuration}) saved with ${recordingDataToSave.consoleLogs.length} logs`,
          action: {
            label: 'View',
            onClick: () => window.open(uploadResult.data.url, '_blank')
          }
        });

        setTimeout(() => {
          if (onClose) {
            onClose(true);
          }
        }, 1500);
      } else {
        console.error('❌ Firestore save failed:', firestoreResult.error);

        // Try to cleanup YouTube video
        try {
          await recordingService.deleteRecording({
            youtubeId: uploadResult.data.youtubeId || uploadResult.data.videoId,
            videoId: uploadResult.data.videoId || uploadResult.data.youtubeId
          });
        } catch (cleanupError) {
          console.warn('⚠️ Failed to cleanup YouTube video:', cleanupError);
        }

        throw new Error(firestoreResult.error?.message || 'Firestore save failed');
      }
    } catch (err) {
      console.error('❌ Complete save operation failed:', err);

      toast.error('Failed to save recording', {
        description: err.message,
      });
    } finally {
      setSaving(false);
      console.log('=== RECORDING SAVE PROCESS END ===');
    }
  };

  const canSave = !saving && (previewUrl || recordingData?.blob) && hasTitle;

  return (
    <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
      <div className="text-sm text-gray-600 dark:text-gray-400">
        {saving ? 'Saving to YouTube and database...' : (
          !hasTitle ? (
            <span className="text-amber-600 dark:text-amber-400 font-medium">
              ⚠️ Title required before saving
            </span>
          ) : (
            'Ready to save recording'
          )
        )}
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
          disabled={!canSave}
          className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 disabled:opacity-50 transition-colors"
          title={!hasTitle ? "Enter a title before saving" : "Save recording to YouTube and database"}
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving...' : 'Save'}</span>
        </button>
      </div>
    </div>
  );
};

export default RecorderActions;