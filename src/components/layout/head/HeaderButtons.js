import React, { useState, useRef, useEffect } from 'react';
import { Play, Target, FileText, MoreHorizontal } from 'lucide-react';
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

    // Handle mobile menu toggle
    const toggleMobileMenu = () => {
        if (disabled) return;
        if (!showMobileMenu) {
            calculateMobileMenuPosition();
        }
        setShowMobileMenu(!showMobileMenu);
    };

    // Calculate mobile menu position
    const calculateMobileMenuPosition = () => {
        if (mobileMenuButtonRef.current) {
            const rect = mobileMenuButtonRef.current.getBoundingClientRect();
            const dropdownWidth = 250;
            const windowWidth = window.innerWidth;
            const spaceOnRight = windowWidth - rect.left;

            setMobileMenuPosition({
                top: rect.bottom + window.scrollY,
                left: spaceOnRight >= dropdownWidth ? rect.left : 'auto',
                right: spaceOnRight >= dropdownWidth ? 'auto' : windowWidth - rect.right,
            });
        }
    };

    // Close mobile menu when clicking outside
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

    // Close mobile menu when window resizes to desktop
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 768) { // md breakpoint
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

    return (
        <div className="flex items-center justify-end">
            {/* Mobile Layout (xs to md) */}
            <div className="flex items-center space-x-1 md:hidden">
                {/* Priority Actions - Always Visible on Mobile */}
                <ScreenRecorderButton
                    firestoreService={firestoreService}
                    activeSuite={activeSuite}
                    disabled={disabled}
                    className="text-foreground hover:bg-accent/50"
                    isPrimary={true}
                    iconOnly={true}
                />

                {/* Mobile Menu Button */}
                <div className="relative">
                    <Button
                        ref={mobileMenuButtonRef}
                        variant="ghost"
                        size="iconSm"
                        onClick={toggleMobileMenu}
                        disabled={disabled}
                        className="text-foreground hover:bg-accent/50"
                    >
                        <MoreHorizontal className="h-5 w-5" />
                    </Button>

                    {/* Mobile Dropdown Menu */}
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
                                {/* Create Sprint */}
                                <button
                                    onClick={() => handleMobileAction(onCreateSprint)}
                                    disabled={!activeSuite}
                                    className="w-full flex items-center px-4 py-2 text-sm text-foreground hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Target className="h-4 w-4 mr-3" />
                                    Create Sprint
                                </button>

                                {/* Create Document */}
                                <button
                                    onClick={() => handleMobileAction(onCreateDocument)}
                                    className="w-full flex items-center px-4 py-2 text-sm text-foreground hover:bg-accent transition-colors"
                                >
                                    <FileText className="h-4 w-4 mr-3" />
                                    Create Document
                                </button>

                                {/* Run Tests */}
                                <button
                                    onClick={() => setShowMobileMenu(false)}
                                    className="w-full flex items-center px-4 py-2 text-sm text-foreground hover:bg-accent transition-colors"
                                >
                                    <Play className="h-4 w-4 mr-3" />
                                    Run Tests
                                </button>

                                <div className="border-t border-border my-2"></div>

                                {/* Report Dropdown - Mobile Version */}
                                <div className="px-4 py-2">
                                    <ReportDropdown
                                        disabled={disabled}
                                        className="w-full justify-start text-foreground hover:bg-accent/50"
                                        variant="ghost"
                                        isMobile={true}
                                    />
                                </div>

                                {/* Test Case Dropdown - Mobile Version */}
                                <div className="px-4 py-2">
                                    <TestCaseDropdown
                                        disabled={disabled}
                                        className="w-full justify-start text-foreground hover:bg-accent/50"
                                        variant="ghost"
                                        isMobile={true}
                                    />
                                </div>

                                <div className="border-t border-border my-2"></div>

                                {/* Bug Report - Mobile Version */}
                                <div className="px-4 py-2">
                                    <BugReportButton
                                        variant="ghost"
                                        disabled={disabled}
                                        className="w-full justify-start text-foreground hover:bg-accent/50"
                                        isMobile={true}
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Tablet Layout (md to lg) */}
            <div className="hidden md:flex lg:hidden items-center space-x-1">
                {/* Core Actions with Icons Only */}
                <Button
                    variant="ghost"
                    size="iconSm"
                    onClick={onCreateSprint}
                    disabled={disabled || !activeSuite}
                    className="text-foreground hover:bg-accent/50"
                    title="Create Sprint"
                >
                    <Target className="h-4 w-4" />
                </Button>

                <Button
                    variant="ghost"
                    size="iconSm"
                    onClick={onCreateDocument}
                    disabled={disabled}
                    className="text-foreground hover:bg-accent/50"
                    title="Create Document"
                >
                    <FileText className="h-4 w-4" />
                </Button>

                <Button
                    variant="ghost"
                    size="iconSm"
                    disabled={disabled}
                    className="text-foreground hover:bg-accent/50"
                    title="Run Tests"
                >
                    <Play className="h-4 w-4" />
                </Button>

                <ScreenRecorderButton
                    firestoreService={firestoreService}
                    activeSuite={activeSuite}
                    disabled={disabled}
                    className="text-foreground hover:bg-accent/50"
                    isPrimary={true}
                    iconOnly={true}
                />

                <ReportDropdown
                    disabled={disabled}
                    className="text-foreground hover:bg-accent/50"
                    iconOnly={true}
                />

                <TestCaseDropdown
                    disabled={disabled}
                    className="text-foreground hover:bg-accent/50"
                    iconOnly={true}
                />

                <BugReportButton
                    variant="ghost"
                    disabled={disabled}
                    className="text-foreground hover:bg-accent/50"
                    iconOnly={true}
                />
            </div>

            {/* Desktop Layout (lg and up) */}
            <div className="hidden lg:flex items-center space-x-2">
                {/* Full Buttons with Text */}
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