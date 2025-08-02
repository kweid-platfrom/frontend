import React from 'react';

export const SummaryCards = ({ summaryStats, dataStatus }) => (
    <div className="bg-card rounded-lg shadow-theme border border-border p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-[rgb(var(--color-teal-50))] rounded-lg p-4 border border-[rgb(var(--color-teal-300)/0.2)]">
                <div className="text-2xl font-bold text-teal-800">{summaryStats.totalTestCases}</div>
                <div className="text-sm text-teal-800">Total Test Cases</div>
                {dataStatus.testCases === 'pending' && (
                    <div className="text-xs text-muted-foreground mt-1">Loading...</div>
                )}
                {dataStatus.testCases === 'error' && (
                    <div className="text-xs text-[rgb(var(--color-error))] mt-1">Error loading</div>
                )}
            </div>
            <div className="bg-[rgb(var(--color-success)/0.1)] rounded-lg p-4 border border-[rgb(var(--color-success)/0.2)]">
                <div className="text-2xl font-bold text-[rgb(var(--color-success))]">{summaryStats.passRate}%</div>
                <div className="text-sm text-[rgb(var(--color-success))]">Pass Rate</div>
                {dataStatus.testCases === 'pending' && (
                    <div className="text-xs text-muted-foreground mt-1">Loading...</div>
                )}
                {dataStatus.testCases === 'error' && (
                    <div className="text-xs text-[rgb(var(--color-error))] mt-1">Error loading</div>
                )}
            </div>
            <div className="bg-[rgb(var(--color-warning)/0.1)] rounded-lg p-4 border border-[rgb(var(--color-warning)/0.2)]">
                <div className="text-2xl font-bold text-[rgb(var(--color-warning))]">{summaryStats.activeBugs}</div>
                <div className="text-sm text-[rgb(var(--color-warning))]">Active Bugs</div>
                {dataStatus.bugs === 'pending' && (
                    <div className="text-xs text-muted-foreground mt-1">Loading...</div>
                )}
                {dataStatus.bugs === 'error' && (
                    <div className="text-xs text-[rgb(var(--color-error))] mt-1">Error loading</div>
                )}
            </div>
            <div className="bg-[rgb(var(--color-error)/0.1)] rounded-lg p-4 border border-[rgb(var(--color-error)/0.2)]">
                <div className="text-2xl font-bold text-[rgb(var(--color-error))]">{summaryStats.criticalIssues}</div>
                <div className="text-sm text-[rgb(var(--color-error))]">Critical Issues</div>
                {dataStatus.bugs === 'pending' && (
                    <div className="text-xs text-muted-foreground mt-1">Loading...</div>
                )}
                {dataStatus.bugs === 'error' && (
                    <div className="text-xs text-[rgb(var(--color-error))] mt-1">Error loading</div>
                )}
            </div>
        </div>
    </div>
);