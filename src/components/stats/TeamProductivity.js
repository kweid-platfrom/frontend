import React from 'react';
import { Users, TrendingUp, Award, Clock, Target, Activity } from 'lucide-react';

const TeamProductivity = ({ metrics = {} }) => {
    // Default values for metrics
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
    } = metrics;

    // Team performance indicators
    const teamPerformanceData = [
        { name: 'Test Cases', value: testCasesCreatedPerMember, target: 25, color: 'bg-blue-500' },
        { name: 'Bugs Found', value: bugsFoundPerMember, target: 8, color: 'bg-red-500' },
        { name: 'Recordings', value: recordingsPerMember, target: 12, color: 'bg-purple-500' }
    ];

    // Progress metrics
    const progressMetrics = [
        {
            label: 'Sprint Progress',
            value: sprintTestingProgress,
            color: 'text-blue-600',
            bgColor: 'bg-blue-100',
            icon: Target
        },
        {
            label: 'Release Readiness',
            value: releaseReadiness,
            color: 'text-green-600',
            bgColor: 'bg-green-100',
            icon: Award
        },
        {
            label: 'Quality Trend',
            value: qualityTrendScore,
            color: qualityTrendScore >= 70 ? 'text-green-600' : 'text-orange-600',
            bgColor: qualityTrendScore >= 70 ? 'bg-green-100' : 'bg-orange-100',
            icon: TrendingUp
        }
    ];

    const MetricCard = ({ icon: Icon, label, value, unit = '', color = 'text-gray-600' }) => (
        <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <Icon className={`w-4 h-4 ${color}`} />
                    <span className="text-sm font-medium text-gray-700">{label}</span>
                </div>
                <span className={`text-lg font-bold ${color}`}>
                    {typeof value === 'number' ? value.toFixed(1) : value}{unit}
                </span>
            </div>
        </div>
    );

    const ProgressBar = ({ label, value, color, bgColor, icon: Icon }) => (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <Icon className={`w-4 h-4 ${color}`} />
                    <span className="text-sm font-medium text-gray-700">{label}</span>
                </div>
                <span className={`text-sm font-bold ${color}`}>{value}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                    className={`h-2 rounded-full ${bgColor.replace('bg-', 'bg-').replace('-100', '-500')}`}
                    style={{ width: `${Math.min(value, 100)}%` }}
                ></div>
            </div>
        </div>
    );

    const PerformanceBar = ({ name, value, target, color }) => {
        const percentage = (value / target) * 100;
        const isOnTarget = percentage >= 80;

        return (
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">{name}</span>
                    <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500">{value}/{target}</span>
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${isOnTarget ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                            }`}>
                            {percentage.toFixed(0)}%
                        </span>
                    </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                        className={`h-2 rounded-full ${color}`}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                    ></div>
                </div>
            </div>
        );
    };

    return (
        <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <Users className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">Team Productivity</h3>
                            <p className="text-sm text-gray-600">{activeTeamMembers} active members</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-sm text-gray-500">Features Under Test</div>
                        <div className="text-2xl font-bold text-gray-900">{featuresUnderTest}</div>
                    </div>
                </div>
            </div>

            <div className="p-6 space-y-6">
                {/* Team Performance Metrics */}
                <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-4">Individual Performance (Per Member)</h4>
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

                {/* Progress Indicators */}
                <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-4">Project Progress</h4>
                    <div className="space-y-4">
                        {progressMetrics.map((metric) => (
                            <ProgressBar
                                key={metric.label}
                                label={metric.label}
                                value={metric.value}
                                color={metric.color}
                                bgColor={metric.bgColor}
                                icon={metric.icon}
                            />
                        ))}
                    </div>
                </div>

                {/* Collaboration Metrics */}
                <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-4">Team Collaboration</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <MetricCard
                            icon={Users}
                            label="Cross-Team Score"
                            value={crossTeamCollaboration}
                            unit="%"
                            color={crossTeamCollaboration >= 70 ? 'text-green-600' : 'text-orange-600'}
                        />
                        <MetricCard
                            icon={Clock}
                            label="Review Cycle"
                            value={testCaseReviewCycle}
                            unit="h"
                            color="text-blue-600"
                        />
                        <MetricCard
                            icon={Activity}
                            label="Knowledge Sharing"
                            value={knowledgeSharing}
                            unit="%"
                            color={knowledgeSharing >= 70 ? 'text-green-600' : 'text-orange-600'}
                        />
                        <MetricCard
                            icon={TrendingUp}
                            label="Coverage Growth"
                            value={testCoverageGrowth}
                            unit="%"
                            color={testCoverageGrowth >= 0 ? 'text-green-600' : 'text-red-600'}
                        />
                    </div>
                </div>

                {/* Team Insights */}
                <div className="bg-blue-50 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-blue-900 mb-2">Team Insights</h4>
                    <div className="space-y-2 text-sm text-blue-800">
                        {sprintTestingProgress >= 80 && (
                            <div className="flex items-center space-x-2">
                                <Award className="w-4 h-4 text-green-600" />
                                <span>Sprint testing is on track - great progress!</span>
                            </div>
                        )}
                        {crossTeamCollaboration < 60 && (
                            <div className="flex items-center space-x-2">
                                <Users className="w-4 h-4 text-orange-600" />
                                <span>Consider improving cross-team collaboration</span>
                            </div>
                        )}
                        {testCaseReviewCycle > 48 && (
                            <div className="flex items-center space-x-2">
                                <Clock className="w-4 h-4 text-red-600" />
                                <span>Review cycle time could be optimized</span>
                            </div>
                        )}
                        {qualityTrendScore >= 80 && (
                            <div className="flex items-center space-x-2">
                                <TrendingUp className="w-4 h-4 text-green-600" />
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