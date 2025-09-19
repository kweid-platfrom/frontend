'use client';

import React, { useState } from 'react';
import { Link, Save } from 'lucide-react';

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
        // Update share link to the permanent saved recording
        const permanentShareLink = `${window.location.origin}/recordings/${result.data.id}`;
        setShareLink(permanentShareLink);
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

  return (
    <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
      <div className="text-sm text-gray-600 dark:text-gray-400">
        {shareLink ? 'Recording link ready to share' : 'Click share to generate link'}
      </div>
      <div className="flex space-x-2">
        <button
          onClick={copyShareLink}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          title="Generate and copy shareable link"
        >
          <Link className="w-4 h-4" />
          <span>Share</span>
        </button>
        <button
          onClick={saveRecording}
          disabled={saving}
          className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
          title="Save recording permanently"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving...' : 'Save'}</span>
        </button>
      </div>
    </div>
  );
};

export default RecorderActions;