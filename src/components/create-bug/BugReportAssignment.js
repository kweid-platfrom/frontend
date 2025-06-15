import React, { useState } from "react";
import {
    Users,
    User,
    Calendar,
    Flag,
    Tag,
    ChevronDown,
    CheckCircle,
    Clock,
    AlertTriangle
} from "lucide-react";

const BugReportAssignment = ({ formData, updateFormData, teamMembers = [] }) => {
    const [showTeamDropdown, setShowTeamDropdown] = useState(false);

    const priorities = [
        { value: "Low", label: "Low Priority", color: "text-green-600", bg: "bg-green-100", icon: Clock },
        { value: "Medium", label: "Medium Priority", color: "text-orange-600", bg: "bg-orange-100", icon: Flag },
        { value: "High", label: "High Priority", color: "text-red-600", bg: "bg-red-100", icon: AlertTriangle }
    ];

    const statuses = [
        { value: "New", label: "New", color: "text-blue-600", bg: "bg-blue-100" },
        { value: "In Progress", label: "In Progress", color: "text-yellow-600", bg: "bg-yellow-100" },
        { value: "Under Review", label: "Under Review", color: "text-purple-600", bg: "bg-purple-100" },
        { value: "Resolved", label: "Resolved", color: "text-green-600", bg: "bg-green-100" }
    ];

    const categories = [
        { value: "UI Issue", label: "UI/UX Issue", description: "Visual or user interface problems" },
        { value: "Performance", label: "Performance", description: "Speed, loading, or optimization issues" },
        { value: "Security", label: "Security", description: "Security vulnerabilities or concerns" },
        { value: "Functionality", label: "Functionality", description: "Feature not working as expected" },
        { value: "Integration", label: "Integration", description: "Third-party service or API issues" },
        { value: "Data", label: "Data Issue", description: "Data corruption, loss, or inconsistency" },
        { value: "Browser Compatibility", label: "Browser Compatibility", description: "Cross-browser issues" },
        { value: "Mobile", label: "Mobile", description: "Mobile-specific problems" },
        { value: "Other", label: "Other", description: "Issues not covered by other categories" }
    ];

    const handleAssigneeChange = (memberId) => {
        updateFormData("assignedTo", memberId);
        setShowTeamDropdown(false);
    };

    const getSelectedMember = () => {
        if (!formData.assignedTo) return null;
        return teamMembers.find(member => member.id === formData.assignedTo);
    };

    const getPriorityFromSeverity = (severity) => {
        const priorityMap = {
            'High': 'Critical',
            'Medium': 'High',
            'Low': 'Low'
        };
        return priorityMap[severity] || 'Low';
    };

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Assignment & Priority</h3>
                <p className="text-sm text-gray-600 mb-6">
                    Set priority, assign team members, and categorize this bug report for better tracking and resolution.
                </p>
            </div>

            {/* Priority & Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-900">
                        <Flag className="inline h-4 w-4 mr-2" />
                        Priority Level
                    </label>
                    <div className="space-y-2">
                        {priorities.map((priority) => {
                            const Icon = priority.icon;
                            const isSelected = formData.severity === priority.value;
                            return (
                                <div
                                    key={priority.value}
                                    onClick={() => updateFormData("severity", priority.value)}
                                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                                        isSelected
                                            ? `border-gray-400 ${priority.bg} shadow-sm`
                                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                    }`}
                                >
                                    <div className="flex items-center space-x-3">
                                        <Icon className={`h-5 w-5 ${isSelected ? priority.color : 'text-gray-400'}`} />
                                        <div className="flex-1">
                                            <p className={`font-medium ${isSelected ? priority.color : 'text-gray-700'}`}>
                                                {priority.label}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                Bug Priority: {getPriorityFromSeverity(priority.value)}
                                            </p>
                                        </div>
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                            isSelected
                                                ? `border-gray-400 ${priority.bg}`
                                                : 'border-gray-300'
                                        }`}>
                                            {isSelected && (
                                                <div className={`w-2 h-2 rounded-full ${priority.color.replace('text-', 'bg-')}`} />
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-900">
                        <CheckCircle className="inline h-4 w-4 mr-2" />
                        Initial Status
                    </label>
                    <select
                        value={formData.status || "New"}
                        onChange={(e) => updateFormData("status", e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00897B] focus:border-transparent transition-all duration-200"
                    >
                        {statuses.map(status => (
                            <option key={status.value} value={status.value}>
                                {status.label}
                            </option>
                        ))}
                    </select>
                    <p className="text-xs text-gray-500">
                        Status can be updated later during bug resolution process
                    </p>
                </div>
            </div>

            {/* Category Selection */}
            <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-900">
                    <Tag className="inline h-4 w-4 mr-2" />
                    Bug Category
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {categories.map((category) => {
                        const isSelected = formData.category === category.value;
                        return (
                            <div
                                key={category.value}
                                onClick={() => updateFormData("category", category.value)}
                                className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                                    isSelected
                                        ? 'border-[#00897B] bg-[#E0F2F1] shadow-sm'
                                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                }`}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <p className={`font-medium text-sm ${
                                            isSelected ? 'text-[#00897B]' : 'text-gray-900'
                                        }`}>
                                            {category.label}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                                            {category.description}
                                        </p>
                                    </div>
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ml-3 ${
                                        isSelected
                                            ? 'border-[#00897B] bg-[#00897B]'
                                            : 'border-gray-300'
                                    }`}>
                                        {isSelected && (
                                            <CheckCircle className="h-3 w-3 text-white" />
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Team Assignment */}
            <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-900">
                    <Users className="inline h-4 w-4 mr-2" />
                    Assign to Team Member
                </label>
                
                {teamMembers.length > 0 ? (
                    <div className="relative">
                        <button
                            type="button"
                            onClick={() => setShowTeamDropdown(!showTeamDropdown)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00897B] focus:border-transparent transition-all duration-200 text-left flex items-center justify-between"
                        >
                            <div className="flex items-center space-x-3">
                                {getSelectedMember() ? (
                                    <>
                                        <div className="w-8 h-8 bg-[#00897B] rounded-full flex items-center justify-center">
                                            <User className="h-4 w-4 text-white" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">
                                                {getSelectedMember().name || getSelectedMember().email}
                                            </p>
                                            {getSelectedMember().role && (
                                                <p className="text-xs text-gray-500">{getSelectedMember().role}</p>
                                            )}
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                                            <User className="h-4 w-4 text-gray-400" />
                                        </div>
                                        <span className="text-gray-500">Select team member (optional)</span>
                                    </>
                                )}
                            </div>
                            <ChevronDown
                                className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${
                                    showTeamDropdown ? 'rotate-180' : ''
                                }`}
                            />
                        </button>

                        {showTeamDropdown && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                                <div className="p-2">
                                    <button
                                        type="button"
                                        onClick={() => handleAssigneeChange("")}
                                        className="w-full text-left px-3 py-2 rounded-md hover:bg-gray-100 transition-colors duration-150 flex items-center space-x-3"
                                    >
                                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                                            <User className="h-4 w-4 text-gray-400" />
                                        </div>
                                        <span className="text-gray-500">Unassigned</span>
                                    </button>
                                    {teamMembers.map((member) => (
                                        <button
                                            key={member.id}
                                            type="button"
                                            onClick={() => handleAssigneeChange(member.id)}
                                            className="w-full text-left px-3 py-2 rounded-md hover:bg-gray-100 transition-colors duration-150 flex items-center space-x-3"
                                        >
                                            <div className="w-8 h-8 bg-[#00897B] rounded-full flex items-center justify-center">
                                                <User className="h-4 w-4 text-white" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-medium text-gray-900">
                                                    {member.name || member.email}
                                                </p>
                                                {member.role && (
                                                    <p className="text-xs text-gray-500">{member.role}</p>
                                                )}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-center">
                        <Users className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-500 mb-2">No team members available</p>
                        <p className="text-xs text-gray-400">
                            Add team members to assign bugs to specific developers
                        </p>
                    </div>
                )}
            </div>

            {/* Due Date */}
            <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-900">
                    <Calendar className="inline h-4 w-4 mr-2" />
                    Expected Resolution Date (Optional)
                </label>
                <input
                    type="date"
                    value={formData.dueDate || ""}
                    onChange={(e) => updateFormData("dueDate", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00897B] focus:border-transparent transition-all duration-200"
                    min={new Date().toISOString().split('T')[0]}
                />
                <p className="text-xs text-gray-500">
                    Set a target date for bug resolution to help with planning and prioritization
                </p>
            </div>
        </div>
    );
};

// Demo component to show the BugReportAssignment in action
const App = () => {
    const [formData, setFormData] = useState({
        severity: "",
        status: "New",
        category: "",
        assignedTo: "",
        dueDate: ""
    });

    const sampleTeamMembers = [
        { id: "1", name: "John Doe", email: "john@example.com", role: "Frontend Developer" },
        { id: "2", name: "Jane Smith", email: "jane@example.com", role: "Backend Developer" },
        { id: "3", name: "Mike Johnson", email: "mike@example.com", role: "QA Engineer" },
        { id: "4", name: "Sarah Wilson", email: "sarah@example.com", role: "DevOps Engineer" }
    ];

    const updateFormData = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <BugReportAssignment
                        formData={formData}
                        updateFormData={updateFormData}
                        teamMembers={sampleTeamMembers}
                    />
                    
                    {/* Debug info */}
                    <div className="mt-8 p-4 bg-gray-100 rounded-lg">
                        <h4 className="font-medium text-gray-900 mb-2">Current Form Data:</h4>
                        <pre className="text-xs text-gray-600 overflow-auto">
                            {JSON.stringify(formData, null, 2)}
                        </pre>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default App;