'use client';
import { useState, useRef, useEffect, useCallback } from 'react';

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
  const startConsoleCapture = useCallback(() => {
    ['log', 'error', 'warn'].forEach(level => {
      originalConsoleRef.current[level] = console[level];
      console[level] = (...args) => {
        const logEntry = {
          level,
          message: args.join(' '),
          time: new Date().toISOString(),
          timestamp: Date.now()
        };
        
        setData(prev => ({
          ...prev,
          consoleLogs: [...prev.consoleLogs, logEntry]
        }));
        originalConsoleRef.current[level].apply(console, args);
      };
    });
  }, []);

  // Simple network capture
  const startNetworkCapture = useCallback(() => {
    originalFetchRef.current = window.fetch;
    window.fetch = async (...args) => {
      const startTime = Date.now();
      try {
        const response = await originalFetchRef.current(...args);
        const networkEntry = {
          url: args[0],
          method: args[1]?.method || 'GET',
          status: response.status,
          time: new Date().toISOString(),
          timestamp: startTime
        };
        
        setData(prev => ({
          ...prev,
          networkLogs: [...prev.networkLogs, networkEntry]
        }));
        return response;
      } catch (error) {
        const networkEntry = {
          url: args[0],
          method: args[1]?.method || 'GET',
          status: 'ERROR',
          error: error.message,
          time: new Date().toISOString(),
          timestamp: startTime
        };
        
        setData(prev => ({
          ...prev,
          networkLogs: [...prev.networkLogs, networkEntry]
        }));
        throw error;
      }
    };
  }, []);

  // Stop captures
  const stopCaptures = useCallback(() => {
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
  }, []);

  // Timer functions
  const startTimer = useCallback(() => {
    timerRef.current = setInterval(() => {
      setState(prev => 
        prev.isPaused ? prev : { ...prev, recordingTime: prev.recordingTime + 1 }
      );
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Countdown
  const showCountdown = useCallback(() => {
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
  }, []);

  // Process recording data when it stops
  const processRecordingData = useCallback(async (blob, finalData) => {
    console.log('Processing recording data:', {
      blobSize: blob.size,
      blobType: blob.type,
      dataKeys: Object.keys(finalData)
    });

    const url = URL.createObjectURL(blob);
    
    // Try to get video duration
    let duration = 30; // default fallback
    
    try {
      duration = await new Promise((resolve, reject) => {
        const video = document.createElement('video');
        video.preload = 'metadata';
        
        const timeout = setTimeout(() => {
          console.warn('Video duration detection timeout');
          resolve(30); // fallback
        }, 3000);
        
        video.onloadedmetadata = () => {
          clearTimeout(timeout);
          const videoDuration = video.duration;
          console.log('Video duration detected:', videoDuration);
          resolve(videoDuration && isFinite(videoDuration) && videoDuration > 0 ? videoDuration : 30);
        };

        video.onerror = (error) => {
          clearTimeout(timeout);
          console.warn('Video duration detection error:', error);
          resolve(30); // fallback
        };

        video.src = url;
      });
    } catch (error) {
      console.warn('Failed to detect video duration:', error);
      duration = 30; // fallback
    }

    console.log('Final duration determined:', duration);

    // Create preview data
    const preview = {
      previewUrl: url,
      blob: blob,
      duration: duration,
      data: finalData
    };

    console.log('Setting preview data:', {
      hasBlob: !!preview.blob,
      blobSize: preview.blob?.size,
      duration: preview.duration,
      hasUrl: !!preview.previewUrl
    });

    setPreviewData(preview);
  }, []);

  const actions = {
    async startRecording() {
      try {
        setError(null);
        console.log('Starting recording...');
        
        // Clear previous data
        setData({
          consoleLogs: [],
          networkLogs: [],
          detectedIssues: [],
          comments: []
        });
        setState(prev => ({ ...prev, recordingTime: 0 }));
        setPreviewData(null);

        // Start captures
        startConsoleCapture();
        startNetworkCapture();

        // Get screen capture
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: { cursor: 'always' },
          audio: true,
        });

        streamRef.current = stream;

        // Show countdown AFTER getting permissions
        await showCountdown();

        // Create recorder with explicit MIME type check
        let mimeType = 'video/webm; codecs=vp9';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'video/webm; codecs=vp8';
          if (!MediaRecorder.isTypeSupported(mimeType)) {
            mimeType = 'video/webm';
          }
        }

        const recorder = new MediaRecorder(stream, { mimeType });
        chunksRef.current = [];

        recorder.ondataavailable = (e) => {
          console.log('Data available:', e.data.size, 'bytes');
          if (e.data.size > 0) {
            chunksRef.current.push(e.data);
          }
        };

        recorder.onstop = async () => {
          console.log('Recorder stopped, processing data...', {
            chunksCount: chunksRef.current.length,
            totalSize: chunksRef.current.reduce((sum, chunk) => sum + chunk.size, 0)
          });

          // Create blob immediately
          const blob = new Blob(chunksRef.current, { type: mimeType });
          
          console.log('Blob created:', {
            size: blob.size,
            type: blob.type
          });

          // Get current data state at time of stopping
          setData(currentData => {
            // Detect issues
            const issues = [];
            
            currentData.consoleLogs.forEach(log => {
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

            currentData.networkLogs.forEach(req => {
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

            const finalData = { ...currentData, detectedIssues: issues };
            
            console.log('Final data prepared:', {
              consoleLogs: finalData.consoleLogs.length,
              networkLogs: finalData.networkLogs.length,
              detectedIssues: finalData.detectedIssues.length,
              comments: finalData.comments.length
            });

            // Process recording data asynchronously
            processRecordingData(blob, finalData);
            
            return finalData;
          });

          setState(prev => ({ 
            ...prev, 
            isRecording: false, 
            isPaused: false 
          }));
          stopTimer();
          stopCaptures();
        };

        recorder.onerror = (event) => {
          console.error('MediaRecorder error:', event);
          setError('Recording failed: ' + (event.error?.message || 'Unknown error'));
        };

        recorder.start(1000); // Collect data every second
        mediaRecorderRef.current = recorder;
        
        console.log('MediaRecorder started:', {
          state: recorder.state,
          mimeType: recorder.mimeType
        });
        
        setState(prev => ({ ...prev, isRecording: true }));
        startTimer();

        return { success: true };
      } catch (error) {
        console.error('Failed to start recording:', error);
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
      console.log('Stop recording requested');
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        console.log('Stopping MediaRecorder...');
        mediaRecorderRef.current.stop();
      }
      if (streamRef.current) {
        console.log('Stopping stream tracks...');
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
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
      console.log('Clearing preview data');
      if (previewData?.previewUrl) {
        URL.revokeObjectURL(previewData.previewUrl);
      }
      setPreviewData(null);
    },

    clearError() {
      setError(null);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('useRecording cleanup');
      if (previewData?.previewUrl) {
        URL.revokeObjectURL(previewData.previewUrl);
      }
      stopCaptures();
      stopTimer();
    };
  }, [previewData?.previewUrl, stopCaptures, stopTimer]);

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
      if (!isFinite(seconds) || seconds < 0) return '0:00';
      const sec = Math.floor(seconds % 60).toString().padStart(2, '0');
      const min = Math.floor(seconds / 60).toString();
      return `${min}:${sec}`;
    }
  };
};