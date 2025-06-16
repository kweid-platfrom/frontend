import React, { useState, useEffect } from 'react';
import { Bug, AlertTriangle, CheckCircle, Clock, Video, Network, FileText, TrendingDown } from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { calculateBugMetrics } from '../../utils/calculateBugMetrics';

const BugTrackingMetrics = () => {
    const [metrics, setMetrics] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchBugMetrics = async () => {
            try {
                setLoading(true);
                const bugsCollection = collection(db, 'bugs');
                const bugsSnapshot = await getDocs(bugsCollection);
                const bugsData = bugsSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

                const calculatedMetrics = calculateBugMetrics(bugsData);
                setMetrics(calculatedMetrics);
                setError(null);
            } catch (err) {
                console.error('Error fetching bug metrics:', err);
                setError('Failed to load bug metrics');
                // Set default metrics on error
                setMetrics(calculateBugMetrics([]));
            } finally {
                setLoading(false);
            }
        };

        fetchBugMetrics();
    }, []);

    const {
        totalBugs = 0,
        bugsFromScreenRecording = 0,
        bugsFromManualTesting = 0,
        bugsWithVideoEvidence = 0,
        bugsWithNetworkLogs = 0,
        bugsWithConsoleLogs = 0,
        criticalBugs = 0,
        highPriorityBugs = 0,
        mediumPriorityBugs = 0,
        lowPriorityBugs = 0,
        resolvedBugs = 0,
        avgResolutionTime = 0,
        bugResolutionRate = 0,
        avgBugReportCompleteness = 0,
        bugReportsWithAttachments = 0,
        bugReproductionRate = 0,
        weeklyReportsGenerated = 0,
        monthlyReportsGenerated = 0,
        avgBugsPerReport = 0
    } = metrics;

    const MetricCard = ({ title, value, subtitle, icon: Icon, color = "blue", trend = null }) => (
        <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg bg-${color}-50`}>
                    <Icon className={`w-6 h-6 text-${color}-600`} />
                </div>
                {trend && (
                    <div className={`flex items-center text-sm ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        <TrendingDown className={`w-4 h-4 mr-1 ${trend > 0 ? 'rotate-180' : ''}`} />
                        {Math.abs(trend)}%
                    </div>
                )}
            </div>
            <div className="space-y-1">
                <p className="text-2xl font-bold text-gray-900">{value?.toLocaleString()}</p>
                <p className="text-sm font-medium text-gray-600">{title}</p>
                {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
            </div>
        </div>
    );

    const SeverityBar = ({ severity, count, total, color }) => {
        const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
        return (
            <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full bg-${color}-500`}></div>
                    <span className="font-medium text-gray-900">{severity}</span>
                </div>
                <div className="flex items-center space-x-3">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div
                            className={`bg-${color}-500 h-2 rounded-full transition-all duration-300`}
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
        return (
            <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-3">
                    <div className={`p-2 rounded-lg bg-${color}-50`}>
                        <Icon className={`w-5 h-5 text-${color}-600`} />
                    </div>
                    <div className="text-right">
                        <p className="text-lg font-bold text-gray-900">{value}</p>
                        <p className="text-sm text-gray-500">{percentage}%</p>
                    </div>
                </div>
                <p className="text-sm font-medium text-gray-600">{title}</p>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-2 text-gray-600">Loading bug metrics...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="space-y-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                    <div className="flex items-center">
                        <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
                        <span className="text-red-800">{error}</span>
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
                    value={avgResolutionTime}
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