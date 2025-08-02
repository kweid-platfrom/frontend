// components/dashboard/ErrorDisplay.jsx
import React from 'react';
import { AlertCircle } from 'lucide-react';

export const ErrorDisplay = ({ error, onRefresh }) => (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" aria-hidden="true" />
            <div className="text-yellow-800">
                <p className="mb-2">Error loading some dashboard data: {error}</p>
                <button
                    onClick={onRefresh}
                    className="underline hover:no-underline"
                    aria-label="Try refreshing data"
                >
                    Try refreshing
                </button>
            </div>
        </div>
    </div>
);
