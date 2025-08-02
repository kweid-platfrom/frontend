'use client';

import React from 'react';
import { useApp } from '../../context/AppProvider';
import { useUI } from '../../hooks/useUI';

const Team = () => {
    const { state } = useApp();
    const { toggleSidebar, sidebarOpen } = useUI();
    const { team } = state;

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-full mx-auto py-6 sm:px-6 lg:px-4">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">Team</h1>
                    <button
                        onClick={toggleSidebar}
                        className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
                    >
                        {sidebarOpen ? 'Close' : 'Open'} Sidebar
                    </button>
                </div>
                <div className="bg-white shadow rounded-lg p-6">
                    <p className="text-gray-600">
                        {team.state ? 'Manage team members' : 'No team members'}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Team;