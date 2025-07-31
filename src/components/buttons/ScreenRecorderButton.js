/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { VideoCameraIcon, XMarkIcon } from '@heroicons/react/24/outline';

const ScreenRecorderButton = ({ setShowBugForm, actions }) => {
    const [isRecording, setIsRecording] = useState(false);
    const [timer, setTimer] = useState(0);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [showPreview, setShowPreview] = useState(false);
    const timerRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const networkErrorsRef = useRef([]);
    const chunksRef = useRef([]);
    const networkLogsRef = useRef([]);

    useEffect(() => {
        if (isRecording) {
            timerRef.current = setInterval(() => {
                setTimer((prev) => prev + 1);
            }, 1000);

            const observer = new PerformanceObserver((list) => {
                list.getEntries().forEach((entry) => {
                    if (entry.entryType === 'resource') {
                        networkLogsRef.current.push({
                            url: entry.name,
                            type: entry.initiatorType,
                            status: entry.responseStatus || 'pending',
                            timestamp: new Date().toISOString(),
                        });
                        if (entry.responseStatus && (entry.responseStatus < 200 || entry.responseStatus >= 400)) {
                            networkErrorsRef.current.push({
                                url: entry.name,
                                status: entry.responseStatus,
                                timestamp: new Date().toISOString(),
                            });
                            stopRecording(true);
                        }
                    }
                });
            });
            observer.observe({ entryTypes: ['resource'] });

            return () => {
                clearInterval(timerRef.current);
                observer.disconnect();
            };
        }
    }, [isRecording]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getDisplayMedia({
                video: { frameRate: 30 },
                audio: false,
            });
            mediaRecorderRef.current = new MediaRecorder(stream, {
                mimeType: 'video/webm;codecs=vp9',
                videoBitsPerSecond: 500000,
            });

            mediaRecorderRef.current.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    chunksRef.current.push(event.data);
                }
            };

            mediaRecorderRef.current.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'video/webm' });
                setPreviewUrl(URL.createObjectURL(blob));
                setShowPreview(true);
                chunksRef.current = [];
            };

            mediaRecorderRef.current.start(1000);
            setIsRecording(true);
            actions.ui.showNotification('info', 'Screen recording started', 3000);
        } catch (error) {
            actions.ui.showNotification('error', 'Failed to start recording', 5000);
            console.error('Recording error:', error);
        }
    };

    const stopRecording = async (isError = false) => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            if (isError && networkErrorsRef.current.length > 0) {
                const bugData = {
                    title: `Network Error: ${networkErrorsRef.current[0].status || 'Unknown'}`,
                    description: `Auto-detected network error during recording:\n${JSON.stringify(networkErrorsRef.current, null, 2)}`,
                    status: 'open',
                    severity: 'high',
                    created_at: new Date().toISOString(),
                };
                await actions.bugs.createBug(bugData);
                setShowBugForm(true);
                actions.ui.showNotification('info', 'Bug created for network error', 3000);
            }
        }
    };

    const handleSaveRecording = async () => {
        try {
            const blob = await fetch(previewUrl).then((res) => res.blob());
            const result = await actions.recordings.saveRecording(blob, networkErrorsRef.current);
            if (result.success) {
                actions.ui.showNotification('success', 'Recording saved', 3000);
                setShowPreview(false);
                setPreviewUrl(null);
                networkErrorsRef.current = [];
                networkLogsRef.current = [];
            }
        } catch (error) {
            actions.ui.showNotification('error', 'Failed to save recording', 5000);
            console.error('Save recording error:', error);
        }
    };

    const handleDiscardRecording = () => {
        setShowPreview(false);
        setPreviewUrl(null);
        networkErrorsRef.current = [];
        networkLogsRef.current = [];
        actions.ui.showNotification('info', 'Recording discarded', 3000);
    };

    const handleRecordingToggle = async () => {
        if (!isRecording) {
            await startRecording();
        } else {
            await stopRecording();
        }
    };

    return (
        <>
            <button
                onClick={handleRecordingToggle}
                className={`flex items-center space-x-2 px-3 py-2 text-sm rounded-md transition-colors min-w-[120px] sm:min-w-[140px] md:min-w-[160px] justify-center ${
                    isRecording
                        ? 'text-red-700 bg-red-100 hover:bg-red-200'
                        : 'text-gray-700 hover:bg-teal-100 hover:text-teal-700'
                }`}
                title={isRecording ? 'Stop Recording' : 'Start Recording'}
            >
                <VideoCameraIcon className="h-4 w-4 flex-shrink-0" />
                <span className="inline text-center whitespace-nowrap overflow-hidden text-ellipsis min-w-[80px] sm:min-w-[100px]">
                    {isRecording ? `Stop (${formatTime(timer).padEnd(5, ' ')})` : 'Record Screen'}
                </span>
            </button>

            {showPreview && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-3xl w-full">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-medium">Recording Preview</h3>
                            <button onClick={handleDiscardRecording}>
                                <XMarkIcon className="h-6 w-6 text-gray-500" />
                            </button>
                        </div>
                        <video src={previewUrl} controls className="w-full max-h-96 mb-4" />
                        <div className="flex justify-end space-x-2">
                            <button
                                onClick={handleDiscardRecording}
                                className="px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                            >
                                Discard
                            </button>
                            <button
                                onClick={handleSaveRecording}
                                className="px-4 py-2 text-sm text-white bg-teal-600 hover:bg-teal-700 rounded"
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default ScreenRecorderButton;