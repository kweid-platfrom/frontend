"use client"
import React, { useState } from 'react';
import { X } from 'lucide-react';

const ReportExportModal = ({ testCases, onClose }) => {
    const [format, setFormat] = useState('pdf');
    const [includeDetails, setIncludeDetails] = useState(true);
    const [includeSteps, setIncludeSteps] = useState(true);
    const [includeSummaryStats, setIncludeSummaryStats] = useState(true);
    const [generating, setGenerating] = useState(false);

    // Calculate summary statistics
    const totalTestCases = testCases.length;
    const executionStatus = testCases.reduce((acc, tc) => {
        acc[tc.executionStatus] = (acc[tc.executionStatus] || 0) + 1;
        return acc;
    }, {});

    const priorityDistribution = testCases.reduce((acc, tc) => {
        acc[tc.priority] = (acc[tc.priority] || 0) + 1;
        return acc;
    }, {});

    const handleExport = () => {
        setGenerating(true);

        // Simulate export generation delay
        setTimeout(() => {
            setGenerating(false);

            // In a real app, this would generate and download the report
            const reportConfig = {
                format,
                includeDetails,
                includeSteps,
                includeSummaryStats,
                testCases: testCases.map(tc => tc.id),
                timestamp: new Date().toISOString()
            };

            console.log('Exporting report with config:', reportConfig);

            // Simulate download trigger
            const fakeDownloadLink = document.createElement('a');
            fakeDownloadLink.href = '#';
            fakeDownloadLink.setAttribute('download', `test-case-report-${new Date().toISOString().split('T')[0]}.${format}`);
            fakeDownloadLink.click();

            onClose();
        }, 2000);
    };

    // Helper function to get priority color
    const getPriorityColor = (priority) => {
        switch (priority.toLowerCase()) {
            case 'high':
                return 'bg-red-100 text-red-800';
            case 'medium':
                return 'bg-yellow-100 text-yellow-800';
            case 'low':
                return 'bg-blue-100 text-blue-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
            <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full">
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-900">Export Report</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-500"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <div className="p-6">
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-lg font-medium text-gray-900">Report Summary</h3>
                            <div className="mt-2 grid grid-cols-2 gap-4">
                                <div className="bg-gray-50 p-3 rounded">
                                    <p className="text-sm text-gray-500">Total Test Cases</p>
                                    <p className="text-3xl font-bold text-gray-900">{totalTestCases}</p>
                                </div>
                                <div className="bg-gray-50 p-3 rounded">
                                    <p className="text-sm text-gray-500">Execution Status</p>
                                    <div className="mt-1">
                                        {Object.entries(executionStatus).map(([status, count]) => (
                                            <div key={status} className="flex justify-between items-center text-sm">
                                                <span className={`px-1.5 inline-flex text-xs leading-5 font-semibold rounded-full ${status === 'Passed' ? 'bg-green-100 text-green-800' :
                                                        status === 'Failed' ? 'bg-red-100 text-red-800' :
                                                            'bg-gray-100 text-gray-800'
                                                    }`}>
                                                    {status}
                                                </span>
                                                <span>{count}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Priority Distribution */}
                            <div className="mt-4 bg-gray-50 p-3 rounded">
                                <p className="text-sm text-gray-500">Priority Distribution</p>
                                <div className="mt-1 grid grid-cols-2 gap-2">
                                    {Object.entries(priorityDistribution).map(([priority, count]) => (
                                        <div key={priority} className="flex justify-between items-center text-sm">
                                            <span className={`px-1.5 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityColor(priority)}`}>
                                                {priority}
                                            </span>
                                            <span>{count}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-lg font-medium text-gray-900">Export Options</h3>
                            <div className="mt-4 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Format</label>
                                    <select
                                        value={format}
                                        onChange={(e) => setFormat(e.target.value)}
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-[#00897B] focus:border-[#00897B]"
                                    >
                                        <option value="pdf">PDF Document</option>
                                        <option value="xlsx">Excel Spreadsheet</option>
                                        <option value="csv">CSV File</option>
                                        <option value="html">HTML Report</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center">
                                        <input
                                            id="include-details"
                                            type="checkbox"
                                            checked={includeDetails}
                                            onChange={(e) => setIncludeDetails(e.target.checked)}
                                            className="h-4 w-4 text-[#00897B] focus:ring-[#00897A] border-gray-300 rounded"
                                        />
                                        <label htmlFor="include-details" className="ml-2 text-sm text-gray-700">
                                            Include test case details
                                        </label>
                                    </div>

                                    <div className="flex items-center">
                                        <input
                                            id="include-steps"
                                            type="checkbox"
                                            checked={includeSteps}
                                            onChange={(e) => setIncludeSteps(e.target.checked)}
                                            className="h-4 w-4 text-[#00897B] focus:ring-[#00897A] border-gray-300 rounded"
                                        />
                                        <label htmlFor="include-steps" className="ml-2 text-sm text-gray-700">
                                            Include test steps
                                        </label>
                                    </div>

                                    <div className="flex items-center">
                                        <input
                                            id="include-summary"
                                            type="checkbox"
                                            checked={includeSummaryStats}
                                            onChange={(e) => setIncludeSummaryStats(e.target.checked)}
                                            className="h-4 w-4 text-[#00897B] focus:ring-[#00897A]border-gray-300 rounded"
                                        />
                                        <label htmlFor="include-summary" className="ml-2 text-sm text-gray-700">
                                            Include summary statistics
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 mr-4 border border-gray-300 rounded shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                            disabled={generating}
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleExport}
                            className="px-4 py-2 border border-transparent rounded shadow-sm text-sm font-medium text-white bg-[#00897B] hover:bg-[#49928b]"
                            disabled={generating}
                        >
                            {generating ? 'Generating...' : 'Export Report'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReportExportModal;