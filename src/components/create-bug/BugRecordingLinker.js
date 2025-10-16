import React, { useState, useMemo } from 'react';
import { 
  Play, 
  Search, 
  CheckCircle, 
  X, 
  Link2,
  Video,
  Calendar,
  Clock,
  AlertCircle
} from 'lucide-react';
import { createPortal } from 'react-dom';

const BugRecordingLinker = ({ 
  recordings = [], 
  isLoadingRecordings = false,
  linkedRecordings = [],
  onLinkRecordings,
  onClose 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedRecordings, setSelectedRecordings] = useState([]);

  // Filter recordings - exclude already linked ones
  const filteredRecordings = useMemo(() => {
    return recordings.filter(recording => {
      // Exclude already linked recordings
      if (linkedRecordings.includes(recording.id)) {
        return false;
      }

      // Search filter
      const matchesSearch = recording.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        recording.description?.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Status filter
      const matchesFilter = filterStatus === 'all' || recording.status === filterStatus;
      
      return matchesSearch && matchesFilter;
    });
  }, [recordings, linkedRecordings, searchTerm, filterStatus]);

  const toggleRecordingSelection = (recording) => {
    setSelectedRecordings(prev => {
      if (prev.some(r => r.id === recording.id)) {
        return prev.filter(r => r.id !== recording.id);
      } else {
        return [...prev, recording];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedRecordings.length === filteredRecordings.length) {
      setSelectedRecordings([]);
    } else {
      setSelectedRecordings([...filteredRecordings]);
    }
  };

  const handleLinkSelected = () => {
    if (selectedRecordings.length > 0) {
      onLinkRecordings(selectedRecordings);
      setSelectedRecordings([]);
      onClose();
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString();
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

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in-0 duration-200">
      <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Link2 className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              Link Recordings to Bug
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Select recordings to attach as evidence for this bug report
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Search and Filters */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0 bg-gray-50 dark:bg-gray-900">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search recordings by title or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400"
              />
            </div>

            {/* Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="archived">Archived</option>
            </select>

            {/* Select All */}
            {filteredRecordings.length > 0 && (
              <button
                onClick={handleSelectAll}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors duration-200 whitespace-nowrap"
              >
                {selectedRecordings.length === filteredRecordings.length ? 'Deselect All' : 'Select All'}
              </button>
            )}
          </div>

          {/* Selection Summary */}
          {selectedRecordings.length > 0 && (
            <div className="mt-3 px-4 py-2 bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800 rounded-lg">
              <p className="text-sm text-teal-700 dark:text-teal-300 font-medium">
                {selectedRecordings.length} recording{selectedRecordings.length !== 1 ? 's' : ''} selected
              </p>
            </div>
          )}
        </div>

        {/* Recordings List */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoadingRecordings ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="ml-3 text-gray-600 dark:text-gray-400">Loading recordings...</span>
            </div>
          ) : filteredRecordings.length === 0 ? (
            <div className="text-center py-12">
              <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                {searchTerm || filterStatus !== 'all' ? (
                  <Search className="h-10 w-10 text-gray-400" />
                ) : (
                  <Video className="h-10 w-10 text-gray-400" />
                )}
              </div>
              <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {searchTerm || filterStatus !== 'all' 
                  ? 'No recordings found' 
                  : linkedRecordings.length === recordings.length
                    ? 'All recordings already linked'
                    : 'No recordings available'
                }
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {searchTerm || filterStatus !== 'all'
                  ? 'Try adjusting your search or filter'
                  : 'Create screen recordings first to link them to bugs'
                }
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {filteredRecordings.map((recording) => {
                const isSelected = selectedRecordings.some(r => r.id === recording.id);
                
                return (
                  <div
                    key={recording.id}
                    onClick={() => toggleRecordingSelection(recording)}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                      isSelected
                        ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20 shadow-md'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      {/* Checkbox */}
                      <div className="flex-shrink-0 pt-1">
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors duration-200 ${
                          isSelected
                            ? 'border-teal-500 bg-teal-500'
                            : 'border-gray-300 dark:border-gray-600'
                        }`}>
                          {isSelected && (
                            <CheckCircle className="h-4 w-4 text-white" />
                          )}
                        </div>
                      </div>

                      {/* Thumbnail/Icon */}
                      <div className="flex-shrink-0">
                        <div className={`w-16 h-16 rounded-lg flex items-center justify-center ${
                          isSelected 
                            ? 'bg-teal-100 dark:bg-teal-900/40' 
                            : 'bg-gray-100 dark:bg-gray-700'
                        }`}>
                          <Play className={`h-8 w-8 ${
                            isSelected 
                              ? 'text-teal-600 dark:text-teal-400' 
                              : 'text-gray-400 dark:text-gray-500'
                          }`} />
                        </div>
                      </div>

                      {/* Recording Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 dark:text-white truncate mb-1">
                          {recording.title || `Recording ${recording.id.slice(0, 8)}`}
                        </h3>
                        
                        {recording.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
                            {recording.description}
                          </p>
                        )}

                        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>{formatDate(recording.created_at)}</span>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{formatDuration(recording.duration)}</span>
                          </div>

                          {recording.detectedIssues?.length > 0 && (
                            <div className="flex items-center gap-1 px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full">
                              <AlertCircle className="w-3 h-3" />
                              <span>{recording.detectedIssues.length} issues</span>
                            </div>
                          )}

                          {recording.provider && (
                            <div className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full">
                              {recording.provider}
                            </div>
                          )}
                        </div>

                        {/* Console/Network Stats */}
                        {(recording.consoleLogs?.length > 0 || recording.networkLogs?.length > 0) && (
                          <div className="flex items-center gap-3 mt-2 text-xs">
                            {recording.consoleLogs?.length > 0 && (
                              <span className="text-gray-600 dark:text-gray-400">
                                📋 {recording.consoleLogs.length} console logs
                              </span>
                            )}
                            {recording.networkLogs?.length > 0 && (
                              <span className="text-gray-600 dark:text-gray-400">
                                🌐 {recording.networkLogs.length} network logs
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex-shrink-0">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {filteredRecordings.length} recording{filteredRecordings.length !== 1 ? 's' : ''} available
            {linkedRecordings.length > 0 && (
              <span className="ml-2 text-gray-500">
                ({linkedRecordings.length} already linked)
              </span>
            )}
          </div>
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleLinkSelected}
              disabled={selectedRecordings.length === 0}
              className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed transition-colors duration-200 font-medium shadow-sm"
            >
              Link {selectedRecordings.length > 0 && `(${selectedRecordings.length})`} Recording{selectedRecordings.length !== 1 ? 's' : ''}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default BugRecordingLinker;