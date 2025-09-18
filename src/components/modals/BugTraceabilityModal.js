import React, { useState, useMemo, useCallback } from 'react';
import { 
    Link,
    Search,
    Bug,
    TestTube,
    X,
    ExternalLink,
    Grid,
    List,
    BarChart3,
    AlertTriangle,
    CheckCircle2
} from 'lucide-react';

const BugTraceabilityModal = ({ isOpen, onClose, bugs, testCases, relationships }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedModule, setSelectedModule] = useState('all');
    const [viewType, setViewType] = useState('matrix'); // matrix, list, stats
    const [showOnlyLinked, setShowOnlyLinked] = useState(false);

    // Get linked test cases for a bug
    const getLinkedTestCases = useCallback((bugId) => {
        const linkedIds = relationships?.bugToTestCases?.[bugId] || [];
        return testCases?.filter(tc => linkedIds.includes(tc.id)) || [];
    }, [relationships, testCases]);

    // Get linked bugs for a test case
    const getLinkedBugs = useCallback((testCaseId) => {
        const linkedBugIds = Object.keys(relationships?.bugToTestCases || {})
            .filter(bugId => relationships.bugToTestCases[bugId].includes(testCaseId));
        return bugs?.filter(bug => linkedBugIds.includes(bug.id)) || [];
    }, [relationships, bugs]);

    // Get unique modules from bugs and test cases
    const modules = useMemo(() => {
        const moduleSet = new Set();
        bugs?.forEach(bug => {
            if (bug.module) moduleSet.add(bug.module);
        });
        testCases?.forEach(testCase => {
            if (testCase.module) moduleSet.add(testCase.module);
        });
        return Array.from(moduleSet).sort();
    }, [bugs, testCases]);

    // Filter bugs and test cases based on search and filters
    const filteredBugs = useMemo(() => {
        if (!bugs) return [];
        
        let filtered = bugs.filter(bug => {
            const matchesSearch = !searchTerm || 
                bug.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                bug.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                bug.module?.toLowerCase().includes(searchTerm.toLowerCase());
            
            const matchesModule = selectedModule === 'all' || bug.module === selectedModule;
            
            return matchesSearch && matchesModule;
        });

        if (showOnlyLinked) {
            filtered = filtered.filter(bug => getLinkedTestCases(bug.id).length > 0);
        }

        return filtered;
    }, [bugs, searchTerm, selectedModule, showOnlyLinked, getLinkedTestCases]);

    const filteredTestCases = useMemo(() => {
        if (!testCases) return [];
        
        let filtered = testCases.filter(testCase => {
            const matchesSearch = !searchTerm || 
                testCase.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                testCase.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                testCase.module?.toLowerCase().includes(searchTerm.toLowerCase());
            
            const matchesModule = selectedModule === 'all' || testCase.module === selectedModule;
            
            return matchesSearch && matchesModule;
        });

        if (showOnlyLinked) {
            filtered = filtered.filter(tc => getLinkedBugs(tc.id).length > 0);
        }

        return filtered;
    }, [testCases, searchTerm, selectedModule, showOnlyLinked, getLinkedBugs]);

    // Calculate traceability statistics
    const stats = useMemo(() => {
        const totalBugs = filteredBugs.length;
        const totalTestCases = filteredTestCases.length;
        const bugsWithTestCases = filteredBugs.filter(bug => getLinkedTestCases(bug.id).length > 0).length;
        const testCasesWithBugs = filteredTestCases.filter(tc => getLinkedBugs(tc.id).length > 0).length;
        
        const moduleStats = {};
        modules.forEach(module => {
            const moduleBugs = filteredBugs.filter(bug => bug.module === module);
            const moduleTestCases = filteredTestCases.filter(tc => tc.module === module);
            const linkedModuleBugs = moduleBugs.filter(bug => getLinkedTestCases(bug.id).length > 0);
            
            moduleStats[module] = {
                bugs: moduleBugs.length,
                testCases: moduleTestCases.length,
                linkedBugs: linkedModuleBugs.length,
                coverage: moduleBugs.length > 0 ? Math.round((linkedModuleBugs.length / moduleBugs.length) * 100) : 0
            };
        });
        
        return {
            totalBugs,
            totalTestCases,
            bugsWithTestCases,
            testCasesWithBugs,
            bugsCoverage: totalBugs > 0 ? Math.round((bugsWithTestCases / totalBugs) * 100) : 0,
            testCasesCoverage: totalTestCases > 0 ? Math.round((testCasesWithBugs / totalTestCases) * 100) : 0,
            moduleStats
        };
    }, [filteredBugs, filteredTestCases, modules, getLinkedBugs, getLinkedTestCases]);

    const getSeverityColor = (severity) => {
        switch (severity) {
            case 'critical': return 'text-red-600 bg-red-100';
            case 'high': return 'text-orange-600 bg-orange-100';
            case 'medium': return 'text-yellow-600 bg-yellow-100';
            case 'low': return 'text-green-600 bg-green-100';
            default: return 'text-gray-600 bg-gray-100';
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'open': return 'text-red-600 bg-red-100';
            case 'in-progress': return 'text-blue-600 bg-blue-100';
            case 'resolved': return 'text-green-600 bg-green-100';
            case 'closed': return 'text-gray-600 bg-gray-100';
            default: return 'text-gray-600 bg-gray-100';
        }
    };

    const renderMatrixView = () => (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex items-center">
                        <Bug className="w-8 h-8 text-blue-600" />
                        <div className="ml-3">
                            <p className="text-sm font-medium text-blue-900">Total Bugs</p>
                            <p className="text-2xl font-bold text-blue-700">{stats.totalBugs}</p>
                        </div>
                    </div>
                </div>
                
                <div className="bg-green-50 rounded-lg p-4">
                    <div className="flex items-center">
                        <TestTube className="w-8 h-8 text-green-600" />
                        <div className="ml-3">
                            <p className="text-sm font-medium text-green-900">Total Test Cases</p>
                            <p className="text-2xl font-bold text-green-700">{stats.totalTestCases}</p>
                        </div>
                    </div>
                </div>
                
                <div className="bg-purple-50 rounded-lg p-4">
                    <div className="flex items-center">
                        <Link className="w-8 h-8 text-purple-600" />
                        <div className="ml-3">
                            <p className="text-sm font-medium text-purple-900">Bugs with Test Cases</p>
                            <p className="text-2xl font-bold text-purple-700">{stats.bugsWithTestCases}</p>
                            <p className="text-xs text-purple-600">({stats.bugsCoverage}% coverage)</p>
                        </div>
                    </div>
                </div>
                
                <div className="bg-orange-50 rounded-lg p-4">
                    <div className="flex items-center">
                        <ExternalLink className="w-8 h-8 text-orange-600" />
                        <div className="ml-3">
                            <p className="text-sm font-medium text-orange-900">Test Cases with Bugs</p>
                            <p className="text-2xl font-bold text-orange-700">{stats.testCasesWithBugs}</p>
                            <p className="text-xs text-orange-600">({stats.testCasesCoverage}% coverage)</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Traceability Matrix Table */}
            <div className="bg-white border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Bug Report
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Module
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Severity
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Linked Test Cases
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredBugs.map((bug) => {
                                const linkedTestCases = getLinkedTestCases(bug.id);
                                return (
                                    <tr key={bug.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <Bug className="w-4 h-4 text-red-500 mr-2" />
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {bug.title}
                                                    </div>
                                                    <div className="text-sm text-gray-500 truncate max-w-xs">
                                                        {bug.description}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                                                {bug.module || 'Unassigned'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(bug.status)}`}>
                                                {bug.status || 'open'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSeverityColor(bug.severity)}`}>
                                                {bug.severity || 'medium'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {linkedTestCases.length > 0 ? (
                                                <div className="space-y-1">
                                                    {linkedTestCases.map((testCase) => (
                                                        <div key={testCase.id} className="flex items-center text-sm text-gray-600">
                                                            <TestTube className="w-3 h-3 text-green-500 mr-1" />
                                                            <span className="truncate max-w-xs">{testCase.name}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span className="text-sm text-gray-400 italic">No linked test cases</span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );

    const renderListView = () => (
        <div className="space-y-6">
            {/* Bugs Section */}
            <div>
                <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <Bug className="w-5 h-5 text-red-500 mr-2" />
                    Bug Reports ({filteredBugs.length})
                </h4>
                <div className="space-y-3">
                    {filteredBugs.map((bug) => {
                        const linkedTestCases = getLinkedTestCases(bug.id);
                        return (
                            <div key={bug.id} className="bg-white border rounded-lg p-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-2 mb-2">
                                            <h5 className="text-sm font-medium text-gray-900">{bug.title}</h5>
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(bug.status)}`}>
                                                {bug.status || 'open'}
                                            </span>
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSeverityColor(bug.severity)}`}>
                                                {bug.severity || 'medium'}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-600 mb-2">{bug.description}</p>
                                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                                            <span>Module: {bug.module || 'Unassigned'}</span>
                                            <span>Reporter: {bug.reporter || 'Unknown'}</span>
                                        </div>
                                    </div>
                                    <div className="ml-4">
                                        <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                                            linkedTestCases.length > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                        }`}>
                                            {linkedTestCases.length > 0 ? (
                                                <>
                                                    <CheckCircle2 className="w-3 h-3 mr-1" />
                                                    {linkedTestCases.length} linked
                                                </>
                                            ) : (
                                                <>
                                                    <AlertTriangle className="w-3 h-3 mr-1" />
                                                    Not linked
                                                </>
                                            )}
                                        </span>
                                    </div>
                                </div>
                                {linkedTestCases.length > 0 && (
                                    <div className="mt-3 pt-3 border-t border-gray-200">
                                        <p className="text-xs font-medium text-gray-700 mb-2">Linked Test Cases:</p>
                                        <div className="space-y-1">
                                            {linkedTestCases.map((testCase) => (
                                                <div key={testCase.id} className="flex items-center text-sm text-gray-600 bg-gray-50 rounded px-2 py-1">
                                                    <TestTube className="w-3 h-3 text-green-500 mr-2" />
                                                    <span className="flex-1">{testCase.name}</span>
                                                    <span className="text-xs text-gray-500">{testCase.module}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Test Cases Section */}
            <div>
                <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <TestTube className="w-5 h-5 text-green-500 mr-2" />
                    Test Cases ({filteredTestCases.length})
                </h4>
                <div className="space-y-3">
                    {filteredTestCases.map((testCase) => {
                        const linkedBugs = getLinkedBugs(testCase.id);
                        return (
                            <div key={testCase.id} className="bg-white border rounded-lg p-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-2 mb-2">
                                            <h5 className="text-sm font-medium text-gray-900">{testCase.name}</h5>
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                                testCase.status === 'passed' ? 'bg-green-100 text-green-800' :
                                                testCase.status === 'failed' ? 'bg-red-100 text-red-800' :
                                                testCase.status === 'blocked' ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-gray-100 text-gray-800'
                                            }`}>
                                                {testCase.status || 'not-run'}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-600 mb-2">{testCase.description}</p>
                                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                                            <span>Module: {testCase.module || 'Unassigned'}</span>
                                            <span>Priority: {testCase.priority || 'Medium'}</span>
                                        </div>
                                    </div>
                                    <div className="ml-4">
                                        <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                                            linkedBugs.length > 0 ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-800'
                                        }`}>
                                            {linkedBugs.length > 0 ? (
                                                <>
                                                    <Bug className="w-3 h-3 mr-1" />
                                                    {linkedBugs.length} bug{linkedBugs.length > 1 ? 's' : ''}
                                                </>
                                            ) : (
                                                <>
                                                    <CheckCircle2 className="w-3 h-3 mr-1" />
                                                    No bugs
                                                </>
                                            )}
                                        </span>
                                    </div>
                                </div>
                                {linkedBugs.length > 0 && (
                                    <div className="mt-3 pt-3 border-t border-gray-200">
                                        <p className="text-xs font-medium text-gray-700 mb-2">Related Bugs:</p>
                                        <div className="space-y-1">
                                            {linkedBugs.map((bug) => (
                                                <div key={bug.id} className="flex items-center text-sm text-gray-600 bg-red-50 rounded px-2 py-1">
                                                    <Bug className="w-3 h-3 text-red-500 mr-2" />
                                                    <span className="flex-1">{bug.title}</span>
                                                    <span className={`text-xs px-1 py-0.5 rounded ${getSeverityColor(bug.severity)}`}>
                                                        {bug.severity}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );

    const renderStatsView = () => (
        <div className="space-y-6">
            {/* Overall Coverage */}
            <div className="bg-white border rounded-lg p-6">
                <h4 className="text-lg font-medium text-gray-900 mb-4">Overall Traceability Coverage</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">Bug Coverage</span>
                            <span className="text-sm font-bold text-blue-600">{stats.bugsCoverage}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                                className="bg-blue-600 h-2 rounded-full" 
                                style={{ width: `${stats.bugsCoverage}%` }}
                            ></div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            {stats.bugsWithTestCases} of {stats.totalBugs} bugs have test cases
                        </p>
                    </div>
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">Test Case Coverage</span>
                            <span className="text-sm font-bold text-green-600">{stats.testCasesCoverage}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                                className="bg-green-600 h-2 rounded-full" 
                                style={{ width: `${stats.testCasesCoverage}%` }}
                            ></div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            {stats.testCasesWithBugs} of {stats.totalTestCases} test cases are linked to bugs
                        </p>
                    </div>
                </div>
            </div>

            {/* Module-wise Statistics */}
            {modules.length > 0 && (
                <div className="bg-white border rounded-lg p-6">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Module-wise Coverage</h4>
                    <div className="space-y-4">
                        {modules.map((module) => {
                            const moduleData = stats.moduleStats[module];
                            return (
                                <div key={module} className="border rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <h5 className="font-medium text-gray-900">{module}</h5>
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                            moduleData.coverage >= 80 ? 'bg-green-100 text-green-800' :
                                            moduleData.coverage >= 60 ? 'bg-yellow-100 text-yellow-800' :
                                            'bg-red-100 text-red-800'
                                        }`}>
                                            {moduleData.coverage}% coverage
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-4 mb-3">
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-blue-600">{moduleData.bugs}</div>
                                            <div className="text-xs text-gray-500">Bugs</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-green-600">{moduleData.testCases}</div>
                                            <div className="text-xs text-gray-500">Test Cases</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-purple-600">{moduleData.linkedBugs}</div>
                                            <div className="text-xs text-gray-500">Linked Bugs</div>
                                        </div>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div 
                                            className={`h-2 rounded-full ${
                                                moduleData.coverage >= 80 ? 'bg-green-600' :
                                                moduleData.coverage >= 60 ? 'bg-yellow-600' :
                                                'bg-red-600'
                                            }`}
                                            style={{ width: `${moduleData.coverage}%` }}
                                        ></div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-4 mx-auto p-5 border w-11/12 max-w-7xl shadow-lg rounded-md bg-gray-50 min-h-[95vh]">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center">
                        <Link className="w-6 h-6 text-teal-600 mr-2" />
                        <h3 className="text-lg font-medium text-gray-900">Traceability Matrix</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Controls */}
                <div className="bg-white rounded-lg p-4 mb-6 shadow-sm">
                    <div className="flex flex-col lg:flex-row gap-4">
                        {/* Search */}
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                                <input
                                    type="text"
                                    placeholder="Search bugs, test cases, or modules..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500"
                                />
                            </div>
                        </div>

                        {/* Module Filter */}
                        <select
                            value={selectedModule}
                            onChange={(e) => setSelectedModule(e.target.value)}
                            className="border border-gray-300 rounded-md px-3 py-2 focus:ring-teal-500 focus:border-teal-500"
                        >
                            <option value="all">All Modules</option>
                            {modules.map((module) => (
                                <option key={module} value={module}>
                                    {module}
                                </option>
                            ))}
                        </select>

                        {/* Show Only Linked Toggle */}
                        <label className="flex items-center space-x-2 text-sm">
                            <input
                                type="checkbox"
                                checked={showOnlyLinked}
                                onChange={(e) => setShowOnlyLinked(e.target.checked)}
                                className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                            />
                            <span>Show only linked items</span>
                        </label>

                        {/* View Type Selector */}
                        <div className="flex items-center space-x-1 border border-gray-300 rounded-md p-1">
                            <button
                                onClick={() => setViewType('matrix')}
                                className={`p-2 rounded ${viewType === 'matrix' ? 'bg-teal-100 text-teal-700' : 'text-gray-600 hover:bg-gray-100'}`}
                                title="Matrix View"
                            >
                                <Grid className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setViewType('list')}
                                className={`p-2 rounded ${viewType === 'list' ? 'bg-teal-100 text-teal-700' : 'text-gray-600 hover:bg-gray-100'}`}
                                title="List View"
                            >
                                <List className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setViewType('stats')}
                                className={`p-2 rounded ${viewType === 'stats' ? 'bg-teal-100 text-teal-700' : 'text-gray-600 hover:bg-gray-100'}`}
                                title="Statistics View"
                            >
                                <BarChart3 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="bg-white rounded-lg shadow-sm min-h-96">
                    <div className="p-6">
                        {viewType === 'matrix' && renderMatrixView()}
                        {viewType === 'list' && renderListView()}
                        {viewType === 'stats' && renderStatsView()}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BugTraceabilityModal;