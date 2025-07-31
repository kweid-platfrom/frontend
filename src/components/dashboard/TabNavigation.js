// components/dashboard/TabNavigation.jsx
import React from 'react';
import { TrendingUp, Bug, TestTube, Activity, Settings } from 'lucide-react';

const TAB_OPTIONS = [
    { value: 'overview', label: 'Overview', icon: TrendingUp },
    { value: 'testing', label: 'Testing', icon: TestTube },
    { value: 'bugs', label: 'Bug Tracking', icon: Bug },
    { value: 'ai', label: 'AI Generation', icon: Activity },
    { value: 'automation', label: 'Automation', icon: Settings },
];

export const TabNavigation = ({ activeTab, onTabChange }) => (
    <div className="bg-white rounded-lg shadow-sm border p-1">
        <div className="flex space-x-1 overflow-x-auto">
            {TAB_OPTIONS.map((tab) => {
                const IconComponent = tab.icon;
                return (
                    <button
                        key={tab.value}
                        onClick={() => onTabChange(tab.value)}
                        className={`flex items-center px-4 py-3 text-sm font-medium rounded transition-colors whitespace-nowrap ${
                            activeTab === tab.value
                                ? 'bg-teal-100 text-teal-700'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                        }`}
                        aria-current={activeTab === tab.value ? 'page' : undefined}
                    >
                        <IconComponent className="w-4 h-4 mr-2" aria-hidden="true" />
                        {tab.label}
                    </button>
                );
            })}
        </div>
    </div>
);
