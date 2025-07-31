// components/dashboard/SummaryCards.jsx
import React from 'react';

export const SummaryCards = ({ summaryStats, dataStatus }) => (
    <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-teal-600">{summaryStats.totalTestCases}</div>
                <div className="text-sm text-teal-600">Total Test Cases</div>
                {dataStatus.testCases === 'pending' && (
                    <div className="text-xs text-gray-500 mt-1">Loading...</div>
                )}
                {dataStatus.testCases === 'error' && (
                    <div className="text-xs text-red-500 mt-1">Error loading</div>
                )}
            </div>
            <div className="bg-green-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-green-600">{summaryStats.passRate}%</div>
                <div className="text-sm text-green-600">Pass Rate</div>
                {dataStatus.testCases === 'pending' && (
                    <div className="text-xs text-gray-500 mt-1">Loading...</div>
                )}
                {dataStatus.testCases === 'error' && (
                    <div className="text-xs text-red-500 mt-1">Error loading</div>
                )}
            </div>
            <div className="bg-orange-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-orange-600">{summaryStats.activeBugs}</div>
                <div className="text-sm text-orange-600">Active Bugs</div>
                {dataStatus.bugs === 'pending' && (
                    <div className="text-xs text-gray-500 mt-1">Loading...</div>
                )}
                {dataStatus.bugs === 'error' && (
                    <div className="text-xs text-red-500 mt-1">Error loading</div>
                )}
            </div>
            <div className="bg-red-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-red-600">{summaryStats.criticalIssues}</div>
                <div className="text-sm text-red-600">Critical Issues</div>
                {dataStatus.bugs === 'pending' && (
                    <div className="text-xs text-gray-500 mt-1">Loading...</div>
                )}
                {dataStatus.bugs === 'error' && (
                    <div className="text-xs text-red-500 mt-1">Error loading</div>
                )}
            </div>
        </div>
    </div>
);
