import React, { useState, useEffect, useCallback } from 'react';
import { Users, TrendingUp, Award, Clock, Target, Activity, Bot, Sparkles, AlertTriangle, CheckCircle } from 'lucide-react';

const TeamProductivity = ({ metrics, aiService }) => {
    const [aiInsights, setAiInsights] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [showAiInsights, setShowAiInsights] = useState(false);
    
    const safeMetrics = metrics || {};
    
    // Calculate derived metrics from available data
    const activeTeamMembers = safeMetrics.activeContributors || 0;
    const totalTestCases = safeMetrics.totalTestCases || 0;
    const totalBugs = safeMetrics.totalBugs || 0;
    const totalRecordings = safeMetrics.recordings || 0;
    
    // Per-member productivity
    const testCasesPerMember = activeTeamMembers > 0 
        ? Math.round(totalTestCases / activeTeamMembers) 
        : totalTestCases;
    
    const bugsPerMember = activeTeamMembers > 0 
        ? Math.round(totalBugs / activeTeamMembers) 
        : totalBugs;
    
    const recordingsPerMember = activeTeamMembers > 0 
        ? Math.round(totalRecordings / activeTeamMembers) 
        : totalRecordings;
    
    // Sprint and progress metrics
    const activeSprints = safeMetrics.activeSprints || 0;
    const completedSprints = safeMetrics.completedSprints || 0;
    const sprintVelocity = safeMetrics.sprintVelocity || 0;
    
    // Calculate sprint progress
    const sprintTestingProgress = activeSprints > 0 && sprintVelocity > 0
        ? Math.min(100, Math.round((sprintVelocity / (totalTestCases || 1)) * 100))
        : 0;
    
    // Release readiness
    const passRate = safeMetrics.passRate || 0;
    const automationRate = safeMetrics.automationRate || 0;
    const criticalBugs = safeMetrics.criticalBugs || 0;
    
    const releaseReadiness = Math.min(100, Math.round(
        (passRate * 0.5) + 
        (automationRate * 0.3) + 
        (criticalBugs === 0 ? 20 : Math.max(0, 20 - (criticalBugs * 4)))
    ));
    
    // Quality trend
    const recentlyUpdatedTestCases = safeMetrics.recentlyUpdatedTestCases || 0;
    const testsCreatedThisWeek = safeMetrics.testsCreatedThisWeek || 0;
    const bugsResolvedThisWeek = safeMetrics.recentlyResolvedBugs || 0;
    
    const qualityTrendScore = Math.min(100, Math.round(
        (passRate * 0.4) + 
        (testsCreatedThisWeek > 0 ? 20 : 0) + 
        (bugsResolvedThisWeek > 0 ? 20 : 0) + 
        (recentlyUpdatedTestCases > 0 ? 20 : 0)
    ));
    
    // Features under test
    const testCasesWithTags = safeMetrics.testCasesWithTags || 0;
    const featuresUnderTest = Math.max(
        activeSprints,
        Math.round(testCasesWithTags / 10)
    );
    
    // Team collaboration metrics
    const crossTeamCollaboration = Math.min(100, Math.round(
        (testCasesWithTags / (totalTestCases || 1)) * 50 +
        (safeMetrics.testCasesLinkedToBugs / (totalTestCases || 1)) * 30 +
        (activeTeamMembers > 1 ? 20 : 0)
    ));
    
    const testCaseReviewCycle = safeMetrics.avgResolutionTime || 24;
    
    const knowledgeSharing = Math.min(100, Math.round(
        (safeMetrics.testCasesWithRecordings / (totalTestCases || 1)) * 40 +
        (safeMetrics.bugsWithVideoEvidence / (totalBugs || 1)) * 40 +
        (safeMetrics.totalDocuments > 0 ? 20 : 0)
    ));
    
    const testCoverageGrowth = testsCreatedThisWeek > 0 ? 
        Math.round((testsCreatedThisWeek / (totalTestCases || 1)) * 100) : 0;

    // AI-powered team analysis
    const analyzeTeamProductivity = useCallback(async () => {
        if (!aiService) return;
        
        setIsAnalyzing(true);
        try {
            const teamData = {
                teamSize: activeTeamMembers,
                productivity: {
                    testCasesPerMember,
                    bugsPerMember,
                    recordingsPerMember,
                    testsCreatedThisWeek,
                    bugsResolvedThisWeek
                },
                quality: {
                    passRate,
                    automationRate,
                    qualityTrendScore,
                    criticalBugs,
                    avgResolutionTime: safeMetrics.avgResolutionTime
                },
                progress: {
                    sprintTestingProgress,
                    releaseReadiness,
                    activeSprints,
                    completedSprints,
                    sprintVelocity
                },
                collaboration: {
                    crossTeamCollaboration,
                    knowledgeSharing,
                    testCaseReviewCycle
                },
                trends: {
                    testCoverageGrowth,
                    recentlyUpdatedTestCases,
                    outdatedTestCases: safeMetrics.outdatedTestCases
                }
            };
            
            const result = await aiService.generateTeamImprovements(teamData);
            
            if (result.success) {
                setAiInsights(result.data);
            }
        } catch (error) {
            console.error('Failed to analyze team productivity:', error);
        } finally {
            setIsAnalyzing(false);
        }
    }, [aiService, activeTeamMembers, testCasesPerMember, bugsPerMember, recordingsPerMember,
        passRate, automationRate, qualityTrendScore, sprintTestingProgress, releaseReadiness,
        crossTeamCollaboration, knowledgeSharing, testCoverageGrowth, safeMetrics]);

    const getColorClasses = (color) => {
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
        { name: 'Test Cases', value: testCasesPerMember, target: 25, color: 'info' },
        { name: 'Bugs Found', value: bugsPerMember, target: 8, color: 'error' },
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

    const AIInsightCard = ({ insight }) => {
        const getInsightIcon = (type) => {
            switch (type) {
                case 'strength': return CheckCircle;
                case 'warning': return AlertTriangle;
                case 'opportunity': return Sparkles;
                default: return Activity;
            }
        };

        const getInsightColor = (type) => {
            switch (type) {
                case 'strength': return 'success';
                case 'warning': return 'warning';
                case 'opportunity': return 'info';
                default: return 'muted';
            }
        };

        const Icon = getInsightIcon(insight.type);
        const colors = getColorClasses(getInsightColor(insight.type));

        return (
            <div className={`p-3 rounded-lg ${colors.bg} border border-border`}>
                <div className="flex items-start space-x-3">
                    <Icon className={`w-5 h-5 ${colors.text} flex-shrink-0 mt-0.5`} />
                    <div className="flex-1 min-w-0">
                        <h5 className={`text-sm font-semibold ${colors.text} mb-1`}>
                            {insight.title}
                        </h5>
                        <p className="text-xs text-muted-foreground">
                            {insight.description}
                        </p>
                        {insight.recommendation && (
                            <p className="text-xs text-foreground mt-2 font-medium">
                                💡 {insight.recommendation}
                            </p>
                        )}
                    </div>
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
                    <div className="flex items-center space-x-3">
                        <div className="text-right">
                            <div className="text-sm text-muted-foreground">Features Under Test</div>
                            <div className="text-2xl font-bold text-foreground">{featuresUnderTest}</div>
                        </div>
                        {aiService && (
                            <button
                                onClick={() => {
                                    if (!showAiInsights) {
                                        analyzeTeamProductivity();
                                    }
                                    setShowAiInsights(!showAiInsights);
                                }}
                                disabled={isAnalyzing}
                                className="flex items-center space-x-2 px-4 py-2 bg-[rgb(var(--color-info)/0.1)] text-[rgb(var(--color-info))] rounded-lg hover:bg-[rgb(var(--color-info)/0.2)] transition-colors disabled:opacity-50"
                            >
                                <Bot className="w-4 h-4" />
                                <span className="text-sm font-medium">
                                    {isAnalyzing ? 'Analyzing...' : 'AI Insights'}
                                </span>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="p-6 space-y-6">
                {showAiInsights && aiInsights && (
                    <div className="bg-gradient-to-br from-[rgb(var(--color-info)/0.05)] to-[rgb(var(--color-success)/0.05)] rounded-lg p-4 border border-[rgb(var(--color-info)/0.2)]">
                        <div className="flex items-center space-x-2 mb-4">
                            <Sparkles className="w-5 h-5 text-[rgb(var(--color-info))]" />
                            <h4 className="text-sm font-semibold text-foreground">AI-Powered Team Analysis</h4>
                        </div>
                        <div className="space-y-3">
                            {aiInsights.insights?.map((insight, index) => (
                                <AIInsightCard key={index} insight={insight} />
                            ))}
                        </div>
                        {aiInsights.summary && (
                            <div className="mt-4 p-3 bg-card rounded-lg border border-border">
                                <p className="text-sm text-foreground">{aiInsights.summary}</p>
                            </div>
                        )}
                    </div>
                )}

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