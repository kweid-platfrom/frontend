/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, TrendingUp, Clock, DollarSign, Target, Zap, AlertTriangle, CheckCircle, Download, RefreshCw } from 'lucide-react';
import aiIntegrationService from '../../services/AIIntegrationService';

const AIGenerationMetrics = () => {
    const [metrics, setMetrics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [dateRange, setDateRange] = useState(30);
    const [serviceStatus, setServiceStatus] = useState(null);
    const [refreshing, setRefreshing] = useState(false);
    const [exporting, setExporting] = useState(false);

    useEffect(() => {
        initializeAndLoadMetrics();
    }, [dateRange]);

    const initializeAndLoadMetrics = async () => {
        setLoading(true);
        setError(null);

        try {
            const status = aiIntegrationService.getServiceStatus();
            setServiceStatus(status);

            if (!status.initialized || !status.available) {
                const initResult = await aiIntegrationService.initialize();
                if (!initResult.success) {
                    throw new Error(initResult.userMessage || initResult.error || 'Failed to initialize AI services');
                }
                const updatedStatus = aiIntegrationService.getServiceStatus();
                setServiceStatus(updatedStatus);
            }

            const analyticsResult = await aiIntegrationService.getAIAnalytics(dateRange);
            if (analyticsResult.success) {
                setMetrics(analyticsResult.data);
            } else {
                throw new Error(analyticsResult.error || 'Failed to load analytics');
            }
        } catch (err) {
            setError(err.message);
            setMetrics(getDefaultMetrics());
        } finally {
            setLoading(false);
        }
    };

    const refreshMetrics = async () => {
        setRefreshing(true);
        try {
            const result = await aiIntegrationService.getAIAnalytics(dateRange, true);
            if (result.success) {
                setMetrics(result.data);
                setError(null);
            } else {
                setError(result.error || 'Failed to refresh metrics');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setRefreshing(false);
        }
    };

    const exportReport = async (format) => {
        setExporting(true);
        try {
            const result = await aiIntegrationService.exportAIReport(format, dateRange);
            if (result.success) {
                const blob = new Blob([result.data], { type: result.contentType });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = result.filename;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            } else {
                setError(result.error || 'Export failed');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setExporting(false);
        }
    };

    const getDefaultMetrics = () => ({
        totalTestCasesGenerated: 0,
        totalBugReportsGenerated: 0,
        totalAIGenerations: 0,
        overallSuccessRate: 0,
        totalTimeSavedHours: 0,
        totalCost: 0,
        costEfficiency: 0,
        estimatedROI: 0,
        automationCandidates: 0,
        criticalBugsIdentified: 0,
        averageTestCasesPerGeneration: 0,
        efficiencyScore: 0,
        qualityScore: 0,
        productivityIncrease: 0,
        providerUsage: {},
        currentSession: {
            testCasesGenerated: 0,
            bugReportsGenerated: 0,
            aiCallsToday: 0,
            successfulCalls: 0,
            failedCalls: 0,
            totalCostToday: 0,
            timeSaved: 0
        }
    });

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 4
        }).format(amount);
    };

    const formatNumber = (num) => {
        return new Intl.NumberFormat().format(num);
    };

    const getHealthColor = (rate) => {
        if (rate >= 90) return 'text-[rgb(var(--color-success))]';
        if (rate >= 70) return 'text-[rgb(var(--color-warning))]';
        return 'text-[rgb(var(--color-error))]';
    };

    const getProviderStats = () => {
        if (!metrics?.providerUsage) return [];
        return Object.entries(metrics.providerUsage).map(([provider, stats]) => ({
            provider,
            calls: stats.calls || 0,
            cost: stats.cost || 0,
            successRate: stats.successRate || 0
        }));
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="animate-spin mr-2 text-primary" />
                <span className="text-foreground">Loading AI metrics...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-foreground">AI Generation Metrics</h2>
                    <p className="text-muted-foreground">Last {dateRange} days</p>
                </div>
                <div className="flex items-center gap-2">
                    <select
                        value={dateRange}
                        onChange={(e) => setDateRange(Number(e.target.value))}
                        className="px-3 py-2 border border-border rounded bg-card text-foreground"
                    >
                        <option value={7}>Last 7 days</option>
                        <option value={30}>Last 30 days</option>
                        <option value={90}>Last 90 days</option>
                    </select>
                    <button
                        onClick={refreshMetrics}
                        disabled={refreshing}
                        className="px-3 py-2 bg-[rgb(var(--color-info))] text-white rounded hover:bg-[rgb(var(--color-info)/0.8)] disabled:opacity-50"
                    >
                        {refreshing ? <Loader2 className="animate-spin w-4 h-4" /> : <RefreshCw className="w-4 h-4" />}
                    </button>
                    <button
                        onClick={() => exportReport('json')}
                        disabled={exporting}
                        className="px-3 py-2 bg-[rgb(var(--color-success))] text-white rounded hover:bg-[rgb(var(--color-success)/0.8)] disabled:opacity-50"
                    >
                        {exporting ? <Loader2 className="animate-spin w-4 h-4" /> : <Download className="w-4 h-4" />}
                    </button>
                </div>
            </div>

            {error && (
                <Alert className="border-[rgb(var(--color-error)/0.2)] bg-[rgb(var(--color-error)/0.1)]">
                    <AlertTriangle className="h-4 w-4 text-[rgb(var(--color-error))]" />
                    <AlertDescription className="text-[rgb(var(--color-error))]">
                        {error}
                    </AlertDescription>
                </Alert>
            )}

            {serviceStatus && (
                <Card className="border-[rgb(var(--color-info)/0.2)] bg-[rgb(var(--color-info)/0.1)]">
                    <CardContent className="pt-4">
                        <div className="flex items-center gap-2 mb-2">
                            {serviceStatus.available ? 
                                <CheckCircle className="w-5 h-5 text-[rgb(var(--color-success))]" /> : 
                                <AlertTriangle className="w-5 h-5 text-[rgb(var(--color-error))]" />
                            }
                            <span className="font-medium text-foreground">
                                AI Service Status: {serviceStatus.available ? 'Available' : 'Unavailable'}
                            </span>
                        </div>
                        {serviceStatus.provider && (
                            <p className="text-sm text-muted-foreground">
                                Provider: {serviceStatus.provider} | Model: {serviceStatus.model}
                            </p>
                        )}
                    </CardContent>
                </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-card border-border">
                    <CardContent className="pt-6">
                        <div className="flex items-center">
                            <div className="flex-1">
                                <p className="text-sm font-medium text-muted-foreground">Total Generations</p>
                                <p className="text-2xl font-bold text-foreground">{formatNumber(metrics?.totalAIGenerations || 0)}</p>
                                <p className="text-xs text-muted-foreground">
                                    {formatNumber(metrics?.totalTestCasesGenerated || 0)} test cases + {formatNumber(metrics?.totalBugReportsGenerated || 0)} bug reports
                                </p>
                            </div>
                            <Target className="h-8 w-8 text-[rgb(var(--color-info))]" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-card border-border">
                    <CardContent className="pt-6">
                        <div className="flex items-center">
                            <div className="flex-1">
                                <p className="text-sm font-medium text-muted-foreground">Success Rate</p>
                                <p className={`text-2xl font-bold ${getHealthColor(metrics?.overallSuccessRate || 0)}`}>
                                    {(metrics?.overallSuccessRate || 0).toFixed(1)}%
                                </p>
                                <p className="text-xs text-muted-foreground">Overall AI success rate</p>
                            </div>
                            <CheckCircle className="h-8 w-8 text-[rgb(var(--color-success))]" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-card border-border">
                    <CardContent className="pt-6">
                        <div className="flex items-center">
                            <div className="flex-1">
                                <p className="text-sm font-medium text-muted-foreground">Time Saved</p>
                                <p className="text-2xl font-bold text-[rgb(var(--color-success))]">
                                    {(metrics?.totalTimeSavedHours || 0).toFixed(1)}h
                                </p>
                                <p className="text-xs text-muted-foreground">Estimated manual work saved</p>
                            </div>
                            <Clock className="h-8 w-8 text-[rgb(var(--color-success))]" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-card border-border">
                    <CardContent className="pt-6">
                        <div className="flex items-center">
                            <div className="flex-1">
                                <p className="text-sm font-medium text-muted-foreground">Total Cost</p>
                                <p className="text-2xl font-bold text-[rgb(var(--color-warning))]">
                                    {formatCurrency(metrics?.totalCost || 0)}
                                </p>
                                <p className="text-xs text-muted-foreground">AI service costs</p>
                            </div>
                            <DollarSign className="h-8 w-8 text-[rgb(var(--color-warning))]" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-card border-border">
                    <CardHeader>
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                            <Zap className="w-5 h-5 text-[rgb(var(--color-info))]" />
                            Efficiency Score
                        </h3>
                    </CardHeader>
                    <CardContent>
                        <div className="text-center">
                            <div className="text-3xl font-bold text-[rgb(var(--color-info))] mb-2">
                                {metrics?.efficiencyScore || 0}/100
                            </div>
                            <div className="w-full bg-muted rounded-full h-2">
                                <div 
                                    className="bg-[rgb(var(--color-info))] h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${metrics?.efficiencyScore || 0}%` }}
                                ></div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-card border-border">
                    <CardHeader>
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                            <Target className="w-5 h-5 text-[rgb(var(--color-success))]" />
                            Quality Score
                        </h3>
                    </CardHeader>
                    <CardContent>
                        <div className="text-center">
                            <div className="text-3xl font-bold text-[rgb(var(--color-success))] mb-2">
                                {metrics?.qualityScore || 0}/100
                            </div>
                            <div className="w-full bg-muted rounded-full h-2">
                                <div 
                                    className="bg-[rgb(var(--color-success))] h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${metrics?.qualityScore || 0}%` }}
                                ></div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-card border-border">
                    <CardHeader>
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-[rgb(var(--color-info))]" />
                            ROI
                        </h3>
                    </CardHeader>
                    <CardContent>
                        <div className="text-center">
                            <div className="text-3xl font-bold text-[rgb(var(--color-info))] mb-2">
                                {(metrics?.estimatedROI || 0).toFixed(0)}%
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Return on Investment
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="bg-card border-border">
                <CardHeader>
                    <h3 className="text-lg font-semibold text-foreground">Current Session</h3>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                        <div className="text-center">
                            <p className="text-2xl font-bold text-[rgb(var(--color-info))]">
                                {metrics?.currentSession?.testCasesGenerated || 0}
                            </p>
                            <p className="text-sm text-muted-foreground">Test Cases</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold text-[rgb(var(--color-warning))]">
                                {metrics?.currentSession?.bugReportsGenerated || 0}
                            </p>
                            <p className="text-sm text-muted-foreground">Bug Reports</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold text-[rgb(var(--color-success))]">
                                {metrics?.currentSession?.aiCallsToday || 0}
                            </p>
                            <p className="text-sm text-muted-foreground">AI Calls</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold text-[rgb(var(--color-success))]">
                                {metrics?.currentSession?.successfulCalls || 0}
                            </p>
                            <p className="text-sm text-muted-foreground">Successful</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold text-[rgb(var(--color-error))]">
                                {metrics?.currentSession?.failedCalls || 0}
                            </p>
                            <p className="text-sm text-muted-foreground">Failed</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold text-[rgb(var(--color-info))]">
                                {formatCurrency(metrics?.currentSession?.totalCostToday || 0)}
                            </p>
                            <p className="text-sm text-muted-foreground">Cost Today</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold text-[rgb(var(--color-info))]">
                                {(metrics?.currentSession?.timeSaved || 0).toFixed(0)}m
                            </p>
                            <p className="text-sm text-muted-foreground">Time Saved</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {getProviderStats().length > 0 && (
                <Card className="bg-card border-border">
                    <CardHeader>
                        <h3 className="text-lg font-semibold text-foreground">Provider Usage</h3>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {getProviderStats().map((provider) => (
                                <div key={provider.provider} className="flex items-center justify-between p-3 bg-muted rounded">
                                    <div>
                                        <h4 className="font-medium capitalize text-foreground">{provider.provider}</h4>
                                        <p className="text-sm text-muted-foreground">
                                            {formatNumber(provider.calls)} calls | Success rate: {provider.successRate.toFixed(1)}%
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-medium text-foreground">{formatCurrency(provider.cost)}</p>
                                        <p className="text-sm text-muted-foreground">Total cost</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="bg-card border-border">
                    <CardHeader>
                        <h3 className="text-lg font-semibold text-foreground">Test Case Quality</h3>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Average per generation:</span>
                                <span className="font-medium text-foreground">{(metrics?.averageTestCasesPerGeneration || 0).toFixed(1)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Automation candidates:</span>
                                <span className="font-medium text-[rgb(var(--color-success))]">{formatNumber(metrics?.automationCandidates || 0)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Critical bugs identified:</span>
                                <span className="font-medium text-[rgb(var(--color-error))]">{formatNumber(metrics?.criticalBugsIdentified || 0)}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-card border-border">
                    <CardHeader>
                        <h3 className="text-lg font-semibold text-foreground">Productivity Impact</h3>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Productivity increase:</span>
                                <span className="font-medium text-[rgb(var(--color-info))]">{(metrics?.productivityIncrease || 0).toFixed(1)}%</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Cost efficiency:</span>
                                <span className="font-medium text-foreground">{(metrics?.costEfficiency || 0).toFixed(2)}x</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Time saved per generation:</span>
                                <span className="font-medium text-[rgb(var(--color-success))]">
                                    {metrics?.totalAIGenerations > 0 ? 
                                        ((metrics?.totalTimeSavedHours || 0) / metrics.totalAIGenerations * 60).toFixed(0) : 0}min
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="text-center text-sm text-muted-foreground">
                Last updated: {metrics?.lastUpdated ? new Date(metrics.lastUpdated).toLocaleString() : 'Never'}
            </div>
        </div>
    );
};

export default AIGenerationMetrics;