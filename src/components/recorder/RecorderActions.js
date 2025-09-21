'use client';

import React, { useState } from 'react';
import { Link, Save } from 'lucide-react';
import { toast } from 'sonner';

const RecorderActions = ({ previewUrl, activeSuite, firestoreService, onClose, recordingData }) => {
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

  const formatDuration = (seconds) => {
    if (!isFinite(seconds) || seconds < 0 || isNaN(seconds)) return '0:30';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const saveRecording = async () => {
    console.log('=== RECORDING SAVE PROCESS START ===');
    console.log('saveRecording called with recordingData:', {
      hasRecordingData: !!recordingData,
      recordingDataKeys: recordingData ? Object.keys(recordingData) : [],
      hasBlob: !!recordingData?.blob,
      blobSize: recordingData?.blob?.size,
      duration: recordingData?.duration,
      hasPreviewUrl: !!previewUrl,
      activeSuiteId: activeSuite?.id,
      activeSuiteName: activeSuite?.name
    });

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

      // Handle duration - ensure it's a number
      if (typeof actualDuration === 'string') {
        const parts = actualDuration.split(':');
        if (parts.length === 2) {
          actualDuration = parseInt(parts[0]) * 60 + parseInt(parts[1]);
        } else {
          actualDuration = 30; // fallback
        }
      }
      
      if (!isFinite(actualDuration) || actualDuration <= 0 || isNaN(actualDuration)) {
        actualDuration = 30;
      }

      console.log('Processing recording:', {
        blobSize: blob.size,
        duration: actualDuration,
        suiteId: activeSuite.id
      });

      const formattedDuration = formatDuration(actualDuration);

      // STEP 1: Upload to YouTube first
      console.log('=== STEP 1: YOUTUBE UPLOAD ===');
      const recordingService = (await import('../../services/recordingService')).default;

      const uploadResult = await recordingService.uploadToYouTubeWithRetry(
        blob,
        {
          title: `${activeSuite.name} - ${new Date().toLocaleDateString()}`,
          description: `Screen recording for test suite: ${activeSuite.name}\n\nDuration: ${formattedDuration}`,
          tags: ['qa-testing', 'screen-recording', activeSuite.name.replace(/\s+/g, '-').toLowerCase()],
          privacy: 'private',
          suiteId: activeSuite.id,
          suiteName: activeSuite.name,
          duration: actualDuration
        }
      );

      if (!uploadResult.success) {
        throw new Error(uploadResult.error?.message || 'Failed to upload video');
      }

      console.log('YouTube upload successful:', uploadResult.data);

      // STEP 2: Prepare CORRECT data structure for Firestore
      console.log('=== STEP 2: PREPARE FIRESTORE DATA ===');
      
      // CRITICAL: Match the exact structure that AssetService expects
      const recordingDataToSave = {
        // Core identification fields (REQUIRED by security rules)
        suite_id: activeSuite.id, // THIS IS CRITICAL - must match security rules
        
        // Basic recording info
        title: `${activeSuite.name} - ${new Date().toLocaleDateString()}`,
        description: `Screen recording with ${recordingData.detectedIssues?.length || 0} detected issues`,
        
        // Duration fields (multiple formats for compatibility)
        duration: formattedDuration, // "1:30" format
        durationSeconds: actualDuration, // numeric seconds
        
        // YouTube/Provider fields
        youtubeId: uploadResult.data.youtubeId || uploadResult.data.videoId,
        videoId: uploadResult.data.videoId || uploadResult.data.youtubeId,
        videoUrl: uploadResult.data.url || uploadResult.data.videoUrl,
        url: uploadResult.data.videoUrl || uploadResult.data.url,
        embedUrl: uploadResult.data.embedUrl,
        thumbnailUrl: uploadResult.data.thumbnailUrl,
        privacyStatus: uploadResult.data.privacyStatus || 'private',
        provider: 'youtube',
        
        // File information
        filename: `recording_${Date.now()}.webm`,
        size: blob.size,
        
        // Session data from recording
        consoleLogs: recordingData.consoleLogs || [],
        networkLogs: recordingData.networkLogs || [],
        detectedIssues: recordingData.detectedIssues || [],
        comments: recordingData.comments || [],
        
        // Platform info
        platform: navigator.userAgent,
        
        // Status and timestamps
        status: 'active',
        
        // Statistics for easy querying
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
        hasSuiteId: !!recordingDataToSave.suite_id,
        suite_id: recordingDataToSave.suite_id,
        hasTitle: !!recordingDataToSave.title,
        title: recordingDataToSave.title,
        hasYouTubeId: !!recordingDataToSave.youtubeId,
        youtubeId: recordingDataToSave.youtubeId,
        dataKeys: Object.keys(recordingDataToSave),
        metadataKeys: Object.keys(recordingDataToSave.metadata || {})
      });

      // STEP 3: Save to Firestore using the correct method
      console.log('=== STEP 3: FIRESTORE SAVE ===');

      let firestoreResult;
      
      // Try the most specific method first
      if (firestoreService?.recordings?.createRecording) {
        console.log('Using firestoreService.recordings.createRecording method');
        firestoreResult = await firestoreService.recordings.createRecording(
          activeSuite.id, 
          recordingDataToSave
        );
      } 
      // Try the create method
      else if (firestoreService?.recordings?.create) {
        console.log('Using firestoreService.recordings.create method');
        firestoreResult = await firestoreService.recordings.create(
          activeSuite.id, 
          recordingDataToSave
        );
      } 
      // Try direct createRecording method
      else if (firestoreService?.createRecording) {
        console.log('Using firestoreService.createRecording method');
        firestoreResult = await firestoreService.createRecording(
          activeSuite.id, 
          recordingDataToSave
        );
      } 
      // Fallback to direct FirestoreService import
      else {
        console.log('Using imported FirestoreService as fallback');
        const FirestoreService = (await import('../../services')).default;
        firestoreResult = await FirestoreService.createRecording(
          activeSuite.id, 
          recordingDataToSave
        );
      }
      
      console.log('Firestore operation result:', {
        success: firestoreResult.success,
        hasData: !!firestoreResult.data,
        dataId: firestoreResult.data?.id,
        error: firestoreResult.error?.message
      });

      // STEP 4: Handle the result
      console.log('=== STEP 4: HANDLE RESULT ===');
      
      if (firestoreResult.success) {
        console.log('✅ Recording saved successfully to Firestore:', firestoreResult.data.id);
        
        toast.success('Recording saved successfully!', {
          description: `Video uploaded and saved to database\nDuration: ${formattedDuration}`,
          action: {
            label: 'View',
            onClick: () => window.open(uploadResult.data.url, '_blank')
          }
        });
        
        setTimeout(() => {
          if (onClose) {
            onClose(true); // Close with cleanup flag
          }
        }, 1500);
      } else {
        console.error('❌ Firestore save failed:', firestoreResult.error);
        
        // IMPORTANT: Try to clean up YouTube video if Firestore fails
        try {
          console.log('Attempting to cleanup YouTube video due to Firestore failure...');
          await recordingService.deleteRecording({
            youtubeId: uploadResult.data.youtubeId || uploadResult.data.videoId,
            videoId: uploadResult.data.videoId || uploadResult.data.youtubeId
          });
          console.log('✅ Successfully cleaned up YouTube video');
        } catch (cleanupError) {
          console.error('❌ Failed to cleanup YouTube video:', cleanupError);
        }
        
        toast.error('Failed to save recording to database', {
          description: `YouTube upload succeeded but database save failed: ${firestoreResult.error?.message}`,
        });

        // Additional debugging information
        console.log('=== DEBUGGING INFO ===');
        console.log('Active Suite:', activeSuite);
        console.log('Recording Data Structure:', recordingDataToSave);
        console.log('FirestoreService Available Methods:', {
          hasRecordings: !!firestoreService?.recordings,
          hasCreateRecording: !!firestoreService?.createRecording,
          recordingsMethods: firestoreService?.recordings ? Object.keys(firestoreService.recordings) : 'N/A'
        });
      }
    } catch (err) {
      console.error('❌ Complete save operation failed:', err);
      
      // Log detailed error information
      console.log('Error Details:', {
        message: err.message,
        stack: err.stack,
        name: err.name,
        code: err.code
      });
      
      toast.error('Failed to save recording', {
        description: err.message,
      });
    } finally {
      setSaving(false);
      console.log('=== RECORDING SAVE PROCESS END ===');
    }
  };

  return (
    <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
      <div className="text-sm text-gray-600 dark:text-gray-400">
        {saving ? 'Saving to YouTube and database...' : 'Ready to save recording'}
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
          disabled={saving || (!previewUrl && !recordingData?.blob)}
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