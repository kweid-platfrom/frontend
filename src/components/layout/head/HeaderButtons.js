
// HeaderButtons.jsx - Fixed mobile dropdown styling consistency
import React, { useState, useRef, useEffect } from 'react';
import { Play, Target, FileText, MoreHorizontal, Plus as PlusIcon, Bug as BugIcon } from 'lucide-react';
import { DocumentTextIcon } from '@heroicons/react/24/outline';
import { Button } from '../../ui/button';
import BugReportButton from '../../modals/BugReportButton';
import ScreenRecorderButton from '../../recorder/ScreenRecorderButton';
import ReportDropdown from '../../ReportDropdown';
import TestCaseDropdown from '../../TestCaseDropdown';

const HeaderButtons = ({
    onCreateSprint,
    onCreateDocument,
    activeSuite,
    firestoreService,
    onReportBug,
    disabled = false
}) => {
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const [mobileMenuPosition, setMobileMenuPosition] = useState({ 
        top: 0, 
        left: 0, 
        right: 'auto' 
    });

    const mobileMenuRef = useRef(null);
    const mobileMenuButtonRef = useRef(null);

    const toggleMobileMenu = () => {
        if (disabled) return;
        if (!showMobileMenu) {
            calculateMobileMenuPosition();
        }
        setShowMobileMenu(!showMobileMenu);
    };

    const calculateMobileMenuPosition = () => {
        if (mobileMenuButtonRef.current) {
            const rect = mobileMenuButtonRef.current.getBoundingClientRect();
            const dropdownWidth = 250;
            const windowWidth = window.innerWidth;
            const spaceOnRight = windowWidth - rect.left;

            setMobileMenuPosition({
                top: rect.bottom + window.scrollY + 4,
                left: spaceOnRight >= dropdownWidth ? rect.left : 'auto',
                right: spaceOnRight >= dropdownWidth ? 'auto' : windowWidth - rect.right,
            });
        }
    };

    useEffect(() => {
        if (disabled) return;
        
        const handleClickOutside = (event) => {
            if (
                mobileMenuRef.current &&
                !mobileMenuRef.current.contains(event.target) &&
                mobileMenuButtonRef.current &&
                !mobileMenuButtonRef.current.contains(event.target)
            ) {
                setShowMobileMenu(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [disabled]);

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 768) {
                setShowMobileMenu(false);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleMobileAction = (action) => {
        action();
        setShowMobileMenu(false);
    };

    const handleReportGeneration = (reportType) => {
        console.log('Generate report:', reportType);
        setShowMobileMenu(false);
        // Add your report generation logic here
    };

    const handleTestCaseAction = (actionType) => {
        console.log('Test case action:', actionType);
        setShowMobileMenu(false);
        // Add your test case logic here
    };

    const handleBugReport = () => {
        setShowMobileMenu(false);
        if (onReportBug) {
            onReportBug();
        }
        // Bug report logic will be handled by the parent component
    };

    return (
        <div className="flex items-center justify-end">
            {/* Mobile Layout (xs to md) */}
            <div className="flex items-center space-x-1 md:hidden">
                <ScreenRecorderButton
                    firestoreService={firestoreService}
                    activeSuite={activeSuite}
                    disabled={disabled}
                    className="text-foreground hover:bg-accent/50 flex-shrink-0"
                    isPrimary={true}
                    iconOnly={true}
                />

                <div className="relative">
                    <Button
                        ref={mobileMenuButtonRef}
                        variant="ghost"
                        size="iconSm"
                        onClick={toggleMobileMenu}
                        disabled={disabled}
                        className="text-foreground hover:bg-accent/50 flex-shrink-0"
                    >
                        <MoreHorizontal className="h-5 w-5" />
                    </Button>

                    {showMobileMenu && !disabled && (
                        <div
                            ref={mobileMenuRef}
                            className="fixed bg-card border border-border shadow-lg rounded-lg z-50"
                            style={{
                                top: `${mobileMenuPosition.top}px`,
                                left: mobileMenuPosition.left !== 'auto' ? `${mobileMenuPosition.left}px` : 'auto',
                                right: mobileMenuPosition.right !== 'auto' ? `${mobileMenuPosition.right}px` : 'auto',
                                minWidth: '200px',
                                maxWidth: '250px',
                            }}
                        >
                            <div className="py-2">
                                {/* Consistent button styling for mobile dropdown */}
                                <button
                                    onClick={() => handleMobileAction(onCreateSprint)}
                                    disabled={!activeSuite}
                                    className="w-full flex items-center px-4 py-3 text-sm text-foreground hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Target className="h-4 w-4 mr-3 flex-shrink-0" />
                                    <span className="flex-1 text-left">Create Sprint</span>
                                </button>

                                <button
                                    onClick={() => handleMobileAction(onCreateDocument)}
                                    className="w-full flex items-center px-4 py-3 text-sm text-foreground hover:bg-accent transition-colors"
                                >
                                    <FileText className="h-4 w-4 mr-3 flex-shrink-0" />
                                    <span className="flex-1 text-left">Create Document</span>
                                </button>

                                <button
                                    onClick={() => setShowMobileMenu(false)}
                                    className="w-full flex items-center px-4 py-3 text-sm text-foreground hover:bg-accent transition-colors"
                                >
                                    <Play className="h-4 w-4 mr-3 flex-shrink-0" />
                                    <span className="flex-1 text-left">Run Tests</span>
                                </button>

                                <div className="border-t border-border my-2"></div>

                                {/* Simple buttons for mobile - consistent styling */}
                                <button
                                    onClick={() => handleReportGeneration('bug-summary')}
                                    className="w-full flex items-center px-4 py-3 text-sm text-foreground hover:bg-accent transition-colors"
                                >
                                    <DocumentTextIcon className="h-4 w-4 mr-3 flex-shrink-0" />
                                    <span className="flex-1 text-left">Generate Report</span>
                                </button>

                                <button
                                    onClick={() => handleTestCaseAction('new-test-case')}
                                    className="w-full flex items-center px-4 py-3 text-sm text-foreground hover:bg-accent transition-colors"
                                >
                                    <PlusIcon className="h-4 w-4 mr-3 flex-shrink-0" />
                                    <span className="flex-1 text-left">Add Test Case</span>
                                </button>

                                <div className="border-t border-border my-2"></div>

                                <button
                                    onClick={handleBugReport}
                                    disabled={disabled}
                                    className="w-full flex items-center px-4 py-3 text-sm text-foreground hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <BugIcon className="h-4 w-4 mr-3 flex-shrink-0" />
                                    <span className="flex-1 text-left">Report Bug</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Tablet Layout (md to lg) - Fixed icon visibility */}
            <div className="hidden md:flex lg:hidden items-center space-x-1">
                <Button
                    variant="ghost"
                    size="iconSm"
                    onClick={onCreateSprint}
                    disabled={disabled || !activeSuite}
                    className="text-foreground hover:bg-accent/50 flex-shrink-0"
                    title="Create Sprint"
                >
                    <Target className="h-4 w-4" />
                </Button>

                <Button
                    variant="ghost"
                    size="iconSm"
                    onClick={onCreateDocument}
                    disabled={disabled}
                    className="text-foreground hover:bg-accent/50 flex-shrink-0"
                    title="Create Document"
                >
                    <FileText className="h-4 w-4" />
                </Button>

                <Button
                    variant="ghost"
                    size="iconSm"
                    disabled={disabled}
                    className="text-foreground hover:bg-accent/50 flex-shrink-0"
                    title="Run Tests"
                >
                    <Play className="h-4 w-4" />
                </Button>

                <ScreenRecorderButton
                    firestoreService={firestoreService}
                    activeSuite={activeSuite}
                    disabled={disabled}
                    className="text-foreground hover:bg-accent/50 flex-shrink-0"
                    isPrimary={true}
                    iconOnly={true}
                />

                <ReportDropdown
                    disabled={disabled}
                    className="text-foreground hover:bg-accent/50 flex-shrink-0"
                    iconOnly={true}
                />

                <TestCaseDropdown
                    disabled={disabled}
                    className="text-foreground hover:bg-accent/50 flex-shrink-0"
                    iconOnly={true}
                />

                <BugReportButton
                    variant="ghost"
                    disabled={disabled}
                    className="text-foreground hover:bg-accent/50 flex-shrink-0"
                    iconOnly={true}
                />
            </div>

            {/* Desktop Layout (lg and up) */}
            <div className="hidden lg:flex items-center space-x-2">
                <Button
                    variant="ghost"
                    onClick={onCreateSprint}
                    disabled={disabled || !activeSuite}
                    leftIcon={<Target className="h-4 w-4" />}
                    className="text-foreground hover:bg-accent/50"
                >
                    Create Sprint
                </Button>

                <Button
                    variant="ghost"
                    onClick={onCreateDocument}
                    disabled={disabled}
                    leftIcon={<FileText className="h-4 w-4" />}
                    className="text-foreground hover:bg-accent/50"
                >
                    Create Document
                </Button>

                <Button
                    variant="ghost"
                    disabled={disabled}
                    leftIcon={<Play className="h-4 w-4" />}
                    className="text-foreground hover:bg-accent/50"
                >
                    Run Tests
                </Button>

                <ScreenRecorderButton
                    firestoreService={firestoreService}
                    activeSuite={activeSuite}
                    disabled={disabled}
                    className="text-foreground hover:bg-accent/50"
                    isPrimary={true}
                />

                <ReportDropdown
                    disabled={disabled}
                    className="text-foreground hover:bg-accent/50"
                />

                <TestCaseDropdown
                    disabled={disabled}
                    className="text-foreground hover:bg-accent/50"
                />

                <BugReportButton
                    variant="ghost"
                    disabled={disabled}
                    className="text-foreground hover:bg-accent/50"
                />
            </div>
        </div>
    );
};

export default HeaderButtons;
            