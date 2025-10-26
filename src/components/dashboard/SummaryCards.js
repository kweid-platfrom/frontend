// components/SummaryCards.jsx
import React, { useState, useEffect } from 'react';
import { TestTube, CheckCircle, Target, AlertTriangle, Bot } from 'lucide-react';
import { BugAntIcon } from '@heroicons/react/24/outline';
import { useApp } from '@/context/AppProvider';
import { getAIGeneratedAssetsCount } from '@/services/aiMetricsService';

export const SummaryCards = ({ summaryStats, dataStatus }) => {
    const { state } = useApp();
    const [aiGeneratedCount, setAiGeneratedCount] = useState(0);
    const [loadingAiCount, setLoadingAiCount] = useState(true);

    const activeSuiteId = state.suites?.activeSuite?.id;

    useEffect(() => {
        const loadAIGeneratedCount = async () => {
            if (!activeSuiteId) {
                setAiGeneratedCount(0);
                setLoadingAiCount(false);
                return;
            }

            setLoadingAiCount(true);
            try {
                const count = await getAIGeneratedAssetsCount(activeSuiteId, 'testCases');
                setAiGeneratedCount(count);
            } catch (error) {
                console.error('Error loading AI generated count:', error);
                setAiGeneratedCount(0);
            } finally {
                setLoadingAiCount(false);
            }
        };

        loadAIGeneratedCount();
    }, [activeSuiteId]);

    const stats = {
        totalTestCases: summaryStats?.totalTestCases || 0,
        passRate: summaryStats?.passRate || 0,
        executionCount: summaryStats?.executionCount || 0,
        activeBugs: summaryStats?.activeBugs || 0,
        criticalIssues: summaryStats?.criticalBugs || summaryStats?.criticalIssues || 0,
        sprintProgress: summaryStats?.sprintProgress || 0,
        aiGeneratedTestCases: aiGeneratedCount,
        passCount: summaryStats?.passCount || 0,
        failCount: summaryStats?.failCount || 0,
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'loading':
            case 'pending':
                return <div className="text-xs text-muted-foreground mt-1">Loading...</div>;
            case 'error':
                return <div className="text-xs text-destructive mt-1">Error loading</div>;
            case 'loaded':
                return null;
            default:
                return null;
        }
    };

    return (
        <div className="bg-card rounded-lg shadow-theme-sm border border-border p-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {/* Total Test Cases */}
                <div className="bg-primary/10 rounded-lg p-4 border border-primary/20 relative">
                    <TestTube className="absolute top-2 right-2 w-4 h-4 text-primary" />
                    <div className="text-2xl font-bold text-primary">{stats.totalTestCases}</div>
                    <div className="text-sm text-primary">Total Test Cases</div>
                    {getStatusBadge(dataStatus?.testCases)}
                </div>
                
                {/* Pass Rate */}
                <div className="bg-success/10 rounded-lg p-4 border border-success/20 relative">
                    <CheckCircle className="absolute top-2 right-2 w-4 h-4 text-success" />
                    <div className="text-2xl font-bold text-success">{stats.passRate}%</div>
                    <div className="text-sm text-success">Pass Rate</div>
                    {stats.executionCount > 0 && (
                        <div className="text-xs text-muted-foreground mt-1">
                            {stats.passCount}/{stats.executionCount} passed
                        </div>
                    )}
                    {getStatusBadge(dataStatus?.testCases)}
                </div>
                
                {/* Active Bugs */}
                <div className="bg-warning/10 rounded-lg p-4 border border-warning/20 relative">
                    <BugAntIcon className="absolute top-2 right-2 w-4 h-4 text-warning" />
                    <div className="text-2xl font-bold text-warning">{stats.activeBugs}</div>
                    <div className="text-sm text-warning">Active Bugs</div>
                    {getStatusBadge(dataStatus?.bugs)}
                </div>
                
                {/* Critical Issues */}
                <div className="bg-destructive/10 rounded-lg p-4 border border-destructive/20 relative">
                    <AlertTriangle className="absolute top-2 right-2 w-4 h-4 text-destructive" />
                    <div className="text-2xl font-bold text-destructive">{stats.criticalIssues}</div>
                    <div className="text-sm text-destructive">Critical Issues</div>
                    {getStatusBadge(dataStatus?.bugs)}
                </div>
                
                {/* Sprint Progress */}
                <div className="bg-info/10 rounded-lg p-4 border border-info/20 relative">
                    <Target className="absolute top-2 right-2 w-4 h-4 text-info" />
                    <div className="text-2xl font-bold text-info">{stats.sprintProgress}%</div>
                    <div className="text-sm text-info">Sprint Progress</div>
                    {getStatusBadge(dataStatus?.sprints)}
                </div>
                
                {/* AI Generated Tests */}
                <div className="bg-purple-100 rounded-lg p-4 border border-purple-200 relative">
                    <Bot className="absolute top-2 right-2 w-4 h-4 text-purple-600" />
                    <div className="text-2xl font-bold text-purple-600">
                        {loadingAiCount ? '...' : stats.aiGeneratedTestCases}
                    </div>
                    <div className="text-sm text-purple-600">AI Generated Tests</div>
                    {!loadingAiCount && stats.totalTestCases > 0 && (
                        <div className="text-xs text-muted-foreground mt-1">
                            {((stats.aiGeneratedTestCases / stats.totalTestCases) * 100).toFixed(0)}% of total
                        </div>
                    )}
                    {loadingAiCount && <div className="text-xs text-muted-foreground mt-1">Loading...</div>}
                </div>
            </div>
        </div>
    );
};