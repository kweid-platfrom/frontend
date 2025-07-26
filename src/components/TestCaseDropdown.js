// components/layout/TestCaseDropdown.js
'use client'
import { useState, useRef, useEffect } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';

const TestCaseDropdown = () => {
    const [showTestCaseOptions, setShowTestCaseOptions] = useState(false);
    const [testCaseDropdownPosition, setTestCaseDropdownPosition] = useState({ top: 0, left: 0, right: 'auto' });
    const testCaseDropdownRef = useRef(null);
    const testCaseButtonRef = useRef(null);

    const toggleTestCaseDropdown = () => {
        setShowTestCaseOptions(!showTestCaseOptions);
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (testCaseDropdownRef.current && !testCaseDropdownRef.current.contains(event.target) &&
                testCaseButtonRef.current && !testCaseButtonRef.current.contains(event.target)) {
                setShowTestCaseOptions(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Calculate dropdown position
    useEffect(() => {
        if (showTestCaseOptions && testCaseButtonRef.current) {
            const rect = testCaseButtonRef.current.getBoundingClientRect();
            const dropdownWidth = 180;
            const windowWidth = window.innerWidth;
            const spaceOnRight = windowWidth - rect.left;

            setTestCaseDropdownPosition({
                top: rect.bottom + window.scrollY,
                left: spaceOnRight >= dropdownWidth ? rect.left : 'auto',
                right: spaceOnRight >= dropdownWidth ? 'auto' : (windowWidth - rect.right)
            });
        }
    }, [showTestCaseOptions]);

    const handleTestCaseOption = (optionType) => {
        console.log('Test case option:', optionType);
        setShowTestCaseOptions(false);
        // Add your test case creation/import logic here
    };

    return (
        <>
            <div className="relative">
                <button
                    ref={testCaseButtonRef}
                    onClick={toggleTestCaseDropdown}
                    className="text-gray-700 px-2 lg:px-3 py-2 text-sm rounded-md flex items-center space-x-1 lg:space-x-2 hover:bg-purple-100 hover:text-purple-700 transition-colors cursor-pointer"
                >
                    <PlusIcon className="h-4 w-4" />
                    <span className="hidden lg:inline">Add Test Case</span>
                </button>
            </div>

            {/* Test Case Options Dropdown */}
            {showTestCaseOptions && (
                <div
                    ref={testCaseDropdownRef}
                    className="fixed bg-white border border-gray-200 shadow-lg rounded-lg text-sm z-50"
                    style={{
                        top: `${testCaseDropdownPosition.top}px`,
                        left: testCaseDropdownPosition.left !== 'auto' ? `${testCaseDropdownPosition.left}px` : 'auto',
                        right: testCaseDropdownPosition.right !== 'auto' ? `${testCaseDropdownPosition.right}px` : 'auto',
                        minWidth: '180px'
                    }}
                >
                    <div className="py-1">
                        <button 
                            onClick={() => handleTestCaseOption('new-test-case')}
                            className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700"
                        >
                            New Test Case
                        </button>
                        <button 
                            onClick={() => handleTestCaseOption('import-test-cases')}
                            className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700"
                        >
                            Import Test Cases
                        </button>
                        <button 
                            onClick={() => handleTestCaseOption('bulk-create')}
                            className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700"
                        >
                            Bulk Create
                        </button>
                        <button 
                            onClick={() => handleTestCaseOption('from-template')}
                            className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700"
                        >
                            From Template
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};

export default TestCaseDropdown;