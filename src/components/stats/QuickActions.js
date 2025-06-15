import React, { useState, useEffect } from 'react';
import {
    Plus,
    FileText,
    Video,
    Bug,
    Bot,
    Download,
    Zap,
    GitBranch,
    Calendar,
    Users,
    ChevronRight,
    Activity,
    CheckCircle,
    Brain
} from 'lucide-react';

// Enhanced activity data from RecentActivities component
const sampleActivities = [
    {
        id: 1,
        type: 'test_case_created',
        title: 'Test case created',
        description: 'Login validation tests with AI-generated edge cases',
        user: 'Sarah Johnson',
        timestamp: new Date(Date.now() - 2 * 60 * 1000),
        icon: Plus,
        color: 'green',
        details: {
            testCaseId: 'TC-1247',
            feature: 'Authentication',
            aiGenerated: true
        }
    },
    {
        id: 2,
        type: 'bug_reported',
        title: 'Bug reported',
        description: 'Payment flow issue with critical severity',
        user: 'Mike Chen',
        timestamp: new Date(Date.now() - 15 * 60 * 1000),
        icon: Bug,
        color: 'orange',
        details: {
            bugId: 'BUG-0892',
            severity: 'critical',
            hasRecording: true
        }
    },
    {
        id: 3,
        type: 'recording_completed',
        title: 'Recording completed',
        description: 'User registration flow - 3:24 duration',
        user: 'Emma Davis',
        timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
        icon: Video,
        color: 'red',
        details: {
            recordingId: 'REC-456',
            duration: '3:24',
            feature: 'Registration'
        }
    },
    {
        id: 4,
        type: 'ai_generation',
        title: 'AI generation',
        description: 'Generated 12 test cases from user stories',
        user: 'AI Assistant',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        icon: Bot,
        color: 'purple',
        details: {
            generatedCount: 12,
            feature: 'User Management',
            confidence: '94%'
        }
    },
    {
        id: 5,
        type: 'bug_resolved',
        title: 'Bug resolved',
        description: 'Dashboard loading issue - 67% performance improvement',
        user: 'Alex Kumar',
        timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
        icon: CheckCircle,
        color: 'green',
        details: {
            bugId: 'BUG-0845',
            resolutionTime: '2.5 hours',
            impact: '67% improvement'
        }
    },
    {
        id: 6,
        type: 'automation_generated',
        title: 'Automation generated',
        description: 'Cypress scripts created with 92% success rate',
        user: 'System',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
        icon: Activity,
        color: 'blue',
        details: {
            scriptCount: 8,
            feature: 'API Testing',
            successRate: '92%'
        }
    }
];

const QuickActions = () => {
    const [showMoreActions, setShowMoreActions] = useState(false);
    const [recentActivities, setRecentActivities] = useState([]);

    useEffect(() => {
        // Simulate loading recent activities
        setRecentActivities(sampleActivities.slice(0, 4));
    }, []);

    const formatTimeAgo = (timestamp) => {
        const now = new Date();
        const diff = now - timestamp;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (days > 0) return `${days}d ago`;
        if (hours > 0) return `${hours}h ago`;
        return `${minutes}m ago`;
    };

    const ActionButton = ({ icon: Icon, title, description, color = "blue", onClick, disabled = false }) => (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`
        flex items-center space-x-4 p-4 rounded-lg border transition-all
        ${disabled
                    ? 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed'
                    : `bg-white border-gray-200 hover:border-${color}-300 hover:shadow-md group`
                }
      `}
        >
            <div className={`
        p-3 rounded-lg transition-colors
        ${disabled
                    ? 'bg-gray-100'
                    : `bg-${color}-50 group-hover:bg-${color}-100`
                }
      `}>
                <Icon className={`
          w-5 h-5 transition-colors
          ${disabled
                        ? 'text-gray-400'
                        : `text-${color}-600 group-hover:text-${color}-700`
                    }
        `} />
            </div>
            <div className="flex-1 text-left">
                <h3 className={`font-medium ${disabled ? 'text-gray-400' : 'text-gray-900'}`}>
                    {title}
                </h3>
                <p className={`text-sm ${disabled ? 'text-gray-300' : 'text-gray-600'}`}>
                    {description}
                </p>
            </div>
            {!disabled && (
                <ChevronRight className={`w-5 h-5 text-${color}-400 group-hover:text-${color}-600 transition-colors`} />
            )}
        </button>
    );

    const primaryActions = [
        {
            icon: Plus,
            title: "Create Test Case",
            description: "Generate new test cases manually or with AI",
            color: "green",
            onClick: () => console.log("Create test case")
        },
        {
            icon: Video,
            title: "Start Recording",
            description: "Record screen with network & console logs",
            color: "red",
            onClick: () => console.log("Start recording")
        },
        {
            icon: Bug,
            title: "Report Bug",
            description: "Create detailed bug report with evidence",
            color: "orange",
            onClick: () => console.log("Report bug")
        },
        {
            icon: Bot,
            title: "AI Generation",
            description: "Generate tests from requirements or stories",
            color: "purple",
            onClick: () => console.log("AI generation")
        }
    ];

    const secondaryActions = [
        {
            icon: FileText,
            title: "Export Report",
            description: "Generate PDF or CSV reports",
            color: "blue",
            onClick: () => console.log("Export report")
        },
        {
            icon: Download,
            title: "Bulk Export",
            description: "Export test cases or bug data",
            color: "indigo",
            onClick: () => console.log("Bulk export")
        },
        {
            icon: GitBranch,
            title: "Sync with GitHub",
            description: "Synchronize test cases with repository",
            color: "gray",
            onClick: () => console.log("GitHub sync")
        },
        {
            icon: Zap,
            title: "Run Automation",
            description: "Execute automated test suites",
            color: "yellow",
            onClick: () => console.log("Run automation")
        },
        {
            icon: Calendar,
            title: "Schedule Report",
            description: "Set up automated report delivery",
            color: "green",
            onClick: () => console.log("Schedule report")
        },
        {
            icon: Users,
            title: "Team Settings",
            description: "Manage team permissions and roles",
            color: "pink",
            onClick: () => console.log("Team settings")
        }
    ];

    const quickStats = [
        { label: "Active Tests", value: "1,247", change: "+23" },
        { label: "Open Bugs", value: "84", change: "-12" },
        { label: "Automation", value: "67%", change: "+5%" },
        { label: "AI Generated", value: "156", change: "+34" }
    ];

    return (
        <div className="bg-white rounded-lg border shadow-sm">
            <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
                        <p className="text-sm text-gray-600 mt-1">
                            Common tasks and shortcuts for QAID workflows
                        </p>
                    </div>
                    <div className="flex items-center space-x-4">
                        {quickStats.map((stat, index) => (
                            <div key={index} className="text-center">
                                <div className="text-lg font-bold text-gray-900">{stat.value}</div>
                                <div className="text-xs text-gray-600">{stat.label}</div>
                                <div className={`text-xs ${stat.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                                    {stat.change}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="p-6">
                {/* Primary Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    {primaryActions.map((action, index) => (
                        <ActionButton
                            key={index}
                            icon={action.icon}
                            title={action.title}
                            description={action.description}
                            color={action.color}
                            onClick={action.onClick}
                        />
                    ))}
                </div>

                {/* Secondary Actions Toggle */}
                <div className="border-t border-gray-200 pt-6">
                    <button
                        onClick={() => setShowMoreActions(!showMoreActions)}
                        className="flex items-center space-x-2 text-sm font-medium text-gray-600 hover:text-gray-900 mb-4"
                    >
                        <span>{showMoreActions ? 'Show Less' : 'More Actions'}</span>
                        <ChevronRight className={`w-4 h-4 transition-transform ${showMoreActions ? 'rotate-90' : ''}`} />
                    </button>

                    {showMoreActions && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {secondaryActions.map((action, index) => (
                                <ActionButton
                                    key={index}
                                    icon={action.icon}
                                    title={action.title}
                                    description={action.description}
                                    color={action.color}
                                    onClick={action.onClick}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Recent Activities - Enhanced with real data */}
                <div className="border-t border-gray-200 pt-6 mt-6">
                    <h3 className="text-sm font-medium text-gray-900 mb-4">Recent Activities</h3>
                    <div className="space-y-3">
                        {recentActivities.map((activity) => (
                            <div key={activity.id} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                                <div className={`p-2 rounded-full bg-${activity.color}-100`}>
                                    <activity.icon className={`w-4 h-4 text-${activity.color}-600`} />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                                        <div className="text-xs text-gray-500">{formatTimeAgo(activity.timestamp)}</div>
                                    </div>
                                    <p className="text-xs text-gray-600">{activity.description}</p>
                                    <div className="flex items-center space-x-2 mt-1">
                                        <span className="text-xs text-gray-500">by {activity.user}</span>
                                        {activity.details.aiGenerated && (
                                            <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded text-xs flex items-center space-x-1">
                                                <Brain className="w-3 h-3" />
                                                <span>AI</span>
                                            </span>
                                        )}
                                        {activity.details.hasRecording && (
                                            <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-xs flex items-center space-x-1">
                                                <Video className="w-3 h-3" />
                                                <span>Video</span>
                                            </span>
                                        )}
                                        {activity.details.feature && (
                                            <span className="px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">
                                                {activity.details.feature}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="mt-4 pt-3 border-t border-gray-100">
                        <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                            View All Activities →
                        </button>
                    </div>
                </div>

                {/* Quick Links */}
                <div className="border-t border-gray-200 pt-6 mt-6">
                    <h3 className="text-sm font-medium text-gray-900 mb-4">Quick Links</h3>
                    <div className="flex flex-wrap gap-2">
                        {[
                            { label: "Documentation", href: "#", color: "blue" },
                            { label: "API Reference", href: "#", color: "green" },
                            { label: "Support", href: "#", color: "purple" },
                            { label: "Feedback", href: "#", color: "orange" },
                            { label: "Settings", href: "#", color: "gray" }
                        ].map((link, index) => (
                            <a
                                key={index}
                                href={link.href}
                                className={`
                  inline-flex items-center px-3 py-2 rounded-md text-sm font-medium
                  bg-${link.color}-50 text-${link.color}-700 hover:bg-${link.color}-100
                  transition-colors
                `}
                            >
                                {link.label}
                            </a>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QuickActions;