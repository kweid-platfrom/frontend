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

export { createOptimizedLogger };

// Optimized logging - only capture errors/failures
const createOptimizedLogger = () => {
  const logs = [];
  const networkRequests = [];
  let isCapturing = false;
  const MAX_LOGS = 200; // Increased limit
  const MAX_MESSAGE_LENGTH = 1000; // Increased message length

  // Store original console methods
  const originalLog = console.log;
  const originalError = console.error;
  const originalWarn = console.warn;
  const originalInfo = console.info;
  const originalFetch = window.fetch;
  const originalXHR = window.XMLHttpRequest.prototype.open;

  const start = () => {
    if (isCapturing) return;
    isCapturing = true;
    logs.length = 0;
    networkRequests.length = 0;

    console.log('🎥 Recording logger started - capturing all logs');

    // Capture ALL console.log calls
    console.log = (...args) => {
      if (isCapturing && logs.length < MAX_LOGS) {
        logs.push({
          level: 'log',
          message: args.map(arg => {
            try {
              return typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg);
            } catch {
              return String(arg);
            }
          }).join(' ').substring(0, MAX_MESSAGE_LENGTH),
          time: new Date().toISOString(),
          timestamp: Date.now()
        });
      }
      originalLog.apply(console, args);
    };

    // Capture console.error
    console.error = (...args) => {
      if (isCapturing && logs.length < MAX_LOGS) {
        logs.push({
          level: 'error',
          message: args.map(arg => {
            try {
              return typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg);
            } catch {
              return String(arg);
            }
          }).join(' ').substring(0, MAX_MESSAGE_LENGTH),
          time: new Date().toISOString(),
          timestamp: Date.now()
        });
      }
      originalError.apply(console, args);
    };

    // Capture console.warn
    console.warn = (...args) => {
      if (isCapturing && logs.length < MAX_LOGS) {
        logs.push({
          level: 'warn',
          message: args.map(arg => {
            try {
              return typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg);
            } catch {
              return String(arg);
            }
          }).join(' ').substring(0, MAX_MESSAGE_LENGTH),
          time: new Date().toISOString(),
          timestamp: Date.now()
        });
      }
      originalWarn.apply(console, args);
    };

    // Capture console.info
    console.info = (...args) => {
      if (isCapturing && logs.length < MAX_LOGS) {
        logs.push({
          level: 'info',
          message: args.map(arg => {
            try {
              return typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg);
            } catch {
              return String(arg);
            }
          }).join(' ').substring(0, MAX_MESSAGE_LENGTH),
          time: new Date().toISOString(),
          timestamp: Date.now()
        });
      }
      originalInfo.apply(console, args);
    };

    // Capture ALL fetch requests (not just errors)
    window.fetch = async (...args) => {
      const startTime = Date.now();
      const url = String(args[0]);
      const method = args[1]?.method || 'GET';

      try {
        const response = await originalFetch(...args);

        // Capture ALL requests, not just errors
        if (isCapturing && networkRequests.length < MAX_LOGS) {
          networkRequests.push({
            id: `fetch_${Date.now()}_${Math.random()}`,
            url: url.substring(0, 200),
            method: method,
            status: response.status,
            statusText: response.statusText,
            duration: Date.now() - startTime,
            time: new Date().toISOString(),
            timestamp: Date.now(),
            type: 'fetch'
          });
        }

        return response;
      } catch (err) {
        if (isCapturing && networkRequests.length < MAX_LOGS) {
          networkRequests.push({
            id: `fetch_error_${Date.now()}_${Math.random()}`,
            url: url.substring(0, 200),
            method: method,
            status: 'ERR',
            statusText: 'Network Error',
            duration: Date.now() - startTime,
            error: err.message?.substring(0, 200),
            time: new Date().toISOString(),
            timestamp: Date.now(),
            type: 'fetch'
          });
        }
        throw err;
      }
    };

    // Capture XMLHttpRequest
    window.XMLHttpRequest.prototype.open = function (method, url, ...rest) {
      const startTime = Date.now();

      this.addEventListener('loadend', function () {
        if (isCapturing && networkRequests.length < MAX_LOGS) {
          networkRequests.push({
            id: `xhr_${Date.now()}_${Math.random()}`,
            url: String(url).substring(0, 200),
            method: method,
            status: this.status,
            statusText: this.statusText,
            duration: Date.now() - startTime,
            time: new Date().toISOString(),
            timestamp: Date.now(),
            type: 'xhr'
          });
        }
      });

      return originalXHR.apply(this, [method, url, ...rest]);
    };
  };

  const stop = () => {
    if (!isCapturing) return;
    isCapturing = false;

    console.log = originalLog;
    console.error = originalError;
    console.warn = originalWarn;
    console.info = originalInfo;
    window.fetch = originalFetch;
    window.XMLHttpRequest.prototype.open = originalXHR;

    console.log('🎥 Recording logger stopped - captured:', {
      consoleLogs: logs.length,
      networkRequests: networkRequests.length
    });
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
    this.displayStream = null;
    this.micStream = null;
    this.combinedStream = null;
    this.micTrack = null;
    this.chunks = [];
    this.timer = null;
    this.logger = null;
    this.updateScheduled = false;
  }

  setState(updates) {
    const hasChanges = Object.keys(updates).some(key => this.state[key] !== updates[key]);
    if (!hasChanges) return;

    this.state = { ...this.state, ...updates };

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

      this.logger = createOptimizedLogger();
      this.logger.start();

      // Get display stream with system audio
      this.displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          cursor: "always",
          frameRate: 15
        },
        audio: true, // System audio
      });

      // Get microphone audio separately
      try {
        this.micStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });
      } catch (micError) {
        console.warn('Microphone access denied:', micError);
      }

      // Combine streams
      this.combinedStream = new MediaStream();

      // Add video from display
      this.displayStream.getVideoTracks().forEach(track => {
        this.combinedStream.addTrack(track);
      });

      // Add system audio from display
      this.displayStream.getAudioTracks().forEach(track => {
        this.combinedStream.addTrack(track);
      });

      // Add microphone audio if available
      if (this.micStream) {
        this.micStream.getAudioTracks().forEach(track => {
          this.combinedStream.addTrack(track);
          this.micTrack = track; // Store for mute control
        });
      }

      await this.showCountdown();

      this.recorder = new MediaRecorder(this.combinedStream, {
        mimeType: "video/webm;codecs=vp8",
        videoBitsPerSecond: 1000000
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

        requestIdleCallback(() => {
          this.processRecordingData(url, blob);
        });
      };

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

    const logData = this.logger.getData();
    const issues = this.detectIssues(logData);

    this.previewData = {
      previewUrl: url,
      blob: blob,
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

    // Only flag ERROR level console logs as issues
    data.consoleLogs
      .filter(log => log.level === 'error')
      .forEach(log => {
        issues.push({
          id: `console_${log.timestamp}`,
          type: 'console_error',
          message: log.message,
          severity: 'high',
          source: 'console',
          time: log.time,
          timestamp: log.timestamp
        });
      });

    // Only flag WARN level as medium severity issues
    data.consoleLogs
      .filter(log => log.level === 'warn')
      .forEach(log => {
        issues.push({
          id: `console_warn_${log.timestamp}`,
          type: 'console_warning',
          message: log.message,
          severity: 'medium',
          source: 'console',
          time: log.time,
          timestamp: log.timestamp
        });
      });

    // Only flag failed network requests (4xx, 5xx, ERR) as issues
    data.networkLogs
      .filter(req => req.status >= 400 || req.status === 'ERR')
      .forEach(req => {
        issues.push({
          id: `network_${req.timestamp}`,
          type: 'network_error',
          message: `${req.method} ${req.url} - ${req.status}${req.error ? ` (${req.error})` : ''}`,
          severity: req.status >= 500 || req.status === 'ERR' ? 'high' : 'medium',
          source: 'network',
          time: req.time,
          timestamp: req.timestamp,
          requestData: req
        });
      });

    console.log('🐛 Issues detected:', {
      total: issues.length,
      byType: {
        errors: issues.filter(i => i.type === 'console_error').length,
        warnings: issues.filter(i => i.type === 'console_warning').length,
        network: issues.filter(i => i.type === 'network_error').length
      }
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

    // Only toggle microphone track, not system audio
    if (this.micTrack) {
      this.micTrack.enabled = !newMutedState;
    }
  }

  startTimer() {
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
    if (this.displayStream) {
      this.displayStream.getTracks().forEach(track => track.stop());
      this.displayStream = null;
    }
    if (this.micStream) {
      this.micStream.getTracks().forEach(track => track.stop());
      this.micStream = null;
    }
    if (this.combinedStream) {
      this.combinedStream.getTracks().forEach(track => track.stop());
      this.combinedStream = null;
    }
    if (this.logger) {
      this.logger.stop();
      this.logger = null;
    }
    this.recorder = null;
    this.micTrack = null;
    this.chunks = [];
  }

  setShowPreview(value) {
    this.setState({ showPreview: value });
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
  const { activeSuite, ui, actions } = useApp();
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
          firestoreService={actions}
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