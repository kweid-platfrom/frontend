// components/dashboard/DashboardContent.jsx - Fixed version using useApp for AI
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
    // Updated AI props from useApp context
    aiService,
    aiInitialized,
    aiAvailable,
    aiGenerating,
    aiError,
    generateTestCasesWithAI,
    getAIAnalytics,
    updateAISettings
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
                // Check if AI service is available using the new props
                if (!aiAvailable) {
                    return (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium text-yellow-800">
                                        AI Service Not Available
                                    </h3>
                                    <div className="mt-2 text-sm text-yellow-700">
                                        <p>
                                            The AI service is not properly configured or initialized. 
                                            {aiError && (
                                                <span className="block mt-1 font-medium">
                                                    Error: {aiError}
                                                </span>
                                            )}
                                        </p>
                                        <p className="mt-2 text-xs">
                                            Please check your AI provider settings or environment configuration.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                }

                if (!aiInitialized) {
                    return (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <svg className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium text-blue-800">
                                        Initializing AI Service
                                    </h3>
                                    <div className="mt-2 text-sm text-blue-700">
                                        <p>Please wait while the AI service initializes...</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                }

                return (
                    <AIGenerationMetrics
                        aiService={aiService}
                        aiInitialized={aiInitialized}
                        aiAvailable={aiAvailable}
                        aiGenerating={aiGenerating}
                        aiError={aiError}
                        dateRange={getDateRange()}
                        generateTestCasesWithAI={generateTestCasesWithAI}
                        getAIAnalytics={getAIAnalytics}
                        updateAISettings={updateAISettings}
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
                return (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                        <div className="text-center">
                            <h3 className="text-lg font-medium text-gray-900">Tab Content</h3>
                            <p className="text-gray-600">Content for `{activeTab}` tab will be displayed here.</p>
                        </div>
                    </div>
                );
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
                // Pass AI functionality to QuickActions if needed
                aiAvailable={aiAvailable}
                aiGenerating={aiGenerating}
                generateTestCasesWithAI={generateTestCasesWithAI}
            />
        </div>
    );
};