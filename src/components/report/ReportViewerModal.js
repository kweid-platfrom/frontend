// components/report/ReportViewerModal.jsx
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
            'passed': <CheckCircle className="w-4 h-4 text-green-600" />,
            'pass': <CheckCircle className="w-4 h-4 text-green-600" />,
            'failed': <XCircle className="w-4 h-4 text-red-600" />,
            'fail': <XCircle className="w-4 h-4 text-red-600" />,
            'blocked': <AlertCircle className="w-4 h-4 text-orange-600" />,
            'skipped': <Clock className="w-4 h-4 text-gray-600" />,
        };
        return icons[status?.toLowerCase()] || <Clock className="w-4 h-4 text-gray-400" />;
    };

    const renderSummary = () => {
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

    const renderDetails = () => {
        const details = report.data?.details || [];
        
        if (details.length === 0) {
            return <div className="text-center py-16 text-muted-foreground">No details available</div>;
        }

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
                                        {key === 'status' ? (
                                            <div className="flex items-center gap-2">
                                                {getStatusIcon(value)}
                                                <span className="capitalize">{value}</span>
                                            </div>
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
                                {chart.data.map((item, i) => {
                                    const total = chart.data.reduce((sum, d) => sum + d.value, 0);
                                    const pct = Math.round((item.value / total) * 100);
                                    
                                    return (
                                        <div key={i} className="flex items-center gap-3">
                                            <div className="w-4 h-4 rounded" style={{ 
                                                backgroundColor: ['#3b82f6', '#ef4444', '#f59e0b', '#6b7280'][i % 4]
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
                                    const width = (item.value / max) * 100;
                                    
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
                        <h2 className="text-2xl font-bold mb-3 text-foreground">{report.name}</h2>
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