"use client";

import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import { Bug, Play, Download, CheckCircle, XCircle } from 'lucide-react';

// Test Suites (remain the same as previous example)
const testSuites = {
    bugTracker: [
        {
            name: 'Create Bug',
            test: async () => {
                await new Promise(resolve => setTimeout(resolve, 500));
                return Math.random() > 0.1;
            }
        },
        {
            name: 'Update Bug Status',
            test: async () => {
                await new Promise(resolve => setTimeout(resolve, 500));
                return Math.random() > 0.2;
            }
        },
        {
            name: 'Filter Bugs',
            test: async () => {
                await new Promise(resolve => setTimeout(resolve, 500));
                return Math.random() > 0.3;
            }
        }
    ],
    userAuthentication: [
        {
            name: 'Login Functionality',
            test: async () => {
                await new Promise(resolve => setTimeout(resolve, 500));
                return Math.random() > 0.1;
            }
        },
        {
            name: 'Password Reset',
            test: async () => {
                await new Promise(resolve => setTimeout(resolve, 500));
                return Math.random() > 0.2;
            }
        }
    ]
};

const TestScriptPage = () => {
    const [testResults, setTestResults] = useState({});
    const [isRunning, setIsRunning] = useState(false);

    const runAllTests = async () => {
        setIsRunning(true);
        const results = {};

        for (const [suiteName, tests] of Object.entries(testSuites)) {
            results[suiteName] = [];
            for (const test of tests) {
                try {
                    const result = await test.test();
                    results[suiteName].push({
                        name: test.name,
                        status: result ? 'Passed' : 'Failed',
                        timestamp: new Date().toISOString()
                    });
                } catch (error) {
                    results[suiteName].push({
                        name: test.name,
                        status: 'Error',
                        error: error.message,
                        timestamp: new Date().toISOString()
                    });
                }
            }
        }

        setTestResults(results);
        setIsRunning(false);
    };

    const exportResultsPDF = () => {
        const doc = new jsPDF();
        let yOffset = 20;

        doc.setFontSize(18);
        doc.text('Test Results', 10, yOffset);
        yOffset += 10;

        Object.entries(testResults).forEach(([suiteName, tests]) => {
            doc.setFontSize(14);
            doc.text(`Test Suite: ${suiteName}`, 10, yOffset);
            yOffset += 10;

            tests.forEach(test => {
                doc.setFontSize(12);
                doc.text(`Test: ${test.name}`, 15, yOffset);
                yOffset += 7;
                doc.text(`Status: ${test.status}`, 15, yOffset);
                yOffset += 7;
                doc.text(`Timestamp: ${test.timestamp}`, 15, yOffset);
                yOffset += 10;
            });

            yOffset += 10;
        });

        doc.save('test_results.pdf');
    };

    const exportResultsExcel = () => {
        const workbook = XLSX.utils.book_new();
        
        Object.entries(testResults).forEach(([suiteName, tests]) => {
            const worksheet = XLSX.utils.json_to_sheet(tests);
            XLSX.utils.book_append_sheet(workbook, worksheet, suiteName);
        });

        XLSX.writeFile(workbook, 'test_results.xlsx');
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="max-w-4xl mx-auto bg-white shadow-md rounded-lg p-6">
                <h1 className="text-2xl font-bold mb-6 flex items-center">
                    <Bug className="mr-2" /> Automated Test Script
                </h1>

                <div className="mb-6 flex space-x-4">
                    <button
                        onClick={runAllTests}
                        disabled={isRunning}
                        className={`flex items-center px-4 py-2 rounded ${
                            isRunning 
                                ? 'bg-gray-400 cursor-not-allowed' 
                                : 'bg-[#00897B] hover:bg-[#00695C] text-white'
                        }`}
                    >
                        <Play className="mr-2" /> 
                        {isRunning ? 'Running Tests...' : 'Run All Tests'}
                    </button>

                    {Object.keys(testResults).length > 0 && (
                        <div className="flex space-x-2">
                            <button
                                onClick={exportResultsPDF}
                                className="flex items-center px-4 py-2 bg-[#EAEBF1] hover:bg-[#E1E2E6] text-[#2d3142] rounded"
                            >
                                <Download className="mr-2" /> Export PDF
                            </button>
                            <button
                                onClick={exportResultsExcel}
                                className="flex items-center px-4 py-2 bg-[#EAEBF1] hover:bg-[#E1E2E6] text-[#2d3142] rounded"
                            >
                                <Download className="mr-2" /> Export Excel
                            </button>
                        </div>
                    )}
                </div>

                {Object.entries(testResults).map(([suiteName, tests]) => (
                    <div key={suiteName} className="mb-6">
                        <h2 className="text-xl font-semibold mb-4">{suiteName} Test Suite</h2>
                        <div className="grid gap-4">
                            {tests.map((test, index) => (
                                <div 
                                    key={index} 
                                    className={`p-4 rounded-lg flex justify-between items-center ${
                                        test.status === 'Passed' 
                                            ? 'bg-green-100' 
                                            : test.status === 'Failed' 
                                            ? 'bg-red-100' 
                                            : 'bg-yellow-100'
                                    }`}
                                >
                                    <div>
                                        <div className="font-medium">{test.name}</div>
                                        <div className="text-sm text-gray-600">{test.timestamp}</div>
                                    </div>
                                    <div className="flex items-center">
                                        {test.status === 'Passed' ? (
                                            <CheckCircle className="text-green-600 mr-2" />
                                        ) : test.status === 'Failed' ? (
                                            <XCircle className="text-red-600 mr-2" />
                                        ) : (
                                            <XCircle className="text-yellow-600 mr-2" />
                                        )}
                                        <span>{test.status}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TestScriptPage;