/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, TrendingUp, Clock, DollarSign, Target, Zap, AlertTriangle, CheckCircle, Download, RefreshCw } from 'lucide-react';
import { useAI } from '@/context/AIContext';
import { useApp } from '@/context/AppProvider';
import { calculateSuiteAIMetrics, exportMetricsAsJSON, exportMetricsAsCSV } from '@/services/aiMetricsService';

const AIGenerationMetrics = () => {
    const { state } = useApp();
    const ai = useAI();
    
    const {
        isInitialized,
        isHealthy,
        error: aiError,
        currentModel,
        operationHistory,
        tokensUsed: sessionTokens,
        totalCost: sessionCost,
        operationsCount: sessionOps
    } = ai;

    const [metrics, setMetrics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [dateRange, setDateRange] = useState(30);
    const [refreshing, setRefreshing] = useState(false);
    const [exporting, setExporting] = useState(false);

    const activeSuiteId = state.suites?.activeSuite?.id;

    useEffect(() => {
        if (activeSuiteId) {
            loadMetrics();
        }
    }, [activeSuiteId, dateRange]);

    const loadMetrics = async () => {
        if (!activeSuiteId) {
            setError('No active suite selected');
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // Check if AI context is available
            if (!isInitialized) {
                setError('AI service is initializing...');
                setMetrics(getDefaultMetrics());
                setLoading(false);
                return;
            }

            // Check for errors in AI context
            if (aiError) {
                throw new Error(aiError);
            }

            // Get metrics from Firestore
            const result = await calculateSuiteAIMetrics(activeSuiteId, dateRange);
            
            if (result.success) {
                // Enhance with real-time session data
                const enhancedMetrics = {
                    ...result.data,
                    currentSession: {
                        operations: sessionOps || 0,
                        tokensUsed: sessionTokens || 0,
                        totalCost: sessionCost || 0,
                        successfulCalls: operationHistory?.filter(op => op.success).length || 0,
                        failedCalls: operationHistory?.filter(op => !op.success).length || 0,
                    },
                    lastUpdated: new Date().toISOString()
                };

                setMetrics(enhancedMetrics);
            } else {
                throw new Error(result.error || 'Failed to load metrics');
            }
        } catch (err) {
            console.error('Error loading metrics:', err);
            setError(err.message || 'Failed to load metrics');
            setMetrics(getDefaultMetrics());
        } finally {
            setLoading(false);
        }
    };

    const refreshMetrics = async () => {
        setRefreshing(true);
        await loadMetrics();
        setRefreshing(false);
    };

    const exportReport = async (format) => {
        setExporting(true);
        setError(null);
        
        try {
            if (!metrics) {
                throw new Error('No metrics to export');
            }

            const exportData = {
                generatedAt: new Date().toISOString(),
                dateRange,
                suiteId: activeSuiteId,
                suiteName: state.suites?.activeSuite?.name,
                metrics,
                model: currentModel,
                operationHistory: operationHistory?.slice(0, 50) || []
            };

            let content, contentType, extension;

            if (format === 'json') {
                content = exportMetricsAsJSON(exportData);
                contentType = 'application/json';
                extension = 'json';
            } else if (format === 'csv') {
                content = exportMetricsAsCSV(metrics);
                contentType = 'text/csv';
                extension = 'csv';
            } else {
                throw new Error('Unsupported format');
            }

            // Create and download blob
            const blob = new Blob([content], { type: contentType });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `ai-metrics-${activeSuiteId}-${Date.now()}.${extension}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Error exporting report:', err);
            setError(err.message);
        } finally {
            setExporting(false);
        }
    };

    const getDefaultMetrics = () => ({
        totalTestCasesGenerated: 0,
        totalBugReportsGenerated: 0,
        totalAIGenerations: 0,
        totalOperations: 0,
        successfulOperations: 0,
        failedOperations: 0,
        overallSuccessRate: 0,
        totalTokensUsed: 0,
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
            operations: 0,
            tokensUsed: 0,
            totalCost: 0,
            successfulCalls: 0,
            failedCalls: 0
        }
    });

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 4
        }).format(amount || 0);
    };

    const formatNumber = (num) => {
        return new Intl.NumberFormat().format(num || 0);
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

    // Service status
    const serviceStatus = {
        available: isInitialized && isHealthy && !aiError,
        initialized: isInitialized,
        model: currentModel || 'Not configured',
        loading: !isInitialized
    };

    // No active suite
    if (!activeSuiteId) {
        return (
            <div className="flex items-center justify-center p-8">
                <Alert className="max-w-md">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                        Please select a test suite to view AI metrics
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    if (loading && !metrics) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="animate-spin mr-2 text-primary" />
                <span className="text-foreground">Loading AI metrics...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-foreground">AI Generation Metrics</h2>
                    <p className="text-muted-foreground">
                        {state.suites?.activeSuite?.name} • Last {dateRange} days
                    </p>
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
                        title="Refresh metrics"
                    >
                        {refreshing ? <Loader2 className="animate-spin w-4 h-4" /> : <RefreshCw className="w-4 h-4" />}
                    </button>
                    <button
                        onClick={() => exportReport('json')}
                        disabled={exporting}
                        className="px-3 py-2 bg-[rgb(var(--color-success))] text-white rounded hover:bg-[rgb(var(--color-success)/0.8)] disabled:opacity-50"
                        title="Export report"
                    >
                        {exporting ? <Loader2 className="animate-spin w-4 h-4" /> : <Download className="w-4 h-4" />}
                    </button>
                </div>
            </div>

            {/* Error Alert */}
            {(error || aiError) && (
                <Alert className="border-[rgb(var(--color-error)/0.2)] bg-[rgb(var(--color-error)/0.1)]">
                    <AlertTriangle className="h-4 w-4 text-[rgb(var(--color-error))]" />
                    <AlertDescription className="text-[rgb(var(--color-error))]">
                        {error || aiError}
                    </AlertDescription>
                </Alert>
            )}

            {/* Service Status */}
            <Card className={`border-[rgb(var(--color-${serviceStatus.available ? 'success' : 'error'})/0.2)] bg-[rgb(var(--color-${serviceStatus.available ? 'success' : 'error'})/0.1)]`}>
                <CardContent className="pt-4">
                    <div className="flex items-center gap-2 mb-2">
                        {serviceStatus.loading ? (
                            <Loader2 className="w-5 h-5 animate-spin text-[rgb(var(--color-info))]" />
                        ) : serviceStatus.available ? (
                            <CheckCircle className="w-5 h-5 text-[rgb(var(--color-success))]" />
                        ) : (
                            <AlertTriangle className="w-5 h-5 text-[rgb(var(--color-error))]" />
                        )}
                        <span className="font-medium text-foreground">
                            AI Service Status: {serviceStatus.loading ? 'Initializing...' : serviceStatus.available ? 'Available' : 'Unavailable'}
                        </span>
                    </div>
                    {serviceStatus.model && serviceStatus.model !== 'Not configured' && (
                        <p className="text-sm text-muted-foreground">
                            Model: {serviceStatus.model}
                        </p>
                    )}
                    {!serviceStatus.available && !serviceStatus.loading && (
                        <p className="text-sm text-[rgb(var(--color-error))] mt-2">
                            {aiError || 'Please configure your AI API key in settings to enable AI features.'}
                        </p>
                    )}
                </CardContent>
            </Card>

            {/* Current Session Stats */}
            <Card className="bg-card border-border">
                <CardHeader>
                    <h3 className="text-lg font-semibold text-foreground">Current Session (Real-time)</h3>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                            <p className="text-2xl font-bold text-[rgb(var(--color-info))]">
                                {metrics?.currentSession?.operations || 0}
                            </p>
                            <p className="text-sm text-muted-foreground">Operations</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold text-[rgb(var(--color-success))]">
                                {formatNumber(metrics?.currentSession?.tokensUsed || 0)}
                            </p>
                            <p className="text-sm text-muted-foreground">Tokens</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold text-[rgb(var(--color-warning))]">
                                {formatCurrency(metrics?.currentSession?.totalCost || 0)}
                            </p>
                            <p className="text-sm text-muted-foreground">Cost</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold text-foreground">
                                {metrics?.currentSession?.successfulCalls || 0}/{metrics?.currentSession?.operations || 0}
                            </p>
                            <p className="text-sm text-muted-foreground">Success</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Main Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-card border-border">
                    <CardContent className="pt-6">
                        <div className="flex items-center">
                            <div className="flex-1">
                                <p className="text-sm font-medium text-muted-foreground">Total Generated</p>
                                <p className="text-2xl font-bold text-foreground">{formatNumber(metrics?.totalAIGenerations || 0)}</p>
                                <p className="text-xs text-muted-foreground">
                                    {formatNumber(metrics?.totalTestCasesGenerated || 0)} tests + {formatNumber(metrics?.totalBugReportsGenerated || 0)} bugs
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
                                <p className="text-xs text-muted-foreground">Overall success</p>
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
                                <p className="text-xs text-muted-foreground">Estimated</p>
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
                                <p className="text-xs text-muted-foreground">AI costs</p>
                            </div>
                            <DollarSign className="h-8 w-8 text-[rgb(var(--color-warning))]" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Performance Scores */}
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

            {/* Recent Operations */}
            {operationHistory && operationHistory.length > 0 && (
                <Card className="bg-card border-border">
                    <CardHeader>
                        <h3 className="text-lg font-semibold text-foreground">Recent Operations</h3>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                            {operationHistory.slice(0, 10).map((op, index) => (
                                <div key={op.id || index} className="flex items-center justify-between p-2 bg-muted rounded text-sm">
                                    <div className="flex-1">
                                        <span className="font-medium text-foreground">{op.name || op.type || 'AI Operation'}</span>
                                        <span className={`ml-2 px-2 py-0.5 rounded text-xs ${op.success ? 'bg-[rgb(var(--color-success)/0.2)] text-[rgb(var(--color-success))]' : 'bg-[rgb(var(--color-error)/0.2)] text-[rgb(var(--color-error))]'}`}>
                                            {op.success ? 'Success' : 'Failed'}
                                        </span>
                                    </div>
                                    <div className="text-right text-muted-foreground text-xs">
                                        <div>{new Date(op.timestamp).toLocaleTimeString()}</div>
                                        <div>{formatNumber(op.tokensUsed || 0)} tokens</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Provider Usage */}
            {getProviderStats().length > 0 && (
                <Card className="bg-card border-border">
                    <CardHeader>
                        <h3 className="text-lg font-semibold text-foreground">Provider Usage</h3>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {getProviderStats().map((providerStat) => (
                                <div key={providerStat.provider} className="flex items-center justify-between p-3 bg-muted rounded">
                                    <div>
                                        <h4 className="font-medium capitalize text-foreground">{providerStat.provider}</h4>
                                        <p className="text-sm text-muted-foreground">
                                            {formatNumber(providerStat.calls)} calls | Success: {providerStat.successRate.toFixed(1)}%
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-medium text-foreground">{formatCurrency(providerStat.cost)}</p>
                                        <p className="text-sm text-muted-foreground">Total cost</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Quality and Impact */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="bg-card border-border">
                    <CardHeader>
                        <h3 className="text-lg font-semibold text-foreground">Test Case Quality</h3>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Avg per generation:</span>
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
                                <span className="text-muted-foreground">Time per generation:</span>
                                <span className="font-medium text-[rgb(var(--color-success))]">
                                    {metrics?.totalAIGenerations > 0 ? 
                                        ((metrics?.totalTimeSavedHours || 0) / metrics.totalAIGenerations * 60).toFixed(0) : 0}min
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Footer */}
            <div className="text-center text-sm text-muted-foreground">
                Last updated: {metrics?.lastUpdated ? new Date(metrics.lastUpdated).toLocaleString() : new Date().toLocaleString()}
            </div>
        </div>
    );
};

export default AIGenerationMetrics;