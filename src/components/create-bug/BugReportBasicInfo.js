/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect, useRef } from "react";
import { 
    AlertCircle, 
    Users, 
    User, 
    Calendar,
    Flag,
    Tag,
    ChevronDown,
    Clock,
    AlertTriangle
} from "lucide-react";

const BugReportBasicInfo = ({ 
    formData, 
    updateFormData, 
    teamMembers = []
}) => {
    const [showTeamDropdown, setShowTeamDropdown] = useState(false);
    const techInfoDetected = useRef(false); // Prevent multiple detections

    useEffect(() => {
        // Only run once and only if tech info hasn't been detected yet
        if (techInfoDetected.current) return;

        // Auto-detect and populate technical information in the background
        const detectTechnicalInfo = () => {
            const userAgent = navigator.userAgent;
            const platform = navigator.platform;
            const language = navigator.language;

            // Detect browser
            let browserName = "Unknown";
            let browserVersion = "Unknown";

            if (userAgent.indexOf("Chrome") > -1) {
                browserName = "Chrome";
                browserVersion = userAgent.match(/Chrome\/(\d+)/)?.[1] || "Unknown";
            } else if (userAgent.indexOf("Firefox") > -1) {
                browserName = "Firefox";
                browserVersion = userAgent.match(/Firefox\/(\d+)/)?.[1] || "Unknown";
            } else if (userAgent.indexOf("Safari") > -1 && userAgent.indexOf("Chrome") === -1) {
                browserName = "Safari";
                browserVersion = userAgent.match(/Version\/(\d+)/)?.[1] || "Unknown";
            } else if (userAgent.indexOf("Edge") > -1) {
                browserName = "Edge";
                browserVersion = userAgent.match(/Edge\/(\d+)/)?.[1] || "Unknown";
            }

            // Detect OS
            let osName = "Unknown";
            if (platform.indexOf("Win") > -1) osName = "Windows";
            else if (platform.indexOf("Mac") > -1) osName = "macOS";
            else if (platform.indexOf("Linux") > -1) osName = "Linux";
            else if (userAgent.indexOf("Android") > -1) osName = "Android";
            else if (userAgent.indexOf("iPhone") > -1 || userAgent.indexOf("iPad") > -1) osName = "iOS";

            const techInfo = {
                browser: `${browserName} ${browserVersion}`,
                operatingSystem: osName,
                screenResolution: `${screen.width}x${screen.height}`,
                viewportSize: `${window.innerWidth}x${window.innerHeight}`,
                userAgent: userAgent,
                pageUrl: window.location.href,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                language: language
            };

            // Only update if the fields are empty to avoid overwriting user input
            if (!formData.browserInfo) {
                updateFormData("browserInfo", techInfo.browser);
            }
            if (!formData.deviceInfo) {
                updateFormData("deviceInfo", `${techInfo.operatingSystem}, ${techInfo.screenResolution}`);
            }
            if (!formData.userAgent) {
                updateFormData("userAgent", techInfo.userAgent);
            }
            if (!formData.pageUrl) {
                updateFormData("pageUrl", techInfo.pageUrl);
            }

            techInfoDetected.current = true;
        };

        detectTechnicalInfo();
    }, []); // Empty dependency array - run only once

    const severities = [
        { value: "Low", label: "Low", color: "text-green-600", bg: "bg-green-100", icon: Clock },
        { value: "Medium", label: "Medium", color: "text-yellow-600", bg: "bg-yellow-100", icon: Flag },
        { value: "High", label: "High", color: "text-orange-600", bg: "bg-orange-100", icon: AlertTriangle },
        { value: "Critical", label: "Critical", color: "text-red-600", bg: "bg-red-100", icon: AlertTriangle }
    ];

    const categories = [
        { value: "UI Issue", label: "UI/UX Issue" },
        { value: "Performance", label: "Performance" },
        { value: "Security", label: "Security" },
        { value: "Functionality", label: "Functionality" },
        { value: "Integration", label: "Integration" },
        { value: "Browser Compatibility", label: "Browser Compatibility" },
        { value: "Mobile", label: "Mobile" },
        { value: "Other", label: "Other" }
    ];

    const handleAssigneeChange = (memberId) => {
        updateFormData("assignedTo", memberId);
        setShowTeamDropdown(false);
    };

    const getSelectedMember = () => {
        if (!formData.assignedTo) return null;
        return teamMembers.find(member => member.id === formData.assignedTo);
    };

    const handleChange = (field, value) => {
        updateFormData(field, value);
        
        // Auto-set priority based on severity
        if (field === 'severity') {
            updateFormData("priority", value);
        }
    };

    const getSeverityDescription = (severity) => {
        const descriptions = {
            'Critical': 'System unusable, blocking critical functionality',
            'High': 'Major feature broken, significant impact',
            'Medium': 'Feature partially broken, moderate impact',
            'Low': 'Minor issue, cosmetic or low impact'
        };
        return descriptions[severity] || '';
    };

    return (
        <div className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
                {/* Title */}
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-900">
                        Bug Title <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00897B] focus:border-transparent transition-all duration-200"
                        value={formData.title || ""}
                        onChange={(e) => handleChange("title", e.target.value)}
                        placeholder="Brief, clear title describing the issue"
                        required
                    />
                </div>

                {/* Category and Severity */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-900">
                            <Tag className="inline h-4 w-4 mr-2" />
                            Category
                        </label>
                        <select
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00897B] focus:border-transparent transition-all duration-200"
                            value={formData.category || "UI Issue"}
                            onChange={(e) => handleChange("category", e.target.value)}
                        >
                            {categories.map(category => (
                                <option key={category.value} value={category.value}>
                                    {category.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-900">
                            <Flag className="inline h-4 w-4 mr-2" />
                            Severity <span className="text-red-500">*</span>
                        </label>
                        <select
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00897B] focus:border-transparent transition-all duration-200"
                            value={formData.severity || "Low"}
                            onChange={(e) => handleChange("severity", e.target.value)}
                            required
                        >
                            {severities.map(severity => (
                                <option key={severity.value} value={severity.value}>
                                    {severity.label}
                                </option>
                            ))}
                        </select>
                        <div className={`text-xs font-medium ${
                            formData.severity === 'Critical' ? 'text-red-600' :
                            formData.severity === 'High' ? 'text-orange-600' : 
                            formData.severity === 'Medium' ? 'text-yellow-600' : 'text-green-600'
                        }`}>
                            {getSeverityDescription(formData.severity)}
                        </div>
                    </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-900">
                        Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00897B] focus:border-transparent transition-all duration-200 resize-none"
                        rows="4"
                        value={formData.description || ""}
                        onChange={(e) => handleChange("description", e.target.value)}
                        placeholder="Describe what happened and what you expected to happen..."
                        required
                    />
                </div>

                {/* Expected vs Actual Behavior */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-900">Expected Behavior</label>
                        <textarea
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00897B] focus:border-transparent transition-all duration-200 resize-none"
                            rows="3"
                            value={formData.expectedBehavior || ""}
                            onChange={(e) => handleChange("expectedBehavior", e.target.value)}
                            placeholder="What should have happened?"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-900">
                            Actual Behavior <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00897B] focus:border-transparent transition-all duration-200 resize-none"
                            rows="3"
                            value={formData.actualBehavior || ""}
                            onChange={(e) => handleChange("actualBehavior", e.target.value)}
                            placeholder="What actually happened?"
                            required
                        />
                    </div>
                </div>

                {/* Steps to Reproduce */}
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-900">Steps to Reproduce</label>
                    <textarea
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00897B] focus:border-transparent transition-all duration-200 resize-none"
                        rows="3"
                        value={formData.stepsToReproduce || ""}
                        onChange={(e) => handleChange("stepsToReproduce", e.target.value)}
                        placeholder="1. Navigate to...&#10;2. Click on...&#10;3. Expected: ...&#10;4. Actual: ..."
                    />
                </div>
            </div>

            {/* Assignment Section */}
            <div className="space-y-4 border-t pt-6">
                <h3 className="text-lg font-medium text-gray-900">Assignment & Additional Details</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Team Assignment */}
                    <div className="space-y-2">
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
                                                <div className="w-6 h-6 bg-[#00897B] rounded-full flex items-center justify-center">
                                                    <User className="h-3 w-3 text-white" />
                                                </div>
                                                <span className="text-gray-900">
                                                    {getSelectedMember().name || getSelectedMember().email}
                                                </span>
                                            </>
                                        ) : (
                                            <>
                                                <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                                                    <User className="h-3 w-3 text-gray-400" />
                                                </div>
                                                <span className="text-gray-500">Select team member (optional)</span>
                                            </>
                                        )}
                                    </div>
                                    <ChevronDown
                                        className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${
                                            showTeamDropdown ? 'rotate-180' : ''
                                        }`}
                                    />
                                </button>

                                {showTeamDropdown && (
                                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                                        <div className="p-2">
                                            <button
                                                type="button"
                                                onClick={() => handleAssigneeChange("")}
                                                className="w-full text-left px-3 py-2 rounded-md hover:bg-gray-100 transition-colors duration-150 flex items-center space-x-3"
                                            >
                                                <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                                                    <User className="h-3 w-3 text-gray-400" />
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
                                                    <div className="w-6 h-6 bg-[#00897B] rounded-full flex items-center justify-center">
                                                        <User className="h-3 w-3 text-white" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="text-gray-900 text-sm">
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
                            <div className="p-3 border-2 border-dashed border-gray-300 rounded-lg text-center">
                                <Users className="h-6 w-6 text-gray-400 mx-auto mb-1" />
                                <p className="text-xs text-gray-500">No team members available</p>
                            </div>
                        )}
                    </div>

                    {/* Due Date */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-900">
                            <Calendar className="inline h-4 w-4 mr-2" />
                            Expected Resolution Date
                        </label>
                        <input
                            type="date"
                            value={formData.dueDate || ""}
                            onChange={(e) => handleChange("dueDate", e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00897B] focus:border-transparent transition-all duration-200"
                            min={new Date().toISOString().split('T')[0]}
                        />
                    </div>
                </div>

                {/* Additional Context */}
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-900">Additional Notes</label>
                    <textarea
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00897B] focus:border-transparent transition-all duration-200 resize-none"
                        rows="2"
                        value={formData.workaround || ""}
                        onChange={(e) => handleChange("workaround", e.target.value)}
                        placeholder="Any workarounds, additional context, or notes..."
                    />
                </div>
            </div>

            {/* Tips */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                    <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                        <p className="text-sm font-medium text-blue-900">Tips for a good bug report:</p>
                        <ul className="text-sm text-blue-800 mt-1 space-y-1">
                            <li>• Use a clear, descriptive title</li>
                            <li>• Include what you expected vs. what actually happened</li>
                            <li>• Provide step-by-step reproduction instructions</li>
                            <li>• Severity determines priority automatically</li>
                            <li>• Technical details are captured automatically</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BugReportBasicInfo;