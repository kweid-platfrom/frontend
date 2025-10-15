// hooks/useRecording.js
'use client';
import { useState, useRef, useCallback } from 'react';
import { useApp } from '../context/AppProvider';

export const useRecordings = () => {
  const { 
    state, 
    actions,
    activeSuite 
  } = useApp();

  // Preview state
  const [hasPreview, setHasPreview] = useState(false);
  const [previewData, setPreviewData] = useState(null);

  // Recording state
  const [recordingState, setRecordingState] = useState({
    isRecording: false,
    isPaused: false,
    duration: 0,
    status: 'idle' // idle, recording, paused, stopped
  });

  // Refs for recording
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const consoleLogsRef = useRef([]);
  const networkLogsRef = useRef([]);
  const detectedIssuesRef = useRef([]);

  // Get recordings from app state
  const recordings = state.recordings?.recordings || [];
  const loading = state.recordings?.loading || false;
  const currentUser = state.auth?.currentUser;
  const isTrialActive = state.subscription?.isTrialActive;

  // Capture console logs
  const captureConsoleLogs = useCallback(() => {
    const originalLog = console.log;
    const originalWarn = console.warn;
    const originalError = console.error;

    console.log = (...args) => {
      consoleLogsRef.current.push({
        type: 'log',
        message: args.join(' '),
        timestamp: Date.now()
      });
      originalLog.apply(console, args);
    };

    console.warn = (...args) => {
      consoleLogsRef.current.push({
        type: 'warn',
        message: args.join(' '),
        timestamp: Date.now()
      });
      originalWarn.apply(console, args);
    };

    console.error = (...args) => {
      consoleLogsRef.current.push({
        type: 'error',
        message: args.join(' '),
        timestamp: Date.now()
      });
      detectedIssuesRef.current.push({
        type: 'console_error',
        severity: 'high',
        message: args.join(' '),
        time: Date.now()
      });
      originalError.apply(console, args);
    };

    return () => {
      console.log = originalLog;
      console.warn = originalWarn;
      console.error = originalError;
    };
  }, []);

  // Start recording
  const startRecording = useCallback(async () => {
    try {
      console.log('🎬 Starting recording...');
      
      // Request screen capture
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { 
          mediaSource: 'screen',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: true
      });

      streamRef.current = stream;

      // Initialize MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9',
        videoBitsPerSecond: 2500000
      });

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      consoleLogsRef.current = [];
      networkLogsRef.current = [];
      detectedIssuesRef.current = [];

      // Capture console logs
      const restoreConsole = captureConsoleLogs();

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        console.log('🎬 Recording stopped, processing...');
        restoreConsole();

        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        const previewUrl = URL.createObjectURL(blob);
        // Use ref value instead of state to avoid stale closure
        const duration = timerRef.current ? 
          Math.floor((Date.now() - timerRef.startTime) / 1000) : 0;

        console.log(' Creating preview with:', {
          blobSize: blob.size,
          duration,
          consoleLogsCount: consoleLogsRef.current.length,
          networkLogsCount: networkLogsRef.current.length,
          issuesCount: detectedIssuesRef.current.length
        });

        setPreviewData({
          blob,
          previewUrl,
          duration,
          data: {
            consoleLogs: consoleLogsRef.current,
            networkLogs: networkLogsRef.current,
            detectedIssues: detectedIssuesRef.current,
            comments: []
          }
        });
        setHasPreview(true);

        // Stop all tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }

        setRecordingState({
          isRecording: false,
          isPaused: false,
          duration: 0,
          status: 'stopped'
        });
      };

      // Handle stream end (user clicks browser's stop sharing button)
      stream.getVideoTracks()[0].addEventListener('ended', () => {
        console.log('🎬 Stream ended by user');
        if (mediaRecorderRef.current && 
            mediaRecorderRef.current.state !== 'inactive') {
          mediaRecorderRef.current.stop();
        }
      });

      mediaRecorder.start(1000); // Collect data every second

      // Start timer
      const startTime = Date.now();
      timerRef.startTime = startTime;
      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        setRecordingState(prev => ({
          ...prev,
          duration: elapsed
        }));
      }, 1000);

      setRecordingState({
        isRecording: true,
        isPaused: false,
        duration: 0,
        status: 'recording'
      });

      actions.ui?.showNotification?.({
        id: 'recording-started',
        type: 'success',
        message: 'Recording started',
        duration: 3000
      });

      console.log('✅ Recording started successfully');
      return { success: true };

    } catch (error) {
      console.error('❌ Failed to start recording:', error);
      
      actions.ui?.showNotification?.({
        id: 'recording-error',
        type: 'error',
        message: error.name === 'NotAllowedError' 
          ? 'Screen recording permission denied' 
          : `Failed to start recording: ${error.message}`,
        duration: 5000
      });

      return { success: false, error };
    }
  }, [actions.ui, captureConsoleLogs]);

  // Pause recording
  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && 
        mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      clearInterval(timerRef.current);
      setRecordingState(prev => ({
        ...prev,
        isPaused: true,
        status: 'paused'
      }));
      console.log('⏸️ Recording paused');
    }
  }, []);

  // Resume recording
  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && 
        mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      
      // Resume timer - recalculate start time based on current duration
      setRecordingState(prev => {
        const pausedDuration = prev.duration;
        const startTime = Date.now() - (pausedDuration * 1000);
        timerRef.startTime = startTime;
        
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
        
        timerRef.current = setInterval(() => {
          const elapsed = Math.floor((Date.now() - startTime) / 1000);
          setRecordingState(state => ({
            ...state,
            duration: elapsed
          }));
        }, 1000);

        return {
          ...prev,
          isPaused: false,
          status: 'recording'
        };
      });
      
      console.log('▶️ Recording resumed');
    }
  }, []);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && 
        mediaRecorderRef.current.state !== 'inactive') {
      console.log('🛑 Stopping recording...');
      clearInterval(timerRef.current);
      mediaRecorderRef.current.stop();
    }
  }, []);

  // Clear preview
  const clearPreview = useCallback(() => {
    if (previewData?.previewUrl) {
      URL.revokeObjectURL(previewData.previewUrl);
    }
    setPreviewData(null);
    setHasPreview(false);
    console.log('🗑️ Preview cleared');
  }, [previewData]);

  // Cleanup - NO DEPENDENCIES to prevent infinite loops
  const cleanup = useCallback(() => {
    console.log('🧹 Cleaning up recording resources...');
    
    // Stop recording if active
    if (mediaRecorderRef.current && 
        mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    // Stop all media tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }

    // Clear timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    // Clear preview URL if it exists
    const currentPreviewUrl = previewData?.previewUrl;
    if (currentPreviewUrl) {
      URL.revokeObjectURL(currentPreviewUrl);
    }

    // Reset refs
    mediaRecorderRef.current = null;
    streamRef.current = null;
    chunksRef.current = [];
    consoleLogsRef.current = [];
    networkLogsRef.current = [];
    detectedIssuesRef.current = [];

    // Reset state
    setRecordingState({
      isRecording: false,
      isPaused: false,
      duration: 0,
      status: 'idle'
    });
    setHasPreview(false);
    setPreviewData(null);

    console.log('✅ Cleanup complete');
  }, []); // Empty dependencies - cleanup should only access refs

  // Create recording (save to Firestore)
  const createRecording = useCallback(async (recordingData) => {
    if (!activeSuite?.id) {
      actions.ui?.showNotification?.({
        id: 'no-active-suite',
        type: 'error',
        message: 'No active suite selected',
        duration: 3000
      });
      return { success: false, error: { message: 'No active suite' } };
    }

    try {
      const result = await actions.recordings.createRecording(recordingData, activeSuite.id);
      return result;
    } catch (error) {
      console.error('Failed to create recording:', error);
      return { success: false, error };
    }
  }, [activeSuite, actions]);

  // Delete recording
  const deleteRecording = useCallback(async (recordingId) => {
    if (!activeSuite?.id) {
      return { success: false, error: { message: 'No active suite' } };
    }

    try {
      const result = await actions.recordings.deleteRecording(recordingId, activeSuite.id);
      return result;
    } catch (error) {
      console.error('Failed to delete recording:', error);
      return { success: false, error };
    }
  }, [activeSuite, actions]);

  // Link recording to bug
  const linkRecordingToBug = useCallback(async (recordingId, bugId) => {
    if (!activeSuite?.id) {
      return { success: false, error: { message: 'No active suite' } };
    }

    try {
      const result = await actions.linking.linkRecordingToBug?.(recordingId, bugId, activeSuite.id);
      return result || { success: false, error: { message: 'Method not available' } };
    } catch (error) {
      console.error('Failed to link recording to bug:', error);
      return { success: false, error };
    }
  }, [activeSuite, actions]);

  // Create bug from recording
  const createBug = useCallback(async (bugData) => {
    if (!activeSuite?.id) {
      return { success: false, error: { message: 'No active suite' } };
    }

    try {
      const result = await actions.bugs.createBug?.(bugData, activeSuite.id);
      return result || { success: false, error: { message: 'Method not available' } };
    } catch (error) {
      console.error('Failed to create bug:', error);
      return { success: false, error };
    }
  }, [activeSuite, actions]);

  return {
    // State
    state: recordingState,
    recordings,
    activeSuite,
    loading,
    currentUser,
    isTrialActive,
    
    // Preview state
    hasPreview,
    previewData,
    
    // Actions
    actions: {
      startRecording,
      stopRecording,
      pauseRecording,
      resumeRecording,
      clearPreview,
      cleanup,
      createRecording,
      deleteRecording,
      linkRecordingToBug,
      createBug,
    },

    // Convenience methods
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    clearPreview,
    cleanup,
    createRecording,
    deleteRecording,
    linkRecordingToBug,
    createBug,
  };
};