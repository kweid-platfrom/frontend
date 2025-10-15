/* eslint-disable react-hooks/exhaustive-deps */
// components/traceability/TraceabilityComponent.js
'use client'

import { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { 
    LinkIcon,
    XMarkIcon,
    MagnifyingGlassIcon,
    ArrowPathIcon,
    ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

const TraceabilityMatrix = ({ onClose }) => {
    const [requirements, setRequirements] = useState([]);
    const [defects, setDefects] = useState([]);
    const [traceabilityMatrix, setTraceabilityMatrix] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');

    // Mock data - replace with actual API calls
    useEffect(() => {
        loadTraceabilityData();
    }, []);

    const loadTraceabilityData = async () => {
        try {
            setLoading(true);
            // Mock API calls - replace with actual service calls
            const [reqData, defectData, matrixData] = await Promise.all([
                mockGetRequirements(),
                mockGetDefects(),
                mockGetTraceabilityMatrix()
            ]);
            
            setRequirements(reqData);
            setDefects(defectData);
            setTraceabilityMatrix(matrixData);
        } catch {
            toast.error('Failed to load traceability data');
        } finally {
            setLoading(false);
        }
    };

    // Mock API functions - replace with actual implementations
    const mockGetRequirements = () => {
        return Promise.resolve([
            { id: 'REQ-001', title: 'User Authentication', status: 'approved', priority: 'high' },
            { id: 'REQ-002', title: 'Dashboard Display', status: 'approved', priority: 'medium' },
            { id: 'REQ-003', title: 'Data Export', status: 'draft', priority: 'low' },
            { id: 'REQ-004', title: 'User Management', status: 'approved', priority: 'high' },
            { id: 'REQ-005', title: 'Reporting System', status: 'approved', priority: 'medium' },
        ]);
    };

    const mockGetDefects = () => {
        return Promise.resolve([
            { id: 'DEF-001', title: 'Login fails with special characters', status: 'open', severity: 'high' },
            { id: 'DEF-002', title: 'Dashboard loading slow', status: 'fixed', severity: 'medium' },
            { id: 'DEF-003', title: 'Export button not visible', status: 'open', severity: 'low' },
        ]);
    };

    const mockGetTraceabilityMatrix = () => {
        return Promise.resolve([
            {
                requirementId: 'REQ-001',
                testCases: ['TC-001', 'TC-002', 'TC-015'],
                defects: ['DEF-001'],
                coverage: 85
            },
            {
                requirementId: 'REQ-002',
                testCases: ['TC-003', 'TC-004', 'TC-005'],
                defects: ['DEF-002'],
                coverage: 100
            },
            {
                requirementId: 'REQ-003',
                testCases: ['TC-006'],
                defects: ['DEF-003'],
                coverage: 40
            },
            {
                requirementId: 'REQ-004',
                testCases: ['TC-007', 'TC-008', 'TC-009', 'TC-010'],
                defects: [],
                coverage: 95
            },
            {
                requirementId: 'REQ-005',
                testCases: ['TC-011', 'TC-012'],
                defects: [],
                coverage: 60
            },
        ]);
    };

    const filteredMatrix = useMemo(() => {
        return traceabilityMatrix.filter(item => {
            const requirement = requirements.find(req => req.id === item.requirementId);
            if (!requirement) return false;

            const matchesSearch = searchTerm === '' || 
                requirement.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                requirement.id.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesFilter = filterType === 'all' ||
                (filterType === 'low-coverage' && item.coverage < 60) ||
                (filterType === 'high-coverage' && item.coverage >= 80) ||
                (filterType === 'with-defects' && item.defects.length > 0) ||
                (filterType === 'no-coverage' && item.testCases.length === 0);

            return matchesSearch && matchesFilter;
        });
    }, [traceabilityMatrix, requirements, searchTerm, filterType]);

    const getRequirementById = (id) => requirements.find(req => req.id === id);
    const getDefectById = (id) => defects.find(def => def.id === id);

    const getCoverageColor = (coverage) => {
        if (coverage >= 80) return 'text-success bg-teal-50 border border-teal-300';
        if (coverage >= 60) return 'text-warning bg-warning/20 border border-border';
        return 'text-error bg-destructive/20 border border-destructive';
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'approved': return 'text-success bg-teal-50 border border-teal-300';
            case 'draft': return 'text-muted-foreground bg-muted border border-border';
            case 'open': return 'text-error bg-destructive/20 border border-destructive';
            case 'fixed': return 'text-success bg-teal-50 border border-teal-300';
            default: return 'text-muted-foreground bg-muted border border-border';
        }
    };

    const overallStats = useMemo(() => {
        const totalRequirements = requirements.length;
        const coveredRequirements = traceabilityMatrix.filter(item => item.testCases.length > 0).length;
        const avgCoverage = traceabilityMatrix.reduce((sum, item) => sum + item.coverage, 0) / traceabilityMatrix.length;
        const totalDefects = defects.length;
        const openDefects = defects.filter(def => def.status === 'open').length;

        return {
            totalRequirements,
            coveredRequirements,
            coveragePercentage: Math.round((coveredRequirements / totalRequirements) * 100),
            avgCoverage: Math.round(avgCoverage),
            totalDefects,
            openDefects
        };
    }, [requirements, traceabilityMatrix, defects]);

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    if (loading) {
        return (
            <div 
                className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-background/80"
                onClick={handleBackdropClick}
            >
                <div className="bg-card rounded-lg p-8 shadow-theme-lg">
                    <div className="flex items-center space-x-3">
                        <ArrowPathIcon className="h-6 w-6 animate-spin text-primary" />
                        <span className="text-foreground">Loading traceability data...</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div 
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-background/80"
            onClick={handleBackdropClick}
        >
            <div className="bg-card rounded-lg max-w-7xl w-full max-h-[90vh] overflow-hidden shadow-theme-xl border border-border">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-border">
                    <div className="flex items-center space-x-3">
                        <LinkIcon className="h-6 w-6 text-primary" />
                        <h2 className="text-xl font-semibold text-foreground">Requirements Traceability Matrix</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <XMarkIcon className="h-6 w-6" />
                    </button>
                </div>

                {/* Stats Overview */}
                <div className="p-6 bg-muted border-b border-border">
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-primary">{overallStats.totalRequirements}</div>
                            <div className="text-sm text-muted-foreground">Total Requirements</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-success">{overallStats.coveredRequirements}</div>
                            <div className="text-sm text-muted-foreground">Covered</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-info">{overallStats.coveragePercentage}%</div>
                            <div className="text-sm text-muted-foreground">Coverage</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-warning">{overallStats.avgCoverage}%</div>
                            <div className="text-sm text-muted-foreground">Avg Quality</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-error">{overallStats.totalDefects}</div>
                            <div className="text-sm text-muted-foreground">Total Defects</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-destructive">{overallStats.openDefects}</div>
                            <div className="text-sm text-muted-foreground">Open Defects</div>
                        </div>
                    </div>
                </div>

                {/* Controls */}
                <div className="p-6 border-b bg-card border-border">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative">
                            <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Search requirements..."
                                className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent bg-background text-foreground placeholder-muted-foreground"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <select
                            className="px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent bg-background text-foreground"
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                        >
                            <option value="all">All Requirements</option>
                            <option value="low-coverage">Low Coverage (&lt;60%)</option>
                            <option value="high-coverage">High Coverage (≥80%)</option>
                            <option value="with-defects">With Defects</option>
                            <option value="no-coverage">No Test Coverage</option>
                        </select>
                    </div>
                </div>

                {/* Traceability Matrix */}
                <div className="overflow-auto max-h-[50vh]">
                    <table className="w-full">
                        <thead className="bg-muted sticky top-0">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    Requirement
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    Test Cases
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    Coverage
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    Defects
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-card divide-y divide-border">
                            {filteredMatrix.map((item) => {
                                const requirement = getRequirementById(item.requirementId);
                                if (!requirement) return null;

                                return (
                                    <tr key={item.requirementId} className="hover:bg-secondary">
                                        <td className="px-6 py-4">
                                            <div>
                                                <div className="text-sm font-medium text-foreground">
                                                    {requirement.id}
                                                </div>
                                                <div className="text-sm text-muted-foreground">
                                                    {requirement.title}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(requirement.status)}`}>
                                                {requirement.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-wrap gap-1">
                                                {item.testCases.length > 0 ? (
                                                    item.testCases.map((tcId) => (
                                                        <span
                                                            key={tcId}
                                                            className="inline-flex px-2 py-1 text-xs font-medium bg-primary/10 text-primary rounded border border-primary/20"
                                                        >
                                                            {tcId}
                                                        </span>
                                                    ))
                                                ) : (
                                                    <span className="text-sm text-muted-foreground italic">No test cases</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center space-x-2">
                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getCoverageColor(item.coverage)}`}>
                                                    {item.coverage}%
                                                </span>
                                                {item.coverage < 60 && (
                                                    <ExclamationTriangleIcon className="h-4 w-4 text-destructive" />
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-wrap gap-1">
                                                {item.defects.length > 0 ? (
                                                    item.defects.map((defId) => {
                                                        const defect = getDefectById(defId);
                                                        return defect ? (
                                                            <span
                                                                key={defId}
                                                                className={`inline-flex px-2 py-1 text-xs font-medium rounded border ${
                                                                    defect.status === 'open' ? 'bg-destructive/20 text-destructive border-destructive' : 'bg-teal-50 text-success border-teal-300'
                                                                }`}
                                                            >
                                                                {defId}
                                                            </span>
                                                        ) : null;
                                                    })
                                                ) : (
                                                    <span className="text-sm text-muted-foreground italic">No defects</span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Footer */}
                <div className="p-6 bg-muted border-t border-border">
                    <div className="flex justify-between items-center">
                        <div className="text-sm text-muted-foreground">
                            Showing {filteredMatrix.length} of {traceabilityMatrix.length} requirements
                        </div>
                        <button
                            onClick={loadTraceabilityData}
                            className="flex items-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                        >
                            <ArrowPathIcon className="h-4 w-4" />
                            <span>Refresh</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TraceabilityMatrix;