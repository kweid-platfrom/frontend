import React from 'react';
import RecorderControls from './RecorderControls';
import RecorderPreviewModal from './RecorderPreviewModal';

const EnhancedScreenRecorder = ({ 
  activeSuite,
  firestoreService,
  onClose,
  mode = 'recorder',
  existingRecording = null
}) => {
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

  return (
    <RecorderControls
      variant="contained"
      isPrimary={true}
    />
  );
};

export default EnhancedScreenRecorder;