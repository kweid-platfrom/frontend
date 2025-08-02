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

const sampleActivities = [
    {
        id: 1,
        type: 'test_case_created',
        title: 'Test case created',
        description: 'Login validation tests with AI-generated edge cases',
        user: 'Sarah Johnson',
        timestamp: new Date(Date.now() - 2 * 60 * 1000),
        icon: Plus,
        color: 'success',
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
        color: 'warning',
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
        color: 'error',
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
        color: 'info',
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
        color: 'success',
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
        color: 'info',
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

    const getColorClasses = (color) => {
        const colorMap = {
            success: {
                bg: 'bg-[rgb(var(--color-success)/0.1)]',
                hoverBg: 'bg-[rgb(var(--color-success)/0.2)]',
                text: 'text-[rgb(var(--color-success))]',
                hoverText: 'text-[rgb(var(--color-success)/0.8)]',
                border: 'border-[rgb(var(--color-success)/0.2)]',
                hoverBorder: 'border-[rgb(var(--color-success)/0.3)]',
                tagBg: 'bg-[rgb(var(--color-success)/0.15)]',
                tagText: 'text-[rgb(var(--color-success))]'
            },
            info: {
                bg: 'bg-[rgb(var(--color-info)/0.1)]',
                hoverBg: 'bg-[rgb(var(--color-info)/0.2)]',
                text: 'text-[rgb(var(--color-info))]',
                hoverText: 'text-[rgb(var(--color-info)/0.8)]',
                border: 'border-[rgb(var(--color-info)/0.2)]',
                hoverBorder: 'border-[rgb(var(--color-info)/0.3)]',
                tagBg: 'bg-[rgb(var(--color-info)/0.15)]',
                tagText: 'text-[rgb(var(--color-info))]'
            },
            warning: {
                bg: 'bg-[rgb(var(--color-warning)/0.1)]',
                hoverBg: 'bg-[rgb(var(--color-warning)/0.2)]',
                text: 'text-[rgb(var(--color-warning))]',
                hoverText: 'text-[rgb(var(--color-warning)/0.8)]',
                border: 'border-[rgb(var(--color-warning)/0.2)]',
                hoverBorder: 'border-[rgb(var(--color-warning)/0.3)]',
                tagBg: 'bg-[rgb(var(--color-warning)/0.15)]',
                tagText: 'text-[rgb(var(--color-warning))]'
            },
            error: {
                bg: 'bg-[rgb(var(--color-error)/0.1)]',
                hoverBg: 'bg-[rgb(var(--color-error)/0.2)]',
                text: 'text-[rgb(var(--color-error))]',
                hoverText: 'text-[rgb(var(--color-error)/0.8)]',
                border: 'border-[rgb(var(--color-error)/0.2)]',
                hoverBorder: 'border-[rgb(var(--color-error)/0.3)]',
                tagBg: 'bg-[rgb(var(--color-error)/0.15)]',
                tagText: 'text-[rgb(var(--color-error))]'
            },
            muted: {
                bg: 'bg-muted',
                hoverBg: 'bg-muted/80',
                text: 'text-muted-foreground',
                hoverText: 'text-foreground',
                border: 'border-border',
                hoverBorder: 'border-border/80',
                tagBg: 'bg-muted/50',
                tagText: 'text-muted-foreground'
            }
        };
        return colorMap[color] || colorMap.info;
    };

    const ActionButton = ({ icon: Icon, title, description, color = "info", onClick, disabled = false }) => {
        const colors = getColorClasses(color);
        return (
            <button
                onClick={onClick}
                disabled={disabled}
                className={`
                    flex items-center space-x-4 p-4 rounded-lg border transition-all
                    ${disabled
                        ? 'bg-muted border-border text-muted-foreground cursor-not-allowed'
                        : `bg-card border-border hover:${colors.border} hover:shadow-theme-md group`
                    }
                `}
            >
                <div className={`
                    p-3 rounded-lg transition-colors
                    ${disabled
                        ? 'bg-muted'
                        : `${colors.bg} group-hover:${colors.hoverBg}`
                    }
                `}>
                    <Icon className={`
                        w-5 h-5 transition-colors
                        ${disabled
                            ? 'text-muted-foreground'
                            : `${colors.text} group-hover:${colors.hoverText}`
                        }
                    `} />
                </div>
                <div className="flex-1 text-left">
                    <h3 className={`font-medium ${disabled ? 'text-muted-foreground' : 'text-foreground'}`}>
                        {title}
                    </h3>
                    <p className={`text-sm ${disabled ? 'text-muted-foreground/80' : 'text-muted-foreground'}`}>
                        {description}
                    </p>
                </div>
                {!disabled && (
                    <ChevronRight className={`w-5 h-5 ${colors.text} group-hover:${colors.hoverText} transition-colors`} />
                )}
            </button>
        );
    };

    const primaryActions = [
        {
            icon: Plus,
            title: "Create Test Case",
            description: "Generate new test cases manually or with AI",
            color: "success",
            onClick: () => {}
        },
        {
            icon: Video,
            title: "Start Recording",
            description: "Record screen with network & console logs",
            color: "error",
            onClick: () => {}
        },
        {
            icon: Bug,
            title: "Report Bug",
            description: "Create detailed bug report with evidence",
            color: "warning",
            onClick: () => {}
        },
        {
            icon: Bot,
            title: "AI Generation",
            description: "Generate tests from requirements or stories",
            color: "info",
            onClick: () => {}
        }
    ];

    const secondaryActions = [
        {
            icon: FileText,
            title: "Export Report",
            description: "Generate PDF or CSV reports",
            color: "info",
            onClick: () => {}
        },
        {
            icon: Download,
            title: "Bulk Export",
            description: "Export test cases or bug data",
            color: "info",
            onClick: () => {}
        },
        {
            icon: GitBranch,
            title: "Sync with GitHub",
            description: "Synchronize test cases with repository",
            color: "muted",
            onClick: () => {}
        },
        {
            icon: Zap,
            title: "Run Automation",
            description: "Execute automated test suites",
            color: "warning",
            onClick: () => {}
        },
        {
            icon: Calendar,
            title: "Schedule Report",
            description: "Set up automated report delivery",
            color: "success",
            onClick: () => {}
        },
        {
            icon: Users,
            title: "Team Settings",
            description: "Manage team permissions and roles",
            color: "info",
            onClick: () => {}
        }
    ];

    const quickStats = [
        { label: "Active Tests", value: "1,247", change: "+23" },
        { label: "Open Bugs", value: "84", change: "-12" },
        { label: "Automation", value: "67%", change: "+5%" },
        { label: "AI Generated", value: "156", change: "+34" }
    ];

    return (
        <div className="bg-card rounded-lg border border-border shadow-theme-sm">
            <div className="p-6 border-b border-border">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-foreground">Quick Actions</h2>
                        <p className="text-sm text-muted-foreground mt-1">
                            Common tasks and shortcuts for QAID workflows
                        </p>
                    </div>
                    <div className="flex items-center space-x-4">
                        {quickStats.map((stat, index) => (
                            <div key={index} className="text-center">
                                <div className="text-lg font-bold text-foreground">{stat.value}</div>
                                <div className="text-xs text-muted-foreground">{stat.label}</div>
                                <div className={`text-xs ${stat.change.startsWith('+') ? 'text-[rgb(var(--color-success))]' : 'text-[rgb(var(--color-error))]'}`}>
                                    {stat.change}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="p-6">
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

                <div className="border-t border-border pt-6">
                    <button
                        onClick={() => setShowMoreActions(!showMoreActions)}
                        className="flex items-center space-x-2 text-sm font-medium text-muted-foreground hover:text-foreground mb-4"
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

                <div className="border-t border-border pt-6 mt-6">
                    <h3 className="text-sm font-medium text-foreground mb-4">Recent Activities</h3>
                    <div className="space-y-3">
                        {recentActivities.map((activity) => {
                            const colors = getColorClasses(activity.color);
                            return (
                                <div key={activity.id} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                                    <div className={`p-2 rounded-full ${colors.bg}`}>
                                        <activity.icon className={`w-4 h-4 ${colors.text}`} />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm font-medium text-foreground">{activity.title}</p>
                                            <div className="text-xs text-muted-foreground">{formatTimeAgo(activity.timestamp)}</div>
                                        </div>
                                        <p className="text-xs text-muted-foreground">{activity.description}</p>
                                        <div className="flex items-center space-x-2 mt-1">
                                            <span className="text-xs text-muted-foreground">by {activity.user}</span>
                                            {activity.details.aiGenerated && (
                                                <span className={`px-1.5 py-0.5 ${colors.tagBg} ${colors.tagText} rounded text-xs flex items-center space-x-1`}>
                                                    <Brain className="w-3 h-3" />
                                                    <span>AI</span>
                                                </span>
                                            )}
                                            {activity.details.hasRecording && (
                                                <span className={`px-1.5 py-0.5 bg-[rgb(var(--color-info)/0.15)] text-[rgb(var(--color-info))] rounded text-xs flex items-center space-x-1`}>
                                                    <Video className="w-3 h-3" />
                                                    <span>Video</span>
                                                </span>
                                            )}
                                            {activity.details.feature && (
                                                <span className="px-1.5 py-0.5 bg-muted text-muted-foreground rounded text-xs">
                                                    {activity.details.feature}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <div className="mt-4 pt-3 border-t border-border/50">
                        <button className="text-sm text-[rgb(var(--color-info))] hover:text-[rgb(var(--color-info)/0.8)] font-medium">
                            View All Activities →
                        </button>
                    </div>
                </div>

                <div className="border-t border-border pt-6 mt-6">
                    <h3 className="text-sm font-medium text-foreground mb-4">Quick Links</h3>
                    <div className="flex flex-wrap gap-2">
                        {[
                            { label: "Documentation", href: "#", color: "info" },
                            { label: "API Reference", href: "#", color: "success" },
                            { label: "Support", href: "#", color: "info" },
                            { label: "Feedback", href: "#", color: "warning" },
                            { label: "Settings", href: "#", color: "muted" }
                        ].map((link, index) => {
                            const colors = getColorClasses(link.color);
                            return (
                                <a
                                    key={index}
                                    href={link.href}
                                    className={`
                                        inline-flex items-center px-3 py-2 rounded-md text-sm font-medium
                                        ${colors.bg} ${colors.text} hover:${colors.hoverBg}
                                        transition-colors
                                    `}
                                >
                                    {link.label}
                                </a>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QuickActions;