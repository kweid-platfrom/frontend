import React from 'react';
import { Play, Target, FileText } from 'lucide-react';
import { Bars3Icon } from '@heroicons/react/24/outline';
import { Button } from '../../ui/button';
import BugReportButton from '../../modals/BugReportButton';
import ScreenRecorderButton from '../../recorder/ScreenRecorderButton'; // Your updated component
import ReportDropdown from '../../ReportDropdown';
import TestCaseDropdown from '../../TestCaseDropdown';

const HeaderButtons = ({
    onCreateSprint,
    onCreateDocument,
    setShowBugForm,
    actions,
    activeSuite,
    firestoreService, // Add this prop to pass your existing service
    disabled = false
}) => {
    return (
        <div className="flex items-center">
            {/* Mobile Menu Button */}
            <div className="sm:hidden">
                <Button
                    variant="ghost"
                    size="iconSm"
                    disabled={disabled}
                    className="text-foreground hover:bg-accent/50"
                >
                    <Bars3Icon className="h-5 w-5" />
                </Button>
            </div>

            {/* Desktop Buttons */}
            <div className="hidden sm:flex items-center space-x-1 lg:space-x-2">
                {/* Create Sprint Button */}
                <Button
                    variant="ghost"
                    onClick={onCreateSprint}
                    disabled={disabled || !activeSuite}
                    leftIcon={<Target className="h-4 w-4" />}
                    className="text-foreground hover:bg-accent/50"
                >
                    <span className="hidden lg:inline">Create Sprint</span>
                </Button>

                {/* Create Document Button */}
                <Button
                    variant="ghost"
                    onClick={onCreateDocument}
                    disabled={disabled}
                    leftIcon={<FileText className="h-4 w-4" />}
                    className="text-foreground hover:bg-accent/50"
                >
                    <span className="hidden lg:inline">Create Document</span>
                </Button>

                {/* Run Tests Button */}
                <Button
                    variant="ghost"
                    disabled={disabled}
                    leftIcon={<Play className="h-4 w-4" />}
                    className="text-foreground hover:bg-accent/50"
                >
                    <span className="hidden lg:inline">Run Tests</span>
                </Button>

                {/* Enhanced Screen Recorder Button */}
                <ScreenRecorderButton
                    firestoreService={firestoreService}
                    activeSuite={activeSuite}
                    disabled={disabled}
                    className="text-foreground hover:bg-accent/50"
                    isPrimary={true}
                />

                {/* Report Dropdown */}
                <ReportDropdown
                    disabled={disabled}
                    className="text-foreground hover:bg-accent/50"
                />

                {/* Test Case Dropdown */}
                <TestCaseDropdown
                    disabled={disabled}
                    className="text-foreground hover:bg-accent/50"
                />

                {/* Bug Report Button */}
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