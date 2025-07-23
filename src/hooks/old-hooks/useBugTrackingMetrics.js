import { useState, useEffect, useCallback } from 'react';
import { useApp } from '../../contexts/AppProvider';
import bugTrackingService from '../../services/bugTrackingService';

export const useBugTrackingMetrics = (filters = {}) => {
    const [metrics, setMetrics] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const { activeSuite, userCapabilities, addNotification, isAuthenticated, user } = useApp();

    const fetchMetrics = useCallback(async () => {
        if (!isAuthenticated || !user?.uid) {
            setMetrics(null);
            setError('User not authenticated');
            setLoading(false);
            addNotification({
                type: 'error',
                title: 'Authentication Error',
                message: 'Please log in to view bug metrics',
            });
            return;
        }
        if (!activeSuite?.suite_id) {
            setMetrics(null);
            setError('No test suite selected');
            setLoading(false);
            addNotification({
                type: 'error',
                title: 'Suite Error',
                message: 'Please select a test suite to view bug metrics',
            });
            return;
        }

        setLoading(true);
        setError(null);
        try {
            // Validate filters to include only supported fields
            const validFilters = {};
            ['timeRange', 'priority', 'severity', 'status', 'source', 'environment'].forEach(field => {
                if (filters[field] && filters[field] !== 'all') {
                    validFilters[field] = filters[field];
                }
            });
            console.log('Fetching metrics with filters:', validFilters, 'for suite:', activeSuite.suite_id);

            const data = await bugTrackingService.fetchBugTrackingMetrics(
                activeSuite,
                user,
                userCapabilities,
                validFilters
            );
            setMetrics(data || {});
        } catch (err) {
            console.error('Metrics fetch error:', err);
            setError(err.message || 'Failed to fetch bug metrics');
            addNotification({
                type: 'error',
                title: 'Bug Metrics Error',
                message: err.message || 'Failed to fetch bug metrics',
            });
        } finally {
            setLoading(false);
        }
    }, [filters, activeSuite, userCapabilities, isAuthenticated, user, addNotification]);

    useEffect(() => {
        fetchMetrics();
    }, [fetchMetrics]);

    const refetch = useCallback(() => fetchMetrics(), [fetchMetrics]);

    return {
        metrics,
        loading,
        error,
        refetch,
        canRead: !!userCapabilities?.canViewBugs,
        canWrite: !!userCapabilities?.canCreateBugs,
        canModify: !!userCapabilities?.canCreateBugs,
        canViewAnalytics: !!userCapabilities?.canViewBugAnalytics,
        canExportReports: !!userCapabilities?.canExportReports,
    };
};