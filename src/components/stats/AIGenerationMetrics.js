/* eslint-disable react-hooks/exhaustive-deps */
// components/AIGenerationMetrics.js - Fixed version compatible with your service architecture
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

    // Initialize and load metrics
    useEffect(() => {
        initializeAndLoadMetrics();
    }, [dateRange]);

    const initializeAndLoadMetrics = async () => {
        setLoading(true);
        setError(null);

        try {
            console.log('🚀 Checking AI service initialization...');
            
            // Get service status first
            const status = aiIntegrationService.getServiceStatus();
            setServiceStatus(status);
            console.log('Service status:', status);

            // Initialize if not already initialized
            if (!status.initialized || !status.available) {
                console.log('Initializing AI services...');
                const initResult = await aiIntegrationService.initialize();
                console.log('Init result:', initResult);
                
                if (!initResult.success) {
                    throw new Error(initResult.userMessage || initResult.error || 'Failed to initialize AI services');
                }
                
                // Update service status after initialization
                const updatedStatus = aiIntegrationService.getServiceStatus();
                setServiceStatus(updatedStatus);
            }

            // Load analytics using the correct method
            console.log('📊 Loading AI analytics...');
            const analyticsResult = await aiIntegrationService.getAIAnalytics(dateRange);
            
            if (analyticsResult.success) {
                setMetrics(analyticsResult.data);
                console.log('✅ Analytics loaded successfully');
            } else {
                throw new Error(analyticsResult.error || 'Failed to load analytics');
            }

        } catch (err) {
            console.error('❌ Failed to load metrics:', err);
            setError(err.message);
            
            // Set default metrics to prevent UI breaking
            setMetrics(getDefaultMetrics());
        } finally {
            setLoading(false);
        }
    };

    const refreshMetrics = async () => {
        setRefreshing(true);
        try {
            const result = await aiIntegrationService.getAIAnalytics(dateRange, true); // Force refresh
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
                // Create and download file
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
        if (rate >= 90) return 'text-green-600';
        if (rate >= 70) return 'text-yellow-600';
        return 'text-red-600';
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
                <Loader2 className="animate-spin mr-2" />
                <span>Loading AI metrics...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">AI Generation Metrics</h2>
                    <p className="text-gray-600">Last {dateRange} days</p>
                </div>
                <div className="flex items-center gap-2">
                    <select
                        value={dateRange}
                        onChange={(e) => setDateRange(Number(e.target.value))}
                        className="px-3 py-2 border rounded"
                    >
                        <option value={7}>Last 7 days</option>
                        <option value={30}>Last 30 days</option>
                        <option value={90}>Last 90 days</option>
                    </select>
                    <button
                        onClick={refreshMetrics}
                        disabled={refreshing}
                        className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                    >
                        {refreshing ? <Loader2 className="animate-spin w-4 h-4" /> : <RefreshCw className="w-4 h-4" />}
                    </button>
                    <button
                        onClick={() => exportReport('json')}
                        disabled={exporting}
                        className="px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
                    >
                        {exporting ? <Loader2 className="animate-spin w-4 h-4" /> : <Download className="w-4 h-4" />}
                    </button>
                </div>
            </div>

            {/* Error Alert */}
            {error && (
                <Alert className="border-red-200 bg-red-50">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800">
                        {error}
                    </AlertDescription>
                </Alert>
            )}

            {/* Service Status */}
            {serviceStatus && (
                <Card className="border-blue-200 bg-blue-50">
                    <CardContent className="pt-4">
                        <div className="flex items-center gap-2 mb-2">
                            {serviceStatus.available ? 
                                <CheckCircle className="w-5 h-5 text-green-600" /> : 
                                <AlertTriangle className="w-5 h-5 text-red-600" />
                            }
                            <span className="font-medium">
                                AI Service Status: {serviceStatus.available ? 'Available' : 'Unavailable'}
                            </span>
                        </div>
                        {serviceStatus.provider && (
                            <p className="text-sm text-gray-600">
                                Provider: {serviceStatus.provider} | Model: {serviceStatus.model}
                            </p>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Generations */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center">
                            <div className="flex-1">
                                <p className="text-sm font-medium text-gray-600">Total Generations</p>
                                <p className="text-2xl font-bold">{formatNumber(metrics?.totalAIGenerations || 0)}</p>
                                <p className="text-xs text-gray-500">
                                    {formatNumber(metrics?.totalTestCasesGenerated || 0)} test cases + {formatNumber(metrics?.totalBugReportsGenerated || 0)} bug reports
                                </p>
                            </div>
                            <Target className="h-8 w-8 text-blue-600" />
                        </div>
                    </CardContent>
                </Card>

                {/* Success Rate */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center">
                            <div className="flex-1">
                                <p className="text-sm font-medium text-gray-600">Success Rate</p>
                                <p className={`text-2xl font-bold ${getHealthColor(metrics?.overallSuccessRate || 0)}`}>
                                    {(metrics?.overallSuccessRate || 0).toFixed(1)}%
                                </p>
                                <p className="text-xs text-gray-500">Overall AI success rate</p>
                            </div>
                            <CheckCircle className="h-8 w-8 text-green-600" />
                        </div>
                    </CardContent>
                </Card>

                {/* Time Saved */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center">
                            <div className="flex-1">
                                <p className="text-sm font-medium text-gray-600">Time Saved</p>
                                <p className="text-2xl font-bold text-green-600">
                                    {(metrics?.totalTimeSavedHours || 0).toFixed(1)}h
                                </p>
                                <p className="text-xs text-gray-500">Estimated manual work saved</p>
                            </div>
                            <Clock className="h-8 w-8 text-green-600" />
                        </div>
                    </CardContent>
                </Card>

                {/* Cost */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center">
                            <div className="flex-1">
                                <p className="text-sm font-medium text-gray-600">Total Cost</p>
                                <p className="text-2xl font-bold text-orange-600">
                                    {formatCurrency(metrics?.totalCost || 0)}
                                </p>
                                <p className="text-xs text-gray-500">AI service costs</p>
                            </div>
                            <DollarSign className="h-8 w-8 text-orange-600" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Performance Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Efficiency Score */}
                <Card>
                    <CardHeader>
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                            <Zap className="w-5 h-5" />
                            Efficiency Score
                        </h3>
                    </CardHeader>
                    <CardContent>
                        <div className="text-center">
                            <div className="text-3xl font-bold text-blue-600 mb-2">
                                {metrics?.efficiencyScore || 0}/100
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${metrics?.efficiencyScore || 0}%` }}
                                ></div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Quality Score */}
                <Card>
                    <CardHeader>
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                            <Target className="w-5 h-5" />
                            Quality Score
                        </h3>
                    </CardHeader>
                    <CardContent>
                        <div className="text-center">
                            <div className="text-3xl font-bold text-green-600 mb-2">
                                {metrics?.qualityScore || 0}/100
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                    className="bg-green-600 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${metrics?.qualityScore || 0}%` }}
                                ></div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* ROI */}
                <Card>
                    <CardHeader>
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                            <TrendingUp className="w-5 h-5" />
                            ROI
                        </h3>
                    </CardHeader>
                    <CardContent>
                        <div className="text-center">
                            <div className="text-3xl font-bold text-purple-600 mb-2">
                                {(metrics?.estimatedROI || 0).toFixed(0)}%
                            </div>
                            <p className="text-sm text-gray-600">
                                Return on Investment
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Session Metrics */}
            <Card>
                <CardHeader>
                    <h3 className="text-lg font-semibold">Current Session</h3>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                        <div className="text-center">
                            <p className="text-2xl font-bold text-blue-600">
                                {metrics?.currentSession?.testCasesGenerated || 0}
                            </p>
                            <p className="text-sm text-gray-600">Test Cases</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold text-orange-600">
                                {metrics?.currentSession?.bugReportsGenerated || 0}
                            </p>
                            <p className="text-sm text-gray-600">Bug Reports</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold text-green-600">
                                {metrics?.currentSession?.aiCallsToday || 0}
                            </p>
                            <p className="text-sm text-gray-600">AI Calls</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold text-emerald-600">
                                {metrics?.currentSession?.successfulCalls || 0}
                            </p>
                            <p className="text-sm text-gray-600">Successful</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold text-red-600">
                                {metrics?.currentSession?.failedCalls || 0}
                            </p>
                            <p className="text-sm text-gray-600">Failed</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold text-purple-600">
                                {formatCurrency(metrics?.currentSession?.totalCostToday || 0)}
                            </p>
                            <p className="text-sm text-gray-600">Cost Today</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold text-indigo-600">
                                {(metrics?.currentSession?.timeSaved || 0).toFixed(0)}m
                            </p>
                            <p className="text-sm text-gray-600">Time Saved</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Provider Usage */}
            {getProviderStats().length > 0 && (
                <Card>
                    <CardHeader>
                        <h3 className="text-lg font-semibold">Provider Usage</h3>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {getProviderStats().map((provider) => (
                                <div key={provider.provider} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                                    <div>
                                        <h4 className="font-medium capitalize">{provider.provider}</h4>
                                        <p className="text-sm text-gray-600">
                                            {formatNumber(provider.calls)} calls | Success rate: {provider.successRate.toFixed(1)}%
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-medium">{formatCurrency(provider.cost)}</p>
                                        <p className="text-sm text-gray-600">Total cost</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Additional Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                    <CardHeader>
                        <h3 className="text-lg font-semibold">Test Case Quality</h3>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <span>Average per generation:</span>
                                <span className="font-medium">{(metrics?.averageTestCasesPerGeneration || 0).toFixed(1)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Automation candidates:</span>
                                <span className="font-medium text-green-600">{formatNumber(metrics?.automationCandidates || 0)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Critical bugs identified:</span>
                                <span className="font-medium text-red-600">{formatNumber(metrics?.criticalBugsIdentified || 0)}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <h3 className="text-lg font-semibold">Productivity Impact</h3>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <span>Productivity increase:</span>
                                <span className="font-medium text-blue-600">{(metrics?.productivityIncrease || 0).toFixed(1)}%</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Cost efficiency:</span>
                                <span className="font-medium">{(metrics?.costEfficiency || 0).toFixed(2)}x</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Time saved per generation:</span>
                                <span className="font-medium text-green-600">
                                    {metrics?.totalAIGenerations > 0 ? 
                                        ((metrics?.totalTimeSavedHours || 0) / metrics.totalAIGenerations * 60).toFixed(0) : 0}min
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Last Updated */}
            <div className="text-center text-sm text-gray-500">
                Last updated: {metrics?.lastUpdated ? new Date(metrics.lastUpdated).toLocaleString() : 'Never'}
            </div>
        </div>
    );
};

export default AIGenerationMetrics;