    /* eslint-disable @typescript-eslint/no-unused-vars */
    "use client";
    import React, { useState, useEffect, useCallback } from "react";
    import "../app/globals.css";
    import {
        ChartCard,
        BugStatusChart,
        DefectTrendsChart,
        TestCoverageChart,
        ViewToggle,
    } from "../components/dashboard";
    import TestResultChart from "../components/dashboard/TestResultsChart";
    import ActivityFeed from "../components/dashboard/ActivityFeed";
    import { Sidebar } from "../components/layout";
    import Header from "../components/layout/header";
    import { KeyMetrics } from "../components/dashboard/KeyMetrics";
    import BugTracker from "../pages/bug-tracker";
    import TestScripts from "../pages/test-scripts";
    import AutomatedScripts from "../pages/auto-scripts";
    import SettingsPage from "../pages/settings";
    import { db } from "../config/firebase";
    import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";

    const Dashboard = () => {
        const [activeModal, setActiveModal] = useState(null);
        const [bugData, setBugData] = useState(null);
        const [timeframeView, setTimeframeView] = useState({ value: "weekly", label: "Weekly" });
        const [activePage, setActivePage] = useState("dashboard");
        const [dashboardData, setDashboardData] = useState({
            bugStatusData: [],
            defectTrendsData: [],
            testCoverageData: [],
            testResultsData: [],
            recentActivities: []
        });
        const [isLoading, setIsLoading] = useState(true);

        const viewOptions = [
            { value: "weekly", label: "Weekly" },
            { value: "monthly", label: "Monthly" },
            { value: "quarterly", label: "Quarterly" }
        ];

        // Functions to control modals
        const openModal = (modalType) => setActiveModal(modalType);
        const closeModal = () => setActiveModal(null);

        // Function to fetch bug status data
        const fetchBugStatusData = useCallback(async (timeframe) => {
            try {
                const q = query(
                    collection(db, "bugReports"),
                    orderBy("timestamp", "desc")
                );
                const querySnapshot = await getDocs(q);
                const bugs = [];

                querySnapshot.forEach((doc) => {
                    const data = doc.data();
                    bugs.push({
                        id: doc.id,
                        ...data,
                        timestamp: data.timestamp?.toDate() || new Date()
                    });
                });

                // Process bug status data based on timeframe
                const cutoffDate = getTimeframeCutoff(timeframe);
                const filteredBugs = bugs.filter(bug => bug.timestamp >= cutoffDate);

                // Count bugs by status
                const statusCounts = {
                    New: 0,
                    "In Progress": 0,
                    Resolved: 0,
                    Closed: 0
                };

                filteredBugs.forEach(bug => {
                    if (statusCounts.hasOwnProperty(bug.status)) {
                        statusCounts[bug.status]++;
                    }
                });

                return [
                    { name: "New", value: statusCounts.New },
                    { name: "In Progress", value: statusCounts["In Progress"] },
                    { name: "Resolved", value: statusCounts.Resolved },
                    { name: "Closed", value: statusCounts.Closed }
                ];
            } catch (error) {
                console.error("Error fetching bug status data:", error);
                return [];
            }
        }, []);

        // Function to fetch defect trends data
        const fetchDefectTrendsData = useCallback(async (timeframe) => {
            try {
                const q = query(
                    collection(db, "bugReports"),
                    orderBy("timestamp", "desc")
                );
                const querySnapshot = await getDocs(q);
                const bugs = [];

                querySnapshot.forEach((doc) => {
                    const data = doc.data();
                    bugs.push({
                        id: doc.id,
                        ...data,
                        timestamp: data.timestamp?.toDate() || new Date()
                    });
                });

                // Process bug trends data based on timeframe
                const cutoffDate = getTimeframeCutoff(timeframe);
                const filteredBugs = bugs.filter(bug => bug.timestamp >= cutoffDate);

                // Group bugs by date according to timeframe
                const trendsData = [];
                const dateMap = new Map();

                if (timeframe.value === "weekly") {
                    // Group by day for weekly view
                    filteredBugs.forEach(bug => {
                        const date = bug.timestamp.toISOString().split('T')[0];
                        if (!dateMap.has(date)) {
                            dateMap.set(date, { date, count: 0 });
                        }
                        dateMap.get(date).count++;
                    });
                } else if (timeframe.value === "monthly") {
                    // Group by week for monthly view
                    filteredBugs.forEach(bug => {
                        const weekNum = getWeekNumber(bug.timestamp);
                        const weekKey = `Week ${weekNum}`;
                        if (!dateMap.has(weekKey)) {
                            dateMap.set(weekKey, { date: weekKey, count: 0 });
                        }
                        dateMap.get(weekKey).count++;
                    });
                } else {
                    // Group by month for quarterly view
                    filteredBugs.forEach(bug => {
                        const monthYear = bug.timestamp.toLocaleString('default', { month: 'short', year: 'numeric' });
                        if (!dateMap.has(monthYear)) {
                            dateMap.set(monthYear, { date: monthYear, count: 0 });
                        }
                        dateMap.get(monthYear).count++;
                    });
                }

                dateMap.forEach(value => trendsData.push(value));
                return trendsData.sort((a, b) => a.date.localeCompare(b.date));
            } catch (error) {
                console.error("Error fetching defect trends data:", error);
                return [];
            }
        }, []);

        // Function to fetch test coverage data
        const fetchTestCoverageData = useCallback(async () => {
            try {
                const q = query(
                    collection(db, "testCoverage"),
                    orderBy("timestamp", "desc"),
                    limit(10)
                );
                const querySnapshot = await getDocs(q);
                const coverage = [];

                querySnapshot.forEach((doc) => {
                    const data = doc.data();
                    coverage.push({
                        id: doc.id,
                        ...data
                    });
                });

                // If no test coverage data found, return dummy data
                if (coverage.length === 0) {
                    return [
                        { name: "Authentication", coverage: 87 },
                        { name: "User Management", coverage: 76 },
                        { name: "Dashboard", coverage: 65 },
                        { name: "Reports", coverage: 92 },
                        { name: "API Integration", coverage: 58 }
                    ];
                }

                // Process test coverage data
                const modules = new Map();

                coverage.forEach(item => {
                    if (item.modules) {
                        Object.entries(item.modules).forEach(([module, value]) => {
                            modules.set(module, value.coverage);
                        });
                    }
                });

                const coverageData = [];
                modules.forEach((coverage, name) => {
                    coverageData.push({ name, coverage });
                });

                return coverageData;
            } catch (error) {
                console.error("Error fetching test coverage data:", error);
                return [];
            }
        }, []);

        // Function to fetch test results data
        const fetchTestResultsData = useCallback(async (timeframe) => {
            try {
                const q = query(
                    collection(db, "testResults"),
                    orderBy("timestamp", "desc")
                );
                const querySnapshot = await getDocs(q);
                const results = [];

                querySnapshot.forEach((doc) => {
                    const data = doc.data();
                    results.push({
                        id: doc.id,
                        ...data,
                        timestamp: data.timestamp?.toDate() || new Date()
                    });
                });

                // Process test results data based on timeframe
                const cutoffDate = getTimeframeCutoff(timeframe);
                const filteredResults = results.filter(result => result.timestamp >= cutoffDate);

                // Group results by date according to timeframe
                const resultsData = [];
                const dateMap = new Map();

                if (timeframe.value === "weekly") {
                    // Group by day for weekly view
                    filteredResults.forEach(result => {
                        const date = result.timestamp.toISOString().split('T')[0];
                        if (!dateMap.has(date)) {
                            dateMap.set(date, {
                                date,
                                passed: 0,
                                failed: 0,
                                skipped: 0
                            });
                        }
                        const entry = dateMap.get(date);
                        entry.passed += result.passed || 0;
                        entry.failed += result.failed || 0;
                        entry.skipped += result.skipped || 0;
                    });
                } else if (timeframe.value === "monthly") {
                    // Group by week for monthly view
                    filteredResults.forEach(result => {
                        const weekNum = getWeekNumber(result.timestamp);
                        const weekKey = `Week ${weekNum}`;
                        if (!dateMap.has(weekKey)) {
                            dateMap.set(weekKey, {
                                date: weekKey,
                                passed: 0,
                                failed: 0,
                                skipped: 0
                            });
                        }
                        const entry = dateMap.get(weekKey);
                        entry.passed += result.passed || 0;
                        entry.failed += result.failed || 0;
                        entry.skipped += result.skipped || 0;
                    });
                } else {
                    // Group by month for quarterly view
                    filteredResults.forEach(result => {
                        const monthYear = result.timestamp.toLocaleString('default', { month: 'short', year: 'numeric' });
                        if (!dateMap.has(monthYear)) {
                            dateMap.set(monthYear, {
                                date: monthYear,
                                passed: 0,
                                failed: 0,
                                skipped: 0
                            });
                        }
                        const entry = dateMap.get(monthYear);
                        entry.passed += result.passed || 0;
                        entry.failed += result.failed || 0;
                        entry.skipped += result.skipped || 0;
                    });
                }

                dateMap.forEach(value => resultsData.push(value));
                return resultsData.sort((a, b) => a.date.localeCompare(b.date));
            } catch (error) {
                console.error("Error fetching test results data:", error);
                return [];
            }
        }, []);

        // Function to fetch recent activities
        const fetchRecentActivities = useCallback(async () => {
            try {
                // Fetch recent bugs
                const bugsQuery = query(
                    collection(db, "bugReports"),
                    orderBy("timestamp", "desc"),
                    limit(5)
                );
                const bugsSnapshot = await getDocs(bugsQuery);
                const recentBugs = [];

                bugsSnapshot.forEach((doc) => {
                    const data = doc.data();
                    recentBugs.push({
                        id: doc.id,
                        type: "bug",
                        title: data.title,
                        status: data.status,
                        user: data.reportedBy || "Anonymous",
                        timestamp: data.timestamp?.toDate() || new Date()
                    });
                });

                // Fetch recent test results
                const testsQuery = query(
                    collection(db, "testResults"),
                    orderBy("timestamp", "desc"),
                    limit(5)
                );
                const testsSnapshot = await getDocs(testsQuery);
                const recentTests = [];

                testsSnapshot.forEach((doc) => {
                    const data = doc.data();
                    recentTests.push({
                        id: doc.id,
                        type: "test",
                        title: data.testName || "Test Run",
                        status: data.status || (data.passed > data.failed ? "Passed" : "Failed"),
                        user: data.executedBy || "System",
                        timestamp: data.timestamp?.toDate() || new Date()
                    });
                });

                // Combine and sort activities
                const activities = [...recentBugs, ...recentTests].sort((a, b) =>
                    b.timestamp - a.timestamp
                ).slice(0, 10);

                return activities;
            } catch (error) {
                console.error("Error fetching recent activities:", error);
                return [];
            }
        }, []);

        // Helper function to get cutoff date based on timeframe
        const getTimeframeCutoff = (timeframe) => {
            const now = new Date();
            switch (timeframe.value) {
                case "weekly":
                    return new Date(now.setDate(now.getDate() - 7));
                case "monthly":
                    return new Date(now.setMonth(now.getMonth() - 1));
                case "quarterly":
                    return new Date(now.setMonth(now.getMonth() - 3));
                default:
                    return new Date(now.setDate(now.getDate() - 7));
            }
        };

        // Helper function to get week number
        const getWeekNumber = (date) => {
            const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
            const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
            return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
        };

        // Fetch dashboard data when component mounts or when timeframe changes
        useEffect(() => {
            const fetchDashboardData = async () => {
                setIsLoading(true);
                try {
                    const [
                        bugStatusData,
                        defectTrendsData,
                        testCoverageData,
                        testResultsData,
                        recentActivities
                    ] = await Promise.all([
                        fetchBugStatusData(timeframeView),
                        fetchDefectTrendsData(timeframeView),
                        fetchTestCoverageData(),
                        fetchTestResultsData(timeframeView),
                        fetchRecentActivities()
                    ]);

                    setDashboardData({
                        bugStatusData,
                        defectTrendsData,
                        testCoverageData,
                        testResultsData,
                        recentActivities
                    });
                } catch (error) {
                    console.error("Error fetching dashboard data:", error);
                } finally {
                    setIsLoading(false);
                }
            };

            fetchDashboardData();
        }, [
            timeframeView,
            fetchBugStatusData,
            fetchDefectTrendsData,
            fetchTestCoverageData,
            fetchTestResultsData,
            fetchRecentActivities
        ]);

        return (
            <div className="flex h-screen bg-gray-50">
                <Sidebar activePage={activePage} setActivePage={setActivePage} />

                <div className="flex-grow overflow-auto">
                    <Header />

                    <main className="p-6 space-y-6">
                        {activePage === "dashboard" && (
                            <>
                                <div className="flex justify-between items-center">
                                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">Testing Dashboard</h1>
                                    <div className="flex items-center space-x-4">
                                        <ViewToggle
                                            options={viewOptions}
                                            defaultOption={viewOptions[0]}
                                            onChange={setTimeframeView}
                                        />
                                    </div>
                                </div>

                                {/* Key Metrics Section */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    <KeyMetrics dashboardData={dashboardData} isLoading={isLoading} />
                                </div>

                                {/* Charts Section */}
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    <div className="lg:col-span-2 space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <ChartCard title={`Bug Status (${timeframeView.label})`}>
                                                <BugStatusChart data={dashboardData.bugStatusData} isLoading={isLoading} />
                                            </ChartCard>
                                            <ChartCard title="Test Coverage by Module">
                                                <TestCoverageChart data={dashboardData.testCoverageData} isLoading={isLoading} />
                                            </ChartCard>
                                        </div>
                                        <ChartCard title={`Defect Trends (${timeframeView.label})`}>
                                            <DefectTrendsChart data={dashboardData.defectTrendsData} isLoading={isLoading} />
                                        </ChartCard>
                                        <ChartCard title={`Test Results (${timeframeView.label})`}>
                                            <TestResultChart
                                                timeframe={timeframeView.value}
                                                data={dashboardData.testResultsData}
                                                isLoading={isLoading}
                                            />
                                        </ChartCard>
                                    </div>

                                    <div className="lg:col-span-1">
                                        <div className="bg-white rounded-lg shadow p-6 h-full">
                                            <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
                                            <ActivityFeed activities={dashboardData.recentActivities} isLoading={isLoading} />
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* 🐛 Bug Tracker Page */}
                        {activePage === "bug-tracker" && <BugTracker newBug={bugData} />}

                        {/* 📝 Test Scripts Page */}
                        {activePage === "test-scripts" && <TestScripts />}

                        {/* 📝 Automated Scripts Page */}
                        {activePage === "auto-scripts" && <AutomatedScripts />}

                        {/* 📝 Settings Page */}
                        {activePage === "settings" && <SettingsPage />}
                    </main>
                </div>
            </div>
        );
    };

    export default Dashboard;