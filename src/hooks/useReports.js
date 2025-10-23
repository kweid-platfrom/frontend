// hooks/useReports.js - COMPLETE FIXED VERSION
'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useApp } from '@/context/AppProvider';
import {
    collection,
    doc,
    getDocs,
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
    
    // Wrap in useMemo to prevent exhaustive-deps warnings
    const allTestCases = useMemo(() => state?.testCases?.testCases || [], [state?.testCases?.testCases]);
    const testRuns = useMemo(() => state?.testRuns?.testRuns || [], [state?.testRuns?.testRuns]);
    const bugs = useMemo(() => state?.bugs?.bugs || [], [state?.bugs?.bugs]);
    const requirements = useMemo(() => state?.requirements?.requirements || [], [state?.requirements?.requirements]);

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
    const isGeneratingRef = useRef(false);
    const processingSchedulesRef = useRef(new Set());

    // PRIORITY REPORT TYPES
    const reportTypes = [
        // PRIORITY REPORTS (Top 4)
        'Test Summary Report',
        'Defect Report',
        'Release Readiness Report',
        'Requirement Coverage Report',
        
        // SECONDARY REPORTS
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

    const hasPermission = useCallback(() => {
        if (!currentUser) return false;
        const role = currentUser.role || 'tester';
        return ['admin', 'manager', 'lead'].includes(role);
    }, [currentUser]);

    // ========== HELPER FUNCTIONS ==========

    const calculatePassRate = (passed, total) => {
        return total > 0 ? Math.round((passed / total) * 100) : 0;
    };

    const calculateDefectDensity = (defects, testCases) => {
        return testCases > 0 ? (defects / testCases * 100).toFixed(2) : 0;
    };

    const getDefectAging = (createdAt) => {
        if (!createdAt) return 0;
        const created = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
        const now = new Date();
        return Math.floor((now - created) / (1000 * 60 * 60 * 24)); // days
    };

    const getCriticalDefects = (bugs) => {
        return bugs.filter(b => 
            b.severity === 'critical' || b.priority === 'critical'
        );
    };

    const getOpenDefects = (bugs) => {
        return bugs.filter(b => 
            !['resolved', 'closed', 'fixed'].includes(b.status?.toLowerCase())
        );
    };

    const calculateAvgResolutionTime = (closedBugs) => {
        if (closedBugs.length === 0) return 'N/A';
        
        let totalTime = 0;
        let count = 0;

        closedBugs.forEach(bug => {
            if (bug.created_at && bug.resolved_at) {
                const created = bug.created_at.toDate ? bug.created_at.toDate() : new Date(bug.created_at);
                const resolved = bug.resolved_at.toDate ? bug.resolved_at.toDate() : new Date(bug.resolved_at);
                totalTime += (resolved - created) / (1000 * 60 * 60 * 24); // days
                count++;
            }
        });

        return count > 0 ? `${Math.round(totalTime / count)} days` : 'N/A';
    };

    // ========== PRIORITY REPORT #1: TEST SUMMARY REPORT ==========
    const generateTestSummaryReport = useCallback((params = {}) => {
        const { buildId, sprintId, runId } = params;
        
        let relevantRuns = testRuns;
        let relevantTestCases = allTestCases;
        let contextName = 'All Tests';

        if (runId) {
            relevantRuns = testRuns.filter(r => r.id === runId);
            contextName = relevantRuns[0]?.name || 'Test Run';
        } else if (buildId) {
            relevantRuns = testRuns.filter(r => r.build_version === buildId);
            contextName = `Build ${buildId}`;
        } else if (sprintId) {
            relevantRuns = testRuns.filter(r => r.sprint_id === sprintId);
            relevantTestCases = allTestCases.filter(tc => tc.sprint_id === sprintId);
            contextName = `Sprint ${sprintId}`;
        }

        let totalTests = 0;
        let passedTests = 0;
        let failedTests = 0;
        let blockedTests = 0;
        let skippedTests = 0;
        let notExecuted = 0;
        let totalDuration = 0;
        let lastExecutionDate = null;

        relevantRuns.forEach(run => {
            totalTests += run.summary.total || 0;
            passedTests += run.summary.passed || 0;
            failedTests += run.summary.failed || 0;
            blockedTests += run.summary.blocked || 0;
            skippedTests += run.summary.skipped || 0;

            if (run.completed_at) {
                const completedDate = run.completed_at.toDate ? run.completed_at.toDate() : new Date(run.completed_at);
                if (!lastExecutionDate || completedDate > lastExecutionDate) {
                    lastExecutionDate = completedDate;
                }
            }

            if (run.started_at && run.completed_at) {
                const start = run.started_at.toDate ? run.started_at.toDate() : new Date(run.started_at);
                const end = run.completed_at.toDate ? run.completed_at.toDate() : new Date(run.completed_at);
                totalDuration += (end - start) / 1000 / 60; // minutes
            }
        });

        notExecuted = relevantTestCases.length - totalTests;
        const executionProgress = relevantTestCases.length > 0 
            ? Math.round((totalTests / relevantTestCases.length) * 100) 
            : 0;

        const passRate = calculatePassRate(passedTests, totalTests);

        return {
            summary: {
                context: contextName,
                totalTestCases: relevantTestCases.length,
                executed: totalTests,
                notExecuted,
                executionProgress: `${executionProgress}%`,
                passed: passedTests,
                failed: failedTests,
                blocked: blockedTests,
                skipped: skippedTests,
                passRate: `${passRate}%`,
                totalDuration: `${Math.round(totalDuration)} min`,
                lastExecutionDate: lastExecutionDate?.toLocaleString() || 'N/A'
            },
            details: relevantRuns.map(run => ({
                runName: run.name,
                environment: run.environment,
                buildVersion: run.build_version,
                executed: run.summary.total,
                passed: run.summary.passed,
                failed: run.summary.failed,
                passRate: calculatePassRate(run.summary.passed, run.summary.total),
                executedAt: run.completed_at?.toDate ? run.completed_at.toDate().toLocaleString() : 'N/A'
            })),
            charts: [
                {
                    type: 'pie',
                    title: 'Execution Status Distribution',
                    data: [
                        { name: 'Passed', value: passedTests },
                        { name: 'Failed', value: failedTests },
                        { name: 'Blocked', value: blockedTests },
                        { name: 'Skipped', value: skippedTests },
                        { name: 'Not Executed', value: notExecuted }
                    ]
                },
                {
                    type: 'bar',
                    title: 'Execution Progress',
                    data: [
                        { name: 'Executed', value: totalTests },
                        { name: 'Remaining', value: notExecuted }
                    ]
                }
            ]
        };
    }, [testRuns, allTestCases]);

    // ========== PRIORITY REPORT #2: DEFECT REPORT ==========
    const generateDefectReport = useCallback((params = {}) => {
        const { moduleFilter } = params;
        
        let relevantBugs = bugs;
        if (moduleFilter) {
            relevantBugs = bugs.filter(b => b.module === moduleFilter);
        }

        const openBugs = getOpenDefects(relevantBugs);
        const closedBugs = relevantBugs.filter(b => 
            ['resolved', 'closed', 'fixed'].includes(b.status?.toLowerCase())
        );

        const criticalCount = relevantBugs.filter(b => b.severity === 'critical').length;
        const highCount = relevantBugs.filter(b => b.severity === 'high').length;
        const mediumCount = relevantBugs.filter(b => b.severity === 'medium').length;
        const lowCount = relevantBugs.filter(b => b.severity === 'low').length;

        const agingBuckets = {
            '0-7 days': 0,
            '8-14 days': 0,
            '15-30 days': 0,
            '30+ days': 0
        };

        openBugs.forEach(bug => {
            const age = getDefectAging(bug.created_at);
            if (age <= 7) agingBuckets['0-7 days']++;
            else if (age <= 14) agingBuckets['8-14 days']++;
            else if (age <= 30) agingBuckets['15-30 days']++;
            else agingBuckets['30+ days']++;
        });

        const moduleDefects = {};
        relevantBugs.forEach(bug => {
            const moduleName = bug.module || 'Unassigned';
            moduleDefects[moduleName] = (moduleDefects[moduleName] || 0) + 1;
        });

        const hotspots = Object.entries(moduleDefects)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([moduleName, count]) => ({ module: moduleName, count }));

        return {
            summary: {
                totalDefects: relevantBugs.length,
                openDefects: openBugs.length,
                closedDefects: closedBugs.length,
                criticalDefects: criticalCount,
                defectDensity: calculateDefectDensity(relevantBugs.length, allTestCases.length),
                avgResolutionTime: calculateAvgResolutionTime(closedBugs)
            },
            details: relevantBugs.map(bug => ({
                id: bug.id,
                title: bug.title,
                severity: bug.severity,
                priority: bug.priority,
                status: bug.status,
                module: bug.module || 'N/A',
                age: getDefectAging(bug.created_at),
                assignee: bug.assigned_to || 'Unassigned',
                createdAt: bug.created_at?.toDate ? bug.created_at.toDate().toLocaleDateString() : 'N/A'
            })),
            charts: [
                {
                    type: 'pie',
                    title: 'Defect Status',
                    data: [
                        { name: 'Open', value: openBugs.length },
                        { name: 'Closed', value: closedBugs.length }
                    ]
                },
                {
                    type: 'bar',
                    title: 'Severity Distribution',
                    data: [
                        { name: 'Critical', value: criticalCount },
                        { name: 'High', value: highCount },
                        { name: 'Medium', value: mediumCount },
                        { name: 'Low', value: lowCount }
                    ]
                },
                {
                    type: 'bar',
                    title: 'Defect Aging',
                    data: Object.entries(agingBuckets).map(([name, value]) => ({ name, value }))
                },
                {
                    type: 'bar',
                    title: 'Top 5 Module Hotspots',
                    data: hotspots.map(h => ({ name: h.module, value: h.count }))
                }
            ]
        };
    }, [bugs, allTestCases]);

    // ========== PRIORITY REPORT #3: RELEASE READINESS REPORT ==========
    const generateReleaseReadinessReport = useCallback(() => {
        const latestRun = testRuns.sort((a, b) => {
            const aDate = a.completed_at?.toDate ? a.completed_at.toDate() : new Date(0);
            const bDate = b.completed_at?.toDate ? b.completed_at.toDate() : new Date(0);
            return bDate - aDate;
        })[0];

        const totalTests = latestRun?.summary.total || allTestCases.length;
        const passedTests = latestRun?.summary.passed || 0;
        const passRate = calculatePassRate(passedTests, totalTests);

        const criticalOpenDefects = getCriticalDefects(getOpenDefects(bugs));
        const allOpenDefects = getOpenDefects(bugs);

        const totalRequirements = requirements.length || 0;
        const coveredRequirements = requirements.filter(req => 
            req.linked_tests && req.linked_tests.length > 0
        ).length;
        const coveragePercent = totalRequirements > 0 
            ? Math.round((coveredRequirements / totalRequirements) * 100) 
            : 0;

        const passRateThreshold = 95;
        const criticalDefectThreshold = 0;
        const coverageThreshold = 80;

        const passRatePass = passRate >= passRateThreshold;
        const criticalDefectPass = criticalOpenDefects.length <= criticalDefectThreshold;
        const coveragePass = coveragePercent >= coverageThreshold;

        const allCriteriaMet = passRatePass && criticalDefectPass && coveragePass;

        let riskScore = 0;
        riskScore += (100 - passRate) * 0.4;
        riskScore += criticalOpenDefects.length * 10;
        riskScore += (100 - coveragePercent) * 0.3;
        riskScore = Math.min(100, Math.round(riskScore));

        const recommendation = allCriteriaMet ? 'GO' : 'NO-GO';
        const riskLevel = riskScore < 20 ? 'Low' : riskScore < 50 ? 'Medium' : 'High';

        return {
            summary: {
                releaseId: 'Current',
                recommendation,
                riskLevel,
                riskScore: `${riskScore}/100`,
                passRate: `${passRate}%`,
                passRateStatus: passRatePass ? 'PASS' : 'FAIL',
                criticalDefects: criticalOpenDefects.length,
                criticalDefectStatus: criticalDefectPass ? 'PASS' : 'FAIL',
                requirementCoverage: `${coveragePercent}%`,
                coverageStatus: coveragePass ? 'PASS' : 'FAIL',
                totalOpenDefects: allOpenDefects.length,
                evaluatedAt: new Date().toLocaleString()
            },
            details: [
                {
                    criterion: 'Pass Rate',
                    threshold: `>= ${passRateThreshold}%`,
                    actual: `${passRate}%`,
                    status: passRatePass ? 'PASS' : 'FAIL',
                    impact: 'Critical'
                },
                {
                    criterion: 'Critical Defects',
                    threshold: `<= ${criticalDefectThreshold}`,
                    actual: criticalOpenDefects.length,
                    status: criticalDefectPass ? 'PASS' : 'FAIL',
                    impact: 'Critical'
                },
                {
                    criterion: 'Requirement Coverage',
                    threshold: `>= ${coverageThreshold}%`,
                    actual: `${coveragePercent}%`,
                    status: coveragePass ? 'PASS' : 'FAIL',
                    impact: 'High'
                }
            ],
            blockers: [
                ...(!passRatePass ? [`Pass rate (${passRate}%) below threshold (${passRateThreshold}%)`] : []),
                ...(!criticalDefectPass ? [`${criticalOpenDefects.length} critical defect(s) open`] : []),
                ...(!coveragePass ? [`Requirement coverage (${coveragePercent}%) below threshold (${coverageThreshold}%)`] : [])
            ],
            charts: [
                {
                    type: 'gauge',
                    title: 'Quality Gate Status',
                    data: [
                        { name: 'Pass Rate', value: passRate, threshold: passRateThreshold },
                        { name: 'Coverage', value: coveragePercent, threshold: coverageThreshold }
                    ]
                },
                {
                    type: 'bar',
                    title: 'Open Defects by Severity',
                    data: [
                        { name: 'Critical', value: criticalOpenDefects.length },
                        { name: 'High', value: allOpenDefects.filter(b => b.severity === 'high').length },
                        { name: 'Medium', value: allOpenDefects.filter(b => b.severity === 'medium').length },
                        { name: 'Low', value: allOpenDefects.filter(b => b.severity === 'low').length }
                    ]
                }
            ]
        };
    }, [testRuns, bugs, requirements, allTestCases]);

    // ========== PRIORITY REPORT #4: REQUIREMENT COVERAGE REPORT ==========
    const generateRequirementCoverageReport = useCallback(() => {
        const totalRequirements = requirements.length;
        
        const requirementDetails = requirements.map(req => {
            const linkedTests = allTestCases.filter(tc => 
                tc.requirement_id === req.id || 
                (tc.linked_requirements && tc.linked_requirements.includes(req.id))
            );

            const testResults = linkedTests.map(tc => {
                const latestRun = testRuns
                    .filter(run => run.test_cases && run.test_cases.includes(tc.id))
                    .sort((a, b) => {
                        const aDate = a.completed_at?.toDate ? a.completed_at.toDate() : new Date(0);
                        const bDate = b.completed_at?.toDate ? b.completed_at.toDate() : new Date(0);
                        return bDate - aDate;
                    })[0];

                const result = latestRun?.results?.[tc.id];
                return result?.status || 'not_executed';
            });

            const passedTests = testResults.filter(r => r === 'passed' || r === 'pass').length;
            const failedTests = testResults.filter(r => r === 'failed' || r === 'fail').length;
            const totalExecuted = testResults.filter(r => r !== 'not_executed').length;

            const status = linkedTests.length === 0 ? 'Uncovered' :
                          failedTests > 0 ? 'Failed' :
                          totalExecuted === 0 ? 'Not Tested' :
                          'Passed';

            return {
                requirementId: req.id,
                requirementTitle: req.title || req.name,
                category: req.category || 'Functional',
                priority: req.priority || 'Medium',
                linkedTestsCount: linkedTests.length,
                passedTests,
                failedTests,
                status,
                coverage: linkedTests.length > 0 ? 'Covered' : 'Uncovered'
            };
        });

        const coveredRequirements = requirementDetails.filter(r => r.coverage === 'Covered');
        const uncoveredRequirements = requirementDetails.filter(r => r.coverage === 'Uncovered');
        const passedRequirements = requirementDetails.filter(r => r.status === 'Passed');
        const failedRequirements = requirementDetails.filter(r => r.status === 'Failed');

        const coveragePercent = totalRequirements > 0 
            ? Math.round((coveredRequirements.length / totalRequirements) * 100) 
            : 0;

        return {
            summary: {
                totalRequirements,
                coveredRequirements: coveredRequirements.length,
                uncoveredRequirements: uncoveredRequirements.length,
                coveragePercent: `${coveragePercent}%`,
                passedRequirements: passedRequirements.length,
                failedRequirements: failedRequirements.length,
                notTestedRequirements: requirementDetails.filter(r => r.status === 'Not Tested').length
            },
            details: requirementDetails,
            charts: [
                {
                    type: 'pie',
                    title: 'Requirement Coverage',
                    data: [
                        { name: 'Covered', value: coveredRequirements.length },
                        { name: 'Uncovered', value: uncoveredRequirements.length }
                    ]
                },
                {
                    type: 'bar',
                    title: 'Requirement Status',
                    data: [
                        { name: 'Passed', value: passedRequirements.length },
                        { name: 'Failed', value: failedRequirements.length },
                        { name: 'Not Tested', value: requirementDetails.filter(r => r.status === 'Not Tested').length },
                        { name: 'Uncovered', value: uncoveredRequirements.length }
                    ]
                }
            ]
        };
    }, [requirements, allTestCases, testRuns]);

    // ========== LEGACY REPORT GENERATORS (Keep for backward compatibility) ==========
    
    const generateTestRunSummary = useCallback((params = {}) => {
        const { runId } = params;
        const run = testRuns.find(r => r.id === runId);
        if (!run) {
            return {
                summary: { message: 'Test run not found' },
                details: [],
                charts: []
            };
        }

        return {
            summary: {
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
            },
            details: run.test_cases.map(tcId => {
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
            }),
            charts: [
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
            ]
        };
    }, [testRuns, allTestCases]);

    const generateBugAnalysis = useCallback((params = {}) => {
        const { suiteId } = params;
        const suiteBugs = suiteId 
            ? bugs.filter(b => b.suite_id === suiteId)
            : bugs;

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

        return {
            summary: {
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
            },
            details: suiteBugs.map(bug => ({
                id: bug.id,
                title: bug.title,
                status: bug.status,
                priority: bug.priority,
                severity: bug.severity,
                reportedBy: bug.reported_by,
                createdAt: bug.created_at
            })),
            charts: [
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
            ]
        };
    }, [bugs]);

    const generateCoverageReport = useCallback((params = {}) => {
        const { suiteId } = params;
        const suiteCases = suiteId
            ? allTestCases.filter(tc => tc.suite_id === suiteId)
            : allTestCases;

        const typeCount = {};
        suiteCases.forEach(tc => {
            const type = tc.type || tc.testType || 'functional';
            typeCount[type] = (typeCount[type] || 0) + 1;
        });

        return {
            summary: {
                totalTestCases: suiteCases.length,
                automated: suiteCases.filter(tc => tc.isAutomated || tc.automated).length,
                manual: suiteCases.filter(tc => !(tc.isAutomated || tc.automated)).length,
                withSteps: suiteCases.filter(tc => tc.steps && tc.steps.length > 0).length,
                coverage: suiteCases.length > 0 
                    ? Math.round((suiteCases.filter(tc => tc.executionStatus && tc.executionStatus !== 'pending').length / suiteCases.length) * 100)
                    : 0
            },
            details: suiteCases.map(tc => ({
                id: tc.id,
                title: tc.title,
                type: tc.type || tc.testType,
                automated: tc.isAutomated || tc.automated,
                status: tc.executionStatus || 'pending'
            })),
            charts: [
                {
                    type: 'bar',
                    title: 'Test Cases by Type',
                    data: Object.entries(typeCount).map(([name, value]) => ({ name, value }))
                }
            ]
        };
    }, [allTestCases]);

    const generateWeeklyOrMonthlySummary = useCallback((type) => {
        const days = type === 'Weekly QA Summary' ? 7 : 30;
        const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

        const recentTests = allTestCases.filter(tc => {
            const created = tc.created_at?.toDate ? tc.created_at.toDate() : new Date(tc.created_at);
            return created > cutoffDate;
        });

        const recentBugs = bugs.filter(bug => {
            const created = bug.created_at?.toDate ? bug.created_at.toDate() : new Date(bug.created_at);
            return created > cutoffDate;
        });

        let totalExecutions = 0;
        let passedExecutions = 0;

        testRuns.forEach(run => {
            const runDate = run.created_at?.toDate ? run.created_at.toDate() : new Date(run.created_at);
            if (runDate > cutoffDate) {
                totalExecutions += run.summary.total;
                passedExecutions += run.summary.passed;
            }
        });

        return {
            summary: {
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
            },
            details: [],
            charts: [
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
            ]
        };
    }, [allTestCases, bugs, testRuns]);

    // ========== MAIN REPORT DATA GENERATOR ==========
    const generateReportData = useCallback((type, params = {}) => {
        console.log('Generating report:', type, params);

        switch (type) {
            // PRIORITY REPORTS
            case 'Test Summary Report':
                return generateTestSummaryReport(params);
            
            case 'Defect Report':
                return generateDefectReport(params);
            
            case 'Release Readiness Report':
                return generateReleaseReadinessReport();
            
            case 'Requirement Coverage Report':
                return generateRequirementCoverageReport();

            // LEGACY REPORTS
            case 'Test Run Summary':
                return generateTestRunSummary(params);
            
            case 'Bug Analysis':
                return generateBugAnalysis(params);
            
            case 'Coverage Report':
                return generateCoverageReport(params);
            
            case 'Weekly QA Summary':
                return generateWeeklyOrMonthlySummary('Weekly QA Summary');
            
            case 'Monthly QA Summary':
                return generateWeeklyOrMonthlySummary('Monthly QA Summary');
            
            default:
                return {
                    summary: { message: 'Report type not implemented yet' },
                    details: [],
                    charts: []
                };
        }
    }, [
        generateTestSummaryReport,
        generateDefectReport,
        generateReleaseReadinessReport,
        generateRequirementCoverageReport,
        generateTestRunSummary,
        generateBugAnalysis,
        generateCoverageReport,
        generateWeeklyOrMonthlySummary
    ]);

    // ========== AUTO-GENERATION ==========
    const createAutoReport = useCallback(async (runId, runName, format = 'pdf') => {
        if (!currentUser || !activeSuite?.id) {
            console.warn('createAutoReport: Missing user or suite');
            return;
        }

        // Prevent duplicate generation
        if (isGeneratingRef.current) {
            console.log('Report generation already in progress, skipping...');
            return;
        }

        isGeneratingRef.current = true;

        try {
            console.log('useReports.createAutoReport called:', { runId, runName, format, suiteId: activeSuite.id });

            // Check if report already exists for this run
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
            // Release lock after delay to prevent rapid re-triggers
            setTimeout(() => {
                isGeneratingRef.current = false;
            }, 2000);
        }
    }, [currentUser, activeSuite, generateReportData, actions]);

    // ========== SCHEDULED REPORTS ==========
    const processDueSchedules = useCallback(async () => {
        if (!currentUser || !activeSuite?.id) return;

        const now = new Date();
        const dueSchedules = schedules.filter(schedule => {
            if (!schedule.active) return false;
            if (processingSchedulesRef.current.has(schedule.id)) return false;
            const nextRun = schedule.nextRun?.toDate ? schedule.nextRun.toDate() : new Date(schedule.nextRun);
            return nextRun <= now;
        });

        if (dueSchedules.length === 0) return;

        console.log(`Processing ${dueSchedules.length} due schedules...`);

        for (const schedule of dueSchedules) {
            processingSchedulesRef.current.add(schedule.id);

            try {
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
                processingSchedulesRef.current.delete(schedule.id);
            }
        }
    }, [currentUser, activeSuite, schedules, generateReportData, actions]);

    // ========== SCHEDULE MANAGEMENT ==========
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
    const generateReport = useCallback(async (reportConfig) => {
        if (!currentUser || !activeSuite?.id) {
            throw new Error('User or suite not available');
        }

        try {
            const format = reportConfig.format || 'pdf';
            const reportData = generateReportData(reportConfig.type, {
                suiteId: reportConfig.suiteId || activeSuite.id,
                sprintId: reportConfig.sprintId,
                runId: reportConfig.runId,
                buildId: reportConfig.buildId,
                releaseId: reportConfig.releaseId,
                moduleFilter: reportConfig.moduleFilter
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
                buildId: reportConfig.buildId || null,
                releaseId: reportConfig.releaseId || null,
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
    }, [currentUser, activeSuite?.id]);

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