// hooks/useTestRuns.js
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useApp } from '@/context/AppProvider';
import {
    collection,
    getDocs,
    updateDoc,
    doc,
    serverTimestamp,
    getDoc
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { useReports } from './useReports';

export const useTestRuns = () => {
    const { state, actions } = useApp();
    const { createAutoReport } = useReports();

    const currentUser = state?.auth?.currentUser;
    const activeSuite = state?.suites?.activeSuite;
    const allTestCases = state?.testCases?.testCases || [];

    const [testRuns, setTestRuns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Extract unique runs from test cases
    useEffect(() => {
        if (!activeSuite?.id || !allTestCases.length) {
            setTestRuns([]);
            setLoading(false);
            return;
        }

        try {
            const runsMap = new Map();

            // Iterate through all test cases and extract run information
            allTestCases.forEach(testCase => {
                if (testCase.runs && Array.isArray(testCase.runs)) {
                    testCase.runs.forEach(run => {
                        if (!runsMap.has(run.runId)) {
                            runsMap.set(run.runId, {
                                id: run.runId,
                                name: run.runName,
                                sprint_id: run.sprintId,
                                build_version: run.buildVersion,
                                environment: run.environment,
                                description: run.description,
                                status: run.status,
                                created_by: run.created_by,
                                created_at: run.created_at,
                                started_at: run.started_at,
                                completed_at: run.completed_at,
                                test_cases: [],
                                results: {},
                                summary: {
                                    total: 0,
                                    passed: 0,
                                    failed: 0,
                                    blocked: 0,
                                    skipped: 0,
                                    not_executed: 0
                                }
                            });
                        }

                        const runData = runsMap.get(run.runId);

                        // Add test case to this run
                        if (!runData.test_cases.includes(testCase.id)) {
                            runData.test_cases.push(testCase.id);
                        }

                        // Store the result for this test case
                        runData.results[testCase.id] = {
                            status: run.executionStatus || 'not_executed',
                            executed_at: run.executed_at,
                            executed_by: run.executed_by,
                            duration: run.duration,
                            notes: run.notes,
                            bugs_created: run.bugs_created || []
                        };

                        // Update summary
                        runData.summary.total++;
                        const status = run.executionStatus || 'not_executed';
                        if (runData.summary[status] !== undefined) {
                            runData.summary[status]++;
                        }
                    });
                }
            });

            const runsArray = Array.from(runsMap.values())
                .sort((a, b) => {
                    const dateA = a.created_at instanceof Date ? a.created_at : new Date(a.created_at);
                    const dateB = b.created_at instanceof Date ? b.created_at : new Date(b.created_at);
                    return dateB - dateA;
                });

            setTestRuns(runsArray);
            setLoading(false);
            setError(null);
        } catch (err) {
            console.error('Error extracting test runs:', err);
            setError(err.message);
            setLoading(false);
        }
    }, [activeSuite?.id, allTestCases]);

    // Create test run - adds run data to each selected test case's runs array
    const createTestRun = useCallback(async (runData) => {
        const suiteId = runData.suite_id || activeSuite?.id;

        if (!suiteId) {
            throw new Error('No suite ID provided. Please ensure you have an active test suite.');
        }

        const createdBy = runData.created_by || currentUser?.email || currentUser?.uid;

        if (!createdBy) {
            throw new Error('No user information available.');
        }

        if (!runData.test_cases || runData.test_cases.length === 0) {
            throw new Error('No test cases selected for this run.');
        }

        try {
            // Generate unique run ID
            const runId = `run_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const timestamp = new Date();

            // Prepare run record to be added to each test case's runs array
            const runRecord = {
                runId: runId,
                runName: runData.name,
                sprintId: runData.sprint_id,
                buildVersion: runData.build_version || '',
                environment: runData.environment,
                description: runData.description || '',
                status: 'not_started',
                created_by: createdBy,
                created_at: timestamp,
                started_at: null,
                completed_at: null,
                executionStatus: 'not_executed',
                executed_at: null,
                executed_by: null,
                duration: null,
                notes: '',
                bugs_created: []
            };

            // Update each test case: add this run to their runs array
            const updatePromises = runData.test_cases.map(async (testCaseId) => {
                const testCaseRef = doc(db, 'testSuites', suiteId, 'testCases', testCaseId);
                const testCaseData = allTestCases.find(tc => tc.id === testCaseId);

                if (!testCaseData) {
                    throw new Error(`Test case ${testCaseId} not found`);
                }

                const existingRuns = testCaseData.runs || [];
                const updatedRuns = [...existingRuns, runRecord];

                await updateDoc(testCaseRef, {
                    runs: updatedRuns,
                    suite_id: suiteId,
                    updated_at: serverTimestamp()
                });
            });

            await Promise.all(updatePromises);

            actions.ui?.showNotification?.({
                type: 'success',
                message: `Test run "${runData.name}" created with ${runData.test_cases.length} test cases`,
            });

            return {
                id: runId,
                name: runData.name,
                sprint_id: runData.sprint_id,
                build_version: runData.build_version || '',
                environment: runData.environment,
                description: runData.description || '',
                status: 'not_started',
                created_by: createdBy,
                created_at: timestamp,
                started_at: null,
                completed_at: null,
                test_cases: runData.test_cases,
                results: {},
                summary: {
                    total: runData.test_cases.length,
                    passed: 0,
                    failed: 0,
                    blocked: 0,
                    skipped: 0,
                    not_executed: runData.test_cases.length
                }
            };
        } catch (err) {
            console.error('Error creating test run:', err);
            actions.ui?.showNotification?.({
                type: 'error',
                message: `Failed to create test run: ${err.message}`,
            });
            throw err;
        }
    }, [activeSuite, currentUser, allTestCases, actions]);

    // Update test run - updates the run data across all test cases that have this run
    // ENHANCED: Auto-generates report when run status changes to 'completed'
    const updateTestRun = useCallback(async (runId, updates) => {
        if (!runId) {
            throw new Error('Run ID is required');
        }

        try {
            const testCasesRef = collection(db, 'testSuites', activeSuite?.id, 'testCases');
            const snapshot = await getDocs(testCasesRef);
            const updatePromises = [];
            let runName = '';

            snapshot.forEach((docSnapshot) => {
                const testCase = docSnapshot.data();
                if (testCase.runs && Array.isArray(testCase.runs)) {
                    const runIndex = testCase.runs.findIndex(r => r.runId === runId);
                    if (runIndex !== -1) {
                        const updatedRuns = [...testCase.runs];
                        updatedRuns[runIndex] = {
                            ...updatedRuns[runIndex],
                            ...updates
                        };

                        // Store run name for report generation
                        if (!runName) {
                            runName = updatedRuns[runIndex].runName;
                        }

                        const testCaseRef = doc(db, 'testSuites', activeSuite?.id, 'testCases', docSnapshot.id);
                        updatePromises.push(
                            updateDoc(testCaseRef, {
                                runs: updatedRuns,
                                updated_at: serverTimestamp()
                            })
                        );
                    }
                }
            });

            await Promise.all(updatePromises);

            // AUTO-GENERATE REPORT when run status changes to 'completed'
            if (updates.status === 'completed' && createAutoReport) {
                try {
                    console.log('Test run completed, generating auto-report...');
                    await createAutoReport(runId, runName);
                } catch (reportErr) {
                    console.error('Failed to auto-generate report:', reportErr);
                    // Don't throw - report generation failure shouldn't break run completion
                }
            }

            actions.ui?.showNotification?.({
                type: 'success',
                message: 'Test run updated successfully',
            });
        } catch (err) {
            console.error('Error updating test run:', err);
            actions.ui?.showNotification?.({
                type: 'error',
                message: `Failed to update test run: ${err.message}`,
            });
            throw err;
        }
    }, [activeSuite, actions, createAutoReport]);

    // Update test run result for a specific test case
    // UPDATED: Updates both run-specific result and global test case status
    // Global status reflects the LATEST execution across all runs
    const updateTestRunResult = useCallback(async (runId, testCaseId, result) => {
        if (!runId || !testCaseId) {
            throw new Error('Run ID and Test Case ID are required');
        }

        try {
            const testCaseRef = doc(db, 'testSuites', activeSuite?.id, 'testCases', testCaseId);
            const testCaseDoc = await getDoc(testCaseRef);

            if (!testCaseDoc.exists()) {
                throw new Error('Test case not found');
            }

            const testCase = testCaseDoc.data();

            if (!testCase.runs || !Array.isArray(testCase.runs)) {
                throw new Error('Test case has no runs');
            }

            const runIndex = testCase.runs.findIndex(r => r.runId === runId);
            if (runIndex === -1) {
                throw new Error('Run not found in test case');
            }

            const executionTimestamp = result.executed_at || new Date();
            const executedBy = result.executed_by || currentUser?.email || currentUser?.uid;

            // Update the run's result in the runs array
            const updatedRuns = [...testCase.runs];
            updatedRuns[runIndex] = {
                ...updatedRuns[runIndex],
                executionStatus: result.status,
                executed_at: executionTimestamp,
                executed_by: executedBy,
                duration: result.duration || null,
                notes: result.notes || '',
                bugs_created: result.bugs_created || []
            };

            // Find the most recent execution across all runs to determine global status
            const allExecutions = updatedRuns
                .filter(run => run.executed_at && run.executionStatus !== 'not_executed')
                .sort((a, b) => {
                    const dateA = a.executed_at instanceof Date ? a.executed_at : new Date(a.executed_at);
                    const dateB = b.executed_at instanceof Date ? b.executed_at : new Date(b.executed_at);
                    return dateB - dateA;
                });

            // Global status = most recent execution status
            const latestExecution = allExecutions[0];
            const globalStatus = latestExecution?.executionStatus || 'pending';
            const globalLastExecuted = latestExecution?.executed_at || executionTimestamp;

            // Update test case with run-specific data AND global status
            await updateDoc(testCaseRef, {
                runs: updatedRuns,
                executionStatus: globalStatus,
                lastExecuted: globalLastExecuted,
                updated_at: serverTimestamp()
            });

            actions.ui?.showNotification?.({
                type: 'success',
                message: 'Test result updated successfully',
            });
        } catch (err) {
            console.error('Error updating test result:', err);
            actions.ui?.showNotification?.({
                type: 'error',
                message: `Failed to update test result: ${err.message}`,
            });
            throw err;
        }
    }, [activeSuite, currentUser, actions]);

    // Delete test run - removes the run from all test cases' runs arrays
    const deleteTestRun = useCallback(async (runId) => {
        if (!runId) {
            throw new Error('Run ID is required');
        }

        try {
            const testCasesRef = collection(db, 'testSuites', activeSuite?.id, 'testCases');
            const snapshot = await getDocs(testCasesRef);
            const updatePromises = [];

            snapshot.forEach((docSnapshot) => {
                const testCase = docSnapshot.data();
                if (testCase.runs && Array.isArray(testCase.runs)) {
                    const filteredRuns = testCase.runs.filter(r => r.runId !== runId);

                    if (filteredRuns.length !== testCase.runs.length) {
                        const testCaseRef = doc(db, 'testSuites', activeSuite?.id, 'testCases', docSnapshot.id);
                        updatePromises.push(
                            updateDoc(testCaseRef, {
                                runs: filteredRuns,
                                updated_at: serverTimestamp()
                            })
                        );
                    }
                }
            });

            await Promise.all(updatePromises);

            actions.ui?.showNotification?.({
                type: 'success',
                message: 'Test run deleted successfully',
            });
        } catch (err) {
            console.error('Error deleting test run:', err);
            actions.ui?.showNotification?.({
                type: 'error',
                message: `Failed to delete test run: ${err.message}`,
            });
            throw err;
        }
    }, [activeSuite, actions]);

    return {
        testRuns,
        loading,
        error,
        createTestRun,
        updateTestRun,
        updateTestRunResult,
        deleteTestRun,
        activeSuite,
        currentUser
    };
};