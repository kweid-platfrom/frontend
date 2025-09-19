'use client';

import React, { useState, useEffect } from 'react';
import { Video, Plus, Pause, Play, Square } from 'lucide-react';
import RecorderControls from './RecorderControls';
import RecorderPreviewModal from './RecorderPreviewModal';
import { useApp } from '../../context/AppProvider';
import { openDB } from 'idb';

const formatTime = (s) => {
  const sec = Math.floor(s % 60).toString().padStart(2, '0');
  const min = Math.floor(s / 60).toString();
  return `${min}:${sec}`;
};

const attachConsoleCapture = (setState) => {
  const originalMethods = {};
  ["log", "error", "warn", "info"].forEach((level) => {
    originalMethods[level] = console[level];
    console[level] = (...args) => {
      const message = args.map(String).join(" ");
      const logEntry = { 
        level, 
        message, 
        time: new Date().toISOString(),
        timestamp: Date.now()
      };
      // Use setTimeout to prevent blocking the main thread
      setTimeout(() => {
        setState(prev => ({ consoleLogs: [...prev.consoleLogs, logEntry] }));
      }, 0);
      originalMethods[level].apply(console, args);
    };
  });
  return () => {
    Object.keys(originalMethods).forEach(level => {
      console[level] = originalMethods[level];
    });
  };
};

const attachNetworkCapture = (setState) => {
  const originalFetch = window.fetch;
  window.fetch = async (...args) => {
    const start = Date.now();
    const requestTime = new Date().toISOString();
    try {
      const response = await originalFetch(...args);
      const end = Date.now();
      const logEntry = {
        id: `req_${Date.now()}_${Math.random()}`,
        url: args[0],
        method: args[1]?.method || "GET",
        status: response.status,
        time: requestTime,
        duration: end - start,
        headers: Object.fromEntries(response.headers.entries ? [...response.headers.entries()] : []),
        responseText: response.status < 400 ? 'Success' : 'Error'
      };
      // Use setTimeout to prevent blocking the main thread
      setTimeout(() => {
        setState(prev => ({ networkLogs: [...prev.networkLogs, logEntry] }));
      }, 0);
      return response;
    } catch (err) {
      const logEntry = {
        id: `req_${Date.now()}_${Math.random()}`,
        url: args[0],
        method: args[1]?.method || "GET",
        status: "ERR",
        time: requestTime,
        duration: Date.now() - start,
        error: err.message
      };
      setTimeout(() => {
        setState(prev => ({ networkLogs: [...prev.networkLogs, logEntry] }));
      }, 0);
      throw err;
    }
  };

  const originalOpen = XMLHttpRequest.prototype.open;
  const originalSend = XMLHttpRequest.prototype.send;
  
  XMLHttpRequest.prototype.open = function (method, url, ...rest) {
    this.__method = method;
    this.__url = url;
    this.__startTime = Date.now();
    return originalOpen.apply(this, [method, url, ...rest]);
  };
  
  XMLHttpRequest.prototype.send = function (body) {
    const requestTime = new Date().toISOString();
    this.addEventListener("loadend", () => {
      const logEntry = {
        id: `xhr_${Date.now()}_${Math.random()}`,
        url: this.__url,
        method: this.__method,
        status: this.status,
        time: requestTime,
        duration: Date.now() - this.__startTime,
        headers: {},
        responseText: this.responseText?.substring(0, 200) + (this.responseText?.length > 200 ? '...' : '')
      };
      setTimeout(() => {
        setState(prev => ({ networkLogs: [...prev.networkLogs, logEntry] }));
      }, 0);
    });
    return originalSend.apply(this, [body]);
  };
  
  return () => {
    window.fetch = originalFetch;
    XMLHttpRequest.prototype.open = originalOpen;
    XMLHttpRequest.prototype.send = originalSend;
  };
};

const recordingStore = {
  state: {
    isRecording: false,
    isPaused: false,
    recordingTime: 0,
    showCountdown: 0,
    showPreview: false,
    previewUrl: null,
    duration: "0:00",
    consoleLogs: [],
    networkLogs: [],
    detectedIssues: [],
    comments: [],
    recorder: null,
    chunks: [],
    stream: null,
    cleanupConsole: null,
    cleanupNetwork: null,
    timerInterval: null,
    countdownInterval: null,
    micMuted: false, // Added centralized mute state
    audioStream: null, // Added separate audio stream tracking
  },
  listeners: [],
  setState: function(updates) {
    this.state = {...this.state, ...updates};
    this.listeners.forEach(listener => listener(this.state));
    // Use requestIdleCallback for non-critical IndexedDB operations
    if (window.requestIdleCallback) {
      window.requestIdleCallback(() => {
        this.saveToIndexedDB();
      });
    } else {
      setTimeout(() => this.saveToIndexedDB(), 100);
    }
  },
  saveToIndexedDB: function() {
    openDB('recordingStore', 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('state')) {
          db.createObjectStore('state');
        }
      },
    }).then(db => {
      // Only save serializable state
      const serializableState = {
        ...this.state,
        recorder: null,
        stream: null,
        audioStream: null,
        cleanupConsole: null,
        cleanupNetwork: null,
        timerInterval: null,
        countdownInterval: null,
      };
      db.put('state', 'recording', serializableState);
    }).catch(err => {
      console.warn('IndexedDB save failed:', err);
    });
  },
  subscribe: function(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  },
  actions: {
    startRecording: async () => {
      try {
        recordingStore.setState({
          chunks: [],
          consoleLogs: [],
          networkLogs: [],
          comments: [],
          detectedIssues: [],
          recordingTime: 0,
          isPaused: false,
          micMuted: false,
        });

        const cleanupConsole = attachConsoleCapture(recordingStore.setState);
        recordingStore.setState({ cleanupConsole });
        
        const cleanupNetwork = attachNetworkCapture(recordingStore.setState);
        recordingStore.setState({ cleanupNetwork });

        // Get separate audio stream for better control
        const audioStream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            sampleRate: 44100
          }
        });
        recordingStore.setState({ audioStream });

        // Get display media with audio
        const displayStream = await navigator.mediaDevices.getDisplayMedia({
          video: { 
            cursor: "always",
            frameRate: 30
          },
          audio: true,
        });

        // Combine audio streams
        const combinedStream = new MediaStream([
          ...displayStream.getVideoTracks(),
          ...displayStream.getAudioTracks(),
          ...audioStream.getAudioTracks()
        ]);

        recordingStore.setState({ stream: combinedStream });

        let count = 3;
        recordingStore.setState({ showCountdown: count });
        
        const countdownInterval = setInterval(() => {
          count--;
          if (count > 0) {
            recordingStore.setState({ showCountdown: count });
          } else {
            clearInterval(countdownInterval);
            recordingStore.setState({ showCountdown: 0, countdownInterval: null });
            
            // Use a more compatible codec
            const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus') 
              ? 'video/webm;codecs=vp9,opus'
              : MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')
                ? 'video/webm;codecs=vp8,opus'
                : 'video/webm';

            const mediaRecorder = new MediaRecorder(combinedStream, {
              mimeType,
              videoBitsPerSecond: 2500000,
              audioBitsPerSecond: 128000
            });

            mediaRecorder.ondataavailable = (ev) => {
              if (ev.data && ev.data.size > 0) {
                // Use requestAnimationFrame to prevent blocking
                requestAnimationFrame(() => {
                  recordingStore.setState({
                    chunks: [...recordingStore.state.chunks, ev.data]
                  });
                });
              }
            };

            mediaRecorder.onstop = () => {
              const blob = new Blob(recordingStore.state.chunks, { type: mimeType });
              const url = URL.createObjectURL(blob);
              recordingStore.setState({ previewUrl: url, chunks: [] });

              const tempVideo = document.createElement("video");
              tempVideo.src = url;
              tempVideo.onloadedmetadata = () => {
                recordingStore.setState({ duration: formatTime(tempVideo.duration) });
              };

              recordingStore.state.cleanupConsole?.();
              recordingStore.state.cleanupNetwork?.();

              // Process issues asynchronously
              requestIdleCallback(() => {
                const issues = [];
                recordingStore.state.consoleLogs.forEach(log => {
                  if (log.level === 'error') {
                    issues.push({
                      id: `console_${Date.now()}_${Math.random()}`,
                      type: 'console_error',
                      message: log.message,
                      time: log.time,
                      severity: 'high',
                      source: 'console'
                    });
                  }
                });

                recordingStore.state.networkLogs.forEach(req => {
                  if (req.status >= 400 || req.status === 'ERR') {
                    issues.push({
                      id: `network_${Date.now()}_${Math.random()}`,
                      type: 'network_error',
                      message: `${req.method} ${req.url} - Status: ${req.status}`,
                      time: req.time,
                      severity: req.status >= 500 ? 'high' : 'medium',
                      source: 'network',
                      requestData: req
                    });
                  }
                });

                recordingStore.setState({ detectedIssues: issues, showPreview: true });
              });
            };

            mediaRecorder.start(1000); // Record in 1-second chunks
            recordingStore.setState({ recorder: mediaRecorder, isRecording: true });

            const timerInterval = setInterval(() => {
              if (!recordingStore.state.isPaused) {
                recordingStore.setState({ recordingTime: recordingStore.state.recordingTime + 1 });
              }
            }, 1000);
            recordingStore.setState({ timerInterval });
          }
        }, 1000);
        recordingStore.setState({ countdownInterval });
        
      } catch (err) {
        console.warn('User cancelled screen share or error occurred:', err);
        // Clean up any partial setup
        recordingStore.state.audioStream?.getTracks().forEach(track => track.stop());
        recordingStore.state.cleanupConsole?.();
        recordingStore.state.cleanupNetwork?.();
      }
    },

    pauseRecording: () => {
      if (recordingStore.state.recorder && !recordingStore.state.isPaused) {
        recordingStore.state.recorder.pause();
        recordingStore.setState({ isPaused: true });
      }
    },

    resumeRecording: () => {
      if (recordingStore.state.recorder && recordingStore.state.isPaused) {
        recordingStore.state.recorder.resume();
        recordingStore.setState({ isPaused: false });
      }
    },

    stopRecording: () => {
      if (recordingStore.state.recorder) {
        clearInterval(recordingStore.state.timerInterval);
        recordingStore.setState({ timerInterval: null, isRecording: false, isPaused: false });
        recordingStore.state.recorder.stop();
        recordingStore.state.stream?.getTracks().forEach(track => track.stop());
        recordingStore.state.audioStream?.getTracks().forEach(track => track.stop());
      }
    },

    toggleMute: () => {
      const newMutedState = !recordingStore.state.micMuted;
      recordingStore.setState({ micMuted: newMutedState });
      
      // Mute/unmute all audio tracks
      if (recordingStore.state.stream) {
        recordingStore.state.stream.getAudioTracks().forEach(track => {
          track.enabled = !newMutedState;
        });
      }
      if (recordingStore.state.audioStream) {
        recordingStore.state.audioStream.getAudioTracks().forEach(track => {
          track.enabled = !newMutedState;
        });
      }
    },

    setShowPreview: (value) => recordingStore.setState({ showPreview: value }),
  }
};

const useRecordingStore = () => {
  const [state, setState] = useState(recordingStore.state);
  
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Load saved state asynchronously
    requestIdleCallback(() => {
      openDB('recordingStore', 1, {
        upgrade(db) {
          if (!db.objectStoreNames.contains('state')) {
            db.createObjectStore('state');
          }
        },
      }).then(db => {
        return db.get('state', 'recording');
      }).then(savedState => {
        if (savedState) {
          // Only restore serializable state
          const restoreState = {
            ...savedState,
            isRecording: false,
            isPaused: false,
            showCountdown: 0,
            recorder: null,
            stream: null,
            audioStream: null,
            cleanupConsole: null,
            cleanupNetwork: null,
            timerInterval: null,
            countdownInterval: null,
          };
          recordingStore.setState(restoreState);
          setState(restoreState);
        }
      }).catch(err => {
        console.warn('Failed to restore recording state:', err);
      });
    });

    const unsubscribe = recordingStore.subscribe(setState);
    return unsubscribe;
  }, []);

  return { state, actions: recordingStore.actions };
};

const ScreenRecorderButton = ({ disabled = false, className = "", variant = "ghost", isPrimary = false }) => {
  const { activeSuite, ui } = useApp();
  const { state, actions } = useRecordingStore();

  const handleStart = () => {
    if (!activeSuite?.id) {
      ui.showNotification({
        id: 'no-suite-selected',
        type: 'warning',
        message: 'Please select a test suite first',
        duration: 3000,
      });
      return;
    }
    actions.startRecording();
  };

  return (
    <>
      <RecorderControls 
        disabled={disabled} 
        className={className} 
        variant={variant} 
        isPrimary={isPrimary} 
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
          firestoreService={{
            createRecording: async (suiteId, data) => {
              console.log('Creating recording for suite:', suiteId, data);
              return { 
                success: true, 
                data: { 
                  id: `rec_${Date.now()}`,
                  ...data 
                } 
              };
            },
            createBug: async (suiteId, data) => {
              console.log('Creating bug for suite:', suiteId, data);
              return { 
                success: true, 
                data: { 
                  id: `bug_${Date.now()}`,
                  ...data 
                } 
              };
            }
          }}
          onClose={() => actions.setShowPreview(false)}
          previewUrl={state.previewUrl}
          duration={state.duration}
          consoleLogs={state.consoleLogs}
          networkLogs={state.networkLogs}
          detectedIssues={state.detectedIssues}
          comments={state.comments}
        />
      )}
    </>
  );
};

export { useRecordingStore };
export default ScreenRecorderButton;