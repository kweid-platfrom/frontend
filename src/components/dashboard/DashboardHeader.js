// components/dashboard/DashboardHeader.jsx
import React from 'react';
import { RotateCcw } from 'lucide-react';

export const DashboardHeader = ({ 
    activeSuite, 
    loading, 
    onRefresh 
}) => (
    <div className="flex items-center justify-between mb-4 sm:mb-6">
        {/* Responsive Title */}
        <div className="flex-1 min-w-0 pr-4">
            <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 truncate">
                <span className="hidden sm:inline">
                    {activeSuite ? `${activeSuite.name} Dashboard` : 'Intelligent QA Dashboard'}
                </span>
                <span className="sm:hidden">
                    {activeSuite ? activeSuite.name : 'Dashboard'}
                </span>
            </h1>
        </div>

        {/* Refresh Button */}
        <div className="flex-shrink-0">
            <button
                onClick={onRefresh}
                disabled={loading}
                className="bg-gray-200 text-gray-700 px-3 py-2 sm:px-4 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                title="Refresh Data"
                aria-label="Refresh dashboard data"
            >
                <RotateCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
            </button>
        </div>
    </div>
);