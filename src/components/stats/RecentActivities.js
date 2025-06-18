import React, { useState, useEffect } from 'react';
import {
    Activity,
    Bug,
    TestTube,
    Video,
    Brain,
    CheckCircle,
    Clock,
    User,
    ExternalLink,
    Filter,
    RefreshCw
} from 'lucide-react';

// Sample activity data - in real app, this would come from API
const sampleActivities = [
    {
        id: 1,
        type: 'test_case_created',
        title: 'New test case created for Login Flow',
        description: 'AI-generated test case with edge cases for multi-factor authentication',
        user: 'Sarah Johnson',
        timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
        priority: 'medium',
        status: 'completed',
        details: {
            testCaseId: 'TC-1247',
            feature: 'Authentication',
            aiGenerated: true
        }
    },
    {
        id: 2,
        type: 'bug_reported',
        title: 'Critical bug found in payment processing',
        description: 'Screen recording captured transaction failure with network logs',
        user: 'Mike Chen',
        timestamp: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
        priority: 'high',
        status: 'in_progress',
        details: {
            bugId: 'BUG-0892',
            severity: 'critical',
            hasRecording: true,
            hasNetworkLogs: true
        }
    },
    {
        id: 3,
        type: 'recording_uploaded',
        title: 'Screen recording uploaded',
        description: 'User journey recording for checkout process - 3.2 minutes',
        user: 'Emma Davis',
        timestamp: new Date(Date.now() - 25 * 60 * 1000), // 25 minutes ago
        priority: 'low',
        status: 'completed',
        details: {
            recordingId: 'REC-456',
            duration: '3:24',
            feature: 'E-commerce'
        }
    },
    {
        id: 4,
        type: 'automation_generated',
        title: 'Cypress script generated successfully',
        description: 'AI converted manual test cases to automated Cypress tests',
        user: 'System',
        timestamp: new Date(Date.now() - 45 * 60 * 1000), // 45 minutes ago
        priority: 'medium',
        status: 'completed',
        details: {
            scriptCount: 12,
            feature: 'User Management',
            successRate: '92%'
        }
    },
    {
        id: 5,
        type: 'bug_resolved',
        title: 'Bug resolved: Dashboard loading issue',
        description: 'Performance issue fixed - load time improved by 67%',
        user: 'Alex Kumar',
        timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
        priority: 'medium',
        status: 'completed',
        details: {
            bugId: 'BUG-0845',
            resolutionTime: '2.5 hours',
            impact: 'Performance improved by 67%'
        }
    },
    {
        id: 6,
        type: 'ai_generation',
        title: 'AI test generation completed',
        description: 'Generated 25 test cases from user story requirements',
        user: 'AI Assistant',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        priority: 'low',
        status: 'completed',
        details: {
            generatedCount: 25,
            feature: 'Reporting Dashboard',
            confidence: '94%'
        }
    },
    {
        id: 7,
        type: 'report_generated',
        title: 'Weekly QA report generated',
        description: 'Comprehensive testing report for Sprint 23 - 89% coverage',
        user: 'System',
        timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
        priority: 'low',
        status: 'completed',
        details: {
            reportType: 'Weekly',
            coverage: '89%',
            sprint: 'Sprint 23'
        }
    }
];

const RecentActivities = ({ maxItems = 15 }) => {
    const [activities, setActivities] = useState([]);
    const [filteredActivities, setFilteredActivities] = useState([]);
    const [filter, setFilter] = useState('all');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Simulate API call
        setLoading(true);
        setTimeout(() => {
            setActivities(sampleActivities);
            setLoading(false);
        }, 500);
    }, []);

    useEffect(() => {
        if (filter === 'all') {
            setFilteredActivities(activities.slice(0, maxItems));
        } else {
            setFilteredActivities(
                activities
                    .filter(activity => activity.type === filter)
                    .slice(0, maxItems)
            );
        }
    }, [activities, filter, maxItems]);

    const getActivityIcon = (type) => {
        const iconProps = { className: "w-4 h-4" };

        switch (type) {
            case 'test_case_created': return <TestTube {...iconProps} />;
            case 'bug_reported': return <Bug {...iconProps} />;
            case 'bug_resolved': return <CheckCircle {...iconProps} />;
            case 'recording_uploaded': return <Video {...iconProps} />;
            case 'ai_generation': return <Brain {...iconProps} />;
            case 'automation_generated': return <Activity {...iconProps} />;
            case 'report_generated': return <ExternalLink {...iconProps} />;
            default: return <Activity {...iconProps} />;
        }
    };

    const getActivityColor = (type, status) => {
        if (status === 'in_progress') return 'text-orange-600 bg-orange-100';

        switch (type) {
            case 'test_case_created': return 'text-blue-600 bg-blue-100';
            case 'bug_reported': return 'text-red-600 bg-red-100';
            case 'bug_resolved': return 'text-green-600 bg-green-100';
            case 'recording_uploaded': return 'text-purple-600 bg-purple-100';
            case 'ai_generation': return 'text-indigo-600 bg-indigo-100';
            case 'automation_generated': return 'text-teal-600 bg-teal-100';
            case 'report_generated': return 'text-gray-600 bg-gray-100';
            default: return 'text-gray-600 bg-gray-100';
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'high': return 'bg-red-100 text-red-700 border-red-200';
            case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'low': return 'bg-green-100 text-green-700 border-green-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

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

    const filterOptions = [
        { value: 'all', label: 'All Activities', count: activities.length },
        { value: 'test_case_created', label: 'Test Cases', count: activities.filter(a => a.type === 'test_case_created').length },
        { value: 'bug_reported', label: 'Bug Reports', count: activities.filter(a => a.type === 'bug_reported').length },
        { value: 'recording_uploaded', label: 'Recordings', count: activities.filter(a => a.type === 'recording_uploaded').length },
        { value: 'ai_generation', label: 'AI Generated', count: activities.filter(a => a.type === 'ai_generation').length }
    ];

    const refreshActivities = () => {
        setLoading(true);
        setTimeout(() => {
            setActivities([...sampleActivities].sort(() => Math.random() - 0.5));
            setLoading(false);
        }, 500);
    };

    return (
        <div className="bg-white rounded-lg shadow-sm border">
            {/* Header */}
            <div className="flex items-center justify-between p-6 pb-4">
                <div>
                    <h3 className="text-lg font-medium text-gray-900">Recent Activities</h3>
                    <p className="text-sm text-gray-600 mt-1">Latest QA activities and updates</p>
                </div>
                <button
                    onClick={refreshActivities}
                    disabled={loading}
                    className="text-gray-600 hover:text-gray-800 disabled:opacity-50"
                >
                    <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {/* Filters */}
            <div className="px-6 pb-4">
                <div className="flex items-center space-x-2 overflow-x-auto">
                    <Filter className="w-4 h-4 text-gray-500 flex-shrink-0" />
                    {filterOptions.map(option => (
                        <button
                            key={option.value}
                            onClick={() => setFilter(option.value)}
                            className={`px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors ${filter === option.value
                                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-transparent'
                                }`}
                        >
                            {option.label} ({option.count})
                        </button>
                    ))}
                </div>
            </div>

            {/* Activities List */}
            <div className="max-h-96 overflow-y-auto">
                {loading ? (
                    <div className="flex items-center justify-center p-8">
                        <RefreshCw className="w-6 h-6 text-teal-600 animate-spin" />
                        <span className="ml-2 text-gray-600">Loading activities...</span>
                    </div>
                ) : filteredActivities.length === 0 ? (
                    <div className="text-center p-8 text-gray-500">
                        <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p>No recent activities found</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {filteredActivities.map((activity) => (
                            <div key={activity.id} className="p-4 hover:bg-gray-50 transition-colors">
                                <div className="flex items-start space-x-3">
                                    {/* Activity Icon */}
                                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${getActivityColor(activity.type, activity.status)}`}>
                                        {getActivityIcon(activity.type)}
                                    </div>

                                    {/* Activity Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <h4 className="text-sm font-medium text-gray-900 truncate">
                                                {activity.title}
                                            </h4>
                                            <div className="flex items-center space-x-2 flex-shrink-0 ml-2">
                                                <span className={`px-2 py-1 text-xs font-medium rounded border ${getPriorityColor(activity.priority)}`}>
                                                    {activity.priority}
                                                </span>
                                                <span className="text-xs text-gray-500">
                                                    {formatTimeAgo(activity.timestamp)}
                                                </span>
                                            </div>
                                        </div>

                                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                                            {activity.description}
                                        </p>

                                        {/* Activity Details */}
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                                                <div className="flex items-center space-x-1">
                                                    <User className="w-3 h-3" />
                                                    <span>{activity.user}</span>
                                                </div>
                                                {activity.details && (
                                                    <>
                                                        {activity.details.feature && (
                                                            <span className="px-2 py-1 bg-gray-100 rounded text-gray-700">
                                                                {activity.details.feature}
                                                            </span>
                                                        )}
                                                        {activity.details.aiGenerated && (
                                                            <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded flex items-center space-x-1">
                                                                <Brain className="w-3 h-3" />
                                                                <span>AI</span>
                                                            </span>
                                                        )}
                                                        {activity.details.hasRecording && (
                                                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded flex items-center space-x-1">
                                                                <Video className="w-3 h-3" />
                                                                <span>Video</span>
                                                            </span>
                                                        )}
                                                    </>
                                                )}
                                            </div>

                                            {activity.status === 'in_progress' && (
                                                <div className="flex items-center space-x-1 text-orange-600">
                                                    <Clock className="w-3 h-3" />
                                                    <span className="text-xs">In Progress</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-gray-50 border-t">
                <button className="w-full text-sm text-blue-600 hover:text-blue-800 font-medium">
                    View All Activities
                </button>
            </div>
        </div>
    );
};

export default RecentActivities;