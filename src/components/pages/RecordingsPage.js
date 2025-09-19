'use client';
import React, { useState } from 'react';
import { 
  Video, 
  Play, 
  Eye, 
  Trash2,
  Share2,
  Bug,
  Search,
  Grid,
  List,
  AlertCircle
} from 'lucide-react';
import EnhancedScreenRecorder from '../recorder/EnhancedScreenRecorder';
import RecorderControls from '../recorder/RecorderControls';
import { useApp } from '../../context/AppProvider';

const Recordings = () => {
  const { 
    activeSuite,
    recordings: contextRecordings = [],
    isLoading,
    isTrialActive,
    ui,
    firestoreService
  } = useApp();

  const [viewingRecording, setViewingRecording] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [viewMode, setViewMode] = useState('grid');

  const safeRecordings = Array.isArray(contextRecordings) ? contextRecordings : [];
  const hasActiveSuite = activeSuite?.id;
  const isDataLoading = isLoading;
  const isSubscriptionActive = isTrialActive;

  const filteredRecordings = safeRecordings.filter(recording => {
    const matchesSearch = recording.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         recording.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || recording.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const handleViewRecording = (recording) => {
    setViewingRecording(recording);
  };

  const handleDeleteRecording = async (recordingId) => {
    if (!hasActiveSuite) return;
    if (!confirm('Are you sure you want to delete this recording? This action cannot be undone.')) {
      return;
    }
    try {
      const result = await firestoreService.deleteRecording(recordingId);
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to delete recording');
      }
      ui.showNotification({
        id: `delete-recording-success-${Date.now()}`,
        type: 'success',
        message: 'Recording deleted successfully',
        duration: 3000,
      });
    } catch (err) {
      console.error('Error deleting recording:', err);
      ui.showNotification({
        id: `delete-recording-error-${Date.now()}`,
        type: 'error',
        message: `Failed to delete recording: ${err.message}`,
        duration: 5000,
      });
    }
  };

  const handleShareRecording = (recording) => {
    const shareUrl = `${window.location.origin}/recordings/${recording.id}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      ui.showNotification({
        id: `share-recording-success-${Date.now()}`,
        type: 'success',
        message: 'Recording link copied to clipboard!',
        duration: 3000,
      });
    }).catch(() => {
      ui.showNotification({
        id: `share-recording-error-${Date.now()}`,
        type: 'error',
        message: `Failed to copy link. URL: ${shareUrl}`,
        duration: 5000,
      });
    });
  };

  const createBugsFromRecording = async (recording) => {
    if (!hasActiveSuite) return;
    if (!recording.detectedIssues?.length) {
      ui.showNotification({
        id: `no-issues-${Date.now()}`,
        type: 'warning',
        message: 'No issues detected in this recording',
        duration: 3000,
      });
      return;
    }
    try {
      let createdBugs = 0;
      for (const issue of recording.detectedIssues) {
        const bugData = {
          title: `Bug: ${issue.message}`,
          description: `Automatically detected from recording: ${recording.title}\n\nType: ${issue.type}\nSeverity: ${issue.severity}\nTime: ${issue.time}\n\nDetails: ${issue.message}`,
          severity: issue.severity,
          status: 'open',
          source: 'recording',
          recordingId: recording.id,
          recordingUrl: recording.videoUrl,
          suiteId: activeSuite.id
        };
        const result = await firestoreService.createBug(activeSuite.id, bugData);
        if (result.success) {
          createdBugs++;
          try {
            await firestoreService.linkRecordingToBug(activeSuite.id, recording.id, result.data.id);
          } catch (linkErr) {
            console.warn('Failed to link recording to bug:', linkErr);
          }
        }
      }
      if (createdBugs > 0) {
        ui.showNotification({
          id: `create-bugs-success-${Date.now()}`,
          type: 'success',
          message: `Created ${createdBugs} bug${createdBugs > 1 ? 's' : ''} from recording issues`,
          duration: 3000,
        });
      } else {
        throw new Error('Failed to create bugs from recording issues');
      }
    } catch (err) {
      console.error('Error creating bugs:', err);
      ui.showNotification({
        id: `create-bugs-error-${Date.now()}`,
        type: 'error',
        message: `Failed to create bugs from recording: ${err.message}`,
        duration: 5000,
      });
    }
  };

  const formatDuration = (duration) => {
    if (typeof duration === 'string') return duration;
    if (typeof duration === 'number') {
      const minutes = Math.floor(duration / 60);
      const seconds = Math.floor(duration % 60);
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    return '0:00';
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString();
  };

  const renderEmptyState = () => {
    if (isDataLoading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center text-gray-500">
            <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <div>Loading recordings...</div>
          </div>
        </div>
      );
    }
    if (!isSubscriptionActive) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center text-red-600">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <div className="text-lg font-medium mb-2">Subscription Required</div>
            <div className="text-sm">Your subscription is not active. Please upgrade to access recordings.</div>
          </div>
        </div>
      );
    }
    if (!hasActiveSuite) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center text-gray-500">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <div className="text-lg font-medium mb-2">No Suite Selected</div>
            <div className="text-sm">Please select a test suite to view recordings</div>
          </div>
        </div>
      );
    }
    if (filteredRecordings.length === 0) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center text-gray-500">
            <Video className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <div className="text-lg font-medium mb-2">No recordings found</div>
            {searchTerm || filterStatus !== 'all' ? (
              <div className="text-sm">Try adjusting your search or filter</div>
            ) : (
              <div className="text-sm">Create your first recording to get started</div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Recordings</h1>
            <p className="text-gray-600 dark:text-gray-400">
              {hasActiveSuite ? `Screen recordings for ${activeSuite.name}` : 'Select a suite to view recordings'}
            </p>
          </div>
          {isSubscriptionActive && hasActiveSuite && (
            <RecorderControls
              variant="contained"
              isPrimary={true}
            />
          )}
        </div>
        {hasActiveSuite && (
          <div className="flex items-center justify-between mb-6 bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search recordings..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div className="relative">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="appearance-none px-3 py-2 pr-8 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white bg-white"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="archived">Archived</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded ${
                  viewMode === 'grid' 
                    ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400' 
                    : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                }`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded ${
                  viewMode === 'list' 
                    ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400' 
                    : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 min-h-96">
          {renderEmptyState() || (
            <div className="p-6">
              <div className={viewMode === 'grid' 
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" 
                : "space-y-4"
              }>
                {filteredRecordings.map((recording) => (
                  <div
                    key={recording.id}
                    className={`bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden hover:shadow-lg transition-shadow ${
                      viewMode === 'list' ? 'flex items-center p-4' : ''
                    }`}
                  >
                    {viewMode === 'grid' ? (
                      <>
                        <div className="aspect-video bg-gray-100 dark:bg-gray-600 relative">
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Play className="w-8 h-8 text-gray-400" />
                          </div>
                          <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                            {formatDuration(recording.duration)}
                          </div>
                          {recording.detectedIssues?.length > 0 && (
                            <div className="absolute top-2 left-2 bg-red-600 text-white text-xs px-2 py-1 rounded flex items-center space-x-1">
                              <Bug className="w-3 h-3" />
                              <span>{recording.detectedIssues.length}</span>
                            </div>
                          )}
                        </div>
                        <div className="p-4">
                          <h3 className="font-medium text-gray-900 dark:text-white mb-1 truncate">
                            {recording.title || 'Untitled Recording'}
                          </h3>
                          <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                            {formatDate(recording.created_at)}
                          </div>
                          <div className="text-xs text-gray-400 dark:text-gray-500 mb-3">
                            {recording.consoleLogs?.length || 0} console logs • {recording.networkLogs?.length || 0} requests
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleViewRecording(recording)}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleShareRecording(recording)}
                                className="p-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600 rounded"
                              >
                                <Share2 className="w-4 h-4" />
                              </button>
                              {recording.detectedIssues?.length > 0 && (
                                <button
                                  onClick={() => createBugsFromRecording(recording)}
                                  className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                                >
                                  <Bug className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                            <div className="relative">
                              <button
                                onClick={() => handleDeleteRecording(recording.id)}
                                className="p-1.5 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="w-16 h-12 bg-gray-100 dark:bg-gray-600 rounded flex items-center justify-center mr-4">
                          <Video className="w-6 h-6 text-gray-400" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-medium text-gray-900 dark:text-white">
                                {recording.title || 'Untitled Recording'}
                              </h3>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {formatDate(recording.created_at)} • {formatDuration(recording.duration)}
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              {recording.detectedIssues?.length > 0 && (
                                <div className="flex items-center space-x-1 text-red-600 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded text-sm">
                                  <Bug className="w-3 h-3" />
                                  <span>{recording.detectedIssues.length}</span>
                                </div>
                              )}
                              <button
                                onClick={() => handleViewRecording(recording)}
                                className="px-3 py-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded text-sm"
                              >
                                View
                              </button>
                              <button
                                onClick={() => handleShareRecording(recording)}
                                className="p-1.5 text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-600 rounded"
                              >
                                <Share2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteRecording(recording.id)}
                                className="p-1.5 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      {viewingRecording && (
        <EnhancedScreenRecorder
          mode="viewer"
          activeSuite={activeSuite}
          firestoreService={firestoreService}
          existingRecording={viewingRecording}
          onClose={() => setViewingRecording(null)}
        />
      )}
    </div>
  );
};

export default Recordings;