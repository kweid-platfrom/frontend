// hooks/useRecording.js - SIMPLIFIED VERSION
'use client';
import { useState, useRef } from 'react';

export const useRecording = () => {
  const [state, setState] = useState({
    isRecording: false,
    isPaused: false,
    recordingTime: 0,
    showCountdown: 0,
    micMuted: false
  });

  const [data, setData] = useState({
    consoleLogs: [],
    networkLogs: [],
    detectedIssues: [],
    comments: []
  });

  const [previewData, setPreviewData] = useState(null);
  const [error, setError] = useState(null);

  // Refs for recording
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const originalConsoleRef = useRef({});
  const originalFetchRef = useRef(null);

  // Simple console capture
  const startConsoleCapture = () => {
    ['log', 'error', 'warn'].forEach(level => {
      originalConsoleRef.current[level] = console[level];
      console[level] = (...args) => {
        setData(prev => ({
          ...prev,
          consoleLogs: [...prev.consoleLogs, {
            level,
            message: args.join(' '),
            time: new Date().toISOString(),
            timestamp: Date.now()
          }]
        }));
        originalConsoleRef.current[level].apply(console, args);
      };
    });
  };

  // Simple network capture
  const startNetworkCapture = () => {
    originalFetchRef.current = window.fetch;
    window.fetch = async (...args) => {
      try {
        const response = await originalFetchRef.current(...args);
        setData(prev => ({
          ...prev,
          networkLogs: [...prev.networkLogs, {
            url: args[0],
            method: args[1]?.method || 'GET',
            status: response.status,
            time: new Date().toISOString(),
            timestamp: Date.now()
          }]
        }));
        return response;
      } catch (error) {
        setData(prev => ({
          ...prev,
          networkLogs: [...prev.networkLogs, {
            url: args[0],
            method: args[1]?.method || 'GET',
            status: 'ERROR',
            error: error.message,
            time: new Date().toISOString(),
            timestamp: Date.now()
          }]
        }));
        throw error;
      }
    };
  };

  // Stop captures
  const stopCaptures = () => {
    // Restore console
    Object.keys(originalConsoleRef.current).forEach(level => {
      console[level] = originalConsoleRef.current[level];
    });
    originalConsoleRef.current = {};

    // Restore fetch
    if (originalFetchRef.current) {
      window.fetch = originalFetchRef.current;
      originalFetchRef.current = null;
    }
  };

  // Timer functions
  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setState(prev => 
        prev.isPaused ? prev : { ...prev, recordingTime: prev.recordingTime + 1 }
      );
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  // Countdown
  const showCountdown = () => {
    return new Promise(resolve => {
      let count = 3;
      setState(prev => ({ ...prev, showCountdown: count }));
      
      const countdown = setInterval(() => {
        count--;
        if (count > 0) {
          setState(prev => ({ ...prev, showCountdown: count }));
        } else {
          setState(prev => ({ ...prev, showCountdown: 0 }));
          clearInterval(countdown);
          resolve();
        }
      }, 1000);
    });
  };

  // Detect issues from data
  const detectIssues = () => {
    const issues = [];
    
    data.consoleLogs.forEach(log => {
      if (log.level === 'error' || log.level === 'warn') {
        issues.push({
          id: `console_${log.timestamp}`,
          type: 'console_error',
          message: log.message,
          severity: log.level === 'error' ? 'high' : 'medium',
          source: 'console',
          time: log.time,
          timestamp: log.timestamp
        });
      }
    });

    data.networkLogs.forEach(req => {
      if (req.status >= 400 || req.status === 'ERROR') {
        issues.push({
          id: `network_${req.timestamp}`,
          type: 'network_error',
          message: `${req.method} ${req.url} - ${req.status}`,
          severity: req.status >= 500 || req.status === 'ERROR' ? 'high' : 'medium',
          source: 'network',
          time: req.time,
          timestamp: req.timestamp
        });
      }
    });

    setData(prev => ({ ...prev, detectedIssues: issues }));
  };

  const actions = {
    async startRecording() {
      try {
        setError(null);
        
        // Clear previous data
        setData({
          consoleLogs: [],
          networkLogs: [],
          detectedIssues: [],
          comments: []
        });
        setState(prev => ({ ...prev, recordingTime: 0 }));

        // Start captures
        startConsoleCapture();
        startNetworkCapture();

        // Get screen capture
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: { cursor: "always" },
          audio: true,
        });

        streamRef.current = stream;

        // Show countdown AFTER getting permissions
        await showCountdown();

        // Create recorder
        const recorder = new MediaRecorder(stream, {
          mimeType: "video/webm; codecs=vp9"
        });

        chunksRef.current = [];

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            chunksRef.current.push(e.data);
          }
        };

        recorder.onstop = () => {
          const blob = new Blob(chunksRef.current, { type: "video/webm" });
          const url = URL.createObjectURL(blob);
          
          // Detect issues before showing preview
          detectIssues();
          
          // Create video element to get duration
          const video = document.createElement('video');
          video.src = url;
          video.onloadedmetadata = () => {
            const formatTime = (s) => {
              const sec = Math.floor(s % 60).toString().padStart(2, '0');
              const min = Math.floor(s / 60).toString();
              return `${min}:${sec}`;
            };

            setPreviewData({
              previewUrl: url,
              duration: formatTime(video.duration),
              data: { ...data }
            });
          };

          setState(prev => ({ 
            ...prev, 
            isRecording: false, 
            isPaused: false 
          }));
          stopTimer();
          stopCaptures();
        };

        recorder.start();
        mediaRecorderRef.current = recorder;
        setState(prev => ({ ...prev, isRecording: true }));
        startTimer();

        return { success: true };
      } catch (error) {
        setError(error.message);
        stopCaptures();
        return { success: false, error: error.message };
      }
    },

    pauseRecording() {
      if (mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.pause();
        setState(prev => ({ ...prev, isPaused: true }));
      }
    },

    resumeRecording() {
      if (mediaRecorderRef.current?.state === 'paused') {
        mediaRecorderRef.current.resume();
        setState(prev => ({ ...prev, isPaused: false }));
      }
    },

    stopRecording() {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    },

    toggleMute() {
      const newMutedState = !state.micMuted;
      setState(prev => ({ ...prev, micMuted: newMutedState }));
      
      if (streamRef.current) {
        streamRef.current.getAudioTracks().forEach(track => {
          track.enabled = !newMutedState;
        });
      }
    },

    addComment(text, videoTime) {
      const comment = {
        id: `comment_${Date.now()}`,
        text: text.trim(),
        time: parseFloat(videoTime.toFixed(1)),
        timestamp: Date.now(),
        createdAt: new Date().toISOString()
      };
      
      setData(prev => ({
        ...prev,
        comments: [...prev.comments, comment]
      }));
      
      return comment;
    },

    clearPreview() {
      setPreviewData(null);
    },

    clearError() {
      setError(null);
    }
  };

  return {
    state,
    data,
    previewData,
    error,
    actions,
    isActive: state.isRecording || state.isPaused,
    hasPreview: !!previewData,
    hasError: !!error,
    formatTime: (seconds) => {
      const sec = Math.floor(seconds % 60).toString().padStart(2, '0');
      const min = Math.floor(seconds / 60).toString();
      return `${min}:${sec}`;
    }
  };
};