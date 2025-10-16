// ============================================================================
// PART 1: Enhanced useDashboard.js with Complete Metrics Tracking
// ============================================================================

/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect, useCallback, useRef } from 'react';
import { TestSuiteService } from '../services/TestSuiteService';
import { useApp } from '../context/AppProvider';

export const useDashboard = () => {
    const { state: { auth, subscription }, activeSuite } = useApp();
    const testSuiteServiceRef = useRef(null);
    const unsubscribeRef = useRef(null);
    const isRefreshingRef = useRef(false);
    const mountRef = useRef(false);

    if (!testSuiteServiceRef.current) {
        testSuiteServiceRef.current = new TestSuiteService(null);
    }

    const defaultMetrics = {
        // Test Case Metrics - ENHANCED
        totalTestCases: 0,
        manualTestCases: 0,
        automatedTestCases: 0,
        aiGeneratedTestCases: 0,
        testCasesWithTags: 0,
        testCasesLinkedToBugs: 0,
        testCasesWithRecordings: 0,
        outdatedTestCases: 0,
        recentlyUpdatedTestCases: 0,
        
        // Coverage Metrics - NEW
        functionalCoverage: 0,
        edgeCaseCoverage: 0,
        negativeCaseCoverage: 0,
        totalCoveragePoints: 0,
        
        // Execution Metrics - ENHANCED
        passRate: 0,
        passCount: 0,
        failCount: 0,
        executionCount: 0,
        avgExecutionTime: 0,
        lastExecutionDate: null,
        executionTrend: 'stable', // 'improving', 'declining', 'stable'
        
        // Bug Metrics - ENHANCED
        activeBugs: 0,
        resolvedBugs: 0,
        totalBugs: 0,
        criticalBugs: 0,
        highPriorityBugs: 0,
        mediumPriorityBugs: 0,
        lowPriorityBugs: 0,
        
        // Bug Quality Metrics - NEW
        bugsWithVideoEvidence: 0,
        bugsWithConsoleLogs: 0,
        bugsWithNetworkLogs: 0,
        bugsFromRecordings: 0,
        avgBugReportCompleteness: 0,
        
        // Bug Resolution Metrics - ENHANCED
        avgResolutionTime: 0,
        bugResolutionRate: 0,
        criticalBugResolutionTime: 0,
        highBugResolutionTime: 0,
        recentlyResolvedBugs: 0,
        
        // Recording Metrics - NEW
        recordings: 0,
        recordingsWithIssues: 0,
        totalRecordingDuration: 0,
        avgRecordingDuration: 0,
        recordingsLinkedToBugs: 0,
        
        // Automation Metrics - ENHANCED
        automationRate: 0,
        aiContributionRate: 0,
        aiGenerationSuccessRate: 0,
        
        // Team Metrics - NEW
        activeContributors: 0,
        totalActivities: 0,
        recentActivity: [],
        
        // Time-based Metrics - NEW
        testsCreatedThisWeek: 0,
        testsCreatedThisMonth: 0,
        bugsReportedThisWeek: 0,
        bugsReportedThisMonth: 0,
        recordingsCreatedThisWeek: 0,
        recordingsCreatedThisMonth: 0,
        
        // Trend Data - NEW
        testCaseTrend: [],
        bugTrend: [],
        executionTrend: [],
        
        // Document & Test Data Metrics - NEW
        totalDocuments: 0,
        activeDocuments: 0,
        totalTestData: 0,
        activeTestData: 0,
        
        // Sprint Metrics - NEW
        activeSprints: 0,
        completedSprints: 0,
        sprintVelocity: 0,
    };

    const [metrics, setMetrics] = useState(defaultMetrics);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [dataStatus, setDataStatus] = useState({
        testCases: 'pending',
        bugs: 'pending',
        recordings: 'pending',
        activity: 'pending',
        documents: 'pending',
        testData: 'pending',
        sprints: 'pending',
    });

    const clearSubscription = useCallback(() => {
        if (unsubscribeRef.current && typeof unsubscribeRef.current === 'function') {
            try {
                unsubscribeRef.current();
                console.log('Subscription cleared successfully');
            } catch (err) {
                console.warn('Error clearing subscription:', err);
            }
            unsubscribeRef.current = null;
        }
    }, []);

    const resetState = useCallback(() => {
        setMetrics(defaultMetrics);
        setError(null);
        setDataStatus({
            testCases: 'pending',
            bugs: 'pending',
            recordings: 'pending',
            activity: 'pending',
            documents: 'pending',
            testData: 'pending',
            sprints: 'pending',
        });
    }, []);

    const updateMetricsPartially = useCallback((partialUpdate, section) => {
        setMetrics((prevMetrics) => ({
            ...prevMetrics,
            ...partialUpdate,
        }));
        setDataStatus((prev) => ({
            ...prev,
            [section]: 'loaded',
        }));
    }, []);

    // Helper: Calculate time-based metrics
    const getTimePeriods = () => {
        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return { now, weekAgo, monthAgo };
    };

    // Helper: Extract date from Firestore timestamp
    const extractDate = (timestamp) => {
        if (!timestamp) return null;
        return timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    };

    // Helper: Calculate test case coverage metrics
    const calculateCoverageMetrics = (testCases) => {
        let functional = 0, edge = 0, negative = 0, total = 0;
        
        testCases.forEach(tc => {
            const type = (tc.type || '').toLowerCase();
            const tags = (tc.tags || []).map(t => t.toLowerCase());
            
            total++;
            
            if (type === 'functional' || tags.includes('functional')) functional++;
            if (type === 'edge' || tags.includes('edge') || tags.includes('boundary')) edge++;
            if (type === 'negative' || tags.includes('negative') || tags.includes('error')) negative++;
        });
        
        return {
            functionalCoverage: total > 0 ? Math.round((functional / total) * 100) : 0,
            edgeCaseCoverage: total > 0 ? Math.round((edge / total) * 100) : 0,
            negativeCaseCoverage: total > 0 ? Math.round((negative / total) * 100) : 0,
            totalCoveragePoints: functional + edge + negative,
        };
    };

    // Helper: Calculate bug quality score
    const calculateBugQualityScore = (bugs) => {
        if (bugs.length === 0) return 0;
        
        let totalScore = 0;
        bugs.forEach(bug => {
            let score = 0;
            if (bug.description && bug.description.length > 50) score += 25;
            if (bug.stepsToReproduce && bug.stepsToReproduce.length > 0) score += 25;
            if (bug.linkedRecordings && bug.linkedRecordings.length > 0) score += 25;
            if (bug.consoleLogs || bug.networkLogs) score += 25;
            totalScore += score;
        });
        
        return Math.round(totalScore / bugs.length);
    };

    // Helper: Calculate execution trend
    const calculateExecutionTrend = (testCases) => {
        const recent = testCases.filter(tc => {
            const execDate = extractDate(tc.lastExecutionDate);
            if (!execDate) return false;
            const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            return execDate > weekAgo;
        });
        
        if (recent.length < 5) return 'stable';
        
        const passRates = recent.map(tc => {
            const result = tc.lastExecutionResult || tc.executionResult;
            return result === 'pass' || result === 'passed' ? 1 : 0;
        });
        
        const avgPassRate = passRates.reduce((sum, val) => sum + val, 0) / passRates.length;
        
        if (avgPassRate > 0.8) return 'improving';
        if (avgPassRate < 0.5) return 'declining';
        return 'stable';
    };

    const fetchDashboardData = useCallback(
        async (forceRefresh = false) => {
            const testSuiteService = testSuiteServiceRef.current;

            if (isRefreshingRef.current && !forceRefresh) {
                console.log('Refresh already in progress, skipping...');
                return () => { };
            }

            if (!auth.isAuthenticated || !auth.currentUser) {
                console.log('User not authenticated');
                resetState();
                setDataStatus({
                    testCases: 'not-authenticated',
                    bugs: 'not-authenticated',
                    recordings: 'not-authenticated',
                    activity: 'not-authenticated',
                    documents: 'not-authenticated',
                    testData: 'not-authenticated',
                    sprints: 'not-authenticated',
                });
                return () => { };
            }

            if (!testSuiteService || typeof testSuiteService.subscribeToUserTestSuites !== 'function') {
                const errorMsg = 'TestSuiteService.subscribeToUserTestSuites is not available';
                console.error(errorMsg);
                setError(errorMsg);
                return () => { };
            }

            if (forceRefresh) {
                clearSubscription();
            }

            isRefreshingRef.current = true;
            setLoading(true);
            setError(null);

            const planLimits = subscription?.planLimits || {
                maxSuites: 999,
                maxTestCasesPerSuite: 999,
                canCreateTestCases: true,
                canUseRecordings: true,
                canUseAutomation: true,
            };

            try {
                await new Promise((resolve) => setTimeout(resolve, 100));

                if (!mountRef.current) {
                    console.log('Component unmounted, aborting...');
                    return () => { };
                }

                const unsubscribe = testSuiteService.subscribeToUserTestSuites(
                    async (suites) => {
                        try {
                            console.log(`Processing ${suites?.length || 0} test suites`);

                            // Initialize all metric accumulators
                            let totalTestCases = 0;
                            let manualTestCases = 0;
                            let automatedTestCases = 0;
                            let aiGeneratedTestCases = 0;
                            let testCasesWithTags = 0;
                            let testCasesLinkedToBugs = 0;
                            let testCasesWithRecordings = 0;
                            let outdatedTestCases = 0;
                            
                            let activeBugs = 0;
                            let resolvedBugs = 0;
                            let criticalBugs = 0;
                            let highPriorityBugs = 0;
                            let mediumPriorityBugs = 0;
                            let lowPriorityBugs = 0;
                            let bugsWithVideoEvidence = 0;
                            let bugsWithConsoleLogs = 0;
                            let bugsWithNetworkLogs = 0;
                            let bugsFromRecordings = 0;
                            
                            let totalRecordings = 0;
                            let recordingsWithIssues = 0;
                            let totalRecordingDuration = 0;
                            let recordingsLinkedToBugs = 0;
                            
                            let totalPassCount = 0;
                            let totalExecutionCount = 0;
                            let totalExecutionTime = 0;
                            let lastExecution = null;
                            
                            let totalResolutionTime = 0;
                            let criticalResolutionTime = 0;
                            let highResolutionTime = 0;
                            let criticalResolvedCount = 0;
                            let highResolvedCount = 0;
                            
                            let totalDocuments = 0;
                            let activeDocuments = 0;
                            let totalTestData = 0;
                            let activeTestData = 0;
                            let activeSprints = 0;
                            let completedSprints = 0;
                            
                            const recentActivity = [];
                            const contributors = new Set();
                            const allTestCases = [];
                            const allBugs = [];
                            
                            const { weekAgo, monthAgo } = getTimePeriods();

                            if (!suites || suites.length === 0) {
                                setMetrics(defaultMetrics);
                                setDataStatus({
                                    testCases: 'loaded',
                                    bugs: 'loaded',
                                    recordings: 'loaded',
                                    activity: 'loaded',
                                    documents: 'loaded',
                                    testData: 'loaded',
                                    sprints: 'loaded',
                                });
                                setLoading(false);
                                isRefreshingRef.current = false;
                                return;
                            }

                            const suitesToProcess = activeSuite
                                ? suites.filter((suite) => suite.id === activeSuite.id)
                                : suites;

                            const suitePromises = suitesToProcess.map(async (suite) => {
                                if (totalTestCases >= planLimits.maxTestCasesPerSuite) return;

                                // ========== TEST CASES ==========
                                try {
                                    if (testSuiteService.queryDocuments) {
                                        const testCasesResult = await testSuiteService.queryDocuments(
                                            `testSuites/${suite.id}/testCases`,
                                            [],
                                            'created_at',
                                            planLimits.maxTestCasesPerSuite
                                        );

                                        if (testCasesResult?.success) {
                                            const testCases = testCasesResult.data || [];
                                            allTestCases.push(...testCases);
                                            
                                            testCases.forEach((tc) => {
                                                const updatedDate = extractDate(tc.updated_at);
                                                
                                                totalTestCases++;
                                                
                                                // Type classification
                                                if (tc.isAutomated || tc.automated || tc.type === 'automated') {
                                                    automatedTestCases++;
                                                } else {
                                                    manualTestCases++;
                                                }
                                                
                                                // AI generation
                                                if (tc.isAIGenerated || tc.aiGenerated || tc.source === 'ai') {
                                                    aiGeneratedTestCases++;
                                                }
                                                
                                                // Tags and links
                                                if (tc.tags && tc.tags.length > 0) testCasesWithTags++;
                                                if (tc.linkedBugs && tc.linkedBugs.length > 0) testCasesLinkedToBugs++;
                                                if (tc.linkedRecordings && tc.linkedRecordings.length > 0) testCasesWithRecordings++;
                                                
                                                // Outdated check (not updated in 90 days)
                                                if (updatedDate) {
                                                    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
                                                    if (updatedDate < ninetyDaysAgo) outdatedTestCases++;
                                                }
                                                
                                                // Execution metrics
                                                const result = tc.lastExecutionResult || tc.executionResult || tc.status;
                                                const hasExecution = result && (
                                                    result === 'pass' || result === 'passed' || result === 'success' ||
                                                    result === 'fail' || result === 'failed' || result === 'error'
                                                );
                                                
                                                if (hasExecution) {
                                                    totalExecutionCount++;
                                                    
                                                    if (result === 'pass' || result === 'passed' || result === 'success') {
                                                        totalPassCount++;
                                                    }
                                                    
                                                    const execTime = tc.lastExecutionTime || tc.executionTime || tc.duration;
                                                    if (execTime && typeof execTime === 'number') {
                                                        totalExecutionTime += execTime;
                                                    }
                                                    
                                                    const execDate = extractDate(tc.lastExecutionDate);
                                                    if (execDate && (!lastExecution || execDate > lastExecution)) {
                                                        lastExecution = execDate;
                                                    }
                                                }
                                                
                                                // Contributor tracking
                                                if (tc.created_by) contributors.add(tc.created_by);
                                                if (tc.updated_by) contributors.add(tc.updated_by);
                                            });
                                            
                                            // Calculate coverage metrics
                                            const coverage = calculateCoverageMetrics(testCases);
                                            
                                            // Calculate execution trend
                                            const execTrend = calculateExecutionTrend(testCases);
                                            
                                            // Time-based counting
                                            const testsThisWeek = testCases.filter(tc => {
                                                const date = extractDate(tc.created_at);
                                                return date && date > weekAgo;
                                            }).length;
                                            
                                            const testsThisMonth = testCases.filter(tc => {
                                                const date = extractDate(tc.created_at);
                                                return date && date > monthAgo;
                                            }).length;
                                            
                                            const recentlyUpdated = testCases.filter(tc => {
                                                const date = extractDate(tc.updated_at);
                                                return date && date > weekAgo;
                                            }).length;

                                            updateMetricsPartially({
                                                totalTestCases,
                                                manualTestCases,
                                                automatedTestCases,
                                                aiGeneratedTestCases,
                                                testCasesWithTags,
                                                testCasesLinkedToBugs,
                                                testCasesWithRecordings,
                                                outdatedTestCases,
                                                recentlyUpdatedTestCases: recentlyUpdated,
                                                ...coverage,
                                                passRate: totalExecutionCount > 0 
                                                    ? Math.round((totalPassCount / totalExecutionCount) * 100) 
                                                    : 0,
                                                passCount: totalPassCount,
                                                failCount: totalExecutionCount - totalPassCount,
                                                executionCount: totalExecutionCount,
                                                avgExecutionTime: totalExecutionCount > 0 
                                                    ? Math.round(totalExecutionTime / totalExecutionCount) 
                                                    : 0,
                                                lastExecutionDate: lastExecution,
                                                executionTrend: execTrend,
                                                automationRate: totalTestCases > 0 
                                                    ? Math.round((automatedTestCases / totalTestCases) * 100) 
                                                    : 0,
                                                aiContributionRate: totalTestCases > 0 
                                                    ? Math.round((aiGeneratedTestCases / totalTestCases) * 100) 
                                                    : 0,
                                                testsCreatedThisWeek: testsThisWeek,
                                                testsCreatedThisMonth: testsThisMonth,
                                            }, 'testCases');
                                        }
                                    }
                                } catch (tcError) {
                                    console.warn(`Error fetching test cases for suite ${suite.id}:`, tcError);
                                    setDataStatus((prev) => ({ ...prev, testCases: 'error' }));
                                }

                                // ========== BUGS ==========
                                try {
                                    if (testSuiteService.queryDocuments) {
                                        const bugsResult = await testSuiteService.queryDocuments(
                                            `testSuites/${suite.id}/bugs`,
                                            [],
                                            'created_at'
                                        );

                                        if (bugsResult?.success) {
                                            const bugs = bugsResult.data || [];
                                            allBugs.push(...bugs);

                                            bugs.forEach((bug) => {
                                                const status = bug.status?.toLowerCase() || 'open';
                                                const priority = bug.priority?.toLowerCase() || 'medium';
                                                const severity = bug.severity?.toLowerCase() || 'medium';
                                                
                                                // Evidence tracking
                                                if (bug.linkedRecordings && bug.linkedRecordings.length > 0) {
                                                    bugsWithVideoEvidence++;
                                                    bugsFromRecordings++;
                                                }
                                                if (bug.consoleLogs && bug.consoleLogs.length > 0) bugsWithConsoleLogs++;
                                                if (bug.networkLogs && bug.networkLogs.length > 0) bugsWithNetworkLogs++;
                                                
                                                if (status !== 'resolved' && status !== 'closed' && status !== 'fixed') {
                                                    activeBugs++;
                                                    
                                                    // Priority classification for active bugs
                                                    if (priority === 'critical' || severity === 'critical') {
                                                        criticalBugs++;
                                                    } else if (priority === 'high') {
                                                        highPriorityBugs++;
                                                    } else if (priority === 'medium') {
                                                        mediumPriorityBugs++;
                                                    } else if (priority === 'low') {
                                                        lowPriorityBugs++;
                                                    }
                                                } else {
                                                    resolvedBugs++;
                                                    
                                                    // Resolution time calculation
                                                    const resTime = bug.resolutionTime || bug.timeToResolve;
                                                    let timeInHours = 0;
                                                    
                                                    if (resTime && typeof resTime === 'number') {
                                                        timeInHours = resTime;
                                                    } else if (bug.resolvedAt && bug.createdAt) {
                                                        const created = extractDate(bug.createdAt);
                                                        const resolved = extractDate(bug.resolvedAt);
                                                        if (created && resolved) {
                                                            timeInHours = Math.abs(resolved - created) / 36e5;
                                                        }
                                                    }
                                                    
                                                    totalResolutionTime += timeInHours;
                                                    
                                                    // Track by priority
                                                    if (priority === 'critical' || severity === 'critical') {
                                                        criticalResolutionTime += timeInHours;
                                                        criticalResolvedCount++;
                                                    } else if (priority === 'high') {
                                                        highResolutionTime += timeInHours;
                                                        highResolvedCount++;
                                                    }
                                                }
                                                
                                                // Contributor tracking
                                                if (bug.reported_by) contributors.add(bug.reported_by);
                                            });
                                            
                                            // Calculate bug quality
                                            const bugQuality = calculateBugQualityScore(bugs);
                                            
                                            // Time-based counting
                                            const bugsThisWeek = bugs.filter(b => {
                                                const date = extractDate(b.created_at);
                                                return date && date > weekAgo;
                                            }).length;
                                            
                                            const bugsThisMonth = bugs.filter(b => {
                                                const date = extractDate(b.created_at);
                                                return date && date > monthAgo;
                                            }).length;
                                            
                                            const recentlyResolved = bugs.filter(b => {
                                                const date = extractDate(b.resolvedAt);
                                                return date && date > weekAgo;
                                            }).length;
                                            
                                            const totalBugsNow = activeBugs + resolvedBugs;

                                            updateMetricsPartially({
                                                activeBugs,
                                                resolvedBugs,
                                                totalBugs: totalBugsNow,
                                                criticalBugs,
                                                highPriorityBugs,
                                                mediumPriorityBugs,
                                                lowPriorityBugs,
                                                bugsWithVideoEvidence,
                                                bugsWithConsoleLogs,
                                                bugsWithNetworkLogs,
                                                bugsFromRecordings,
                                                avgBugReportCompleteness: bugQuality,
                                                bugResolutionRate: totalBugsNow > 0 
                                                    ? Math.round((resolvedBugs / totalBugsNow) * 100) 
                                                    : 0,
                                                avgResolutionTime: resolvedBugs > 0 
                                                    ? Math.round(totalResolutionTime / resolvedBugs) 
                                                    : 0,
                                                criticalBugResolutionTime: criticalResolvedCount > 0
                                                    ? Math.round(criticalResolutionTime / criticalResolvedCount)
                                                    : 0,
                                                highBugResolutionTime: highResolvedCount > 0
                                                    ? Math.round(highResolutionTime / highResolvedCount)
                                                    : 0,
                                                recentlyResolvedBugs: recentlyResolved,
                                                bugsReportedThisWeek: bugsThisWeek,
                                                bugsReportedThisMonth: bugsThisMonth,
                                            }, 'bugs');
                                        }
                                    }
                                } catch (bugError) {
                                    console.warn(`Error fetching bugs for suite ${suite.id}:`, bugError);
                                    setDataStatus((prev) => ({ ...prev, bugs: 'error' }));
                                }

                                // ========== RECORDINGS ==========
                                if (planLimits.canUseRecordings) {
                                    try {
                                        if (testSuiteService.queryDocuments) {
                                            const recordingsResult = await testSuiteService.queryDocuments(
                                                `testSuites/${suite.id}/recordings`,
                                                [],
                                                'created_at'
                                            );
                                            
                                            if (recordingsResult?.success) {
                                                const recordings = recordingsResult.data || [];
                                                
                                                recordings.forEach(rec => {
                                                    totalRecordings++;
                                                    
                                                    if (rec.detectedIssues && rec.detectedIssues.length > 0) {
                                                        recordingsWithIssues++;
                                                    }
                                                    
                                                    if (rec.linkedBugs && rec.linkedBugs.length > 0) {
                                                        recordingsLinkedToBugs++;
                                                    }
                                                    
                                                    if (rec.duration) {
                                                        totalRecordingDuration += rec.duration;
                                                    }
                                                    
                                                    if (rec.created_by) contributors.add(rec.created_by);
                                                });
                                                
                                                const recordingsThisWeek = recordings.filter(r => {
                                                    const date = extractDate(r.created_at);
                                                    return date && date > weekAgo;
                                                }).length;
                                                
                                                const recordingsThisMonth = recordings.filter(r => {
                                                    const date = extractDate(r.created_at);
                                                    return date && date > monthAgo;
                                                }).length;

                                                updateMetricsPartially({
                                                    recordings: totalRecordings,
                                                    recordingsWithIssues,
                                                    totalRecordingDuration,
                                                    avgRecordingDuration: totalRecordings > 0
                                                        ? Math.round(totalRecordingDuration / totalRecordings)
                                                        : 0,
                                                    recordingsLinkedToBugs,
                                                    recordingsCreatedThisWeek: recordingsThisWeek,
                                                    recordingsCreatedThisMonth: recordingsThisMonth,
                                                }, 'recordings');
                                            }
                                        }
                                    } catch (recError) {
                                        console.warn(`Error fetching recordings for suite ${suite.id}:`, recError);
                                        setDataStatus((prev) => ({ ...prev, recordings: 'error' }));
                                    }
                                }

                                // ========== DOCUMENTS ==========
                                try {
                                    if (testSuiteService.queryDocuments) {
                                        const docsResult = await testSuiteService.queryDocuments(
                                            `testSuites/${suite.id}/documents`,
                                            [],
                                            'created_at'
                                        );
                                        
                                        if (docsResult?.success) {
                                            const docs = docsResult.data || [];
                                            totalDocuments += docs.length;
                                            activeDocuments += docs.filter(d => d.status === 'active').length;
                                            
                                            updateMetricsPartially({
                                                totalDocuments,
                                                activeDocuments,
                                            }, 'documents');
                                        }
                                    }
                                } catch (docError) {
                                    console.warn(`Error fetching documents for suite ${suite.id}:`, docError);
                                    setDataStatus((prev) => ({ ...prev, documents: 'error' }));
                                }

                                // ========== TEST DATA ==========
                                try {
                                    if (testSuiteService.queryDocuments) {
                                        const testDataResult = await testSuiteService.queryDocuments(
                                            `testSuites/${suite.id}/testData`,
                                            [],
                                            'created_at'
                                        );
                                        
                                        if (testDataResult?.success) {
                                            const testDataItems = testDataResult.data || [];
                                            totalTestData += testDataItems.length;
                                            activeTestData += testDataItems.filter(td => td.isActive).length;
                                            
                                            updateMetricsPartially({
                                                totalTestData,
                                                activeTestData,
                                            }, 'testData');
                                        }
                                    }
                                } catch (tdError) {
                                    console.warn(`Error fetching test data for suite ${suite.id}:`, tdError);
                                    setDataStatus((prev) => ({ ...prev, testData: 'error' }));
                                }

                                // ========== SPRINTS ==========
                                try {
                                    if (testSuiteService.queryDocuments) {
                                        const sprintsResult = await testSuiteService.queryDocuments(
                                            `testSuites/${suite.id}/sprints`,
                                            [],
                                            'created_at'
                                        );
                                        
                                        if (sprintsResult?.success) {
                                            const sprints = sprintsResult.data || [];
                                            sprints.forEach(sprint => {
                                                if (sprint.status === 'active' || sprint.status === 'in_progress') {
                                                    activeSprints++;
                                                } else if (sprint.status === 'completed') {
                                                    completedSprints++;
                                                }
                                            });
                                            
                                            // Calculate sprint velocity (completed test cases per sprint)
                                            const completedSprintsList = sprints.filter(s => s.status === 'completed');
                                            let totalVelocity = 0;
                                            completedSprintsList.forEach(sprint => {
                                                if (sprint.completedTestCases) {
                                                    totalVelocity += sprint.completedTestCases;
                                                }
                                            });
                                            
                                            const velocity = completedSprintsList.length > 0
                                                ? Math.round(totalVelocity / completedSprintsList.length)
                                                : 0;
                                            
                                            updateMetricsPartially({
                                                activeSprints,
                                                completedSprints,
                                                sprintVelocity: velocity,
                                            }, 'sprints');
                                        }
                                    }
                                } catch (sprintError) {
                                    console.warn(`Error fetching sprints for suite ${suite.id}:`, sprintError);
                                    setDataStatus((prev) => ({ ...prev, sprints: 'error' }));
                                }

                                // ========== ACTIVITY ==========
                                try {
                                    if (testSuiteService.queryDocuments) {
                                        const activityResult = await testSuiteService.queryDocuments(
                                            `testSuites/${suite.id}/activityLogs`,
                                            [],
                                            'timestamp',
                                            50
                                        );
                                        
                                        if (activityResult?.success) {
                                            const suiteActivity = (activityResult.data || []).map((activity) => ({
                                                ...activity,
                                                suiteId: suite.id,
                                                suiteName: suite.name,
                                            }));
                                            recentActivity.push(...suiteActivity);
                                        }
                                    }
                                } catch (actError) {
                                    console.warn(`Error fetching activity for suite ${suite.id}:`, actError);
                                    setDataStatus((prev) => ({ ...prev, activity: 'error' }));
                                }
                            });

                            await Promise.allSettled(suitePromises);

                            // ========== FINAL CALCULATIONS ==========
                            
                            // Sort and limit activity
                            const sortedActivity = recentActivity
                                .sort((a, b) => {
                                    const aTime = a.timestamp?.toDate ? a.timestamp.toDate() : new Date(a.timestamp || 0);
                                    const bTime = b.timestamp?.toDate ? b.timestamp.toDate() : new Date(b.timestamp || 0);
                                    return bTime - aTime;
                                })
                                .slice(0, 20);

                            // Calculate AI generation success rate
                            const aiSuccessRate = aiGeneratedTestCases > 0 && totalTestCases > 0
                                ? Math.min(100, Math.round((aiGeneratedTestCases / totalTestCases) * 150)) // Weighted higher
                                : 0;

                            // Calculate trend data (last 7 data points)
                            const testCaseTrend = Array.from({ length: 7 }, (_, i) => {
                                const daysAgo = 6 - i;
                                const date = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
                                const count = allTestCases.filter(tc => {
                                    const created = extractDate(tc.created_at);
                                    if (!created) return false;
                                    return created.toDateString() === date.toDateString();
                                }).length;
                                return { date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), count };
                            });

                            const bugTrend = Array.from({ length: 7 }, (_, i) => {
                                const daysAgo = 6 - i;
                                const date = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
                                const count = allBugs.filter(bug => {
                                    const created = extractDate(bug.created_at);
                                    if (!created) return false;
                                    return created.toDateString() === date.toDateString();
                                }).length;
                                return { date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), count };
                            });

                            const executionTrend = Array.from({ length: 7 }, (_, i) => {
                                const daysAgo = 6 - i;
                                const date = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
                                const executions = allTestCases.filter(tc => {
                                    const execDate = extractDate(tc.lastExecutionDate);
                                    if (!execDate) return false;
                                    return execDate.toDateString() === date.toDateString();
                                });
                                const passed = executions.filter(tc => {
                                    const result = tc.lastExecutionResult || tc.executionResult;
                                    return result === 'pass' || result === 'passed' || result === 'success';
                                }).length;
                                const total = executions.length;
                                const rate = total > 0 ? Math.round((passed / total) * 100) : 0;
                                return { 
                                    date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), 
                                    passRate: rate,
                                    total 
                                };
                            });

                            // Final metrics update
                            updateMetricsPartially({
                                activeContributors: contributors.size,
                                totalActivities: recentActivity.length,
                                recentActivity: sortedActivity,
                                aiGenerationSuccessRate: aiSuccessRate,
                                testCaseTrend,
                                bugTrend,
                                executionTrend,
                            }, 'activity');

                            setLoading(false);
                            isRefreshingRef.current = false;
                            console.log('Dashboard data fetch completed successfully');
                        } catch (err) {
                            console.error('Dashboard data processing error:', err);
                            setError(err.message || 'Failed to process dashboard data');
                            setLoading(false);
                            isRefreshingRef.current = false;
                        }
                    },
                    (err) => {
                        console.error('Dashboard data fetch error:', err);
                        setError(err.message || 'Failed to load dashboard data');
                        setLoading(false);
                        isRefreshingRef.current = false;
                    }
                );

                unsubscribeRef.current = unsubscribe;
                return unsubscribe;
            } catch (subscribeError) {
                console.error('Error setting up subscription:', subscribeError);
                setError(subscribeError.message || 'Failed to setup data subscription');
                setLoading(false);
                isRefreshingRef.current = false;
                return () => { };
            }
        },
        [auth.isAuthenticated, auth.currentUser, subscription?.planLimits, activeSuite?.id]
    );

    useEffect(() => {
        console.log('Setting up dashboard data subscription...');
        mountRef.current = true;
        fetchDashboardData(true);

        return () => {
            console.log('Cleaning up dashboard subscription...');
            mountRef.current = false;
            clearSubscription();
            isRefreshingRef.current = false;
        };
    }, [fetchDashboardData]);

    const refresh = useCallback(async () => {
        console.log('Manual refresh triggered...');
        try {
            await fetchDashboardData(true);
            console.log('Manual refresh completed');
        } catch (error) {
            console.error('Manual refresh failed:', error);
            setTimeout(async () => {
                if (!mountRef.current) return;
                console.log('Retrying dashboard data fetch...');
                try {
                    await fetchDashboardData(true);
                    console.log('Retry successful');
                } catch (retryError) {
                    console.error('Retry failed:', retryError);
                }
            }, 1000);
            throw error;
        }
    }, [fetchDashboardData]);

    return {
        metrics,
        loading,
        error,
        refresh,
        dataStatus,
    };
};