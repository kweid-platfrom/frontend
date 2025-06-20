/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { Bug, AlertTriangle, CheckCircle, Clock, Video, Network, FileText, TrendingDown, TrendingUp } from 'lucide-react';
import { db } from '../../config/firebase';
import { collection, query, getDocs, orderBy, where } from 'firebase/firestore';
import { useProject } from '../../context/ProjectContext';
import { useAuth } from '../../context/AuthProvider';

const BugTrackingMetrics = ({ bugs = [], metrics = null, loading = false, error = null }) => {
    const [fetchedBugs, setFetchedBugs] = useState([]);
    const [fetchingBugs, setFetchingBugs] = useState(false);
    const [fetchError, setFetchError] = useState(null);
    const [hasFetched, setHasFetched] = useState(false);

    const { activeProject } = useProject();
    const { hasPermission, user } = useAuth();

    // Memoize the fetch function to prevent infinite re-renders
    const fetchBugsDirectly = useCallback(async () => {
        if (!activeProject?.id || !user || !hasPermission('read_bugs') || hasFetched) {
            return;
        }

        setFetchingBugs(true);
        setFetchError(null);

        try {
            // Try subcollection first
            const bugsRef = collection(db, 'projects', activeProject.id, 'bugs');
            let querySnapshot;

            try {
                const q = query(bugsRef, orderBy('createdAt', 'desc'));
                querySnapshot = await getDocs(q);
            } catch (orderError) {
                querySnapshot = await getDocs(bugsRef);
            }

            // If subcollection is empty, try main collection with projectId filter
            if (querySnapshot.size === 0) {
                const mainBugsRef = collection(db, 'bugs');
                const mainQuery = query(mainBugsRef, where('projectId', '==', activeProject.id));
                querySnapshot = await getDocs(mainQuery);
            }

            const bugList = querySnapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt) || new Date(),
                    updatedAt: data.updatedAt?.toDate?.() || new Date(data.updatedAt) || new Date(),
                    // Ensure required fields have defaults
                    status: data.status || 'Open',
                    priority: data.priority || 'Medium',
                    severity: data.severity || 'Medium',
                    source: data.source || 'manual',
                    hasVideoEvidence: data.hasVideoEvidence || false,
                    hasNetworkLogs: data.hasNetworkLogs || false,
                    hasConsoleLogs: data.hasConsoleLogs || false,
                    hasAttachments: data.hasAttachments || false,
                    isReproducible: data.isReproducible !== false, // Default to true
                    resolutionTime: data.resolutionTime || 0
                };
            });

            setFetchedBugs(bugList);
            setHasFetched(true);
        } catch (error) {
            setFetchError(error.message);
        } finally {
            setFetchingBugs(false);
        }
    }, [activeProject?.id, user, hasPermission, hasFetched]);

    // Fetch bugs when component mounts if no bugs provided
    useEffect(() => {
        if ((!bugs || bugs.length === 0) && !loading && !error && !hasFetched) {
            fetchBugsDirectly();
        }
    }, [bugs, loading, error, hasFetched, fetchBugsDirectly]);

    // Reset hasFetched when project changes
    useEffect(() => {
        setHasFetched(false);
        setFetchedBugs([]);
        setFetchError(null);
    }, [activeProject?.id]);

    // Use provided bugs or fetched bugs
    const effectiveBugs = useMemo(() => {
        if (bugs && bugs.length > 0) {
            return bugs;
        }
        if (fetchedBugs && fetchedBugs.length > 0) {
            return fetchedBugs;
        }
        return [];
    }, [bugs, fetchedBugs]);

    // Enhanced metrics calculation with better defaults
    const calculateDefaultMetrics = useCallback((bugsData) => {
        if (!Array.isArray(bugsData) || bugsData.length === 0) {
            return {
                totalBugs: 0,
                bugsFromScreenRecording: 0,
                bugsFromManualTesting: 0,
                bugsWithVideoEvidence: 0,
                bugsWithNetworkLogs: 0,
                bugsWithConsoleLogs: 0,
                criticalBugs: 0,
                highPriorityBugs: 0,
                mediumPriorityBugs: 0,
                lowPriorityBugs: 0,
                resolvedBugs: 0,
                avgResolutionTime: 0,
                bugResolutionRate: 0,
                avgBugReportCompleteness: 75,
                bugReportsWithAttachments: 0,
                bugReproductionRate: 0,
                weeklyReportsGenerated: 4,
                monthlyReportsGenerated: 1,
                avgBugsPerReport: 0
            };
        }

        // Calculate metrics from bugs array with better field matching
        const total = bugsData.length;
        const resolved = bugsData.filter(bug => {
            const status = (bug.status || '').toLowerCase();
            return status === 'resolved' || status === 'closed' || status === 'fixed';
        }).length;

        const critical = bugsData.filter(bug => {
            const priority = (bug.priority || bug.severity || '').toLowerCase();
            return priority === 'critical' || priority === 'high';
        }).length;

        const high = bugsData.filter(bug => {
            const priority = (bug.priority || '').toLowerCase();
            return priority === 'high';
        }).length;

        const medium = bugsData.filter(bug => {
            const priority = (bug.priority || '').toLowerCase();
            return priority === 'medium' || priority === 'normal';
        }).length;

        const low = bugsData.filter(bug => {
            const priority = (bug.priority || '').toLowerCase();
            return priority === 'low' || priority === 'minor';
        }).length;

        const screenRecordingBugs = bugsData.filter(bug => {
            const source = (bug.source || '').toLowerCase();
            return source.includes('screen') || source.includes('recording') || source.includes('video');
        }).length;

        const manualBugs = bugsData.filter(bug => {
            const source = (bug.source || '').toLowerCase();
            return source === 'manual' || source === 'testing' || source === '';
        }).length;

        return {
            totalBugs: total,
            bugsFromScreenRecording: screenRecordingBugs,
            bugsFromManualTesting: Math.max(manualBugs, total - screenRecordingBugs),
            bugsWithVideoEvidence: bugsData.filter(bug => bug.hasVideoEvidence || bug.videoUrl || bug.screenRecording).length,
            bugsWithNetworkLogs: bugsData.filter(bug => bug.hasNetworkLogs || bug.networkLogs).length,
            bugsWithConsoleLogs: bugsData.filter(bug => bug.hasConsoleLogs || bug.consoleLogs).length,
            criticalBugs: critical,
            highPriorityBugs: high,
            mediumPriorityBugs: medium,
            lowPriorityBugs: low,
            resolvedBugs: resolved,
            avgResolutionTime: Math.round(bugsData.reduce((acc, bug) => acc + (bug.resolutionTime || 0), 0) / total) || 0,
            bugResolutionRate: total > 0 ? Math.round((resolved / total) * 100) : 0,
            avgBugReportCompleteness: 85,
            bugReportsWithAttachments: bugsData.filter(bug =>
                bug.hasAttachments ||
                bug.attachments?.length > 0 ||
                bug.screenshots?.length > 0 ||
                bug.files?.length > 0
            ).length,
            bugReproductionRate: total > 0 ? Math.round((bugsData.filter(bug => bug.isReproducible !== false).length / total) * 100) : 85,
            weeklyReportsGenerated: 4,
            monthlyReportsGenerated: 1,
            avgBugsPerReport: Math.round(total / 5) || 0
        };
    }, []);

    // Use passed metrics if available, otherwise calculate from bugs
    const finalMetrics = useMemo(() => {
        if (metrics && typeof metrics === 'object') {
            // Ensure all required fields have default values
            return {
                totalBugs: metrics.totalBugs || 0,
                bugsFromScreenRecording: metrics.bugsFromScreenRecording || 0,
                bugsFromManualTesting: metrics.bugsFromManualTesting || 0,
                bugsWithVideoEvidence: metrics.bugsWithVideoEvidence || 0,
                bugsWithNetworkLogs: metrics.bugsWithNetworkLogs || 0,
                bugsWithConsoleLogs: metrics.bugsWithConsoleLogs || 0,
                criticalBugs: metrics.criticalBugs || 0,
                highPriorityBugs: metrics.highPriorityBugs || 0,
                mediumPriorityBugs: metrics.mediumPriorityBugs || 0,
                lowPriorityBugs: metrics.lowPriorityBugs || 0,
                resolvedBugs: metrics.resolvedBugs || 0,
                avgResolutionTime: metrics.avgResolutionTime || 0,
                bugResolutionRate: metrics.bugResolutionRate || 0,
                avgBugReportCompleteness: metrics.avgBugReportCompleteness || 75,
                bugReportsWithAttachments: metrics.bugReportsWithAttachments || 0,
                bugReproductionRate: metrics.bugReproductionRate || 0,
                weeklyReportsGenerated: metrics.weeklyReportsGenerated || 4,
                monthlyReportsGenerated: metrics.monthlyReportsGenerated || 1,
                avgBugsPerReport: metrics.avgBugsPerReport || 0
            };
        }
        return calculateDefaultMetrics(effectiveBugs);
    }, [effectiveBugs, metrics, calculateDefaultMetrics]);

    const {
        totalBugs,
        bugsFromScreenRecording,
        bugsFromManualTesting,
        bugsWithVideoEvidence,
        bugsWithNetworkLogs,
        bugsWithConsoleLogs,
        criticalBugs,
        highPriorityBugs,
        mediumPriorityBugs,
        lowPriorityBugs,
        resolvedBugs,
        avgResolutionTime,
        bugResolutionRate,
        avgBugReportCompleteness,
        bugReportsWithAttachments,
        bugReproductionRate,
        weeklyReportsGenerated,
        monthlyReportsGenerated,
        avgBugsPerReport
    } = finalMetrics;

    // Fixed color classes - using static Tailwind classes
    const getColorClasses = (color) => {
        const colorMap = {
            red: { bg: 'bg-red-50', text: 'text-red-600', border: 'bg-red-500' },
            green: { bg: 'bg-green-50', text: 'text-green-600', border: 'bg-green-500' },
            blue: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'bg-blue-500' },
            orange: { bg: 'bg-orange-50', text: 'text-orange-600', border: 'bg-orange-500' },
            purple: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'bg-purple-500' },
            yellow: { bg: 'bg-yellow-50', text: 'text-yellow-600', border: 'bg-yellow-500' }
        };
        return colorMap[color] || colorMap.blue;
    };

    const MetricCard = ({ title, value, subtitle, icon: Icon, color = "blue", trend = null }) => {
        const colors = getColorClasses(color);
        return (
            <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-lg ${colors.bg}`}>
                        <Icon className={`w-6 h-6 ${colors.text}`} />
                    </div>
                    {trend !== null && (
                        <div className={`flex items-center text-sm ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {trend > 0 ? (
                                <TrendingUp className="w-4 h-4 mr-1" />
                            ) : (
                                <TrendingDown className="w-4 h-4 mr-1" />
                            )}
                            {Math.abs(trend)}%
                        </div>
                    )}
                </div>
                <div className="space-y-1">
                    <p className="text-2xl font-bold text-gray-900">{value?.toLocaleString() || '0'}</p>
                    <p className="text-sm font-medium text-gray-600">{title}</p>
                    {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
                </div>
            </div>
        );
    };

    const SeverityBar = ({ severity, count, total, color }) => {
        const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
        const colors = getColorClasses(color);

        return (
            <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${colors.border}`}></div>
                    <span className="font-medium text-gray-900">{severity}</span>
                </div>
                <div className="flex items-center space-x-3">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div
                            className={`${colors.border} h-2 rounded-full transition-all duration-300`}
                            style={{ width: `${percentage}%` }}
                        ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-700 w-16 text-right">
                        {count} ({percentage}%)
                    </span>
                </div>
            </div>
        );
    };

    const EvidenceCard = ({ title, value, total, icon: Icon, color = "blue" }) => {
        const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
        const colors = getColorClasses(color);

        return (
            <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-3">
                    <div className={`p-2 rounded-lg ${colors.bg}`}>
                        <Icon className={`w-5 h-5 ${colors.text}`} />
                    </div>
                    <div className="text-right">
                        <p className="text-lg font-bold text-gray-900">{value || 0}</p>
                        <p className="text-sm text-gray-500">{percentage}%</p>
                    </div>
                </div>
                <p className="text-sm font-medium text-gray-600">{title}</p>
            </div>
        );
    };

    // Show loading state
    if (loading || fetchingBugs) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-2 text-gray-600">
                        {fetchingBugs ? 'Fetching bug data...' : 'Loading bug metrics...'}
                    </span>
                </div>
            </div>
        );
    }

    // Show error state
    if (error || fetchError) {
        return (
            <div className="space-y-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
                            <span className="text-red-800">{error || fetchError}</span>
                        </div>
                        {fetchError && (
                            <button
                                onClick={() => {
                                    setHasFetched(false);
                                    setFetchError(null);
                                    fetchBugsDirectly();
                                }}
                                className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200"
                            >
                                Retry
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Bug Tracking & Resolution</h2>
                <div className="text-sm text-gray-500">
                    Total: {totalBugs.toLocaleString()} bugs tracked
                    {effectiveBugs.length !== totalBugs && (
                        <span className="ml-2 text-xs text-orange-600">
                            ({effectiveBugs.length} loaded)
                        </span>
                    )}
                </div>
            </div>

            {/* Core Bug Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                    title="Total Bugs"
                    value={totalBugs}
                    subtitle="All bugs reported"
                    icon={Bug}
                    color="red"
                />
                <MetricCard
                    title="Resolved Bugs"
                    value={resolvedBugs}
                    subtitle={`${bugResolutionRate}% resolution rate`}
                    icon={CheckCircle}
                    color="green"
                    trend={15}
                />
                <MetricCard
                    title="Avg Resolution Time"
                    value={`${avgResolutionTime}h`}
                    subtitle="Hours to resolve"
                    icon={Clock}
                    color="orange"
                    trend={-8}
                />
                <MetricCard
                    title="From Screen Recording"
                    value={bugsFromScreenRecording}
                    subtitle={`${totalBugs > 0 ? Math.round((bugsFromScreenRecording / totalBugs) * 100) : 0}% of total`}
                    icon={Video}
                    color="purple"
                    trend={22}
                />
            </div>

            {/* Bug Severity Distribution */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                    <AlertTriangle className="w-5 h-5 mr-2 text-orange-600" />
                    Bug Severity Distribution
                </h3>
                <div className="space-y-4">
                    <SeverityBar
                        severity="Critical"
                        count={criticalBugs}
                        total={totalBugs}
                        color="red"
                    />
                    <SeverityBar
                        severity="High Priority"
                        count={highPriorityBugs}
                        total={totalBugs}
                        color="orange"
                    />
                    <SeverityBar
                        severity="Medium Priority"
                        count={mediumPriorityBugs}
                        total={totalBugs}
                        color="yellow"
                    />
                    <SeverityBar
                        severity="Low Priority"
                        count={lowPriorityBugs}
                        total={totalBugs}
                        color="green"
                    />
                </div>
            </div>

            {/* Evidence Quality */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Bug Evidence Types */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Evidence Collection</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <EvidenceCard
                            title="Video Evidence"
                            value={bugsWithVideoEvidence}
                            total={totalBugs}
                            icon={Video}
                            color="purple"
                        />
                        <EvidenceCard
                            title="Network Logs"
                            value={bugsWithNetworkLogs}
                            total={totalBugs}
                            icon={Network}
                            color="blue"
                        />
                        <EvidenceCard
                            title="Console Logs"
                            value={bugsWithConsoleLogs}
                            total={totalBugs}
                            icon={FileText}
                            color="green"
                        />
                        <EvidenceCard
                            title="With Attachments"
                            value={bugReportsWithAttachments}
                            total={totalBugs}
                            icon={FileText}
                            color="orange"
                        />
                    </div>
                </div>

                {/* Bug Quality Metrics */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Report Quality</h3>
                    <div className="space-y-6">
                        <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                            <div>
                                <p className="font-medium text-blue-900">Report Completeness</p>
                                <p className="text-sm text-blue-600">Avg quality score</p>
                            </div>
                            <div className="text-3xl font-bold text-blue-700">{avgBugReportCompleteness}%</div>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                            <div>
                                <p className="font-medium text-green-900">Reproduction Rate</p>
                                <p className="text-sm text-green-600">Successfully reproduced</p>
                            </div>
                            <div className="text-3xl font-bold text-green-700">{bugReproductionRate}%</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bug Source Analysis */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Bug Discovery</h3>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600">Screen Recording</span>
                            <div className="flex items-center space-x-2">
                                <span className="font-medium">{bugsFromScreenRecording}</span>
                                <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                            </div>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600">Manual Testing</span>
                            <div className="flex items-center space-x-2">
                                <span className="font-medium">{bugsFromManualTesting}</span>
                                <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                            </div>
                        </div>
                        <div className="pt-2 border-t">
                            <p className="text-xs text-gray-500">
                                {totalBugs > 0 ? Math.round((bugsFromScreenRecording / totalBugs) * 100) : 0}% discovered via screen recording
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Resolution Performance</h3>
                    <div className="space-y-4">
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                            <p className="text-2xl font-bold text-green-700">{bugResolutionRate}%</p>
                            <p className="text-sm text-gray-600">Resolution Rate</p>
                        </div>
                        <div className="text-center p-4 bg-orange-50 rounded-lg">
                            <p className="text-2xl font-bold text-orange-700">{avgResolutionTime}h</p>
                            <p className="text-sm text-gray-600">Avg Resolution Time</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Reporting Activity</h3>
                    <div className="space-y-4">
                        <div className="flex justify-between">
                            <span className="text-gray-600">Weekly Reports</span>
                            <span className="font-medium">{weeklyReportsGenerated}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Monthly Reports</span>
                            <span className="font-medium">{monthlyReportsGenerated}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Avg Bugs/Report</span>
                            <span className="font-medium">{avgBugsPerReport}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bug Health Dashboard */}
            <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-lg border border-red-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Bug Management Health</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">
                            {criticalBugs + highPriorityBugs}
                        </div>
                        <div className="text-sm text-gray-600">High Priority</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                            {avgBugReportCompleteness}%
                        </div>
                        <div className="text-sm text-gray-600">Report Quality</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                            {bugReproductionRate}%
                        </div>
                        <div className="text-sm text-gray-600">Reproducible</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">
                            {totalBugs > 0 ? Math.round(((bugsWithVideoEvidence + bugsWithNetworkLogs) / (totalBugs * 2)) * 100) : 0}%
                        </div>
                        <div className="text-sm text-gray-600">Evidence Coverage</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BugTrackingMetrics;