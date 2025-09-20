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
      // Get the blob from the preview URL
      const blob = await (await fetch(previewUrl)).blob();

      // Import and use the recording service
      const recordingService = (await import('../../services/recordingService')).default;

      // Debug: Check service status first
      console.log('Checking YouTube service status...');
      const serviceStatus = await recordingService.getServiceStatus();
      console.log('Service Status:', serviceStatus);
      
      const isAvailable = await recordingService.isYouTubeAvailable();
      console.log('YouTube Available:', isAvailable);

      // Upload directly to YouTube
      const uploadResult = await recordingService.uploadToYouTube(
        blob,
        {
          title: `${activeSuite.name} - ${new Date().toLocaleDateString()}`,
          description: `Screen recording for test suite: ${activeSuite.name}\n\nCaptured Issues: ${recordingData.detectedIssues?.length || 0}\nConsole Logs: ${recordingData.consoleLogs?.length || 0}\nNetwork Errors: ${recordingData.networkLogs?.length || 0}`,
          tags: ['qa-testing', 'screen-recording', activeSuite.name],
          privacy: 'private'
        },
        (progress) => {
          console.log(`Upload progress: ${progress}%`);
        }
      );

      if (!uploadResult.success) {
        throw new Error(uploadResult.error?.message || 'Failed to upload video to YouTube');
      }

      // Prepare data for Firestore - only YouTube URL and metadata
      const recordingDataToSave = {
        title: `${activeSuite.name} - ${new Date().toLocaleDateString()}`,
        description: `Screen recording with ${recordingData.detectedIssues?.length || 0} detected issues`,
        duration: recordingData.duration,

        // YouTube video information
        youtubeId: uploadResult.data.videoId,
        videoUrl: uploadResult.data.url,
        embedUrl: uploadResult.data.embedUrl,
        thumbnailUrl: uploadResult.data.thumbnailUrl,
        privacyStatus: uploadResult.data.privacyStatus || 'private',

        // Recording analysis data
        consoleLogs: recordingData.consoleLogs || [],
        networkLogs: recordingData.networkLogs || [],
        detectedIssues: recordingData.detectedIssues || [],
        comments: recordingData.comments || [],

        // Metadata
        platform: navigator.userAgent,
        suiteId: activeSuite.id,
        status: 'active',
        recordedAt: new Date(),
        provider: 'youtube'
      };

      // Save to Firestore
      const result = await firestoreService.createRecording(activeSuite.id, recordingDataToSave);

      if (result.success) {
        const permanentShareLink = uploadResult.data.url;
        setShareLink(permanentShareLink);
        alert('Recording saved successfully to YouTube!');
        setTimeout(() => onClose(), 1500);
      } else {
        // If Firestore save fails, we should consider cleaning up the YouTube video
        console.error('Failed to save recording metadata to Firestore:', result.error);
        throw new Error(result.error?.message || 'Failed to save recording metadata to database');
      }
    } catch (err) {
      console.error('Failed to save recording:', err);
      alert('Failed to save recording: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
      <div className="text-sm text-gray-600 dark:text-gray-400">
        {shareLink ? 'Recording link ready to share' : 'Click share to generate link'}
      </div>
      <div className="flex space-x-2">
        <button
          onClick={copyShareLink}
          className="flex items-center space-x-2 px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors"
          title="Generate and copy shareable link"
        >
          <Link className="w-4 h-4" />
          <span>Share</span>
        </button>
        <button
          onClick={saveRecording}
          disabled={saving}
          className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 disabled:opacity-50 transition-colors"
          title="Save recording to YouTube"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving...' : 'Save'}</span>
        </button>
      </div>
    </div>
  );
};

export default RecorderActions;