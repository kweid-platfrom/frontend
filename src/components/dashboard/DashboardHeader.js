// components/dashboard/DashboardHeader.jsx
import React from 'react';
import { RotateCcw } from 'lucide-react';

export const DashboardHeader = ({ 
    activeSuite, 
    loading, 
    onRefresh, 
    toggleSidebar, 
    sidebarOpen 
}) => (
    <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
            {activeSuite ? `${activeSuite.name} Dashboard` : 'Intelligent QA Dashboard'}
        </h1>
        <div className="flex items-center space-x-3">
            <button
                onClick={onRefresh}
                disabled={loading}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                title="Refresh Data"
                aria-label="Refresh dashboard data"
            >
                <RotateCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
            </button>
            <button
                onClick={toggleSidebar}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
            >
                {sidebarOpen ? 'Close' : 'Open'} Sidebar
            </button>
        </div>
    </div>
);
