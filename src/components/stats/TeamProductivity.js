/* eslint-disable @typescript-eslint/no-unused-vars */
import React from 'react';
import { Users, TrendingUp, Award, Clock, Target, Activity } from 'lucide-react';

const TeamProductivity = ({ metrics }) => {
    const safeMetrics = metrics || {};
    
    const {
        activeTeamMembers = 0,
        testCasesCreatedPerMember = 0,
        bugsFoundPerMember = 0,
        recordingsPerMember = 0,
        featuresUnderTest = 0,
        sprintTestingProgress = 0,
        releaseReadiness = 0,
        crossTeamCollaboration = 0,
        testCaseReviewCycle = 0,
        knowledgeSharing = 0,
        qualityTrendScore = 0,
        testCoverageGrowth = 0
    } = safeMetrics;

    const getColorClasses = (color, intensity = 'base') => {
        const colorMap = {
            success: {
                bg: 'bg-[rgb(var(--color-success)/0.1)]',
                text: 'text-[rgb(var(--color-success))]',
                bar: 'bg-[rgb(var(--color-success))]'
            },
            info: {
                bg: 'bg-[rgb(var(--color-info)/0.1)]',
                text: 'text-[rgb(var(--color-info))]',
                bar: 'bg-[rgb(var(--color-info))]'
            },
            warning: {
                bg: 'bg-[rgb(var(--color-warning)/0.1)]',
                text: 'text-[rgb(var(--color-warning))]',
                bar: 'bg-[rgb(var(--color-warning))]'
            },
            error: {
                bg: 'bg-[rgb(var(--color-error)/0.1)]',
                text: 'text-[rgb(var(--color-error))]',
                bar: 'bg-[rgb(var(--color-error))]'
            },
            muted: {
                bg: 'bg-muted',
                text: 'text-muted-foreground',
                bar: 'bg-muted-foreground'
            }
        };
        return colorMap[color] || colorMap.info;
    };

    const teamPerformanceData = [
        { name: 'Test Cases', value: testCasesCreatedPerMember, target: 25, color: 'info' },
        { name: 'Bugs Found', value: bugsFoundPerMember, target: 8, color: 'error' },
        { name: 'Recordings', value: recordingsPerMember, target: 12, color: 'info' }
    ];

    const progressMetrics = [
        {
            label: 'Sprint Progress',
            value: sprintTestingProgress,
            color: 'info',
            icon: Target
        },
        {
            label: 'Release Readiness',
            value: releaseReadiness,
            color: 'success',
            icon: Award
        },
        {
            label: 'Quality Trend',
            value: qualityTrendScore,
            color: qualityTrendScore >= 70 ? 'success' : 'warning',
            icon: TrendingUp
        }
    ];

    const MetricCard = ({ icon: Icon, label, value, unit = '', color = 'muted' }) => {
        const colors = getColorClasses(color);
        return (
            <div className="bg-[rgb(var(--color-muted)/0.1)] rounded-lg p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <Icon className={`w-4 h-4 ${colors.text}`} />
                        <span className="text-sm font-medium text-foreground">{label}</span>
                    </div>
                    <span className={`text-lg font-bold ${colors.text}`}>
                        {typeof value === 'number' ? value.toFixed(1) : value}{unit}
                    </span>
                </div>
            </div>
        );
    };

    const ProgressBar = ({ label, value, color, icon: Icon }) => {
        const colors = getColorClasses(color);
        return (
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <Icon className={`w-4 h-4 ${colors.text}`} />
                        <span className="text-sm font-medium text-foreground">{label}</span>
                    </div>
                    <span className={`text-sm font-bold ${colors.text}`}>{value}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                    <div
                        className={`h-2 rounded-full ${colors.bar}`}
                        style={{ width: `${Math.min(value, 100)}%` }}
                    ></div>
                </div>
            </div>
        );
    };

    const PerformanceBar = ({ name, value, target, color }) => {
        const percentage = target > 0 ? (value / target) * 100 : 0;
        const isOnTarget = percentage >= 80;
        const colors = getColorClasses(isOnTarget ? 'success' : 'warning');
        const barColors = getColorClasses(color);

        return (
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">{name}</span>
                    <div className="flex items-center space-x-2">
                        <span className="text-sm text-muted-foreground">{value}/{target}</span>
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${colors.bg} ${colors.text}`}>
                            {percentage.toFixed(0)}%
                        </span>
                    </div>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                    <div
                        className={`h-2 rounded-full ${barColors.bar}`}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                    ></div>
                </div>
            </div>
        );
    };

    return (
        <div className="bg-card rounded-lg shadow-theme-sm border border-border">
            <div className="p-6 border-b border-border">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-[rgb(var(--color-info)/0.1)] rounded-lg">
                            <Users className="w-5 h-5 text-[rgb(var(--color-info))]" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-foreground">Team Productivity</h3>
                            <p className="text-sm text-muted-foreground">{activeTeamMembers} active members</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-sm text-muted-foreground">Features Under Test</div>
                        <div className="text-2xl font-bold text-foreground">{featuresUnderTest}</div>
                    </div>
                </div>
            </div>

            <div className="p-6 space-y-6">
                <div>
                    <h4 className="text-sm font-semibold text-foreground mb-4">Individual Performance (Per Member)</h4>
                    <div className="space-y-4">
                        {teamPerformanceData.map((item) => (
                            <PerformanceBar
                                key={item.name}
                                name={item.name}
                                value={item.value}
                                target={item.target}
                                color={item.color}
                            />
                        ))}
                    </div>
                </div>

                <div>
                    <h4 className="text-sm font-semibold text-foreground mb-4">Project Progress</h4>
                    <div className="space-y-4">
                        {progressMetrics.map((metric) => (
                            <ProgressBar
                                key={metric.label}
                                label={metric.label}
                                value={metric.value}
                                color={metric.color}
                                icon={metric.icon}
                            />
                        ))}
                    </div>
                </div>

                <div>
                    <h4 className="text-sm font-semibold text-foreground mb-4">Team Collaboration</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <MetricCard
                            icon={Users}
                            label="Cross-Team Score"
                            value={crossTeamCollaboration}
                            unit="%"
                            color={crossTeamCollaboration >= 70 ? 'success' : 'warning'}
                        />
                        <MetricCard
                            icon={Clock}
                            label="Review Cycle"
                            value={testCaseReviewCycle}
                            unit="h"
                            color="info"
                        />
                        <MetricCard
                            icon={Activity}
                            label="Knowledge Sharing"
                            value={knowledgeSharing}
                            unit="%"
                            color={knowledgeSharing >= 70 ? 'success' : 'warning'}
                        />
                        <MetricCard
                            icon={TrendingUp}
                            label="Coverage Growth"
                            value={testCoverageGrowth}
                            unit="%"
                            color={testCoverageGrowth >= 0 ? 'success' : 'error'}
                        />
                    </div>
                </div>

                <div className="bg-[rgb(var(--color-info)/0.1)] rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-foreground mb-2">Team Insights</h4>
                    <div className="space-y-2 text-sm text-[rgb(var(--color-info))]">
                        {sprintTestingProgress >= 80 && (
                            <div className="flex items-center space-x-2">
                                <Award className="w-4 h-4 text-[rgb(var(--color-success))]" />
                                <span>Sprint testing is on track - great progress!</span>
                            </div>
                        )}
                        {crossTeamCollaboration < 60 && (
                            <div className="flex items-center space-x-2">
                                <Users className="w-4 h-4 text-[rgb(var(--color-warning))]" />
                                <span>Consider improving cross-team collaboration</span>
                            </div>
                        )}
                        {testCaseReviewCycle > 48 && (
                            <div className="flex items-center space-x-2">
                                <Clock className="w-4 h-4 text-[rgb(var(--color-error))]" />
                                <span>Review cycle time could be optimized</span>
                            </div>
                        )}
                        {qualityTrendScore >= 80 && (
                            <div className="flex items-center space-x-2">
                                <TrendingUp className="w-4 h-4 text-[rgb(var(--color-success))]" />
                                <span>Quality metrics are trending upward</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TeamProductivity;