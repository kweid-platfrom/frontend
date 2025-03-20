// hooks/useTestCaseMetrics.js
import { useState } from 'react';
import { db } from "../config/firebase";
import { collection, doc, setDoc } from "firebase/firestore";
import { useTestCaseMetricsContext } from '../context/TestCaseMetricContext';

/**
 * Custom hook to process test case data for dashboard metrics
 */
export const useTestCaseMetrics = () => {
    const [isProcessing, setIsProcessing] = useState(false);
    const { notifyMetricsUpdated, setIsMetricsUpdating, setUpdateStatus } = useTestCaseMetricsContext();

    /**
     * Processes test cases and saves metrics to Firestore for dashboard consumption
     * @param {Array} testCases - Array of test case objects
     * @returns {Promise<boolean>} Success status
     */
    const processAndSaveMetrics = async (testCases) => {
        if (!testCases || testCases.length === 0) {
            console.warn("No test cases provided for metrics processing");
            return false;
        }

        setIsProcessing(true);
        setIsMetricsUpdating(true);
        setUpdateStatus('Processing metrics...');

        try {
            // 1. Process and save test coverage data
            const testCoverageData = processTestCoverageData(testCases);
            await saveTestCoverageData(testCoverageData);
            setUpdateStatus('Coverage data saved...');

            // 2. Process and save test results data
            const testResultsData = processTestResultsData(testCases);
            await saveTestResultsData(testResultsData);
            setUpdateStatus('Test results saved...');

            // 3. Process and save bug status data (from failed test cases)
            const bugReportsData = processBugReportsData(testCases);
            await saveBugReportsData(bugReportsData);
            setUpdateStatus('Bug reports saved...');

            // 4. Add activity entries for significant test case events
            await saveTestCaseActivities(testCases);
            setUpdateStatus('Activities saved...');

            // Notify that metrics have been updated
            await notifyMetricsUpdated();
            
            setUpdateStatus('Metrics updated successfully');
            setIsProcessing(false);
            setIsMetricsUpdating(false);
            return true;
        } catch (error) {
            console.error("Error processing test case metrics:", error);
            setUpdateStatus(`Error: ${error.message}`);
            setIsProcessing(false);
            setIsMetricsUpdating(false);
            return false;
        }
    };

    /**
     * Process test cases to extract coverage data by module
     */
    const processTestCoverageData = (testCases) => {
        // Group test cases by module
        const modules = testCases.reduce((acc, testCase) => {
            const moduleName = testCase.module || 'Uncategorized';

            if (!acc[moduleName]) {
                acc[moduleName] = {
                    total: 0,
                    covered: 0
                };
            }

            acc[moduleName].total++;

            // Consider a test case as "covered" if it has been executed
            if (testCase.executionStatus && testCase.executionStatus !== 'Not Run') {
                acc[moduleName].covered++;
            }

            return acc;
        }, {});

        // Calculate coverage percentages
        const result = {
            timestamp: new Date(),
            modules: {}
        };

        Object.entries(modules).forEach(([moduleName, data]) => {
            result.modules[moduleName] = {
                total: data.total,
                covered: data.covered,
                coverage: data.total > 0 ? Math.round((data.covered / data.total) * 100) : 0
            };
        });

        return result;
    };

    /**
     * Process test cases to extract test results data (pass/fail metrics)
     */
    const processTestResultsData = (testCases) => {
        // Count test results
        const passed = testCases.filter(tc => tc.executionStatus === 'Passed').length;
        const failed = testCases.filter(tc => tc.executionStatus === 'Failed').length;
        const skipped = testCases.filter(tc => tc.executionStatus === 'Skipped' || tc.executionStatus === 'Blocked').length;
        const notRun = testCases.filter(tc => tc.executionStatus === 'Not Run').length;

        return {
            timestamp: new Date(),
            testName: "Test Case Execution",
            executedBy: "Test Case Manager",
            passed,
            failed,
            skipped,
            notRun,
            total: testCases.length
        };
    };

    /**
     * Process failed test cases to extract bug report data
     */
    const processBugReportsData = (testCases) => {
        // Filter test cases that have failed
        const failedTests = testCases.filter(tc => tc.executionStatus === 'Failed');

        // Create bug reports for failed test cases
        return failedTests.map(testCase => ({
            title: `Failed Test: ${testCase.title}`,
            description: `This bug was automatically created from a failed test case.\n\nDescription: ${testCase.description}\n\nSteps to reproduce: ${testCase.steps?.map((step, index) => `${index + 1}. ${step.description}`).join('\n') || 'N/A'}`,
            priority: testCase.priority || 'Medium',
            status: 'New',
            severity: getSeverityFromPriority(testCase.priority),
            module: testCase.module || 'Uncategorized',
            reportedBy: 'Test Case Management System',
            timestamp: new Date(),
            testCaseId: testCase.id
        }));
    };

    /**
     * Map test case priority to bug severity
     */
    const getSeverityFromPriority = (priority) => {
        switch (priority) {
            case 'High':
                return 'Critical';
            case 'Medium':
                return 'Major';
            case 'Low':
                return 'Minor';
            default:
                return 'Major';
        }
    };

    /**
     * Save test coverage data to Firestore
     */
    const saveTestCoverageData = async (coverageData) => {
        try {
            const docRef = doc(collection(db, "testCoverage"));
            await setDoc(docRef, coverageData);
            return true;
        } catch (error) {
            console.error("Error saving test coverage data:", error);
            return false;
        }
    };

    /**
     * Save test results data to Firestore
     */
    const saveTestResultsData = async (resultsData) => {
        try {
            const docRef = doc(collection(db, "testResults"));
            await setDoc(docRef, resultsData);
            return true;
        } catch (error) {
            console.error("Error saving test results data:", error);
            return false;
        }
    };

    /**
     * Save bug reports for failed test cases
     */
    const saveBugReportsData = async (bugReports) => {
        if (!bugReports || bugReports.length === 0) return true;

        try {
            // Save each bug report as a separate document
            const promises = bugReports.map(bugReport => {
                const docRef = doc(collection(db, "bugReports"));
                return setDoc(docRef, bugReport);
            });

            await Promise.all(promises);
            return true;
        } catch (error) {
            console.error("Error saving bug reports:", error);
            return false;
        }
    };

    /**
     * Save activity entries for significant test case events
     */
    const saveTestCaseActivities = async (testCases) => {
        try {
            // Get recently executed test cases (assuming they have an executedAt field)
            const recentlyExecuted = testCases
                .filter(tc => tc.executedAt)
                .sort((a, b) => new Date(b.executedAt) - new Date(a.executedAt))
                .slice(0, 5);

            // Create activity entries
            const activities = recentlyExecuted.map(testCase => ({
                type: "test",
                title: testCase.title,
                status: testCase.executionStatus || "Unknown",
                user: testCase.executedBy || "System",
                timestamp: new Date(testCase.executedAt),
                testCaseId: testCase.id
            }));

            // Save activity entries
            const promises = activities.map(activity => {
                const docRef = doc(collection(db, "activities"));
                return setDoc(docRef, activity);
            });

            await Promise.all(promises);
            return true;
        } catch (error) {
            console.error("Error saving test case activities:", error);
            return false;
        }
    };

    return {
        processAndSaveMetrics,
        isProcessing
    };
};