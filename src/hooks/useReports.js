/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from 'react';
import { useApp } from '../context/AppProvider';

export const useReports = () => {
    const { state, actions, isAuthenticated, currentUser } = useApp();
    const { reports: reportState } = state;
    const { reports: reportActions } = actions;
    const [filters, setFilters] = useState({
        type: 'all',
        status: 'all',
        date: '',
        author: '',
        suite: 'all',
    });

    useEffect(() => {
        if (!isAuthenticated || !currentUser) return;

        const loadReports = async () => {
            try {
                const result = await reportActions.getReports(state)();
                if (result.success) {
                    reportState.actions.loadReportsSuccess(result.data);
                } else {
                    reportState.actions.loadReportsFailure(result.error);
                }
            } catch (error) {
                reportState.actions.loadReportsFailure(error.message);
            }
        };

        loadReports();

        if (hasPermission()) {
            const unsubscribe = reportActions.subscribeToTriggers(state, actions)((result) => {
                if (result.success) {
                    reportState.actions.addReport(result.data);
                }
            });
            return () => unsubscribe();
        }
    }, [isAuthenticated, currentUser, state, actions]);

    const generateReport = async ({ reportType, suiteId, sprintId, dateRange }) => {
        try {
            const result = await reportActions.generateReport(state, actions)({
                reportType,
                suiteId,
                sprintId,
                dateRange,
            });
            if (result.success) {
                reportState.actions.addReport(result.data);
            }
            return result;
        } catch (error) {
            return { success: false, error: error.message };
        }
    };

    const toggleScheduledReports = async () => {
        try {
            const enabled = !reportState.scheduledReportsEnabled;
            const result = await reportActions.toggleSchedule(state)(enabled);
            if (result.success) {
                reportState.actions.toggleScheduledReports(enabled);
            }
            return result;
        } catch (error) {
            return { success: false, error: error.message };
        }
    };

    const hasPermission = () => {
        const roles = ['qa_lead', 'admin', 'org_admin'];
        return currentUser?.role && roles.includes(currentUser.role);
    };

    const filteredReports = reportState.reports.filter((report) => {
        const matchesType = filters.type === 'all' || report.type === filters.type;
        const matchesStatus = filters.status === 'all' || report.status === filters.status;
        const matchesDate = !filters.date || new Date(report.created_at).toISOString().split('T')[0] === filters.date;
        const matchesAuthor = !filters.author || report.created_by.toLowerCase().includes(filters.author.toLowerCase());
        const matchesSuite = filters.suite === 'all' || report.suiteId === filters.suite;
        return matchesType && matchesStatus && matchesDate && matchesAuthor && matchesSuite;
    });

    return {
        reports: filteredReports,
        loading: reportState.loading,
        filters,
        setFilters,
        reportTypes: reportState.reportTypes || [], // Fallback to empty array
        hasPermission,
        generateReport,
        toggleScheduledReports,
    };
};