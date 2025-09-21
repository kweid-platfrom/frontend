// StatusIndicator.jsx - Responsive version
import React from 'react';

export const StatusIndicator = ({ isConnected, currentTime, loading, activeSuite }) => (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mb-4">
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600">
            <div className="flex items-center space-x-2">
                <div
                    className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}
                    aria-label={isConnected ? 'Connected' : 'Offline'}
                ></div>
                <span>{isConnected ? 'Connected' : 'Offline'}</span>
            </div>
            <span className="hidden sm:inline">•</span>
            <span className="truncate">Updated: {currentTime.toLocaleTimeString()}</span>
            {loading && (
                <>
                    <span className="hidden sm:inline">•</span>
                    <span className="text-teal-600">Refreshing...</span>
                </>
            )}
        </div>
        {activeSuite && (
            <div className="text-xs sm:text-sm text-teal-600 font-medium truncate">
                <span className="sm:hidden">Suite: </span>
                <span className="hidden sm:inline">Suite: </span>
                {activeSuite.name}
            </div>
        )}
    </div>
);