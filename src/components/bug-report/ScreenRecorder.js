"use client"
import React, { useState, useRef, useEffect } from "react";
import { Video } from "lucide-react";

const ScreenRecorderButton = ({ onRecordingComplete }) => {
    const [isRecording, setIsRecording] = useState(false);
    const [showOverlay, setShowOverlay] = useState(false);
    const [stream, setStream] = useState(null);
    const [mediaRecorder, setMediaRecorder] = useState(null);
    const [recordedChunks, setRecordedChunks] = useState([]);
    const [countdown, setCountdown] = useState(3);
    const [recordingTime, setRecordingTime] = useState(0);
    const [videoPreviewUrl, setVideoPreviewUrl] = useState(null);

    const buttonRef = useRef(null);
    const overlayRef = useRef(null);
    const timerRef = useRef(null);
    const videoRef = useRef(null);

    // Calculate overlay position relative to button
    const [overlayPosition, setOverlayPosition] = useState({ top: 0, left: 0 });

    useEffect(() => {
        if (showOverlay && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            setOverlayPosition({
                top: rect.top - 8, // Position slightly above the button
                left: rect.left - 176 + (rect.width / 2) // Center the 350px overlay
            });
        }
    }, [showOverlay]);

    // Handle countdown
    useEffect(() => {
        if (countdown > 0 && showOverlay && !isRecording) {
            const timer = setTimeout(() => {
                setCountdown(countdown - 1);
            }, 1000);

            return () => clearTimeout(timer);
        } else if (countdown === 0 && !isRecording && showOverlay) {
            startRecording();
        }
    }, [countdown, showOverlay, isRecording]);

    // Clean up on unmount
    useEffect(() => {
        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, [stream]);

    // Handle clicking outside of overlay
    useEffect(() => {
        function handleClickOutside(event) {
            if (overlayRef.current &&
                !overlayRef.current.contains(event.target) &&
                buttonRef.current &&
                !buttonRef.current.contains(event.target) &&
                !isRecording) {
                setShowOverlay(false);
                setCountdown(3);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isRecording]);

    const toggleOverlay = () => {
        if (isRecording) {
            stopRecording();
        } else {
            setShowOverlay(true);
            setCountdown(3);
        }
    };

    const startRecording = async () => {
        try {
            const displayStream = await navigator.mediaDevices.getDisplayMedia({
                video: { cursor: "always" },
                audio: true
            });

            setStream(displayStream);

            const recorder = new MediaRecorder(displayStream);
            setMediaRecorder(recorder);

            recorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    setRecordedChunks(prev => [...prev, event.data]);
                }
            };

            recorder.onstop = handleRecordingStop;

            recorder.start();
            setIsRecording(true);

            // Start recording timer
            timerRef.current = setInterval(() => {
                setRecordingTime(prevTime => prevTime + 1);
            }, 1000);

        } catch (error) {
            console.error("Error starting screen recording:", error);
            setShowOverlay(false);
            setCountdown(3);
        }
    };

    const stopRecording = () => {
        if (mediaRecorder && isRecording) {
            mediaRecorder.stop();

            // Stop all tracks
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }

            // Clear timer
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        }
    };

    const handleRecordingStop = () => {
        // Create a blob from the recorded chunks
        const blob = new Blob(recordedChunks, { type: "video/webm" });

        // Create a URL for the blob
        const url = URL.createObjectURL(blob);
        setVideoPreviewUrl(url);

        // Reset recording state
        setIsRecording(false);
        setRecordingTime(0);

        // Handle the recording data (you can save it, send it, etc.)
        if (onRecordingComplete) {
            onRecordingComplete({
                blob,
                url,
                type: "video/webm"
            });
        }
    };

    const cancelRecording = () => {
        setShowOverlay(false);
        setCountdown(3);

        // If recording is active, stop it
        if (isRecording) {
            stopRecording();
        }

        // Clear any recorded data
        setRecordedChunks([]);
        setVideoPreviewUrl(null);
    };

    // Format seconds into MM:SS
    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="relative">
            {/* Recording Button */}
            <button
                ref={buttonRef}
                className="text-[#2D3142] px-3 py-2 text-sm rounded-xs flex items-center space-x-2 hover:bg-[#A5D6A7] hover:text-white transition"
                onClick={toggleOverlay}
            >
                <Video className={`h-4 w-4 ${isRecording ? "text-red-500" : ""}`} />
                <span className="hidden md:inline">{isRecording ? "Stop Recording" : "Record Screen"}</span>
                {isRecording && <span className="ml-1 text-red-500 animate-pulse">●</span>}
            </button>

            {/* Screen Recorder Overlay */}
            {showOverlay && (
                <div
                    ref={overlayRef}
                    className="fixed bg-white border border-gray-300 shadow-xl rounded-lg text-sm z-50 w-96"
                    style={{
                        top: `${overlayPosition.top}px`,
                        left: `${overlayPosition.left}px`
                    }}
                >
                    <div className="p-4">
                        <h3 className="text-lg font-semibold mb-3">Screen Recording</h3>

                        {countdown > 0 && !isRecording ? (
                            <div className="text-center py-6">
                                <div className="text-5xl font-bold text-indigo-600 mb-2">{countdown}</div>
                                <p className="text-gray-600">Recording will start in {countdown} second{countdown !== 1 ? 's' : ''}...</p>
                            </div>
                        ) : isRecording ? (
                            <div className="text-center py-4">
                                <div className="inline-flex items-center justify-center bg-red-100 text-red-800 px-3 py-1 rounded-full mb-2">
                                    <span className="animate-pulse mr-2">●</span>
                                    <span className="font-medium">Recording: {formatTime(recordingTime)}</span>
                                </div>
                                <p className="text-gray-600 mb-4">Recording your screen. Click &quot;Stop&quot; when you&apos;re done.</p>
                                <button
                                    onClick={stopRecording}
                                    className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-md transition"
                                >
                                    Stop Recording
                                </button>
                            </div>
                        ) : videoPreviewUrl ? (
                            <div className="py-3">
                                <p className="text-gray-700 mb-2">Recording Preview:</p>
                                <video
                                    ref={videoRef}
                                    src={videoPreviewUrl}
                                    controls
                                    className="w-full h-40 bg-black rounded-md mb-3"
                                />
                                <div className="flex space-x-2">
                                    <button
                                        onClick={cancelRecording}
                                        className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-50 transition"
                                    >
                                        Discard
                                    </button>
                                    <button
                                        onClick={() => {
                                            setShowOverlay(false);
                                            // Reset for next recording
                                            setVideoPreviewUrl(null);
                                            setRecordedChunks([]);
                                        }}
                                        className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md transition"
                                    >
                                        Keep Recording
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="py-3">
                                <p className="text-gray-600 mb-4">Click below to start recording your screen.</p>
                                <div className="flex space-x-2">
                                    <button
                                        onClick={cancelRecording}
                                        className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-50 transition"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={() => setCountdown(3)}
                                        className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-md transition"
                                    >
                                        Start Recording
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ScreenRecorderButton;