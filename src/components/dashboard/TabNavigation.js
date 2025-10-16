// TabNavigation.jsx - Responsive version
import React from 'react';
import { 
    TrendingUp, 
    Bug, 
    TestTube, 
    Activity, 
    Settings,
    Video,
    FileText,
    Calendar,
    Database,
    FileBarChart,
    Lightbulb
} from 'lucide-react';

const TAB_OPTIONS = [
    { value: 'overview', label: 'Overview', shortLabel: 'Overview', icon: TrendingUp },
    { value: 'testing', label: 'Testing', shortLabel: 'Testing', icon: TestTube },
    { value: 'bugs', label: 'Bug Tracking', shortLabel: 'Bugs', icon: Bug },
    { value: 'recordings', label: 'Recordings', shortLabel: 'Recordings', icon: Video },
    { value: 'documents', label: 'Documents', shortLabel: 'Docs', icon: FileText },
    { value: 'sprint', label: 'Sprint', shortLabel: 'Sprint', icon: Calendar },
    { value: 'testdata', label: 'Test Data', shortLabel: 'Data', icon: Database },
    { value: 'reports', label: 'Reports', shortLabel: 'Reports', icon: FileBarChart },
    { value: 'ai', label: 'AI Generation', shortLabel: 'AI', icon: Activity },
    { value: 'automation', label: 'Automation', shortLabel: 'Auto', icon: Settings },
    { value: 'recommendations', label: 'Suggestions', shortLabel: 'Suggest', icon: Lightbulb },
];

export const TabNavigation = ({ activeTab, onTabChange }) => (
    <div className="bg-card rounded-lg shadow-theme-sm border border-border p-1">
        <div className="flex space-x-1 overflow-x-auto">
            {TAB_OPTIONS.map((tab) => {
                const IconComponent = tab.icon;
                return (
                    <button
                        key={tab.value}
                        onClick={() => onTabChange(tab.value)}
                        className={`flex items-center px-2 sm:px-3 lg:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium rounded transition-colors whitespace-nowrap flex-shrink-0 ${
                            activeTab === tab.value
                                ? 'bg-primary/10 text-primary'
                                : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                        }`}
                        aria-current={activeTab === tab.value ? 'page' : undefined}
                    >
                        <IconComponent className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 flex-shrink-0" aria-hidden="true" />
                        <span className="hidden sm:inline lg:hidden">{tab.shortLabel}</span>
                        <span className="sm:hidden lg:inline">{tab.label}</span>
                    </button>
                );
            })}
        </div>
    </div>
);