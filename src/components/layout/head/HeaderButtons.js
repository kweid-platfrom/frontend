// HeaderButtons.jsx - Replaced Bug Report Button with AI Bug Generator
import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Play, Target, FileText, MoreHorizontal, Plus as PlusIcon, Upload, Sparkles, ChevronDown } from 'lucide-react';
import { DocumentTextIcon } from '@heroicons/react/24/outline';
import { Button } from '../../ui/button';
import AIBugGeneratorButton from '../../modals/AIBugGeneratorButton';
import ScreenRecorderButton from '../../recorder/ScreenRecorderButton';

const HeaderButtons = ({
    onCreateSprint,
    onCreateDocument,
    activeSuite,
    firestoreService,
    onCreateTestCase,
    onImportTestCases,
    onGenerateTestCases,
    onGenerateReport,
    disabled = false
}) => {
    const router = useRouter();
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const [showTabletTestCaseMenu, setShowTabletTestCaseMenu] = useState(false);
    const [showDesktopTestCaseMenu, setShowDesktopTestCaseMenu] = useState(false);
    const [mobileMenuPosition, setMobileMenuPosition] = useState({
        top: 0,
        left: 0,
        right: 'auto'
    });

    const mobileMenuRef = useRef(null);
    const mobileMenuButtonRef = useRef(null);
    const tabletTestCaseMenuRef = useRef(null);
    const tabletTestCaseButtonRef = useRef(null);
    const desktopTestCaseMenuRef = useRef(null);

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

    const toggleMobileMenu = () => {
        if (disabled) return;
        if (!showMobileMenu) {
            calculateMobileMenuPosition();
        }
        setShowMobileMenu(!showMobileMenu);
    };

    // Close dropdowns when clicking outside
    useEffect(() => {
        if (disabled) return;

        const handleClickOutside = (event) => {
            // Mobile menu
            if (
                mobileMenuRef.current &&
                !mobileMenuRef.current.contains(event.target) &&
                mobileMenuButtonRef.current &&
                !mobileMenuButtonRef.current.contains(event.target)
            ) {
                setShowMobileMenu(false);
            }

            // Tablet test case menu
            if (
                tabletTestCaseMenuRef.current &&
                !tabletTestCaseMenuRef.current.contains(event.target) &&
                tabletTestCaseButtonRef.current &&
                !tabletTestCaseButtonRef.current.contains(event.target)
            ) {
                setShowTabletTestCaseMenu(false);
            }

            // Desktop test case menu
            if (
                desktopTestCaseMenuRef.current &&
                !desktopTestCaseMenuRef.current.contains(event.target)
            ) {
                setShowDesktopTestCaseMenu(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [disabled]);

    // Close mobile menu on resize
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 768) {
                setShowMobileMenu(false);
            }
            if (window.innerWidth >= 1024) {
                setShowTabletTestCaseMenu(false);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Handler functions
    const handleRunTests = () => {
        setShowMobileMenu(false);
        router.push('/testruns');
    };

    const handleNewTestCase = () => {
        setShowMobileMenu(false);
        setShowTabletTestCaseMenu(false);
        setShowDesktopTestCaseMenu(false);
        if (onCreateTestCase) {
            onCreateTestCase();
        }
    };

    const handleImportTestCases = () => {
        setShowMobileMenu(false);
        setShowTabletTestCaseMenu(false);
        setShowDesktopTestCaseMenu(false);
        if (onImportTestCases) {
            onImportTestCases();
        }
    };

    const handleGenerateTestCases = () => {
        setShowMobileMenu(false);
        setShowTabletTestCaseMenu(false);
        setShowDesktopTestCaseMenu(false);
        if (onGenerateTestCases) {
            onGenerateTestCases();
        }
    };

    const handleGenerateReport = () => {
        setShowMobileMenu(false);
        if (onGenerateReport) {
            onGenerateReport();
        }
    };

    const handleCreateSprint = () => {
        setShowMobileMenu(false);
        if (onCreateSprint) {
            onCreateSprint();
        }
    };

    const handleCreateDocument = () => {
        setShowMobileMenu(false);
        if (onCreateDocument) {
            onCreateDocument();
        }
    };

    const handleBugCreated = (result) => {
        // Close mobile menu if open
        setShowMobileMenu(false);
        // You can add additional logic here if needed
        console.log('AI Bug created:', result);
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
                            className="fixed bg-card border border-border shadow-lg rounded-lg z-[60]"
                            style={{
                                top: `${mobileMenuPosition.top}px`,
                                left: mobileMenuPosition.left !== 'auto' ? `${mobileMenuPosition.left}px` : 'auto',
                                right: mobileMenuPosition.right !== 'auto' ? `${mobileMenuPosition.right}px` : 'auto',
                                minWidth: '200px',
                                maxWidth: '250px',
                            }}
                        >
                            <div className="py-2">
                                <button
                                    onClick={handleCreateSprint}
                                    disabled={!activeSuite}
                                    className="w-full flex items-center px-4 py-3 text-sm text-foreground hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Target className="h-4 w-4 mr-3 flex-shrink-0" />
                                    <span className="flex-1 text-left">Create Sprint</span>
                                </button>

                                <button
                                    onClick={handleCreateDocument}
                                    className="w-full flex items-center px-4 py-3 text-sm text-foreground hover:bg-accent transition-colors"
                                >
                                    <FileText className="h-4 w-4 mr-3 flex-shrink-0" />
                                    <span className="flex-1 text-left">Create Document</span>
                                </button>

                                <button
                                    onClick={handleRunTests}
                                    className="w-full flex items-center px-4 py-3 text-sm text-foreground hover:bg-accent transition-colors"
                                >
                                    <Play className="h-4 w-4 mr-3 flex-shrink-0" />
                                    <span className="flex-1 text-left">Run Tests</span>
                                </button>

                                <button
                                    onClick={handleGenerateReport}
                                    disabled={!activeSuite}
                                    className="w-full flex items-center px-4 py-3 text-sm text-foreground hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <DocumentTextIcon className="h-4 w-4 mr-3 flex-shrink-0" />
                                    <span className="flex-1 text-left">Generate Report</span>
                                </button>

                                <div className="border-t border-border my-2"></div>

                                <button
                                    onClick={handleNewTestCase}
                                    disabled={!activeSuite}
                                    className="w-full flex items-center px-4 py-3 text-sm text-foreground hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <PlusIcon className="h-4 w-4 mr-3 flex-shrink-0" />
                                    <span className="flex-1 text-left">New Test Case</span>
                                </button>

                                <button
                                    onClick={handleImportTestCases}
                                    disabled={!activeSuite}
                                    className="w-full flex items-center px-4 py-3 text-sm text-foreground hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Upload className="h-4 w-4 mr-3 flex-shrink-0" />
                                    <span className="flex-1 text-left">Import Test Cases</span>
                                </button>

                                <button
                                    onClick={handleGenerateTestCases}
                                    disabled={!activeSuite}
                                    className="w-full flex items-center px-4 py-3 text-sm text-foreground hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Sparkles className="h-4 w-4 mr-3 flex-shrink-0" />
                                    <span className="flex-1 text-left">Generate with AI</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Tablet Layout (md to lg) */}
            <div className="hidden md:flex lg:hidden items-center space-x-1">
                <Button
                    variant="ghost"
                    size="iconSm"
                    onClick={handleCreateSprint}
                    disabled={disabled || !activeSuite}
                    className="text-foreground hover:bg-accent/50 flex-shrink-0"
                    title="Create Sprint"
                >
                    <Target className="h-4 w-4" />
                </Button>

                <Button
                    variant="ghost"
                    size="iconSm"
                    onClick={handleCreateDocument}
                    disabled={disabled}
                    className="text-foreground hover:bg-accent/50 flex-shrink-0"
                    title="Create Document"
                >
                    <FileText className="h-4 w-4" />
                </Button>

                <Button
                    variant="ghost"
                    size="iconSm"
                    onClick={handleRunTests}
                    disabled={disabled}
                    className="text-foreground hover:bg-accent/50 flex-shrink-0"
                    title="Run Tests"
                >
                    <Play className="h-4 w-4" />
                </Button>

                <Button
                    variant="ghost"
                    size="iconSm"
                    onClick={handleGenerateReport}
                    disabled={disabled || !activeSuite}
                    className="text-foreground hover:bg-accent/50 flex-shrink-0"
                    title="Generate Report"
                >
                    <DocumentTextIcon className="h-4 w-4" />
                </Button>

                <ScreenRecorderButton
                    firestoreService={firestoreService}
                    activeSuite={activeSuite}
                    disabled={disabled}
                    className="text-foreground hover:bg-accent/50 flex-shrink-0"
                    isPrimary={true}
                    iconOnly={true}
                />

                {/* Test Case Dropdown for Tablet */}
                <div className="relative">
                    <Button
                        ref={tabletTestCaseButtonRef}
                        variant="ghost"
                        size="iconSm"
                        onClick={() => setShowTabletTestCaseMenu(!showTabletTestCaseMenu)}
                        disabled={disabled || !activeSuite}
                        className="text-foreground hover:bg-accent/50 flex-shrink-0"
                        title="Test Case Actions"
                    >
                        <PlusIcon className="h-4 w-4" />
                    </Button>
                    
                    {showTabletTestCaseMenu && !disabled && (
                        <div 
                            ref={tabletTestCaseMenuRef}
                            className="absolute right-0 mt-2 w-56 bg-card border border-border shadow-lg rounded-lg z-[60]"
                        >
                            <div className="py-2">
                                <button
                                    onClick={handleNewTestCase}
                                    disabled={!activeSuite}
                                    className="w-full flex items-center px-4 py-3 text-sm text-foreground hover:bg-accent transition-colors disabled:opacity-50"
                                >
                                    <PlusIcon className="h-4 w-4 mr-3" />
                                    <span>New Test Case</span>
                                </button>
                                <button
                                    onClick={handleImportTestCases}
                                    disabled={!activeSuite}
                                    className="w-full flex items-center px-4 py-3 text-sm text-foreground hover:bg-accent transition-colors disabled:opacity-50"
                                >
                                    <Upload className="h-4 w-4 mr-3" />
                                    <span>Import Test Cases</span>
                                </button>
                                <button
                                    onClick={handleGenerateTestCases}
                                    disabled={!activeSuite}
                                    className="w-full flex items-center px-4 py-3 text-sm text-foreground hover:bg-accent transition-colors disabled:opacity-50"
                                >
                                    <Sparkles className="h-4 w-4 mr-3" />
                                    <span>Generate with AI</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <AIBugGeneratorButton
                    className="!px-2 !py-1.5"
                    onBugCreated={handleBugCreated}
                />
            </div>

            {/* Desktop Layout (lg and up) */}
            <div className="hidden lg:flex items-center space-x-2">
                <Button
                    variant="ghost"
                    onClick={handleCreateSprint}
                    disabled={disabled || !activeSuite}
                    leftIcon={<Target className="h-4 w-4" />}
                    className="text-foreground hover:bg-accent/50"
                >
                    Create Sprint
                </Button>

                <Button
                    variant="ghost"
                    onClick={handleCreateDocument}
                    disabled={disabled}
                    leftIcon={<FileText className="h-4 w-4" />}
                    className="text-foreground hover:bg-accent/50"
                >
                    Create Document
                </Button>

                <Button
                    variant="ghost"
                    onClick={handleRunTests}
                    disabled={disabled}
                    leftIcon={<Play className="h-4 w-4" />}
                    className="text-foreground hover:bg-accent/50"
                >
                    Run Tests
                </Button>

                <Button
                    variant="ghost"
                    onClick={handleGenerateReport}
                    disabled={disabled || !activeSuite}
                    leftIcon={<DocumentTextIcon className="h-4 w-4" />}
                    className="text-foreground hover:bg-accent/50"
                >
                    Generate Report
                </Button>

                <ScreenRecorderButton
                    firestoreService={firestoreService}
                    activeSuite={activeSuite}
                    disabled={disabled}
                    className="text-foreground hover:bg-accent/50"
                    isPrimary={true}
                />

                {/* Test Case Dropdown for Desktop */}
                <div className="relative">
                    <Button
                        variant="ghost"
                        onClick={() => setShowDesktopTestCaseMenu(!showDesktopTestCaseMenu)}
                        disabled={disabled || !activeSuite}
                        leftIcon={<PlusIcon className="h-4 w-4" />}
                        rightIcon={<ChevronDown className="h-3 w-3 ml-1" />}
                        className="text-foreground hover:bg-accent/50"
                    >
                        Test Case
                    </Button>
                    
                    {showDesktopTestCaseMenu && !disabled && (
                        <div 
                            ref={desktopTestCaseMenuRef}
                            className="absolute right-0 mt-2 w-56 bg-card border border-border shadow-lg rounded-lg z-[60]"
                        >
                            <div className="py-2">
                                <button
                                    onClick={handleNewTestCase}
                                    disabled={!activeSuite}
                                    className="w-full flex items-center px-4 py-3 text-sm text-foreground hover:bg-accent transition-colors disabled:opacity-50"
                                >
                                    <PlusIcon className="h-4 w-4 mr-3" />
                                    <span>New Test Case</span>
                                </button>
                                <button
                                    onClick={handleImportTestCases}
                                    disabled={!activeSuite}
                                    className="w-full flex items-center px-4 py-3 text-sm text-foreground hover:bg-accent transition-colors disabled:opacity-50"
                                >
                                    <Upload className="h-4 w-4 mr-3" />
                                    <span>Import Test Cases</span>
                                </button>
                                <button
                                    onClick={handleGenerateTestCases}
                                    disabled={!activeSuite}
                                    className="w-full flex items-center px-4 py-3 text-sm text-foreground hover:bg-accent transition-colors disabled:opacity-50"
                                >
                                    <Sparkles className="h-4 w-4 mr-3" />
                                    <span>Generate with AI</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <AIBugGeneratorButton
                    onBugCreated={handleBugCreated}
                />
            </div>
        </div>
    );
};

export default HeaderButtons;