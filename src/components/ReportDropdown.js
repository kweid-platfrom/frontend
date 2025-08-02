// components/layout/ReportDropdown.js
'use client'
import { useState, useRef, useEffect } from 'react';
import { DocumentTextIcon } from '@heroicons/react/24/outline';

const ReportDropdown = () => {
    const [showReportOptions, setShowReportOptions] = useState(false);
    const [reportDropdownPosition, setReportDropdownPosition] = useState({ top: 0, left: 0, right: 'auto' });
    const reportDropdownRef = useRef(null);
    const reportButtonRef = useRef(null);

    const toggleReportDropdown = () => {
        setShowReportOptions(!showReportOptions);
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (reportDropdownRef.current && !reportDropdownRef.current.contains(event.target) &&
                reportButtonRef.current && !reportButtonRef.current.contains(event.target)) {
                setShowReportOptions(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Calculate dropdown position
    useEffect(() => {
        if (showReportOptions && reportButtonRef.current) {
            const rect = reportButtonRef.current.getBoundingClientRect();
            const dropdownWidth = 160;
            const windowWidth = window.innerWidth;
            const spaceOnRight = windowWidth - rect.left;

            setReportDropdownPosition({
                top: rect.bottom + window.scrollY,
                left: spaceOnRight >= dropdownWidth ? rect.left : 'auto',
                right: spaceOnRight >= dropdownWidth ? 'auto' : (windowWidth - rect.right)
            });
        }
    }, [showReportOptions]);

    const handleReportOption = (reportType) => {
        console.log('Generate report:', reportType);
        setShowReportOptions(false);
        // Add your report generation logic here
    };

    return (
        <>
            <div className="relative">
                <button
                    ref={reportButtonRef}
                    onClick={toggleReportDropdown}
                    className="text-gray-700 px-2 lg:px-3 py-2 text-sm rounded-md flex items-center space-x-1 lg:space-x-2 hover:bg-blue-100 hover:text-blue-700 transition-colors"
                >
                    <DocumentTextIcon className="h-4 w-4" />
                    <span className="hidden lg:inline">Generate Report</span>
                </button>
            </div>

            {/* Report Options Dropdown */}
            {showReportOptions && (
                <div
                    ref={reportDropdownRef}
                    className="fixed bg-white border border-gray-200 shadow-lg rounded-lg text-sm z-50"
                    style={{
                        top: `${reportDropdownPosition.top}px`,
                        left: reportDropdownPosition.left !== 'auto' ? `${reportDropdownPosition.left}px` : 'auto',
                        right: reportDropdownPosition.right !== 'auto' ? `${reportDropdownPosition.right}px` : 'auto',
                        minWidth: '160px'
                    }}
                >
                    <div className="py-1">
                        <button 
                            onClick={() => handleReportOption('bug-summary')}
                            className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700"
                        >
                            Bug Summary
                        </button>
                        <button 
                            onClick={() => handleReportOption('bug-report')}
                            className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700"
                        >
                            Bug Report
                        </button>
                        <button 
                            onClick={() => handleReportOption('test-execution')}
                            className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700"
                        >
                            Test Execution Report
                        </button>
                        <button 
                            onClick={() => handleReportOption('sprint-summary')}
                            className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700"
                        >
                            Sprint Summary
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};

export default ReportDropdown;