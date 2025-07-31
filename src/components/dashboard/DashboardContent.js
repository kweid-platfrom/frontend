// components/dashboard/DashboardContent.jsx
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

export const DashboardContent = ({ 
    activeTab, 
    enhancedMetrics, 
    loading, 
    error, 
    filters, 
    activeSuite, 
    onRefresh,
    aiService 
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
                        <QAIDCharts metrics={enhancedMetrics} loading={loading} />
                        <TeamProductivity metrics={enhancedMetrics} loading={loading} />
                    </>
                );

            case 'testing':
                return (
                    <>
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
                        <RecordingMetrics
                            metrics={{
                                totalRecordings: enhancedMetrics.testCasesWithRecordings || enhancedMetrics.recordings || 0,
                                successfulRecordings: Math.round((enhancedMetrics.testCasesWithRecordings || enhancedMetrics.recordings || 0) * 0.9),
                                bugsFromRecordings: enhancedMetrics.bugsFromScreenRecording || 0,
                            }}
                            loading={loading}
                        />
                    </>
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

            case 'ai':
                return (
                    <AIGenerationMetrics
                        aiService={aiService}
                        dateRange={getDateRange()}
                    />
                );

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
                return null;
        }
    };

    return (
        <div className="space-y-6">
            {renderTabContent()}
            
            <QuickActions
                metrics={{
                    qa: {
                        testCases: enhancedMetrics.totalTestCases,
                        passRate: enhancedMetrics.passRate,
                        automationRate: enhancedMetrics.automationRate,
                    },
                    bugs: enhancedMetrics,
                }}
                loading={loading}
                onRefresh={onRefresh}
            />
        </div>
    );
};