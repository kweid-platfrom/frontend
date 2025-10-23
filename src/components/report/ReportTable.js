// components/report/ReportTable.jsx - Enhanced with Selection Support
'use client';

import React, { useState } from 'react';
import { 
    FileText, 
    Eye, 
    Download, 
    Trash2, 
    CheckCircle, 
    Clock,
    Send,
    AlertCircle,
    Calendar,
    User,
    Tag,
    MoreVertical
} from 'lucide-react';

const ReportTable = ({ 
    reports, 
    loading, 
    onView, 
    onUpdateStatus, 
    onDelete,
    hasPermission,
    selectedItems = [],
    onSelectAll,
    onSelectItem
}) => {
    const [deletingId, setDeletingId] = useState(null);
    const [updatingStatusId, setUpdatingStatusId] = useState(null);
    const [openDropdown, setOpenDropdown] = useState(null);

    const handleDelete = async (reportId) => {
        if (!confirm('Are you sure you want to delete this report?')) return;
        
        setDeletingId(reportId);
        try {
            await onDelete(reportId);
        } finally {
            setDeletingId(null);
        }
    };

    const handleStatusChange = async (reportId, newStatus) => {
        setUpdatingStatusId(reportId);
        setOpenDropdown(null);
        try {
            await onUpdateStatus(reportId, newStatus);
        } finally {
            setUpdatingStatusId(null);
        }
    };

    const getStatusBadge = (status) => {
        const variants = {
            'Generated': { 
                color: 'bg-blue-50 text-blue-800 border-blue-200', 
                icon: Clock 
            },
            'Reviewed': { 
                color: 'bg-yellow-50 text-yellow-800 border-yellow-200', 
                icon: CheckCircle 
            },
            'Published': { 
                color: 'bg-teal-50 text-teal-800 border-teal-200', 
                icon: Send 
            }
        };

        const variant = variants[status] || variants['Generated'];
        const Icon = variant.icon;

        return (
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${variant.color}`}>
                <Icon className="h-3 w-3" />
                {status}
            </span>
        );
    };

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

    const downloadReport = (report) => {
        try {
            const dataStr = JSON.stringify(report.data, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${report.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Error downloading report:', err);
            alert('Failed to download report');
        }
    };

    if (loading) {
        return (
            <div className="bg-card border border-border shadow-sm rounded-lg p-8">
                <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <span className="ml-3 text-muted-foreground">Loading reports...</span>
                </div>
            </div>
        );
    }

    if (reports.length === 0) {
        return (
            <div className="bg-card border border-border shadow-sm rounded-lg p-12 text-center">
                <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No reports found</h3>
                <p className="text-muted-foreground mb-4">
                    Reports will appear here when you generate them or when test runs complete
                </p>
            </div>
        );
    }

    const isAllSelected = selectedItems.length === reports.length && reports.length > 0;
    const isSomeSelected = selectedItems.length > 0 && selectedItems.length < reports.length;

    return (
        <div className="bg-card border border-border shadow-sm rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-border">
                    <thead className="bg-muted">
                        <tr>
                            {hasPermission && (
                                <th className="px-4 py-3 text-left w-12">
                                    <input
                                        type="checkbox"
                                        checked={isAllSelected}
                                        ref={(input) => {
                                            if (input) {
                                                input.indeterminate = isSomeSelected;
                                            }
                                        }}
                                        onChange={(e) => onSelectAll(e.target.checked)}
                                        className="rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                                    />
                                </th>
                            )}
                            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                Report Name
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                Type
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                Status
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                Created By
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                Created At
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                Source
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-card divide-y divide-border">
                        {reports.map((report) => (
                            <tr key={report.id} className="hover:bg-accent transition-colors">
                                {hasPermission && (
                                    <td className="px-4 py-3">
                                        <input
                                            type="checkbox"
                                            checked={selectedItems.includes(report.id)}
                                            onChange={(e) => onSelectItem(report.id, e.target.checked)}
                                            className="rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                                        />
                                    </td>
                                )}
                                <td className="px-4 py-3">
                                    <div className="flex items-start gap-2">
                                        <FileText className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-foreground truncate">
                                                {report.name}
                                            </p>
                                            {report.description && (
                                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                                    {report.description}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-2">
                                        <Tag className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-sm text-foreground">{report.type}</span>
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    {getStatusBadge(report.status)}
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-2">
                                        <User className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-sm text-muted-foreground">
                                            {report.createdBy?.split('@')[0] || 'Unknown'}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-sm text-muted-foreground">
                                            {formatDate(report.createdAt)}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    {report.autoGenerated ? (
                                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs bg-muted text-muted-foreground border border-border">
                                            {report.scheduledReport ? (
                                                <Clock className="h-3 w-3" />
                                            ) : (
                                                <AlertCircle className="h-3 w-3" />
                                            )}
                                            Auto
                                        </span>
                                    ) : (
                                        <span className="text-xs text-muted-foreground">Manual</span>
                                    )}
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <div className="flex items-center justify-end gap-1">
                                        <button
                                            onClick={() => onView(report)}
                                            className="inline-flex items-center justify-center h-8 w-8 rounded-lg text-primary hover:text-primary hover:bg-primary/10 transition-colors"
                                            title="View Report"
                                        >
                                            <Eye className="h-4 w-4" />
                                        </button>
                                        
                                        <button
                                            onClick={() => downloadReport(report)}
                                            className="inline-flex items-center justify-center h-8 w-8 rounded-lg text-teal-600 hover:text-teal-700 hover:bg-teal-50 transition-colors"
                                            title="Download Report"
                                        >
                                            <Download className="h-4 w-4" />
                                        </button>

                                        {hasPermission && (
                                            <>
                                                <div className="relative">
                                                    <button
                                                        onClick={() => setOpenDropdown(openDropdown === report.id ? null : report.id)}
                                                        disabled={updatingStatusId === report.id}
                                                        className="inline-flex items-center justify-center h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors disabled:opacity-50"
                                                        title="Change Status"
                                                    >
                                                        {updatingStatusId === report.id ? (
                                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                                                        ) : (
                                                            <MoreVertical className="h-4 w-4" />
                                                        )}
                                                    </button>
                                                    
                                                    {openDropdown === report.id && (
                                                        <>
                                                            <div 
                                                                className="fixed inset-0 z-10" 
                                                                onClick={() => setOpenDropdown(null)}
                                                            />
                                                            <div className="absolute right-0 mt-1 w-48 bg-card border border-border rounded-lg shadow-lg z-20 py-1">
                                                                <button
                                                                    onClick={() => handleStatusChange(report.id, 'Generated')}
                                                                    disabled={report.status === 'Generated'}
                                                                    className="w-full px-4 py-2 text-left text-sm hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                                                >
                                                                    <Clock className="h-4 w-4 text-blue-600" />
                                                                    <span className="text-foreground">Mark as Generated</span>
                                                                </button>
                                                                <button
                                                                    onClick={() => handleStatusChange(report.id, 'Reviewed')}
                                                                    disabled={report.status === 'Reviewed'}
                                                                    className="w-full px-4 py-2 text-left text-sm hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                                                >
                                                                    <CheckCircle className="h-4 w-4 text-yellow-600" />
                                                                    <span className="text-foreground">Mark as Reviewed</span>
                                                                </button>
                                                                <button
                                                                    onClick={() => handleStatusChange(report.id, 'Published')}
                                                                    disabled={report.status === 'Published'}
                                                                    className="w-full px-4 py-2 text-left text-sm hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                                                >
                                                                    <Send className="h-4 w-4 text-teal-600" />
                                                                    <span className="text-foreground">Mark as Published</span>
                                                                </button>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>

                                                <button
                                                    onClick={() => handleDelete(report.id)}
                                                    disabled={deletingId === report.id}
                                                    className="inline-flex items-center justify-center h-8 w-8 rounded-lg text-destructive hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
                                                    title="Delete Report"
                                                >
                                                    {deletingId === report.id ? (
                                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-destructive"></div>
                                                    ) : (
                                                        <Trash2 className="h-4 w-4" />
                                                    )}
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ReportTable;