'use client';
import React, { useEffect } from 'react';
import { useApp } from '../../context/AppProvider';
import RecorderControls from './RecorderControls';
import RecorderPreviewModal from './RecorderPreviewModal';
import { useRecordings } from '../../hooks/useRecording';

const EnhancedScreenRecorder = ({
  onClose,
  mode = 'recorder',
  existingRecording = null
}) => {
  // Get app context for notifications and active suite
  const { 
    activeSuite, 
    actions: { ui: uiActions },
    state: { suites: { activeSuite: contextActiveSuite } }
  } = useApp();

  const finalActiveSuite = activeSuite || contextActiveSuite;

  const {
    state: recordingState,
    actions: recordingActions,
    hasPreview,
    previewData
  } = useRecordings();

  console.log('EnhancedScreenRecorder render:', {
    mode,
    hasPreview,
    previewDataExists: !!previewData,
    previewDataBlob: !!previewData?.blob,
    previewDataDuration: previewData?.duration,
    hasActiveSuite: !!finalActiveSuite
  });

  // Make notification function globally available for RecorderActions
  useEffect(() => {
    if (uiActions?.showNotification) {
      window.showNotification = uiActions.showNotification;
    }
    return () => {
      delete window.showNotification;
    };
  }, [uiActions]);

  // Cleanup when component unmounts
  useEffect(() => {
    return () => {
      console.log('EnhancedScreenRecorder unmounting, cleaning up resources');
      recordingActions.cleanup();
    };
  }, [recordingActions]);

  // Viewer mode - show existing recording
  if (mode === 'viewer' && existingRecording) {
    return (
      <RecorderPreviewModal
        activeSuite={finalActiveSuite}
        firestoreService={window.FirestoreService} // Access global service
        onClose={onClose}
        previewUrl={existingRecording.videoUrl}
        blob={null}
        duration={existingRecording.durationSeconds || existingRecording.duration || 0}
        consoleLogs={existingRecording.consoleLogs || []}
        networkLogs={existingRecording.networkLogs || []}
        detectedIssues={existingRecording.detectedIssues || []}
        comments={existingRecording.comments || []}
        isSavedRecording={true}
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
        activeSuite={finalActiveSuite}
        firestoreService={window.FirestoreService}
        onClose={(shouldCleanup = false) => {
          recordingActions.clearPreview();
          if (shouldCleanup) {
            recordingActions.cleanup();
          }
          if (onClose) onClose();
        }}
        previewUrl={previewData.previewUrl}
        blob={previewData.blob}
        duration={previewData.duration}
        consoleLogs={previewData.data?.consoleLogs || []}
        networkLogs={previewData.data?.networkLogs || []}
        detectedIssues={previewData.data?.detectedIssues || []}
        comments={previewData.data?.comments || []}
        isSavedRecording={false}
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
        if (!finalActiveSuite?.id) {
          uiActions?.showNotification?.({
            id: 'recording-no-suite',
            type: 'error',
            message: 'Please select a test suite first',
            duration: 3000
          });
          return;
        }
        await recordingActions.startRecording();
      }}
    />
  );
};

export default EnhancedScreenRecorder;