// components/dashboard/StatusIndicator.jsx
import React from 'react';

export const StatusIndicator = ({ isConnected, currentTime, loading, activeSuite }) => (
    <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-6 text-sm text-gray-600">
            <div className="flex items-center space-x-2">
                <div
                    className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}
                    aria-label={isConnected ? 'Connected' : 'Offline'}
                ></div>
                <span>{isConnected ? 'Connected' : 'Offline'}</span>
            </div>
            <span>•</span>
            <span>Updated: {currentTime.toLocaleTimeString()}</span>
            {loading && (
                <>
                    <span>•</span>
                    <span className="text-teal-600">Refreshing...</span>
                </>
            )}
        </div>
        {activeSuite && (
            <div className="text-sm text-teal-600 font-medium">
                Suite: {activeSuite.name}
            </div>
        )}
    </div>
);
