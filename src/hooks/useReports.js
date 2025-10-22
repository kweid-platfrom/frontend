// hooks/useReports.js - FIXED: Prevent duplicate report generation
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useApp } from '@/context/AppProvider';
import {
    collection,
    doc,
    getDocs,
    getDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    onSnapshot,
    serverTimestamp,
    Timestamp
} from 'firebase/firestore';
import { db } from '@/config/firebase';

export const useReports = () => {
    const { state, actions } = useApp();
    const currentUser = state?.auth?.currentUser;
    const activeSuite = state?.suites?.activeSuite;
    const allTestCases = state?.testCases?.testCases || [];
    const testRuns = state?.testRuns?.testRuns || [];

    const [reports, setReports] = useState([]);
    const [schedules, setSchedules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState({
        type: 'all',
        status: 'all',
        date: '',
        author: '',
        suite: 'all'
    });

    const unsubscribeReportsRef = useRef(null);
    const unsubscribeSchedulesRef = useRef(null);
    
    // FIXED: Add locks to prevent duplicate generation
    const isGeneratingRef = useRef(false);
    const processingSchedulesRef = useRef(new Set());

    const reportTypes = [
        'Test Run Summary',
        'Bug Analysis',
        'Sprint Summary',
        'Coverage Report',
        'Weekly QA Summary',
        'Monthly QA Summary',
        'Regression Report',
        'Performance Report',
        'Recording Analysis',
        'Recommendation Summary',
        'Document Inventory',
        'Test Data Audit',
        'Asset Health Report',
        'Team Activity Report',
        'Quality Metrics Dashboard'
    ];

    // Check if user has permission to generate reports
    const hasPermission = useCallback(() => {
        if (!currentUser) return false;
        const role = currentUser.role || 'tester';
        return ['admin', 'manager', 'lead'].includes(role);
    }, [currentUser]);

    // ========== AUTO-GENERATION HELPERS ==========

    /**
     * Generate report data based on type
     */
    const generateReportData = useCallback((type, params = {}) => {
        const suiteId = params.suiteId || activeSuite?.id;
        const sprintId = params.sprintId;
        const runId = params.runId;

        let data = {
            summary: {},
            details: [],
            charts: []
        };

        switch (type) {
            case 'Test Run Summary': {
                const run = testRuns.find(r => r.id === runId);
                if (!run) break;

                data.summary = {
                    runName: run.name,
                    totalTests: run.summary.total,
                    passed: run.summary.passed,
                    failed: run.summary.failed,
                    blocked: run.summary.blocked,
                    skipped: run.summary.skipped,
                    passRate: run.summary.total > 0 
                        ? Math.round((run.summary.passed / run.summary.total) * 100) 
                        : 0,
                    duration: run.completed_at && run.started_at
                        ? Math.round((new Date(run.completed_at) - new Date(run.started_at)) / 1000 / 60)
                        : 0,
                    environment: run.environment,
                    buildVersion: run.build_version
                };

                data.details = run.test_cases.map(tcId => {
                    const testCase = allTestCases.find(tc => tc.id === tcId);
                    const result = run.results[tcId];
                    return {
                        id: tcId,
                        title: testCase?.title || 'Unknown',
                        status: result?.status || 'not_executed',
                        duration: result?.duration || 0,
                        executedBy: result?.executed_by || '',
                        notes: result?.notes || '',
                        bugsCreated: result?.bugs_created || []
                    };
                });

                data.charts = [
                    {
                        type: 'pie',
                        title: 'Test Results Distribution',
                        data: [
                            { name: 'Passed', value: run.summary.passed },
                            { name: 'Failed', value: run.summary.failed },
                            { name: 'Blocked', value: run.summary.blocked },
                            { name: 'Skipped', value: run.summary.skipped }
                        ]
                    }
                ];
                break;
            }

            case 'Bug Analysis': {
                const suiteBugs = state?.bugs?.bugs?.filter(b => 
                    !suiteId || b.suite_id === suiteId
                ) || [];

                const statusCounts = {};
                const priorityCounts = {};
                const severityCounts = {};

                suiteBugs.forEach(bug => {
                    const status = bug.status || 'open';
                    const priority = bug.priority || 'medium';
                    const severity = bug.severity || 'medium';

                    statusCounts[status] = (statusCounts[status] || 0) + 1;
                    priorityCounts[priority] = (priorityCounts[priority] || 0) + 1;
                    severityCounts[severity] = (severityCounts[severity] || 0) + 1;
                });

                data.summary = {
                    totalBugs: suiteBugs.length,
                    active: suiteBugs.filter(b => 
                        !['resolved', 'closed', 'fixed'].includes(b.status?.toLowerCase())
                    ).length,
                    resolved: suiteBugs.filter(b => 
                        ['resolved', 'closed', 'fixed'].includes(b.status?.toLowerCase())
                    ).length,
                    critical: suiteBugs.filter(b => 
                        b.priority === 'critical' || b.severity === 'critical'
                    ).length
                };

                data.details = suiteBugs.map(bug => ({
                    id: bug.id,
                    title: bug.title,
                    status: bug.status,
                    priority: bug.priority,
                    severity: bug.severity,
                    reportedBy: bug.reported_by,
                    createdAt: bug.created_at
                }));

                data.charts = [
                    {
                        type: 'bar',
                        title: 'Bugs by Status',
                        data: Object.entries(statusCounts).map(([name, value]) => ({ name, value }))
                    },
                    {
                        type: 'bar',
                        title: 'Bugs by Priority',
                        data: Object.entries(priorityCounts).map(([name, value]) => ({ name, value }))
                    }
                ];
                break;
            }

            case 'Weekly QA Summary':
            case 'Monthly QA Summary': {
                const days = type === 'Weekly QA Summary' ? 7 : 30;
                const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

                const recentTests = allTestCases.filter(tc => {
                    const created = tc.created_at?.toDate ? tc.created_at.toDate() : new Date(tc.created_at);
                    return created > cutoffDate;
                });

                const recentBugs = state?.bugs?.bugs?.filter(bug => {
                    const created = bug.created_at?.toDate ? bug.created_at.toDate() : new Date(bug.created_at);
                    return created > cutoffDate;
                }) || [];

                // Calculate execution stats from test runs
                let totalExecutions = 0;
                let passedExecutions = 0;
                let failedExecutions = 0;

                testRuns.forEach(run => {
                    const runDate = run.created_at?.toDate ? run.created_at.toDate() : new Date(run.created_at);
                    if (runDate > cutoffDate) {
                        totalExecutions += run.summary.total;
                        passedExecutions += run.summary.passed;
                        failedExecutions += run.summary.failed;
                    }
                });

                data.summary = {
                    period: type === 'Weekly QA Summary' ? 'Last 7 Days' : 'Last 30 Days',
                    testsCreated: recentTests.length,
                    bugsReported: recentBugs.length,
                    testExecutions: totalExecutions,
                    passRate: totalExecutions > 0 
                        ? Math.round((passedExecutions / totalExecutions) * 100) 
                        : 0,
                    activeBugs: recentBugs.filter(b => 
                        !['resolved', 'closed', 'fixed'].includes(b.status?.toLowerCase())
                    ).length
                };

                data.charts = [
                    {
                        type: 'line',
                        title: 'Daily Activity',
                        data: Array.from({ length: days }, (_, i) => {
                            const date = new Date(Date.now() - (days - 1 - i) * 24 * 60 * 60 * 1000);
                            const dateStr = date.toDateString();
                            
                            const testsCreated = recentTests.filter(tc => {
                                const created = tc.created_at?.toDate ? tc.created_at.toDate() : new Date(tc.created_at);
                                return created.toDateString() === dateStr;
                            }).length;

                            const bugsCreated = recentBugs.filter(bug => {
                                const created = bug.created_at?.toDate ? bug.created_at.toDate() : new Date(bug.created_at);
                                return created.toDateString() === dateStr;
                            }).length;

                            return {
                                date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                                tests: testsCreated,
                                bugs: bugsCreated
                            };
                        })
                    }
                ];
                break;
            }

            case 'Coverage Report': {
                const suiteCases = allTestCases.filter(tc => 
                    !suiteId || tc.suite_id === suiteId
                );

                const typeCount = {};
                suiteCases.forEach(tc => {
                    const type = tc.type || tc.testType || 'functional';
                    typeCount[type] = (typeCount[type] || 0) + 1;
                });

                data.summary = {
                    totalTestCases: suiteCases.length,
                    automated: suiteCases.filter(tc => tc.isAutomated || tc.automated).length,
                    manual: suiteCases.filter(tc => !(tc.isAutomated || tc.automated)).length,
                    withSteps: suiteCases.filter(tc => tc.steps && tc.steps.length > 0).length,
                    coverage: suiteCases.length > 0 
                        ? Math.round((suiteCases.filter(tc => tc.executionStatus && tc.executionStatus !== 'pending').length / suiteCases.length) * 100)
                        : 0
                };

                data.charts = [
                    {
                        type: 'bar',
                        title: 'Test Cases by Type',
                        data: Object.entries(typeCount).map(([name, value]) => ({ name, value }))
                    }
                ];
                break;
            }

            default:
                data.summary = { message: 'Report type not implemented yet' };
        }

        return data;
    }, [activeSuite, allTestCases, testRuns, state?.bugs]);

    /**
     * FIXED: Create an auto-generated report with duplicate prevention
     */
    const createAutoReport = useCallback(async (runId, runName, format = 'pdf') => {
        if (!currentUser || !activeSuite?.id) {
            console.warn('createAutoReport: Missing user or suite');
            return;
        }

        // FIXED: Prevent duplicate generation
        const lockKey = `${runId}-${format}`;
        if (isGeneratingRef.current) {
            console.log('Report generation already in progress, skipping...');
            return;
        }

        isGeneratingRef.current = true;

        try {
            console.log('useReports.createAutoReport called:', { runId, runName, format, suiteId: activeSuite.id });

            // FIXED: Check if report already exists for this run
            const reportsRef = collection(db, 'testSuites', activeSuite.id, 'reports');
            const existingQuery = query(
                reportsRef,
                where('runId', '==', runId),
                where('autoGenerated', '==', true)
            );
            const existingDocs = await getDocs(existingQuery);
            
            if (!existingDocs.empty) {
                console.log('Auto-report already exists for this run, skipping...');
                return existingDocs.docs[0].id;
            }

            const reportData = generateReportData('Test Run Summary', { runId });

            const newReport = {
                name: `Test Run: ${runName}`,
                type: 'Test Run Summary',
                status: 'Generated',
                autoGenerated: true,
                suiteId: activeSuite.id,
                suiteName: activeSuite.name,
                runId: runId,
                created_by: currentUser.uid,
                createdBy: currentUser.email || currentUser.uid,
                createdAt: serverTimestamp(),
                data: reportData,
                format: format
            };

            const docRef = await addDoc(reportsRef, newReport);

            actions.ui?.showNotification?.({
                type: 'success',
                message: `Auto-generated ${format.toUpperCase()} report for "${runName}" is ready`
            });

            return docRef.id;
        } catch (err) {
            console.error('Error creating auto report:', err);
            actions.ui?.showNotification?.({
                type: 'error',
                message: `Failed to auto-generate report: ${err.message}`
            });
            throw err;
        } finally {
            // FIXED: Release lock after a delay to prevent rapid re-triggers
            setTimeout(() => {
                isGeneratingRef.current = false;
            }, 2000);
        }
    }, [currentUser, activeSuite, generateReportData, actions]);

    // ========== SCHEDULED REPORTS ==========

    /**
     * FIXED: Process due schedules with duplicate prevention
     */
    const processDueSchedules = useCallback(async () => {
        if (!currentUser || !activeSuite?.id) return;

        const now = new Date();
        const dueSchedules = schedules.filter(schedule => {
            if (!schedule.active) return false;
            if (processingSchedulesRef.current.has(schedule.id)) return false; // FIXED: Skip if already processing
            const nextRun = schedule.nextRun?.toDate ? schedule.nextRun.toDate() : new Date(schedule.nextRun);
            return nextRun <= now;
        });

        if (dueSchedules.length === 0) return;

        console.log(`Processing ${dueSchedules.length} due schedules...`);

        for (const schedule of dueSchedules) {
            // FIXED: Mark as processing
            processingSchedulesRef.current.add(schedule.id);

            try {
                // FIXED: Check if report was already generated for this schedule run
                const reportsRef = collection(db, 'testSuites', activeSuite.id, 'reports');
                const lastRunTime = schedule.lastRun?.toDate ? schedule.lastRun.toDate() : null;
                
                if (lastRunTime) {
                    const recentQuery = query(
                        reportsRef,
                        where('scheduleId', '==', schedule.id),
                        where('createdAt', '>=', Timestamp.fromDate(lastRunTime))
                    );
                    const recentDocs = await getDocs(recentQuery);
                    
                    if (!recentDocs.empty) {
                        console.log(`Scheduled report already exists for schedule ${schedule.id}, skipping...`);
                        processingSchedulesRef.current.delete(schedule.id);
                        continue;
                    }
                }

                // Generate the scheduled report
                const reportData = generateReportData(schedule.type, {
                    suiteId: schedule.suiteId
                });

                const newReport = {
                    name: `${schedule.type} - ${now.toLocaleDateString()}`,
                    type: schedule.type,
                    status: 'Generated',
                    autoGenerated: true,
                    scheduledReport: true,
                    scheduleId: schedule.id,
                    suiteId: activeSuite.id,
                    suiteName: activeSuite.name,
                    created_by: currentUser.uid,
                    createdBy: schedule.userId,
                    createdAt: serverTimestamp(),
                    data: reportData,
                    format: 'pdf'
                };

                await addDoc(reportsRef, newReport);

                // Update schedule with next run time
                const frequency = schedule.frequency || 'weekly';
                const nextRunDate = new Date(now);
                
                if (frequency === 'daily') {
                    nextRunDate.setDate(nextRunDate.getDate() + 1);
                } else if (frequency === 'weekly') {
                    nextRunDate.setDate(nextRunDate.getDate() + 7);
                } else if (frequency === 'monthly') {
                    nextRunDate.setMonth(nextRunDate.getMonth() + 1);
                }

                const scheduleRef = doc(db, 'testSuites', activeSuite.id, 'reportSchedules', schedule.id);
                await updateDoc(scheduleRef, {
                    lastRun: Timestamp.fromDate(now),
                    nextRun: Timestamp.fromDate(nextRunDate),
                    updatedAt: serverTimestamp()
                });

                actions.ui?.showNotification?.({
                    type: 'success',
                    message: `Scheduled ${schedule.type} generated automatically`
                });
            } catch (err) {
                console.error('Error processing schedule:', err);
            } finally {
                // FIXED: Remove from processing set
                processingSchedulesRef.current.delete(schedule.id);
            }
        }
    }, [currentUser, activeSuite, schedules, generateReportData, actions]);

    // ========== SCHEDULE MANAGEMENT ==========

    /**
     * Create or update a report schedule
     */
    const saveSchedule = useCallback(async (scheduleData) => {
        if (!currentUser || !activeSuite?.id) {
            throw new Error('User or suite not available');
        }

        try {
            const schedule = {
                userId: currentUser.uid,
                userEmail: currentUser.email,
                suiteId: activeSuite.id,
                suiteName: activeSuite.name,
                type: scheduleData.type,
                frequency: scheduleData.frequency || 'weekly',
                active: scheduleData.active !== undefined ? scheduleData.active : true,
                lastRun: null,
                nextRun: scheduleData.nextRun || Timestamp.fromDate(new Date()),
                createdAt: serverTimestamp()
            };

            if (scheduleData.id) {
                const scheduleRef = doc(db, 'testSuites', activeSuite.id, 'reportSchedules', scheduleData.id);
                await updateDoc(scheduleRef, {
                    ...schedule,
                    updatedAt: serverTimestamp()
                });

                actions.ui?.showNotification?.({
                    type: 'success',
                    message: 'Schedule updated successfully'
                });
            } else {
                const schedulesRef = collection(db, 'testSuites', activeSuite.id, 'reportSchedules');
                await addDoc(schedulesRef, schedule);

                actions.ui?.showNotification?.({
                    type: 'success',
                    message: 'Schedule created successfully'
                });
            }
        } catch (err) {
            console.error('Error saving schedule:', err);
            actions.ui?.showNotification?.({
                type: 'error',
                message: `Failed to save schedule: ${err.message}`
            });
            throw err;
        }
    }, [currentUser, activeSuite, actions]);

    /**
     * Delete a schedule
     */
    const deleteSchedule = useCallback(async (scheduleId) => {
        if (!activeSuite?.id) {
            throw new Error('No active suite');
        }

        try {
            const scheduleRef = doc(db, 'testSuites', activeSuite.id, 'reportSchedules', scheduleId);
            await deleteDoc(scheduleRef);

            actions.ui?.showNotification?.({
                type: 'success',
                message: 'Schedule deleted successfully'
            });
        } catch (err) {
            console.error('Error deleting schedule:', err);
            actions.ui?.showNotification?.({
                type: 'error',
                message: `Failed to delete schedule: ${err.message}`
            });
            throw err;
        }
    }, [activeSuite, actions]);

    // ========== REPORT MANAGEMENT ==========

    /**
     * Manually generate a report (supports PDF and CSV)
     */
    const generateReport = useCallback(async (reportConfig) => {
        if (!currentUser || !activeSuite?.id) {
            throw new Error('User or suite not available');
        }

        try {
            const format = reportConfig.format || 'pdf';
            const reportData = generateReportData(reportConfig.type, {
                suiteId: reportConfig.suiteId || activeSuite.id,
                sprintId: reportConfig.sprintId,
                runId: reportConfig.runId
            });

            const newReport = {
                name: reportConfig.name,
                type: reportConfig.type,
                status: 'Generated',
                autoGenerated: false,
                suiteId: activeSuite.id,
                suiteName: activeSuite.name,
                sprintId: reportConfig.sprintId || null,
                runId: reportConfig.runId || null,
                created_by: currentUser.uid,
                createdBy: currentUser.email || currentUser.uid,
                createdAt: serverTimestamp(),
                data: reportData,
                format: format,
                description: reportConfig.description || ''
            };

            const reportsRef = collection(db, 'testSuites', activeSuite.id, 'reports');
            const docRef = await addDoc(reportsRef, newReport);

            actions.ui?.showNotification?.({
                type: 'success',
                message: `Report "${reportConfig.name}" generated successfully as ${format.toUpperCase()}`
            });

            return docRef.id;
        } catch (err) {
            console.error('Error generating report:', err);
            actions.ui?.showNotification?.({
                type: 'error',
                message: `Failed to generate report: ${err.message}`
            });
            throw err;
        }
    }, [currentUser, activeSuite, generateReportData, actions]);

    /**
     * Update report status
     */
    const updateReportStatus = useCallback(async (reportId, newStatus) => {
        if (!activeSuite?.id) {
            throw new Error('No active suite');
        }

        try {
            const reportRef = doc(db, 'testSuites', activeSuite.id, 'reports', reportId);
            await updateDoc(reportRef, {
                status: newStatus,
                updatedAt: serverTimestamp(),
                updatedBy: currentUser?.email || currentUser?.uid
            });

            actions.ui?.showNotification?.({
                type: 'success',
                message: `Report status updated to ${newStatus}`
            });
        } catch (err) {
            console.error('Error updating report status:', err);
            actions.ui?.showNotification?.({
                type: 'error',
                message: `Failed to update report status: ${err.message}`
            });
            throw err;
        }
    }, [activeSuite, currentUser, actions]);

    /**
     * Delete a report
     */
    const deleteReport = useCallback(async (reportId) => {
        if (!activeSuite?.id) {
            throw new Error('No active suite');
        }

        try {
            const reportRef = doc(db, 'testSuites', activeSuite.id, 'reports', reportId);
            await deleteDoc(reportRef);

            actions.ui?.showNotification?.({
                type: 'success',
                message: 'Report deleted successfully'
            });
        } catch (err) {
            console.error('Error deleting report:', err);
            actions.ui?.showNotification?.({
                type: 'error',
                message: `Failed to delete report: ${err.message}`
            });
            throw err;
        }
    }, [activeSuite, actions]);

    // ========== REAL-TIME SUBSCRIPTIONS ==========

    useEffect(() => {
        if (!currentUser || !activeSuite?.id) {
            setReports([]);
            setSchedules([]);
            setLoading(false);
            return;
        }

        setLoading(true);

        // Subscribe to reports subcollection
        const reportsQuery = query(
            collection(db, 'testSuites', activeSuite.id, 'reports'),
            orderBy('createdAt', 'desc')
        );

        unsubscribeReportsRef.current = onSnapshot(
            reportsQuery,
            (snapshot) => {
                const reportsData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setReports(reportsData);
                setLoading(false);
            },
            (err) => {
                console.error('Error subscribing to reports:', err);
                setError(err.message);
                setLoading(false);
            }
        );

        // Subscribe to schedules subcollection
        const schedulesQuery = query(
            collection(db, 'testSuites', activeSuite.id, 'reportSchedules'),
            where('userId', '==', currentUser.uid)
        );

        unsubscribeSchedulesRef.current = onSnapshot(
            schedulesQuery,
            (snapshot) => {
                const schedulesData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setSchedules(schedulesData);
            },
            (err) => {
                console.error('Error subscribing to schedules:', err);
            }
        );

        return () => {
            if (unsubscribeReportsRef.current) {
                unsubscribeReportsRef.current();
            }
            if (unsubscribeSchedulesRef.current) {
                unsubscribeSchedulesRef.current();
            }
        };
    }, [currentUser?.uid, activeSuite?.id]);

    // Apply filters
    const filteredReports = reports.filter(report => {
        if (filters.type !== 'all' && report.type !== filters.type) return false;
        if (filters.status !== 'all' && report.status !== filters.status) return false;
        if (filters.author && !report.createdBy?.toLowerCase().includes(filters.author.toLowerCase())) return false;
        if (filters.date) {
            const reportDate = report.createdAt?.toDate ? report.createdAt.toDate() : new Date(report.createdAt);
            const filterDate = new Date(filters.date);
            if (reportDate.toDateString() !== filterDate.toDateString()) return false;
        }
        return true;
    });

    return {
        reports: filteredReports,
        schedules,
        loading,
        error,
        filters,
        setFilters,
        reportTypes,
        hasPermission,
        generateReport,
        createAutoReport,
        updateReportStatus,
        deleteReport,
        saveSchedule,
        deleteSchedule,
        processDueSchedules
    };
};