// DropdownMenu.js

import React from 'react';

const DropdownMenu = ({
    showReportOptions,
    showTestCaseOptions,
    generateBugSummary,
    generateBugReport,
    openAddNewTestCaseModal,
    openImportTestCaseModal,
}) => {
    return (
        <div>
            {/* Generate Report Options */}
            {showReportOptions && (
                <div className="absolute z-10 mt-2 w-48 bg-white border border-gray-200 rounded shadow-md">
                    <button onClick={() => generateBugSummary('weekly')} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Bug Summary (Weekly)</button>
                    <button onClick={() => generateBugSummary('bi-weekly')} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Bug Summary (Bi-Weekly)</button>
                    <button onClick={() => generateBugSummary('monthly')} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Bug Summary (Monthly)</button>
                    <button onClick={() => generateBugReport('weekly')} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Bug Report (Weekly)</button>
                    <button onClick={() => generateBugReport('bi-weekly')} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Bug Report (Bi-Weekly)</button>
                    <button onClick={() => generateBugReport('monthly')} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Bug Report (Monthly)</button>
                </div>
            )}

            {/* Add Test Case Options */}
            {showTestCaseOptions && (
                <div className="absolute z-10 mt-2 w-48 bg-white border border-gray-200 rounded shadow-md">
                    <button onClick={() => openAddNewTestCaseModal()} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Add New</button>
                    <button onClick={() => openImportTestCaseModal()} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Import Test Cases</button>
                </div>
            )}
        </div>
    );
};

export default DropdownMenu;
