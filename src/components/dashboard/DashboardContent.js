import React from 'react';
import QAIDMetricsOverview from '../stats/QAIDMetricsOverview';
import TestCaseMetrics from '../stats/TestCaseMetrics';
import BugTrackingMetrics from '../stats/BugTrackingMetrics';
import AIGenerationMetrics from '../stats/AIGenerationMetrics';
import RecordingMetrics from '../stats/RecordingsMetrics';
import AutomationMetrics from '../stats/AutomationMetrics';
import TeamProductivity from '../stats/TeamProductivity';
import QAIDCharts from '../stats/QAIDCharts';
import QuickActions from '../stats/QuickActions';
import TestDataMetrics from '../stats/TestDataMetrics';
import SprintMetrics from '../stats/SprintMetrics';
import DocumentMetrics from '../stats/DocumentMetrics';
import ReportsMetrics from '../stats/ReportsMetrics';
import SuggestionsMetrics from '../stats/SuggestionsMetrics';


export const DashboardContent = ({
    activeTab,
    enhancedMetrics,
    loading,
    error,
    dataStatus,
    filters,
    activeSuite,
}) => {
    const getDateRange = () => {
        switch (filters.timeRange) {
            case '7d': return 7;
            case '30d': return 30;
            case '90d': return 90;
            default: return 30;
        }
    };

    const renderTabContent = () => {
        switch (activeTab) {
            case 'overview':
                return (
                    <>
                        <QAIDMetricsOverview metrics={enhancedMetrics} loading={loading} />
                        <QAIDCharts metrics={enhancedMetrics} dataStatus={dataStatus} />
                        <TeamProductivity metrics={enhancedMetrics} loading={loading} />
                    </>
                );

            case 'testing':
                return (
                    <TestCaseMetrics
                        suiteId={activeSuite?.id}
                        sprintId={null}
                        options={{
                            autoRefresh: true,
                            refreshInterval: 30000,
                            enableRealtime: true,
                            includeExecutions: true
                        }}
                    />
                );
            case 'recordings':
                return (
                    <RecordingMetrics
                        metrics={{
                            totalRecordings: enhancedMetrics.testCasesWithRecordings || enhancedMetrics.recordings || 0,
                            successfulRecordings: Math.round((enhancedMetrics.testCasesWithRecordings || enhancedMetrics.recordings || 0) * 0.9),
                            bugsFromRecordings: enhancedMetrics.bugsFromScreenRecording || 0,
                        }}
                        loading={loading}
                    />
                );
            case 'testdata':
                return (
                    <TestDataMetrics
                        metrics={enhancedMetrics.testData || enhancedMetrics}
                        loading={loading}
                        error={error}
                        filters={filters}
                    />
                );
            case 'documents':
                return (
                    <DocumentMetrics
                        metrics={enhancedMetrics.documents || enhancedMetrics}
                        loading={loading}
                        error={error}
                        filters={filters}
                    />
                );
            case 'reports':
                return (
                    <ReportsMetrics
                        metrics={enhancedMetrics.reports || enhancedMetrics}
                        loading={loading}
                        error={error}
                        filters={filters}
                    />
                );
            case 'recommendations':
                return (
                    <SuggestionsMetrics
                        metrics={enhancedMetrics.suggestions || enhancedMetrics}
                        loading={loading}
                        error={error}
                        filters={filters}
                    />
                );

            case 'bugs':
                return (
                    <BugTrackingMetrics
                        filters={filters}
                        loading={loading}
                        error={error}
                        metrics={enhancedMetrics}
                    />
                );
            case 'sprint':
                return (
                    <SprintMetrics
                        metrics={enhancedMetrics.sprints || enhancedMetrics}
                        loading={loading}
                        error={error}
                        filters={filters}
                    />
                );

            case 'ai':
                // AIGenerationMetrics handles all AI status internally
                return <AIGenerationMetrics />;

            case 'automation':
                return (
                    <AutomationMetrics
                        metrics={{
                            automatedTests: enhancedMetrics.automatedTestCases || 0,
                            automationCoverage: enhancedMetrics.automationRate || 0,
                            totalTestCases: enhancedMetrics.totalTestCases || 0,
                            manualTests: enhancedMetrics.manualTestCases || 0,
                        }}
                        loading={loading}
                    />
                );

            default:
                return (
                    <div className="bg-card border border-border rounded-lg p-6 shadow-theme">
                        <div className="text-center">
                            <h3 className="text-lg font-medium text-foreground">Tab Content</h3>
                            <p className="text-muted-foreground">Content for `{activeTab}` tab will be displayed here.</p>
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="space-y-6">
            {renderTabContent()}
            <QuickActions
                metrics={enhancedMetrics}
                loading={loading}
            />
        </div>
    );
};