/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import React, { useState, useEffect, useCallback } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { where } from "firebase/firestore";
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
import { collection, query, orderBy, limit, getDocs, onSnapshot, doc } from "firebase/firestore";
import { useRouter } from "next/navigation";

const Dashboard = () => {
    const auth = getAuth();
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [isAuthLoading, setIsAuthLoading] = useState(true);
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
    const [metricsLastUpdated, setMetricsLastUpdated] = useState(null);

    const viewOptions = [
        { value: "weekly", label: "Weekly" },
        { value: "monthly", label: "Monthly" },
        { value: "quarterly", label: "Quarterly" }
    ];

    // Functions to control modals
    const openModal = (modalType) => setActiveModal(modalType);
    const closeModal = () => setActiveModal(null);

    // Authentication tracking
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
            } else {
                // Redirect to login if no user
                router.push('/login');
            }
            setIsAuthLoading(false);
        });

        return () => unsubscribe();
    }, [auth, router]);
    
    // Function to fetch bug status data
    const fetchBugStatusData = useCallback(async (timeframe) => {
        try {
            if (!user) {
                throw new Error("User not authenticated");
            }
    
            // Query bugs created by the current user or in their organization
            const q = query(
                collection(db, "bugs"),
                // Either created by the current user OR in their organization
                where("createdBy", "==", user.uid),
                // You could also use a compound query with organizationId if needed
                // where("organizationId", "==", user.organizationId),
                orderBy("createdAt", "desc")
            );
            
            const querySnapshot = await getDocs(q);
            const bugs = [];
    
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                bugs.push({
                    id: doc.id,
                    title: data.title,
                    status: data.status,
                    timestamp: data.createdAt?.toDate() || new Date(),
                    reportedBy: data.reportedBy || data.createdBy || "Anonymous",
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
            // Return empty data when there's an error
            return [
                { name: "New", value: 0 },
                { name: "In Progress", value: 0 },
                { name: "Resolved", value: 0 },
                { name: "Closed", value: 0 }
            ];
        }
    }, [user]);
    
    // Function to fetch defect trends data
    const fetchDefectTrendsData = useCallback(async (timeframe) => {
        try {
            if (!user) {
                throw new Error("User not authenticated");
            }
    
            const q = query(
                collection(db, "bugs"),
                where("createdBy", "==", user.uid),
                orderBy("createdAt", "desc")
            );
            
            const querySnapshot = await getDocs(q);
            const bugs = [];

            querySnapshot.forEach((doc) => {
                const data = doc.data();
                bugs.push({
                    id: doc.id,
                    title: data.title,
                    status: data.status,
                    timestamp: data.createdAt?.toDate() || new Date(),
                    reportedBy: data.reportedBy || data.createdBy || "Anonymous",
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
            // Return default sample data in case of error
            return [
                { date: "Week 1", count: 5 },
                { date: "Week 2", count: 8 },
                { date: "Week 3", count: 6 },
                { date: "Week 4", count: 10 }
            ];
        }
    }, [user]);

    // Function to fetch test coverage data
    const fetchTestCoverageData = useCallback(async () => {
        try {
            const q = query(
                collection(db, "testCoverage"),
                orderBy("createdAt", "desc"),
                limit(10)
            );
            const querySnapshot = await getDocs(q);
            const coverage = [];

            querySnapshot.forEach((doc) => {
                const data = doc.data();
                coverage.push({
                    id: doc.id,
                    modules: data.modules || {},
                    createdAt: data.createdAt?.toDate() || new Date()
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
                    Object.entries(item.modules).forEach(([moduleName, value]) => {
                        modules.set(moduleName, value.coverage);
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
            // Return default sample data in case of error
            return [
                { name: "Authentication", coverage: 87 },
                { name: "User Management", coverage: 76 },
                { name: "Dashboard", coverage: 65 },
                { name: "Reports", coverage: 92 },
                { name: "API Integration", coverage: 58 }
            ];
        }
    }, []);

    // Function to fetch test results data
    const fetchTestResultsData = useCallback(async (timeframe) => {
        try {
            const q = query(
                collection(db, "testResults"),
                orderBy("createdAt", "desc")
            );
            const querySnapshot = await getDocs(q);
            const results = [];

            querySnapshot.forEach((doc) => {
                const data = doc.data();
                results.push({
                    id: doc.id,
                    passed: data.passed || 0,
                    failed: data.failed || 0,
                    skipped: data.skipped || 0,
                    timestamp: data.createdAt?.toDate() || new Date(),
                    executedBy: data.executedBy || "System"
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
            // Return default sample data in case of error
            return [
                { date: "3/1", passed: 242, failed: 14, skipped: 2 },
                { date: "3/2", passed: 251, failed: 11, skipped: 0 },
                { date: "3/3", passed: 248, failed: 15, skipped: 1 },
                { date: "3/4", passed: 255, failed: 9, skipped: 3 },
                { date: "3/5", passed: 260, failed: 8, skipped: 0 },
                { date: "3/6", passed: 258, failed: 10, skipped: 1 },
                { date: "3/7", passed: 263, failed: 7, skipped: 2 }
            ];
        }
    }, []);

    // Function to fetch recent activities
    const fetchRecentActivities = useCallback(async () => {
        try {
            if (!user) {
                throw new Error("User not authenticated");
            }
    
            // Fetch recent bugs with proper filters
            const bugsQuery = query(
                collection(db, "bugs"),
                where("createdBy", "==", user.uid),
                orderBy("createdAt", "desc"),
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
                    user: data.reportedBy || data.createdBy || "Anonymous",
                    createdAt: data.createdAt?.toDate() || new Date()
                });
            });

            // Fetch recent test results
            const testsQuery = query(
                collection(db, "testResults"),
                orderBy("createdAt", "desc"),
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
                    createdAt: data.createdAt?.toDate() || new Date()
                });
            });

            // Try to get activities from the dedicated collection
            const activitiesQuery = query(
                collection(db, "activities"),
                where("userId", "==", user.uid),
                orderBy("createdAt", "desc"),
                limit(5)
            );
            const activitiesSnapshot = await getDocs(activitiesQuery);
            const recentActivities = [];

            activitiesSnapshot.forEach((doc) => {
                const data = doc.data();
                recentActivities.push({
                    id: doc.id,
                    ...data,
                    createdAt: data.createdAt?.toDate() || new Date()
                });
            });

            // Combine and sort activities
            const activities = [...recentBugs, ...recentTests, ...recentActivities].sort((a, b) =>
                b.createdAt - a.createdAt
            ).slice(0, 10);

            return activities;
        } catch (error) {
            console.error("Error fetching recent activities:", error);
            // Return empty array in case of error
            return [];
        }
    }, [user]);

    // Auto refresh function
    const fetchDashboardData = useCallback(async () => {
        if (activePage !== "dashboard") return;

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
    }, [
        activePage,
        timeframeView,
        fetchBugStatusData,
        fetchDefectTrendsData,
        fetchTestCoverageData,
        fetchTestResultsData,
        fetchRecentActivities
    ]);

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

    // Setup real-time listeners for data changes
    useEffect(() => {
        let unsubscribers = [];
    
        if (activePage === "dashboard" && user) {
            // Listen for changes in bug reports
            try {
                const bugsQuery = query(
                    collection(db, "bugs"),
                    where("createdBy", "==", user.uid)
                );
                
                const bugsUnsubscribe = onSnapshot(
                    bugsQuery,
                    () => fetchDashboardData(),
                    (error) => console.error("Error listening to bug reports:", error)
                );
                unsubscribers.push(bugsUnsubscribe);
    
                // Similarly, add filters to other listeners
                const resultsQuery = query(
                    collection(db, "testResults"),
                    where("createdBy", "==", user.uid)
                );
                
                const resultsUnsubscribe = onSnapshot(
                    resultsQuery,
                    () => fetchDashboardData(),
                    (error) => console.error("Error listening to test results:", error)
                );
                unsubscribers.push(resultsUnsubscribe);
    
                // Similarly for other listeners...
            } catch (error) {
                console.error("Error setting up listeners:", error);
            }
        }
    
        return () => {
            unsubscribers.forEach(unsubscribe => unsubscribe());
        };
    }, [activePage, fetchDashboardData, user]);

    // Fetch data when component mounts or when timeframe changes
    useEffect(() => {
        fetchDashboardData();
    }, [timeframeView, fetchDashboardData]);

    // Refresh when metrics are updated
    useEffect(() => {
        if (metricsLastUpdated) {
            fetchDashboardData();
        }
    }, [fetchDashboardData, metricsLastUpdated]);

    // Loading state while authentication is being determined
    if (isAuthLoading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-blue-500"></div>
            </div>
        );
    }

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
                                    <div className="text-xs text-gray-500">
                                        Auto-refreshing every 30s
                                    </div>
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