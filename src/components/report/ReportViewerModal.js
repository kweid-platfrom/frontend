// components/report/ReportViewerModal.jsx - ENHANCED for Priority Reports
'use client';

import React, { useState } from 'react';
import { X, Download, FileText, User, Calendar, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';

const ReportViewerModal = ({ open, onOpenChange, report, onUpdateStatus, hasPermission }) => {
    const [activeTab, setActiveTab] = useState('summary');
    const [statusDropdown, setStatusDropdown] = useState(false);

    if (!open || !report) return null;

    const formatDate = (timestamp) => {
        if (!timestamp) return 'N/A';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    };

    const downloadReport = () => {
        const dataStr = JSON.stringify(report.data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${report.name.replace(/\s+/g, '_')}_${Date.now()}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const getStatusIcon = (status) => {
        const icons = {
            'PASS': <CheckCircle className="w-4 h-4 text-green-600" />,
            'FAIL': <XCircle className="w-4 h-4 text-red-600" />,
            'passed': <CheckCircle className="w-4 h-4 text-green-600" />,
            'pass': <CheckCircle className="w-4 h-4 text-green-600" />,
            'failed': <XCircle className="w-4 h-4 text-red-600" />,
            'fail': <XCircle className="w-4 h-4 text-red-600" />,
            'Failed': <XCircle className="w-4 h-4 text-red-600" />,
            'Passed': <CheckCircle className="w-4 h-4 text-green-600" />,
            'blocked': <AlertCircle className="w-4 h-4 text-orange-600" />,
            'skipped': <Clock className="w-4 h-4 text-gray-600" />,
            'Uncovered': <AlertCircle className="w-4 h-4 text-orange-600" />,
            'Not Tested': <Clock className="w-4 h-4 text-gray-600" />,
        };
        return icons[status] || <Clock className="w-4 h-4 text-gray-400" />;
    };

    const isPriorityReport = ['Test Summary Report', 'Defect Report', 'Release Readiness Report', 'Requirement Coverage Report'].includes(report.type);

    // === RELEASE READINESS SPECIFIC RENDERING ===
    const renderReleaseReadinessSummary = () => {
        const summary = report.data?.summary || {};
        const recommendation = summary.recommendation || 'N/A';
        const isGo = recommendation === 'GO';
        
        return (
            <div className="space-y-6">
                {/* GO/NO-GO Banner */}
                <div className={`p-6 rounded-lg border-2 ${
                    isGo 
                        ? 'bg-green-50 border-green-500' 
                        : 'bg-red-50 border-red-500'
                }`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-2xl font-bold mb-1">
                                {isGo ? (
                                    <span className="text-green-700 flex items-center gap-2">
                                        <CheckCircle className="w-8 h-8" />
                                        GO FOR RELEASE
                                    </span>
                                ) : (
                                    <span className="text-red-700 flex items-center gap-2">
                                        <XCircle className="w-8 h-8" />
                                        NO-GO FOR RELEASE
                                    </span>
                                )}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                Release: {summary.releaseId} | Risk Level: <strong>{summary.riskLevel}</strong>
                            </p>
                        </div>
                        <div className="text-right">
                            <div className="text-4xl font-bold">{summary.riskScore}</div>
                            <div className="text-xs text-muted-foreground">Risk Score</div>
                        </div>
                    </div>
                </div>

                {/* Quality Gate Criteria */}
                <div className="grid grid-cols-3 gap-4">
                    <div className={`p-5 rounded-lg border ${
                        summary.passRateStatus === 'PASS' 
                            ? 'bg-green-50 border-green-200' 
                            : 'bg-red-50 border-red-200'
                    }`}>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">Pass Rate</span>
                            {getStatusIcon(summary.passRateStatus)}
                        </div>
                        <div className="text-3xl font-bold">{summary.passRate}</div>
                        <div className="text-xs text-muted-foreground mt-1">Threshold: ≥95%</div>
                    </div>

                    <div className={`p-5 rounded-lg border ${
                        summary.criticalDefectStatus === 'PASS' 
                            ? 'bg-green-50 border-green-200' 
                            : 'bg-red-50 border-red-200'
                    }`}>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">Critical Defects</span>
                            {getStatusIcon(summary.criticalDefectStatus)}
                        </div>
                        <div className="text-3xl font-bold">{summary.criticalDefects}</div>
                        <div className="text-xs text-muted-foreground mt-1">Threshold: ≤0</div>
                    </div>

                    <div className={`p-5 rounded-lg border ${
                        summary.coverageStatus === 'PASS' 
                            ? 'bg-green-50 border-green-200' 
                            : 'bg-red-50 border-red-200'
                    }`}>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">Coverage</span>
                            {getStatusIcon(summary.coverageStatus)}
                        </div>
                        <div className="text-3xl font-bold">{summary.requirementCoverage}</div>
                        <div className="text-xs text-muted-foreground mt-1">Threshold: ≥80%</div>
                    </div>
                </div>

                {/* Blockers */}
                {report.data.blockers && report.data.blockers.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-5">
                        <h4 className="font-semibold text-red-900 mb-3 flex items-center gap-2">
                            <AlertCircle className="w-5 h-5" />
                            Release Blockers ({report.data.blockers.length})
                        </h4>
                        <ul className="space-y-2">
                            {report.data.blockers.map((blocker, idx) => (
                                <li key={idx} className="flex items-start gap-2 text-sm text-red-800">
                                    <span className="text-red-600 mt-0.5">•</span>
                                    {blocker}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Additional Metrics */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-card border border-border rounded-lg p-4">
                        <div className="text-xs text-muted-foreground mb-1">Total Open Defects</div>
                        <div className="text-2xl font-bold">{summary.totalOpenDefects || 0}</div>
                    </div>
                    <div className="bg-card border border-border rounded-lg p-4">
                        <div className="text-xs text-muted-foreground mb-1">Evaluated At</div>
                        <div className="text-sm font-medium">{summary.evaluatedAt}</div>
                    </div>
                </div>
            </div>
        );
    };

    // === TEST SUMMARY SPECIFIC RENDERING ===
    const renderTestSummarySummary = () => {
        const summary = report.data?.summary || {};
        
        return (
            <div className="space-y-6">
                {/* Header Info */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-5">
                    <h3 className="text-xl font-bold text-blue-900 mb-1">{summary.context}</h3>
                    <p className="text-sm text-blue-700">
                        Last Execution: {summary.lastExecutionDate}
                    </p>
                </div>

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-4 gap-4">
                    <div className="bg-card border border-border rounded-lg p-5">
                        <div className="text-xs text-muted-foreground mb-1">Total Test Cases</div>
                        <div className="text-3xl font-bold">{summary.totalTestCases}</div>
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-5">
                        <div className="text-xs text-green-700 mb-1">Passed</div>
                        <div className="text-3xl font-bold text-green-700">{summary.passed}</div>
                    </div>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-5">
                        <div className="text-xs text-red-700 mb-1">Failed</div>
                        <div className="text-3xl font-bold text-red-700">{summary.failed}</div>
                    </div>
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-5">
                        <div className="text-xs text-orange-700 mb-1">Blocked</div>
                        <div className="text-3xl font-bold text-orange-700">{summary.blocked}</div>
                    </div>
                </div>

                {/* Pass Rate & Progress */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-card border border-border rounded-lg p-5">
                        <h4 className="text-sm font-semibold mb-3">Pass Rate</h4>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-2xl font-bold">{summary.passRate}</span>
                        </div>
                        <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-green-500 transition-all"
                                style={{ width: summary.passRate }}
                            />
                        </div>
                    </div>

                    <div className="bg-card border border-border rounded-lg p-5">
                        <h4 className="text-sm font-semibold mb-3">Execution Progress</h4>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-2xl font-bold">{summary.executionProgress}</span>
                            <span className="text-sm text-muted-foreground">{summary.executed}/{summary.totalTestCases}</span>
                        </div>
                        <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-blue-500 transition-all"
                                style={{ width: summary.executionProgress }}
                            />
                        </div>
                    </div>
                </div>

                {/* Duration & Not Executed */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-card border border-border rounded-lg p-4">
                        <div className="text-xs text-muted-foreground mb-1">Total Duration</div>
                        <div className="text-xl font-bold">{summary.totalDuration}</div>
                    </div>
                    <div className="bg-card border border-border rounded-lg p-4">
                        <div className="text-xs text-muted-foreground mb-1">Not Executed</div>
                        <div className="text-xl font-bold">{summary.notExecuted}</div>
                    </div>
                </div>
            </div>
        );
    };

    // === DEFECT REPORT SPECIFIC RENDERING ===
    const renderDefectReportSummary = () => {
        const summary = report.data?.summary || {};
        
        return (
            <div className="space-y-6">
                {/* Key Metrics */}
                <div className="grid grid-cols-5 gap-4">
                    <div className="bg-card border border-border rounded-lg p-5">
                        <div className="text-xs text-muted-foreground mb-1">Total Defects</div>
                        <div className="text-3xl font-bold">{summary.totalDefects}</div>
                    </div>
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-5">
                        <div className="text-xs text-orange-700 mb-1">Open</div>
                        <div className="text-3xl font-bold text-orange-700">{summary.openDefects}</div>
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-5">
                        <div className="text-xs text-green-700 mb-1">Closed</div>
                        <div className="text-3xl font-bold text-green-700">{summary.closedDefects}</div>
                    </div>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-5">
                        <div className="text-xs text-red-700 mb-1">Critical</div>
                        <div className="text-3xl font-bold text-red-700">{summary.criticalDefects}</div>
                    </div>
                    <div className="bg-card border border-border rounded-lg p-5">
                        <div className="text-xs text-muted-foreground mb-1">Defect Density</div>
                        <div className="text-2xl font-bold">{summary.defectDensity}%</div>
                    </div>
                </div>

                {/* Average Resolution Time */}
                <div className="bg-card border border-border rounded-lg p-5">
                    <h4 className="text-sm font-semibold mb-2">Average Resolution Time</h4>
                    <div className="text-3xl font-bold">{summary.avgResolutionTime}</div>
                </div>
            </div>
        );
    };

    // === REQUIREMENT COVERAGE SPECIFIC RENDERING ===
    const renderRequirementCoverageSummary = () => {
        const summary = report.data?.summary || {};
        const coveragePercent = parseInt(summary.coveragePercent) || 0;
        
        return (
            <div className="space-y-6">
                {/* Coverage Overview */}
                <div className="bg-card border border-border rounded-lg p-6">
                    <h4 className="text-sm font-semibold mb-4">Requirement Coverage</h4>
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-3xl font-bold">{summary.coveragePercent}</span>
                        <span className="text-sm text-muted-foreground">
                            {summary.coveredRequirements}/{summary.totalRequirements} Requirements
                        </span>
                    </div>
                    <div className="w-full h-4 bg-muted rounded-full overflow-hidden">
                        <div 
                            className={`h-full transition-all ${
                                coveragePercent >= 80 ? 'bg-green-500' :
                                coveragePercent >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: summary.coveragePercent }}
                        />
                    </div>
                </div>

                {/* Breakdown */}
                <div className="grid grid-cols-4 gap-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-5">
                        <div className="text-xs text-blue-700 mb-1">Total Requirements</div>
                        <div className="text-3xl font-bold text-blue-700">{summary.totalRequirements}</div>
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-5">
                        <div className="text-xs text-green-700 mb-1">Passed</div>
                        <div className="text-3xl font-bold text-green-700">{summary.passedRequirements}</div>
                    </div>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-5">
                        <div className="text-xs text-red-700 mb-1">Failed</div>
                        <div className="text-3xl font-bold text-red-700">{summary.failedRequirements}</div>
                    </div>
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-5">
                        <div className="text-xs text-orange-700 mb-1">Uncovered</div>
                        <div className="text-3xl font-bold text-orange-700">{summary.uncoveredRequirements}</div>
                    </div>
                </div>

                {/* Not Tested */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-yellow-800">Not Tested Requirements</span>
                        <span className="text-2xl font-bold text-yellow-800">{summary.notTestedRequirements}</span>
                    </div>
                </div>
            </div>
        );
    };

    // === GENERIC SUMMARY RENDERING ===
    const renderGenericSummary = () => {
        const summary = report.data?.summary || {};
        
        return (
            <div className="space-y-6">
                <div className="grid grid-cols-4 gap-4">
                    {Object.entries(summary).map(([key, value]) => {
                        if (typeof value === 'object') return null;
                        
                        return (
                            <div key={key} className="bg-accent rounded-lg p-5 border border-border">
                                <div className="text-xs text-muted-foreground mb-1">
                                    {key.replace(/([A-Z])/g, ' $1').trim()}
                                </div>
                                <div className="text-2xl font-bold text-foreground">
                                    {typeof value === 'number' && key.includes('Rate') ? `${value}%` : value}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {summary.passRate !== undefined && (
                    <div className="bg-card border border-border rounded-lg p-6">
                        <h3 className="text-base font-semibold mb-4 text-foreground">Pass Rate Analysis</h3>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-muted-foreground">Success Rate</span>
                            <span className="text-lg font-bold text-foreground">{summary.passRate}%</span>
                        </div>
                        <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                            <div 
                                className={`h-full transition-all ${
                                    summary.passRate >= 80 ? 'bg-green-500' : 
                                    summary.passRate >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${summary.passRate}%` }}
                            />
                        </div>
                    </div>
                )}
            </div>
        );
    };

    // === MAIN SUMMARY RENDERER ===
    const renderSummary = () => {
        switch (report.type) {
            case 'Release Readiness Report':
                return renderReleaseReadinessSummary();
            case 'Test Summary Report':
                return renderTestSummarySummary();
            case 'Defect Report':
                return renderDefectReportSummary();
            case 'Requirement Coverage Report':
                return renderRequirementCoverageSummary();
            default:
                return renderGenericSummary();
        }
    };

    // === DETAILS TABLE RENDERING ===
    const renderDetails = () => {
        const details = report.data?.details || [];
        
        if (details.length === 0) {
            return <div className="text-center py-16 text-muted-foreground">No details available</div>;
        }

        // Special handling for Release Readiness Report criteria
        if (report.type === 'Release Readiness Report') {
            return (
                <div className="border border-border rounded-lg overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-muted">
                            <tr>
                                <th className="px-4 py-3 text-left text-sm font-semibold">Criterion</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold">Threshold</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold">Actual</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold">Impact</th>
                            </tr>
                        </thead>
                        <tbody>
                            {details.map((item, idx) => (
                                <tr key={idx} className="border-t border-border hover:bg-accent/50">
                                    <td className="px-4 py-3 text-sm font-medium">{item.criterion}</td>
                                    <td className="px-4 py-3 text-sm">{item.threshold}</td>
                                    <td className="px-4 py-3 text-sm font-semibold">{item.actual}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            {getStatusIcon(item.status)}
                                            <span className={`font-semibold ${
                                                item.status === 'PASS' ? 'text-green-700' : 'text-red-700'
                                            }`}>
                                                {item.status}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                                            item.impact === 'Critical' ? 'bg-red-100 text-red-800' :
                                            item.impact === 'High' ? 'bg-orange-100 text-orange-800' :
                                            'bg-yellow-100 text-yellow-800'
                                        }`}>
                                            {item.impact}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            );
        }

        // Generic table rendering
        return (
            <div className="border border-border rounded-lg overflow-hidden">
                <table className="w-full">
                    <thead className="bg-muted">
                        <tr>
                            {Object.keys(details[0]).map((key) => (
                                <th key={key} className="px-4 py-3 text-left text-sm font-semibold text-foreground">
                                    {key.replace(/([A-Z])/g, ' $1').trim()}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {details.map((item, idx) => (
                            <tr key={idx} className="border-t border-border hover:bg-accent/50">
                                {Object.entries(item).map(([key, value]) => (
                                    <td key={key} className="px-4 py-3 text-sm">
                                        {key === 'status' || key === 'coverage' ? (
                                            <div className="flex items-center gap-2">
                                                {getStatusIcon(value)}
                                                <span className="capitalize">{value}</span>
                                            </div>
                                        ) : key === 'age' ? (
                                            <span>{value} days</span>
                                        ) : (
                                            <span>{value?.toString() || 'N/A'}</span>
                                        )}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    // === CHARTS RENDERING ===
    const renderCharts = () => {
        const charts = report.data?.charts || [];
        
        if (charts.length === 0) {
            return <div className="text-center py-16 text-muted-foreground">No charts available</div>;
        }

        return (
            <div className="space-y-6">
                {charts.map((chart, idx) => (
                    <div key={idx} className="bg-card border border-border rounded-lg p-6">
                        <h3 className="text-base font-semibold mb-4 text-foreground">{chart.title}</h3>
                        
                        {chart.type === 'pie' && (
                            <div className="space-y-2">
                                {chart.data.filter(item => item.value > 0).map((item, i) => {
                                    const total = chart.data.reduce((sum, d) => sum + d.value, 0);
                                    const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
                                    
                                    return (
                                        <div key={i} className="flex items-center gap-3">
                                            <div className="w-4 h-4 rounded" style={{ 
                                                backgroundColor: ['#3b82f6', '#ef4444', '#f59e0b', '#6b7280', '#8b5cf6'][i % 5]
                                            }} />
                                            <span className="flex-1 text-sm">{item.name}</span>
                                            <span className="text-sm font-semibold">{item.value} ({pct}%)</span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                        
                        {chart.type === 'bar' && (
                            <div className="space-y-3">
                                {chart.data.map((item, i) => {
                                    const max = Math.max(...chart.data.map(d => d.value));
                                    const width = max > 0 ? (item.value / max) * 100 : 0;
                                    
                                    return (
                                        <div key={i}>
                                            <div className="flex justify-between text-sm mb-1">
                                                <span>{item.name}</span>
                                                <span className="font-semibold">{item.value}</span>
                                            </div>
                                            <div className="w-full h-2 bg-muted rounded">
                                                <div className="h-2 bg-primary rounded" style={{ width: `${width}%` }} />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {chart.type === 'gauge' && (
                            <div className="space-y-4">
                                {chart.data.map((item, i) => {
                                    const isPassing = item.value >= item.threshold;
                                    return (
                                        <div key={i} className="space-y-2">
                                            <div className="flex justify-between text-sm">
                                                <span>{item.name}</span>
                                                <span className="font-semibold">
                                                    {item.value}% / {item.threshold}%
                                                </span>
                                            </div>
                                            <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                                                <div 
                                                    className={`h-3 rounded-full transition-all ${
                                                        isPassing ? 'bg-green-500' : 'bg-red-500'
                                                    }`}
                                                    style={{ width: `${item.value}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => onOpenChange(false)}>
            <div className="bg-background rounded-xl shadow-2xl w-[60vw] h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                
                {/* Header */}
                <div className="px-6 py-5 border-b border-border flex items-start justify-between">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-3">
                            <h2 className="text-2xl font-bold text-foreground">{report.name}</h2>
                            {isPriorityReport && (
                                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded">
                                    PRIORITY
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-6 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4" />
                                {report.type}
                            </div>
                            <div className="flex items-center gap-2">
                                <User className="w-4 h-4" />
                                {report.createdBy?.split('@')[0] || 'Unknown'}
                            </div>
                            <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                {formatDate(report.createdAt)}
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        {hasPermission && (
                            <div className="relative">
                                <button
                                    onClick={() => setStatusDropdown(!statusDropdown)}
                                    className="px-4 py-2 border border-border rounded-lg hover:bg-accent text-sm font-medium"
                                >
                                    Change Status
                                </button>
                                {statusDropdown && (
                                    <div className="absolute right-0 top-full mt-1 bg-background border border-border rounded-lg shadow-lg w-40 z-10">
                                        {['Generated', 'Reviewed', 'Published'].map(status => (
                                            <button
                                                key={status}
                                                onClick={() => {
                                                    onUpdateStatus(report.id, status);
                                                    setStatusDropdown(false);
                                                }}
                                                className="w-full px-4 py-2 text-left text-sm hover:bg-accent first:rounded-t-lg last:rounded-b-lg"
                                            >
                                                {status}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                        <button
                            onClick={downloadReport}
                            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 flex items-center gap-2 text-sm font-medium"
                        >
                            <Download className="w-4 h-4" />
                            Download
                        </button>
                        <button
                            onClick={() => onOpenChange(false)}
                            className="p-2 hover:bg-accent rounded-lg"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="px-6 border-b border-border flex gap-6">
                    {['summary', 'details', 'charts'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`py-3 text-sm font-medium border-b-2 -mb-px ${
                                activeTab === tab
                                    ? 'border-primary text-primary'
                                    : 'border-transparent text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-6 py-6">
                    {activeTab === 'summary' && renderSummary()}
                    {activeTab === 'details' && renderDetails()}
                    {activeTab === 'charts' && renderCharts()}
                </div>
            </div>
        </div>
    );
};

export default ReportViewerModal;