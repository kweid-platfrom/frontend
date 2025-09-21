'use client';

import React, { useState, useEffect, useCallback } from 'react';
import RecorderControls from './RecorderControls';
import RecorderPreviewModal from './RecorderPreviewModal';
import { useApp } from '../../context/AppProvider';

const formatTime = (s) => {
  const sec = Math.floor(s % 60).toString().padStart(2, '0');
  const min = Math.floor(s / 60).toString();
  return `${min}:${sec}`;
};

// Optimized logging - only capture errors/failures
const createOptimizedLogger = () => {
  const logs = [];
  const networkRequests = [];
  let isCapturing = false;
  const MAX_LOGS = 100; // Limit to prevent memory bloat
  const MAX_MESSAGE_LENGTH = 500; // Truncate long messages
  
  const originalError = console.error;
  const originalWarn = console.warn;
  const originalFetch = window.fetch;
  
  const start = () => {
    if (isCapturing) return;
    isCapturing = true;
    logs.length = 0;
    networkRequests.length = 0;
    
    // Only capture errors and warnings (not regular logs)
    console.error = (...args) => {
      if (isCapturing && logs.length < MAX_LOGS) {
        logs.push({
          level: 'error',
          message: args.map(String).join(' ').substring(0, MAX_MESSAGE_LENGTH),
          time: new Date().toISOString(),
          timestamp: Date.now()
        });
      }
      originalError.apply(console, args);
    };
    
    console.warn = (...args) => {
      if (isCapturing && logs.length < MAX_LOGS) {
        logs.push({
          level: 'warn',
          message: args.map(String).join(' ').substring(0, MAX_MESSAGE_LENGTH),
          time: new Date().toISOString(),
          timestamp: Date.now()
        });
      }
      originalWarn.apply(console, args);
    };

    // Only capture failed network requests (4xx, 5xx, errors)
    window.fetch = async (...args) => {
      const startTime = Date.now();
      try {
        const response = await originalFetch(...args);
        // Only capture failures and errors
        if (isCapturing && response.status >= 400 && networkRequests.length < MAX_LOGS) {
          networkRequests.push({
            url: String(args[0]).substring(0, 100), // Truncate URL
            method: args[1]?.method || 'GET',
            status: response.status,
            duration: Date.now() - startTime,
            time: new Date().toISOString(),
            timestamp: Date.now()
          });
        }
        return response;
      } catch (err) {
        // Always capture network errors
        if (isCapturing && networkRequests.length < MAX_LOGS) {
          networkRequests.push({
            url: String(args[0]).substring(0, 100),
            method: args[1]?.method || 'GET',
            status: 'ERROR',
            duration: Date.now() - startTime,
            error: err.message?.substring(0, 200),
            time: new Date().toISOString(),
            timestamp: Date.now()
          });
        }
        throw err;
      }
    };
  };

  const stop = () => {
    if (!isCapturing) return;
    isCapturing = false;
    console.error = originalError;
    console.warn = originalWarn;
    window.fetch = originalFetch;
  };

  const getData = () => ({
    consoleLogs: [...logs],
    networkLogs: [...networkRequests]
  });

  return { start, stop, getData };
};

// Memory-optimized store
class OptimizedRecordingStore {
  constructor() {
    this.state = {
      isRecording: false,
      isPaused: false,
      recordingTime: 0,
      showCountdown: 0,
      showPreview: false,
      previewUrl: null,
      duration: "0:00",
      micMuted: false,
    };
    
    this.listeners = new Set();
    this.recorder = null;
    this.stream = null;
    this.chunks = [];
    this.timer = null;
    this.logger = null;
    this.updateScheduled = false;
  }

  setState(updates) {
    const hasChanges = Object.keys(updates).some(key => this.state[key] !== updates[key]);
    if (!hasChanges) return;
    
    this.state = { ...this.state, ...updates };
    
    // Batch state updates to prevent excessive re-renders
    if (!this.updateScheduled) {
      this.updateScheduled = true;
      requestAnimationFrame(() => {
        this.listeners.forEach(listener => listener(this.state));
        this.updateScheduled = false;
      });
    }
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  async startRecording() {
    try {
      this.setState({
        recordingTime: 0,
        isPaused: false,
        micMuted: false
      });

      // Start optimized logging
      this.logger = createOptimizedLogger();
      this.logger.start();

      // Get screen capture with optimized settings
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { 
          cursor: "always",
          frameRate: 15 // Reduced framerate for better performance
        },
        audio: true,
      });

      this.stream = stream;
      await this.showCountdown();

      // Use more efficient codec settings
      this.recorder = new MediaRecorder(stream, {
        mimeType: "video/webm;codecs=vp8", // VP8 is lighter than VP9
        videoBitsPerSecond: 1000000 // Reduced bitrate
      });

      this.chunks = [];
      
      this.recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          this.chunks.push(e.data);
        }
      };

      this.recorder.onstop = () => {
        this.logger.stop();
        
        const blob = new Blob(this.chunks, { type: "video/webm" });
        const url = URL.createObjectURL(blob);
        this.setState({ previewUrl: url });

        // Process data asynchronously to not block UI
        requestIdleCallback(() => {
          this.processRecordingData(url, blob);
        });
      };

      // Use larger chunks for better performance
      this.recorder.start(3000);
      this.setState({ isRecording: true });
      this.startTimer();
      
    } catch (err) {
      console.error('Recording failed:', err);
      this.cleanup();
    }
  }

  processRecordingData(url, blob) {
    const video = document.createElement('video');
    video.src = url;
    video.onloadedmetadata = () => {
      this.setState({ duration: formatTime(video.duration) });
    };

    // Get logged data and detect issues
    const logData = this.logger.getData();
    const issues = this.detectIssues(logData);
    
    // Store complete data for preview including the blob
    this.previewData = {
      previewUrl: url,
      blob: blob, // Include the actual blob
      duration: video.duration || 0,
      consoleLogs: logData.consoleLogs,
      networkLogs: logData.networkLogs,
      detectedIssues: issues,
      comments: []
    };
    
    this.setState({ showPreview: true });
    this.cleanup();
  }

  async showCountdown() {
    return new Promise(resolve => {
      let count = 3;
      this.setState({ showCountdown: count });
      
      const timer = setInterval(() => {
        count--;
        if (count > 0) {
          this.setState({ showCountdown: count });
        } else {
          this.setState({ showCountdown: 0 });
          clearInterval(timer);
          resolve();
        }
      }, 1000);
    });
  }

  detectIssues(data) {
    const issues = [];
    
    // Only process errors and warnings (already filtered by logger)
    data.consoleLogs.forEach(log => {
      issues.push({
        id: `console_${log.timestamp}`,
        type: 'console_error',
        message: log.message,
        severity: log.level === 'error' ? 'high' : 'medium',
        source: 'console',
        time: log.time,
        timestamp: log.timestamp
      });
    });

    // Only failed network requests (already filtered by logger)
    data.networkLogs.forEach(req => {
      issues.push({
        id: `network_${req.timestamp}`,
        type: 'network_error',
        message: `${req.method} ${req.url} - ${req.status}${req.error ? ` (${req.error})` : ''}`,
        severity: req.status >= 500 || req.status === 'ERROR' ? 'high' : 'medium',
        source: 'network',
        time: req.time,
        timestamp: req.timestamp
      });
    });

    return issues;
  }

  pauseRecording() {
    if (this.recorder && this.recorder.state === 'recording') {
      this.recorder.pause();
      this.setState({ isPaused: true });
    }
  }

  resumeRecording() {
    if (this.recorder && this.recorder.state === 'paused') {
      this.recorder.resume();
      this.setState({ isPaused: false });
    }
  }

  stopRecording() {
    if (this.recorder && this.recorder.state !== 'inactive') {
      this.recorder.stop();
    }
    this.setState({ isRecording: false, isPaused: false });
  }

  toggleMute() {
    const newMutedState = !this.state.micMuted;
    this.setState({ micMuted: newMutedState });
    
    if (this.stream) {
      this.stream.getAudioTracks().forEach(track => {
        track.enabled = !newMutedState;
      });
    }
  }

  startTimer() {
    // Update timer less frequently to save CPU
    this.timer = setInterval(() => {
      if (!this.state.isPaused) {
        this.setState({ recordingTime: this.state.recordingTime + 1 });
      }
    }, 1000);
  }

  cleanup() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    if (this.logger) {
      this.logger.stop();
      this.logger = null;
    }
    this.recorder = null;
    // Clear chunks to free memory
    this.chunks = [];
  }

  setShowPreview(value) {
    this.setState({ showPreview: value });
    // Clear preview data when closing to free memory
    if (!value) {
      if (this.previewData?.previewUrl) {
        URL.revokeObjectURL(this.previewData.previewUrl);
      }
      this.previewData = null;
    }
  }

  getPreviewData() {
    return this.previewData || {
      previewUrl: null,
      blob: null,
      duration: 0,
      consoleLogs: [],
      networkLogs: [],
      detectedIssues: [],
      comments: []
    };
  }
}

// Use optimized store
const store = new OptimizedRecordingStore();

const useRecordingStore = () => {
  const [state, setState] = useState(store.state);
  
  useEffect(() => {
    return store.subscribe(setState);
  }, []);

  const actions = {
    startRecording: useCallback(() => store.startRecording(), []),
    pauseRecording: useCallback(() => store.pauseRecording(), []),
    resumeRecording: useCallback(() => store.resumeRecording(), []),
    stopRecording: useCallback(() => store.stopRecording(), []),
    toggleMute: useCallback(() => store.toggleMute(), []),
    setShowPreview: useCallback((value) => store.setShowPreview(value), []),
  };

  return { state, actions };
};

const ScreenRecorderButton = ({ disabled = false, className = "", variant = "ghost", isPrimary = false }) => {
  const { activeSuite, ui, actions } = useApp(); // Get actions from AppProvider
  const { state, actions: recordingActions } = useRecordingStore();

  const handleStart = useCallback(async () => {
    if (!activeSuite?.id) {
      ui.showNotification({
        id: 'no-suite-selected',
        type: 'warning',
        message: 'Please select a test suite first',
        duration: 3000,
      });
      return;
    }
    recordingActions.startRecording();
  }, [activeSuite?.id, ui, recordingActions]);

  const previewData = store.getPreviewData();

  return (
    <>
      <RecorderControls 
        disabled={disabled} 
        className={className} 
        variant={variant} 
        isPrimary={isPrimary}
        onStart={handleStart}
        recordingState={state}
        actions={recordingActions}
      />
      
      {isPrimary && state.showCountdown > 0 && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="text-white text-9xl font-bold animate-bounce">
            {state.showCountdown}
          </div>
        </div>
      )}
      
      {isPrimary && state.showPreview && (
        <RecorderPreviewModal
          activeSuite={activeSuite}
          firestoreService={actions} // Use real actions from AppProvider
          onClose={() => recordingActions.setShowPreview(false)}
          previewUrl={previewData.previewUrl}
          blob={previewData.blob}
          duration={previewData.duration}
          consoleLogs={previewData.consoleLogs}
          networkLogs={previewData.networkLogs}
          detectedIssues={previewData.detectedIssues}
          comments={previewData.comments}
        />
      )}
    </>
  );
};

export { useRecordingStore };
export default ScreenRecorderButton;