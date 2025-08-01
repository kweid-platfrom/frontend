// Fix 1: Update Dashboard.jsx to use AI through useApp instead of separate AIProvider
'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useDashboard } from '../../hooks/useDashboard';
import { useUI } from '../../hooks/useUI';
import { useApp } from '../../context/AppProvider';
// Remove this import: import { useAI } from '../../context/AIProvider';
import { useMetricsProcessor } from '../../hooks/useMetricsProcessor';
import { useConnectionStatus } from '../../hooks/useConnectionStatus';

// Dashboard Components
import TipsMode from '../../components/TipsMode';
import { DashboardHeader } from '../../components/dashboard/DashboardHeader';
import { StatusIndicator } from '../../components/dashboard/StatusIndicator';
import { SummaryCards } from '../../components/dashboard/SummaryCards';
import { TrialBanner } from '../../components/dashboard/TrialBanner';
import { TabNavigation } from '../../components/dashboard/TabNavigation';
import { FilterControls } from '../../components/dashboard/FilterControls';
import { ErrorDisplay } from '../../components/dashboard/ErrorDisplay';
import { DashboardContent } from '../../components/dashboard/DashboardContent';

const Dashboard = () => {
    const { metrics, loading, error, refresh, dataStatus } = useDashboard();
    const { toggleSidebar, sidebarOpen } = useUI();
    const {
        state,
        activeSuite,
        isTrialActive,
        currentUser,
        actions,
        // AI-related properties from useApp
        aiAvailable,
        aiGenerating,
    } = useApp();

    // Get AI state and actions from the app context
    const aiService = state.ai?.serviceInstance || null;
    const aiInitialized = state.ai?.isInitialized || false;
    const aiError = state.ai?.error || null;

    // Custom hooks
    const enhancedMetrics = useMetricsProcessor(metrics);
    const isConnected = useConnectionStatus();

    // Local state
    const [filters, setFilters] = useState({
        timeRange: '7d',
        severity: 'all',
        priority: 'all',
        status: 'all',
        source: 'all',
        environment: 'all',
    });
    const [currentTime, setCurrentTime] = useState(new Date());
    const [activeTab, setActiveTab] = useState('overview');
    const [dashboardMounted, setDashboardMounted] = useState(false);
    
    // Refs
    const timeIntervalRef = useRef(null);
    const lastRefreshRef = useRef(null);

    // Computed values
    const isInTipsMode = useMemo(() => {
        if (!activeSuite) return true;

        const hasAnyData = metrics && (
            metrics.totalTestCases > 0 ||
            metrics.activeBugs > 0 ||
            metrics.recordings > 0 ||
            (metrics.recentActivity && metrics.recentActivity.length > 0)
        );

        const hasAnySuccessfulLoad = Object.values(dataStatus).some(status => status === 'loaded');
        const allDataSourcesFailed = Object.values(dataStatus).every(status =>
            status === 'error' || status === 'not-authenticated'
        );
        return !hasAnyData && (allDataSourcesFailed || (!hasAnySuccessfulLoad && !loading));
    }, [activeSuite, metrics, dataStatus, loading]);

    const isOrganizationAccount = currentUser?.accountType === 'organization' || state?.subscription?.type === 'organization';
    const trialDaysRemaining = state?.subscription?.trialDaysRemaining || 0;

    const summaryStats = useMemo(() => ({
        totalTestCases: enhancedMetrics.totalTestCases || enhancedMetrics.testCases || 0,
        activeBugs: enhancedMetrics.activeBugs || 0,
        passRate: enhancedMetrics.passRate || 0,
        criticalIssues: enhancedMetrics.criticalBugs || enhancedMetrics.criticalIssues || 0,
    }), [enhancedMetrics]);

    // Effects
    useEffect(() => {
        console.log('Dashboard mounted or navigation detected');
        setDashboardMounted(true);

        const now = Date.now();
        const shouldRefresh = !lastRefreshRef.current || (now - lastRefreshRef.current) > 30000;

        if (shouldRefresh && refresh) {
            console.log('Auto-refreshing dashboard data on mount/navigation');
            lastRefreshRef.current = now;
            refresh().catch(error => {
                console.error('Auto-refresh failed:', error);
            });
        }

        return () => {
            setDashboardMounted(false);
        };
    }, [refresh]);

    useEffect(() => {
        if (activeSuite && dashboardMounted && refresh) {
            console.log('Active suite changed, refreshing data:', activeSuite.id);
            lastRefreshRef.current = Date.now();
            refresh().catch(error => {
                console.error('Suite change refresh failed:', error);
            });
        }
    }, [activeSuite, activeSuite?.id, dashboardMounted, refresh]);

    useEffect(() => {
        if (timeIntervalRef.current) {
            clearInterval(timeIntervalRef.current);
        }
        timeIntervalRef.current = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => {
            if (timeIntervalRef.current) {
                clearInterval(timeIntervalRef.current);
            }
        };
    }, []);

    // Event handlers
    const handleFilterChange = useCallback((key, value) => {
        setFilters((prev) => ({ ...prev, [key]: value }));
    }, []);

    const handleRefresh = useCallback(async () => {
        try {
            lastRefreshRef.current = Date.now();
            await refresh?.();
            setCurrentTime(new Date());

            if (actions?.ui?.showNotification) {
                actions.ui.showNotification({
                    type: 'success',
                    title: 'Data Refreshed',
                    message: 'Dashboard data has been updated.',
                });
            }
        } catch (error) {
            console.error('Refresh error:', error);
            if (actions?.ui?.showNotification) {
                actions.ui.showNotification({
                    type: 'error',
                    title: 'Refresh Failed',
                    message: 'Failed to refresh dashboard data. Please try again.',
                    persistent: true,
                });
            }
        }
    }, [refresh, actions]);

    const handleTabChange = useCallback((tab) => {
        setActiveTab(tab);
    }, []);

    // Log AI status for debugging
    useEffect(() => {
        console.log('Dashboard AI Status:', {
            aiAvailable,
            aiInitialized,
            aiGenerating,
            aiError,
            hasServiceInstance: !!aiService
        });
    }, [aiAvailable, aiInitialized, aiGenerating, aiError, aiService]);

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-full mx-auto py-6 sm:px-6 lg:px-4">
                <DashboardHeader
                    activeSuite={activeSuite}
                    loading={loading}
                    onRefresh={handleRefresh}
                    toggleSidebar={toggleSidebar}
                    sidebarOpen={sidebarOpen}
                />

                {isInTipsMode ? (
                    <TipsMode
                        activeSuite={activeSuite}
                        isTrialActive={isTrialActive}
                        trialDaysRemaining={trialDaysRemaining}
                        isOrganizationAccount={isOrganizationAccount}
                    />
                ) : (
                    <div className="space-y-6">
                        <div className="bg-white rounded-lg shadow-sm border p-6">
                            <StatusIndicator
                                isConnected={isConnected}
                                currentTime={currentTime}
                                loading={loading}
                                activeSuite={activeSuite}
                            />
                            <SummaryCards
                                summaryStats={summaryStats}
                                dataStatus={dataStatus}
                            />
                        </div>

                        {isTrialActive && trialDaysRemaining > 0 && (
                            <TrialBanner trialDaysRemaining={trialDaysRemaining} />
                        )}

                        <TabNavigation
                            activeTab={activeTab}
                            onTabChange={handleTabChange}
                        />

                        <FilterControls
                            filters={filters}
                            onFilterChange={handleFilterChange}
                            loading={loading}
                        />

                        {error && (
                            <ErrorDisplay
                                error={error}
                                onRefresh={handleRefresh}
                            />
                        )}

                        <DashboardContent
                            activeTab={activeTab}
                            enhancedMetrics={enhancedMetrics}
                            loading={loading}
                            error={error}
                            filters={filters}
                            activeSuite={activeSuite}
                            onRefresh={handleRefresh}
                            // Pass AI-related props from the app context
                            aiService={aiService}
                            aiInitialized={aiInitialized}
                            aiAvailable={aiAvailable}
                            aiGenerating={aiGenerating}
                            aiError={aiError}
                            // Pass AI actions from the app context
                            generateTestCasesWithAI={actions.ai?.generateTestCasesWithAI}
                            getAIAnalytics={actions.ai?.getAIAnalytics}
                            updateAISettings={actions.ai?.updateAISettings}
                        />

                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;