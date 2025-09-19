'use client';

import React, { useState } from 'react';
import { Link, Save, X } from 'lucide-react';

const RecorderActions = ({ previewUrl, activeSuite, firestoreService, onClose, recordingData }) => {
  const [saving, setSaving] = useState(false);
  const [shareLink, setShareLink] = useState(null);

  const uploadToYouTube = async (blob, metadata) => {
    console.log('Uploading to YouTube:', metadata);
    await new Promise(resolve => setTimeout(resolve, 2000));
    return { 
      success: true, 
      data: { 
        videoId: `yt_${Date.now()}`, 
        url: `https://youtube.com/watch?v=demo_${Date.now()}` 
      } 
    };
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
      const blob = await (await fetch(previewUrl)).blob();
      const uploadResult = await uploadToYouTube(blob, {
        title: `Recording - ${activeSuite.name} - ${new Date().toLocaleDateString()}`,
        description: `Screen recording for test suite: ${activeSuite.name}`,
        privacy: 'private'
      });
      if (!uploadResult.success) {
        throw new Error('Failed to upload video');
      }
      const recordingDataToSave = {
        title: `Recording - ${new Date().toLocaleDateString()}`,
        videoUrl: uploadResult.data.url,
        youtubeId: uploadResult.data.videoId,
        ...recordingData,
        platform: navigator.userAgent,
        suiteId: activeSuite.id,
        status: 'active'
      };
      const result = await firestoreService.createRecording(activeSuite.id, recordingDataToSave);
      if (result.success) {
        const recordingShareLink = `${window.location.origin}/recordings/${result.data.id}`;
        setShareLink(recordingShareLink);
        alert('Recording saved successfully!');
        setTimeout(() => onClose(), 1500);
      } else {
        throw new Error(result.error?.message || 'Failed to save recording');
      }
    } catch (err) {
      console.error('Failed to save recording:', err);
      alert('Failed to save recording: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const copyShareLink = () => {
    if (shareLink) {
      navigator.clipboard.writeText(shareLink).then(() => {
        alert('Recording link copied to clipboard!');
      }).catch(() => {
        alert(`Failed to copy link. URL: ${shareLink}`);
      });
    }
  };

  return (
    <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-2">
      <button
        onClick={copyShareLink}
        disabled={!shareLink}
        className="flex items-center space-x-2 px-3 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50"
      >
        <Link className="w-4 h-4" />
        <span>Copy Share Link</span>
      </button>
      <button
        onClick={saveRecording}
        disabled={saving}
        className="flex items-center space-x-2 px-3 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 disabled:opacity-50"
      >
        <Save className="w-4 h-4" />
        <span>Save & Close</span>
      </button>
      <button
        onClick={onClose}
        className="flex items-center space-x-2 px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
      >
        <X className="w-4 h-4" />
        <span>Discard</span>
      </button>
    </div>
  );
};

export default RecorderActions;