"use client"

import React, { useState, useEffect } from "react";
import { Play, Trash2, Download, Clock, FileText } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function RecordingsPage() {
    const [recordings, setRecordings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedRecording, setSelectedRecording] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Fetch all recordings on component mount
    useEffect(() => {
        const fetchRecordings = async () => {
            try {
                const response = await fetch('/api/recordings');

                if (!response.ok) {
                    throw new Error(`Error fetching recordings: ${response.status}`);
                }

                const data = await response.json();
                setRecordings(data.recordings);
            } catch (err) {
                console.error("Failed to fetch recordings:", err);
                setError("Failed to load recordings. Please try again later.");
            } finally {
                setLoading(false);
            }
        };

        fetchRecordings();
    }, []);

    // Format file size for display
    const formatFileSize = (bytes) => {
        if (bytes < 1024) return `${bytes} B`;
        else if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        else return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    // Format date for display
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Format duration for display (from seconds)
    const formatDuration = (seconds) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Handle opening the modal for recording playback
    const openRecordingModal = (recording) => {
        setSelectedRecording(recording);
        setIsModalOpen(true);
    };

    // Handle closing the modal
    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedRecording(null);
    };

    // Handle deleting a recording
    const deleteRecording = async (id) => {
        if (confirm("Are you sure you want to delete this recording? This action cannot be undone.")) {
            setIsDeleting(true);

            try {
                const response = await fetch(`/api/recordings/${id}`, {
                    method: 'DELETE',
                });

                if (!response.ok) {
                    throw new Error(`Error deleting recording: ${response.status}`);
                }

                // Remove the deleted recording from state
                setRecordings(recordings.filter(rec => rec.id !== id));

                // Close modal if the deleted recording was being viewed
                if (selectedRecording && selectedRecording.id === id) {
                    closeModal();
                }
            } catch (err) {
                console.error("Failed to delete recording:", err);
                alert("Failed to delete recording. Please try again.");
            } finally {
                setIsDeleting(false);
            }
        }
    };

    // Handle downloading a recording
    const downloadRecording = (recording) => {
        const a = document.createElement('a');
        a.href = recording.url;
        a.download = `Recording-${new Date(recording.timestamp).toISOString().slice(0, 10)}.webm`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Screen Recordings</h1>
                <Link href="/">
                    <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-md transition">
                        Back to Dashboard
                    </button>
                </Link>
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800"></div>
                </div>
            ) : error ? (
                <div className="bg-red-100 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                </div>
            ) : recordings.length === 0 ? (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FileText className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-700 mb-2">No recordings yet</h3>
                    <p className="text-gray-500 mb-4">
                        When you record your screen, your recordings will appear here.
                    </p>
                    <Link href="/">
                        <button className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md transition">
                            Record Screen
                        </button>
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {recordings.map((recording) => (
                        <div key={recording.id} className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition">
                            <div
                                className="h-40 bg-gray-100 relative cursor-pointer"
                                onClick={() => openRecordingModal(recording)}
                            >
                                {recording.thumbnailUrl ? (
                                    <Image
                                        src={recording.thumbnailUrl}
                                        alt={`Recording from ${formatDate(recording.timestamp)}`}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gray-200">
                                        <div className="text-gray-500 text-sm">No preview available</div>
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-black bg-opacity-20 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity">
                                    <div className="bg-white bg-opacity-90 rounded-full p-3">
                                        <Play className="h-8 w-8 text-green-600" />
                                    </div>
                                </div>
                            </div>

                            <div className="p-4">
                                <h3 className="font-medium text-gray-800 mb-2">
                                    Recording {formatDate(recording.timestamp)}
                                </h3>

                                <div className="flex items-center text-sm text-gray-500 mb-3">
                                    <Clock className="h-4 w-4 mr-1" />
                                    <span className="mr-3">{formatDuration(recording.duration)}</span>
                                    <span>{formatFileSize(recording.fileSize)}</span>
                                </div>

                                <div className="flex justify-between pt-2">
                                    <button
                                        onClick={() => deleteRecording(recording.id)}
                                        className="text-red-600 hover:text-red-800 transition"
                                        disabled={isDeleting}
                                    >
                                        <Trash2 className="h-5 w-5" />
                                    </button>

                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => downloadRecording(recording)}
                                            className="text-blue-600 hover:text-blue-800 transition"
                                        >
                                            <Download className="h-5 w-5" />
                                        </button>

                                        <button
                                            onClick={() => openRecordingModal(recording)}
                                            className="bg-green-600 hover:bg-green-700 text-white rounded-full p-1"
                                        >
                                            <Play className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Recording Modal */}
            {isModalOpen && selectedRecording && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl">
                        <div className="p-4 border-b flex justify-between items-center">
                            <h3 className="text-lg font-medium">
                                Recording from {formatDate(selectedRecording.timestamp)}
                            </h3>
                            <button
                                onClick={closeModal}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                &times;
                            </button>
                        </div>

                        <div className="p-4">
                            <video
                                src={selectedRecording.url}
                                controls
                                autoPlay
                                className="w-full h-auto bg-black rounded"
                                style={{ maxHeight: "70vh" }}
                            />
                        </div>

                        <div className="bg-gray-50 p-4 rounded-b-lg flex justify-between items-center">
                            <div className="text-sm text-gray-500">
                                <div className="mb-1">Duration: {formatDuration(selectedRecording.duration)}</div>
                                <div>Size: {formatFileSize(selectedRecording.fileSize)}</div>
                            </div>

                            <div className="flex space-x-3">
                                <button
                                    onClick={() => deleteRecording(selectedRecording.id)}
                                    className="bg-red-50 text-red-600 hover:bg-red-100 py-2 px-4 rounded transition flex items-center"
                                    disabled={isDeleting}
                                >
                                    <Trash2 className="h-4 w-4 mr-1" />
                                    {isDeleting ? "Deleting..." : "Delete"}
                                </button>

                                <button
                                    onClick={() => downloadRecording(selectedRecording)}
                                    className="bg-blue-50 text-blue-600 hover:bg-blue-100 py-2 px-4 rounded transition flex items-center"
                                >
                                    <Download className="h-4 w-4 mr-1" />
                                    Download
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}