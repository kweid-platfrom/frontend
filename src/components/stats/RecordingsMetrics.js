import React from 'react';
import { Video, Clock, HardDrive, Users, TrendingUp, Activity, Link, Upload, AlertTriangle } from 'lucide-react';

const RecordingMetrics = ({ metrics = {} }) => {
    const {
        totalRecordings = 0,
        avgRecordingDuration = 0,
        totalRecordingHours = 0,
        recordingsWithNetworkData = 0,
        recordingsWithConsoleData = 0,
        recordingsLinkedToBugs = 0,
        recordingsLinkedToTestCases = 0,
        bugsFoundPerRecording = 0,
        recordingToReportConversionRate = 0,
        totalStorageUsedGB = 0,
        avgUploadTime = 0,
        recordingProcessingFailures = 0,
        activeRecordingUsers = 0,
        recordingsPerUser = 0,
        recordingUsageGrowth = 0
    } = metrics;

    const MetricCard = ({ title, value, subtitle, icon: Icon, color = 'blue', trend = null }) => (
        <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between mb-4">
                <div className={`p-2 rounded-lg bg-${color}-100`}>
                    <Icon className={`w-5 h-5 text-${color}-600`} />
                </div>
                {trend && (
                    <div className={`flex items-center text-sm ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        <TrendingUp className="w-4 h-4 mr-1" />
                        {Math.abs(trend)}%
                    </div>
                )}
            </div>
            <div>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
                <p className="text-sm text-gray-600">{title}</p>
                {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
            </div>
        </div>
    );

    const ProgressBar = ({ value, max, label, color = 'blue' }) => (
        <div className="mb-4">
            <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">{label}</span>
                <span className="font-medium">{Math.round((value / max) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                    className={`bg-${color}-500 h-2 rounded-full transition-all duration-300`}
                    style={{ width: `${Math.min((value / max) * 100, 100)}%` }}
                ></div>
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Screen Recording & Evidence Metrics</h2>
                <p className="text-gray-600">Track recording usage, quality, and effectiveness in bug reporting</p>
            </div>

            {/* Core Recording Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                    title="Total Recordings"
                    value={totalRecordings.toLocaleString()}
                    subtitle="All time recordings"
                    icon={Video}
                    color="blue"
                />
                <MetricCard
                    title="Recording Hours"
                    value={`${totalRecordingHours.toFixed(1)}h`}
                    subtitle={`Avg: ${avgRecordingDuration.toFixed(1)}min per recording`}
                    icon={Clock}
                    color="green"
                />
                <MetricCard
                    title="Storage Used"
                    value={`${totalStorageUsedGB.toFixed(1)} GB`}
                    subtitle={`${(totalStorageUsedGB / totalRecordings * 1024).toFixed(0)}MB avg per recording`}
                    icon={HardDrive}
                    color="purple"
                />
                <MetricCard
                    title="Active Users"
                    value={activeRecordingUsers}
                    subtitle={`${recordingsPerUser.toFixed(1)} recordings per user`}
                    icon={Users}
                    color="orange"
                    trend={recordingUsageGrowth}
                />
            </div>

            {/* Recording Quality & Context */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg shadow-sm border p-6">
                    <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                        <Activity className="w-5 h-5 mr-2 text-blue-600" />
                        Recording Quality & Context
                    </h3>
                    <div className="space-y-4">
                        <ProgressBar
                            value={recordingsWithNetworkData}
                            max={totalRecordings}
                            label="Recordings with Network Data"
                            color="blue"
                        />
                        <ProgressBar
                            value={recordingsWithConsoleData}
                            max={totalRecordings}
                            label="Recordings with Console Logs"
                            color="green"
                        />
                        <ProgressBar
                            value={recordingsLinkedToBugs}
                            max={totalRecordings}
                            label="Recordings Linked to Bugs"
                            color="red"
                        />
                        <ProgressBar
                            value={recordingsLinkedToTestCases}
                            max={totalRecordings}
                            label="Recordings Linked to Test Cases"
                            color="purple"
                        />
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border p-6">
                    <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                        <Link className="w-5 h-5 mr-2 text-green-600" />
                        Recording Effectiveness
                    </h3>
                    <div className="space-y-6">
                        <div className="text-center">
                            <div className="text-3xl font-bold text-blue-600">{bugsFoundPerRecording.toFixed(1)}</div>
                            <p className="text-sm text-gray-600">Average bugs found per recording</p>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-bold text-green-600">{recordingToReportConversionRate.toFixed(1)}%</div>
                            <p className="text-sm text-gray-600">Recording to bug report conversion rate</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-700">Evidence Quality Score</span>
                                <span className="text-lg font-bold text-blue-600">
                                    {Math.round((recordingsWithNetworkData + recordingsWithConsoleData) / (totalRecordings * 2) * 100)}%
                                </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                                Based on network and console data coverage
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Performance & Reliability */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg shadow-sm border p-6">
                    <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                        <Upload className="w-5 h-5 mr-2 text-purple-600" />
                        Upload Performance
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <div className="text-2xl font-bold text-gray-900">{avgUploadTime.toFixed(1)}s</div>
                            <p className="text-sm text-gray-600">Average upload time</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">Upload Success Rate</span>
                                <span className="font-medium text-green-600">
                                    {Math.round((totalRecordings - recordingProcessingFailures) / totalRecordings * 100)}%
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border p-6">
                    <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                        <AlertTriangle className="w-5 h-5 mr-2 text-red-600" />
                        Processing Issues
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <div className="text-2xl font-bold text-red-600">{recordingProcessingFailures}</div>
                            <p className="text-sm text-gray-600">Processing failures</p>
                        </div>
                        <div className="bg-red-50 rounded-lg p-3">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">Failure Rate</span>
                                <span className="font-medium text-red-600">
                                    {(recordingProcessingFailures / totalRecordings * 100).toFixed(1)}%
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border p-6">
                    <h3 className="font-semibold text-gray-900 mb-4">Storage Efficiency</h3>
                    <div className="space-y-4">
                        <div>
                            <div className="text-2xl font-bold text-purple-600">
                                {(totalStorageUsedGB / totalRecordingHours).toFixed(1)} GB/h
                            </div>
                            <p className="text-sm text-gray-600">Storage per recording hour</p>
                        </div>
                        <div className="bg-purple-50 rounded-lg p-3">
                            <div className="text-xs text-purple-800">
                                {totalStorageUsedGB > 100 ? 'Consider compression optimization' : 'Storage usage is optimal'}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recording Insights */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Recording Insights & Recommendations</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h4 className="font-medium text-gray-900 mb-3">Quality Insights</h4>
                        <div className="space-y-2 text-sm">
                            {recordingsWithNetworkData / totalRecordings < 0.7 && (
                                <div className="flex items-start space-x-2">
                                    <div className="w-2 h-2 bg-orange-500 rounded-full mt-1.5"></div>
                                    <span className="text-gray-600">
                                        Only {Math.round(recordingsWithNetworkData / totalRecordings * 100)}% of recordings include network data.
                                        Consider enabling network capture by default.
                                    </span>
                                </div>
                            )}
                            {recordingsWithConsoleData / totalRecordings < 0.8 && (
                                <div className="flex items-start space-x-2">
                                    <div className="w-2 h-2 bg-orange-500 rounded-full mt-1.5"></div>
                                    <span className="text-gray-600">
                                        Console logs are missing in {Math.round((1 - recordingsWithConsoleData / totalRecordings) * 100)}% of recordings.
                                    </span>
                                </div>
                            )}
                            {bugsFoundPerRecording > 2 && (
                                <div className="flex items-start space-x-2">
                                    <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5"></div>
                                    <span className="text-gray-600">
                                        High bug discovery rate: {bugsFoundPerRecording.toFixed(1)} bugs per recording.
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                    <div>
                        <h4 className="font-medium text-gray-900 mb-3">Usage Patterns</h4>
                        <div className="space-y-2 text-sm">
                            <div className="flex items-start space-x-2">
                                <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5"></div>
                                <span className="text-gray-600">
                                    Average recording duration: {avgRecordingDuration.toFixed(1)} minutes
                                </span>
                            </div>
                            <div className="flex items-start space-x-2">
                                <div className="w-2 h-2 bg-purple-500 rounded-full mt-1.5"></div>
                                <span className="text-gray-600">
                                    {activeRecordingUsers} active users creating {recordingsPerUser.toFixed(1)} recordings each
                                </span>
                            </div>
                            {recordingUsageGrowth > 0 && (
                                <div className="flex items-start space-x-2">
                                    <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5"></div>
                                    <span className="text-gray-600">
                                        Usage growing by {recordingUsageGrowth.toFixed(1)}% this period
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RecordingMetrics;