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

    const getColorClasses = (color) => {
        const colorMap = {
            success: {
                bg: 'bg-[rgb(var(--color-success)/0.1)]',
                text: 'text-[rgb(var(--color-success))]',
                bar: 'bg-[rgb(var(--color-success))]',
                dot: 'bg-[rgb(var(--color-success))]'
            },
            info: {
                bg: 'bg-[rgb(var(--color-info)/0.1)]',
                text: 'text-[rgb(var(--color-info))]',
                bar: 'bg-[rgb(var(--color-info))]',
                dot: 'bg-[rgb(var(--color-info))]'
            },
            warning: {
                bg: 'bg-[rgb(var(--color-warning)/0.1)]',
                text: 'text-[rgb(var(--color-warning))]',
                bar: 'bg-[rgb(var(--color-warning))]',
                dot: 'bg-[rgb(var(--color-warning))]'
            },
            error: {
                bg: 'bg-[rgb(var(--color-error)/0.1)]',
                text: 'text-[rgb(var(--color-error))]',
                bar: 'bg-[rgb(var(--color-error))]',
                dot: 'bg-[rgb(var(--color-error))]'
            }
        };
        return colorMap[color] || colorMap.info; // Default to info if color is not found
    };

    const MetricCard = ({ title, value, subtitle, icon: Icon, color = 'info', trend = null }) => {
        const colors = getColorClasses(color);
        return (
            <div className="bg-card rounded-lg shadow-theme-sm border border-border p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className={`p-2 rounded-lg ${colors.bg}`}>
                        <Icon className={`w-5 h-5 ${colors.text}`} />
                    </div>
                    {trend && (
                        <div className={`flex items-center text-sm ${trend > 0 ? 'text-[rgb(var(--color-success))]' : 'text-[rgb(var(--color-error))]'}`}>
                            <TrendingUp className="w-4 h-4 mr-1" />
                            {Math.abs(trend)}%
                        </div>
                    )}
                </div>
                <div>
                    <p className="text-2xl font-bold text-foreground">{value}</p>
                    <p className="text-sm text-muted-foreground">{title}</p>
                    {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
                </div>
            </div>
        );
    };

    const ProgressBar = ({ value, max, label, color = 'info' }) => {
        const colors = getColorClasses(color);
        const percentage = max > 0 ? Math.round((value / max) * 100) : 0;
        return (
            <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-medium text-foreground">{percentage}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                    <div
                        className={`h-2 rounded-full transition-all duration-300 ${colors.bar}`}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                    ></div>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-bold text-foreground mb-2">Screen Recording & Evidence Metrics</h2>
                <p className="text-muted-foreground">Track recording usage, quality, and effectiveness in bug reporting</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                    title="Total Recordings"
                    value={totalRecordings.toLocaleString()}
                    subtitle="All time recordings"
                    icon={Video}
                    color="info"
                />
                <MetricCard
                    title="Recording Hours"
                    value={`${totalRecordingHours.toFixed(1)}h`}
                    subtitle={`Avg: ${avgRecordingDuration.toFixed(1)}min per recording`}
                    icon={Clock}
                    color="success"
                />
                <MetricCard
                    title="Storage Used"
                    value={`${totalStorageUsedGB.toFixed(1)} GB`}
                    subtitle={`${totalRecordings > 0 ? (totalStorageUsedGB / totalRecordings * 1024).toFixed(0) : 0}MB avg per recording`}
                    icon={HardDrive}
                    color="info"
                />
                <MetricCard
                    title="Active Users"
                    value={activeRecordingUsers}
                    subtitle={`${recordingsPerUser.toFixed(1)} recordings per user`}
                    icon={Users}
                    color="warning"
                    trend={recordingUsageGrowth}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-card rounded-lg shadow-theme-sm border border-border p-6">
                    <h3 className="font-semibold text-foreground mb-4 flex items-center">
                        <Activity className="w-5 h-5 mr-2 text-[rgb(var(--color-info))]" />
                        Recording Quality & Context
                    </h3>
                    <div className="space-y-4">
                        <ProgressBar
                            value={recordingsWithNetworkData}
                            max={totalRecordings}
                            label="Recordings with Network Data"
                            color="info"
                        />
                        <ProgressBar
                            value={recordingsWithConsoleData}
                            max={totalRecordings}
                            label="Recordings with Console Logs"
                            color="success"
                        />
                        <ProgressBar
                            value={recordingsLinkedToBugs}
                            max={totalRecordings}
                            label="Recordings Linked to Bugs"
                            color="error"
                        />
                        <ProgressBar
                            value={recordingsLinkedToTestCases}
                            max={totalRecordings}
                            label="Recordings Linked to Test Cases"
                            color="info"
                        />
                    </div>
                </div>

                <div className="bg-card rounded-lg shadow-theme-sm border border-border p-6">
                    <h3 className="font-semibold text-foreground mb-4 flex items-center">
                        <Link className="w-5 h-5 mr-2 text-[rgb(var(--color-success))]" />
                        Recording Effectiveness
                    </h3>
                    <div className="space-y-6">
                        <div className="text-center">
                            <div className="text-3xl font-bold text-[rgb(var(--color-info))]">{bugsFoundPerRecording.toFixed(1)}</div>
                            <p className="text-sm text-muted-foreground">Average bugs found per recording</p>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-bold text-[rgb(var(--color-success))]">{recordingToReportConversionRate.toFixed(1)}%</div>
                            <p className="text-sm text-muted-foreground">Recording to bug report conversion rate</p>
                        </div>
                        <div className="bg-[rgb(var(--color-info)/0.1)] rounded-lg p-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-foreground">Evidence Quality Score</span>
                                <span className="text-lg font-bold text-[rgb(var(--color-info))]">
                                    {totalRecordings > 0 ? Math.round((recordingsWithNetworkData + recordingsWithConsoleData) / (totalRecordings * 2) * 100) : 0}%
                                </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Based on network and console data coverage
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-card rounded-lg shadow-theme-sm border border-border p-6">
                    <h3 className="font-semibold text-foreground mb-4 flex items-center">
                        <Upload className="w-5 h-5 mr-2 text-[rgb(var(--color-info))]" />
                        Upload Performance
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <div className="text-2xl font-bold text-foreground">{avgUploadTime.toFixed(1)}s</div>
                            <p className="text-sm text-muted-foreground">Average upload time</p>
                        </div>
                        <div className="bg-[rgb(var(--color-success)/0.1)] rounded-lg p-3">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Upload Success Rate</span>
                                <span className="font-medium text-[rgb(var(--color-success))]">
                                    {totalRecordings > 0 ? Math.round((totalRecordings - recordingProcessingFailures) / totalRecordings * 100) : 0}%
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-card rounded-lg shadow-theme-sm border border-border p-6">
                    <h3 className="font-semibold text-foreground mb-4 flex items-center">
                        <AlertTriangle className="w-5 h-5 mr-2 text-[rgb(var(--color-error))]" />
                        Processing Issues
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <div className="text-2xl font-bold text-[rgb(var(--color-error))]">{recordingProcessingFailures}</div>
                            <p className="text-sm text-muted-foreground">Processing failures</p>
                        </div>
                        <div className="bg-[rgb(var(--color-error)/0.1)] rounded-lg p-3">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Failure Rate</span>
                                <span className="font-medium text-[rgb(var(--color-error))]">
                                    {totalRecordings > 0 ? (recordingProcessingFailures / totalRecordings * 100).toFixed(1) : 0}%
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-card rounded-lg shadow-theme-sm border border-border p-6">
                    <h3 className="font-semibold text-foreground mb-4">Storage Efficiency</h3>
                    <div className="space-y-4">
                        <div>
                            <div className="text-2xl font-bold text-[rgb(var(--color-info))]">
                                {totalRecordingHours > 0 ? (totalStorageUsedGB / totalRecordingHours).toFixed(1) : 0} GB/h
                            </div>
                            <p className="text-sm text-muted-foreground">Storage per recording hour</p>
                        </div>
                        <div className="bg-[rgb(var(--color-info)/0.1)] rounded-lg p-3">
                            <div className="text-xs text-[rgb(var(--color-info))]">
                                {totalStorageUsedGB > 100 ? 'Consider compression optimization' : 'Storage usage is optimal'}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-card rounded-lg shadow-theme-sm border border-border p-6">
                <h3 className="font-semibold text-foreground mb-4">Recording Insights & Recommendations</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h4 className="font-medium text-foreground mb-3">Quality Insights</h4>
                        <div className="space-y-2 text-sm">
                            {recordingsWithNetworkData / totalRecordings < 0.7 && (
                                <div className="flex items-start space-x-2">
                                    <div className="w-2 h-2 bg-[rgb(var(--color-warning))] rounded-full mt-1.5"></div>
                                    <span className="text-muted-foreground">
                                        Only {totalRecordings > 0 ? Math.round(recordingsWithNetworkData / totalRecordings * 100) : 0}% of recordings include network data.
                                        Consider enabling network capture by default.
                                    </span>
                                </div>
                            )}
                            {recordingsWithConsoleData / totalRecordings < 0.8 && (
                                <div className="flex items-start space-x-2">
                                    <div className="w-2 h-2 bg-[rgb(var(--color-warning))] rounded-full mt-1.5"></div>
                                    <span className="text-muted-foreground">
                                        Console logs are missing in {totalRecordings > 0 ? Math.round((1 - recordingsWithConsoleData / totalRecordings) * 100) : 0}% of recordings.
                                    </span>
                                </div>
                            )}
                            {bugsFoundPerRecording > 2 && (
                                <div className="flex items-start space-x-2">
                                    <div className="w-2 h-2 bg-[rgb(var(--color-success))] rounded-full mt-1.5"></div>
                                    <span className="text-muted-foreground">
                                        High bug discovery rate: {bugsFoundPerRecording.toFixed(1)} bugs per recording.
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                    <div>
                        <h4 className="font-medium text-foreground mb-3">Usage Patterns</h4>
                        <div className="space-y-2 text-sm">
                            <div className="flex items-start space-x-2">
                                <div className="w-2 h-2 bg-[rgb(var(--color-info))] rounded-full mt-1.5"></div>
                                <span className="text-muted-foreground">
                                    Average recording duration: {avgRecordingDuration.toFixed(1)} minutes
                                </span>
                            </div>
                            <div className="flex items-start space-x-2">
                                <div className="w-2 h-2 bg-[rgb(var(--color-info))] rounded-full mt-1.5"></div>
                                <span className="text-muted-foreground">
                                    {activeRecordingUsers} active users creating {recordingsPerUser.toFixed(1)} recordings each
                                </span>
                            </div>
                            {recordingUsageGrowth > 0 && (
                                <div className="flex items-start space-x-2">
                                    <div className="w-2 h-2 bg-[rgb(var(--color-success))] rounded-full mt-1.5"></div>
                                    <span className="text-muted-foreground">
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