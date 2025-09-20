import React from 'react';
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

  // Viewer mode - show existing recording
  if (mode === 'viewer' && existingRecording) {
    return (
      <RecorderPreviewModal
        activeSuite={activeSuite}
        firestoreService={firestoreService}
        onClose={onClose}
        previewUrl={existingRecording.videoUrl}
        duration={existingRecording.duration}
        consoleLogs={existingRecording.consoleLogs || []}
        networkLogs={existingRecording.networkLogs || []}
        detectedIssues={existingRecording.detectedIssues || []}
        comments={existingRecording.comments || []}
      />
    );
  }

  // Recorder mode with preview
  if (hasPreview && previewData) {
    return (
      <RecorderPreviewModal
        activeSuite={activeSuite}
        firestoreService={firestoreService}
        onClose={() => {
          recordingActions.clearPreview();
          if (onClose) onClose();
        }}
        previewUrl={previewData.previewUrl}
        duration={previewData.duration}
        consoleLogs={previewData.data.consoleLogs}
        networkLogs={previewData.data.networkLogs}
        detectedIssues={previewData.data.detectedIssues}
        comments={previewData.data.comments}
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
          alert('Please select a test suite first');
          return;
        }
        await recordingActions.startRecording();
      }}
    />
  );
};

export default EnhancedScreenRecorder;