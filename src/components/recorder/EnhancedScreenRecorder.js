'use client';
import React, { useEffect } from 'react';
import { toast } from 'sonner';
import RecorderControls from './RecorderControls';
import RecorderPreviewModal from './RecorderPreviewModal';
import { useRecording } from '../../hooks/useRecording';

const EnhancedScreenRecorder = ({
  activeSuite,
  firestoreService,
  onClose,
  mode = 'recorder',
  existingRecording = null
}) => {
  const {
    state: recordingState,
    actions: recordingActions,
    hasPreview,
    previewData
  } = useRecording();

  console.log('EnhancedScreenRecorder render:', {
    mode,
    hasPreview,
    previewDataExists: !!previewData,
    previewDataBlob: !!previewData?.blob,
    previewDataDuration: previewData?.duration
  });

  // Cleanup when component unmounts
  useEffect(() => {
    return () => {
      // Only cleanup if we're closing the entire recorder, not just switching views
      console.log('EnhancedScreenRecorder unmounting, cleaning up resources');
      recordingActions.cleanup();
    };
  }, [recordingActions]);

  // Viewer mode - show existing recording
  if (mode === 'viewer' && existingRecording) {
    return (
      <RecorderPreviewModal
        activeSuite={activeSuite}
        firestoreService={firestoreService}
        onClose={onClose}
        previewUrl={existingRecording.videoUrl}
        blob={null} // No blob for existing recordings
        duration={existingRecording.durationSeconds || existingRecording.duration || 0}
        consoleLogs={existingRecording.consoleLogs || []}
        networkLogs={existingRecording.networkLogs || []}
        detectedIssues={existingRecording.detectedIssues || []}
        comments={existingRecording.comments || []}
      />
    );
  }

  // Recorder mode with preview
  if (hasPreview && previewData) {
    console.log('EnhancedScreenRecorder: Rendering preview with data:', {
      hasBlob: !!previewData.blob,
      blobSize: previewData.blob?.size,
      duration: previewData.duration,
      dataKeys: Object.keys(previewData.data || {}),
      issuesCount: previewData.data?.detectedIssues?.length,
      previewDataKeys: Object.keys(previewData)
    });

    return (
      <RecorderPreviewModal
        activeSuite={activeSuite}
        firestoreService={firestoreService}
        onClose={(shouldCleanup = false) => {
          recordingActions.clearPreview();
          if (shouldCleanup) {
            recordingActions.cleanup();
          }
          if (onClose) onClose();
        }}
        previewUrl={previewData.previewUrl}
        blob={previewData.blob} // This should be the actual blob
        duration={previewData.duration}
        consoleLogs={previewData.data?.consoleLogs || []}
        networkLogs={previewData.data?.networkLogs || []}
        detectedIssues={previewData.data?.detectedIssues || []}
        comments={previewData.data?.comments || []}
      />
    );
  }

  // Default recorder controls
  return (
    <RecorderControls
      variant="contained"
      isPrimary={true}
      recordingState={recordingState}
      actions={recordingActions}
      onStart={async () => {
        if (!activeSuite?.id) {
          toast.error('Please select a test suite first');
          return;
        }
        await recordingActions.startRecording();
      }}
    />
  );
};

export default EnhancedScreenRecorder;