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
    // Removed unused activeTab state
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
        if (coverage >= 80) return 'text-green-600 bg-green-100';
        if (coverage >= 60) return 'text-yellow-600 bg-yellow-100';
        return 'text-red-600 bg-red-100';
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'approved': return 'text-green-600 bg-green-100';
            case 'draft': return 'text-gray-600 bg-gray-100';
            case 'open': return 'text-red-600 bg-red-100';
            case 'fixed': return 'text-green-600 bg-green-100';
            default: return 'text-gray-600 bg-gray-100';
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

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-8">
                    <div className="flex items-center space-x-3">
                        <ArrowPathIcon className="h-6 w-6 animate-spin text-blue-600" />
                        <span>Loading traceability data...</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-7xl w-full max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b">
                    <div className="flex items-center space-x-3">
                        <LinkIcon className="h-6 w-6 text-blue-600" />
                        <h2 className="text-xl font-semibold">Requirements Traceability Matrix</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <XMarkIcon className="h-6 w-6" />
                    </button>
                </div>

                {/* Stats Overview */}
                <div className="p-6 bg-gray-50 border-b">
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">{overallStats.totalRequirements}</div>
                            <div className="text-sm text-gray-600">Total Requirements</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">{overallStats.coveredRequirements}</div>
                            <div className="text-sm text-gray-600">Covered</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-purple-600">{overallStats.coveragePercentage}%</div>
                            <div className="text-sm text-gray-600">Coverage</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-orange-600">{overallStats.avgCoverage}%</div>
                            <div className="text-sm text-gray-600">Avg Quality</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-red-600">{overallStats.totalDefects}</div>
                            <div className="text-sm text-gray-600">Total Defects</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-red-700">{overallStats.openDefects}</div>
                            <div className="text-sm text-gray-600">Open Defects</div>
                        </div>
                    </div>
                </div>

                {/* Controls */}
                <div className="p-6 border-b bg-white">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative">
                            <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search requirements..."
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <select
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                        <thead className="bg-gray-50 sticky top-0">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Requirement
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Test Cases
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Coverage
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Defects
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredMatrix.map((item) => {
                                const requirement = getRequirementById(item.requirementId);
                                if (!requirement) return null;

                                return (
                                    <tr key={item.requirementId} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">
                                                    {requirement.id}
                                                </div>
                                                <div className="text-sm text-gray-600">
                                                    {requirement.title}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(requirement.status)}`}>
                                                {requirement.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-wrap gap-1">
                                                {item.testCases.length > 0 ? (
                                                    item.testCases.map((tcId) => (
                                                        <span
                                                            key={tcId}
                                                            className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded"
                                                        >
                                                            {tcId}
                                                        </span>
                                                    ))
                                                ) : (
                                                    <span className="text-sm text-gray-400 italic">No test cases</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center space-x-2">
                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCoverageColor(item.coverage)}`}>
                                                    {item.coverage}%
                                                </span>
                                                {item.coverage < 60 && (
                                                    <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />
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
                                                                className={`inline-flex px-2 py-1 text-xs font-medium rounded ${
                                                                    defect.status === 'open' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                                                                }`}
                                                            >
                                                                {defId}
                                                            </span>
                                                        ) : null;
                                                    })
                                                ) : (
                                                    <span className="text-sm text-gray-400 italic">No defects</span>
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
                <div className="p-6 bg-gray-50 border-t">
                    <div className="flex justify-between items-center">
                        <div className="text-sm text-gray-600">
                            Showing {filteredMatrix.length} of {traceabilityMatrix.length} requirements
                        </div>
                        <button
                            onClick={loadTraceabilityData}
                            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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