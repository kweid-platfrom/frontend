import React, { useState, useEffect } from "react";
import { Monitor, Globe, Code, AlertTriangle } from "lucide-react";

const BugReportTechnicalDetails = ({ formData, updateFormData }) => {
    const [browserInfo, setBrowserInfo] = useState({});

    useEffect(() => {
        // Auto-detect browser and device information
        const detectBrowserInfo = () => {
            const userAgent = navigator.userAgent;
            const platform = navigator.platform;
            const language = navigator.language;
            const cookieEnabled = navigator.cookieEnabled;
            const onLine = navigator.onLine;

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

            const info = {
                browser: `${browserName} ${browserVersion}`,
                os: osName,
                platform: platform,
                language: language,
                screenResolution: `${screen.width}x${screen.height}`,
                viewportSize: `${window.innerWidth}x${window.innerHeight}`,
                userAgent: userAgent,
                cookieEnabled: cookieEnabled,
                onLine: onLine,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
            };

            setBrowserInfo(info);

            // FIX: Auto-populate form data with separate calls
            updateFormData("browser", info.browser);
            updateFormData("operatingSystem", info.os);
            updateFormData("screenResolution", info.screenResolution);
            updateFormData("userAgent", info.userAgent);
        };

        detectBrowserInfo();
    }, [updateFormData]);

    // FIX: Change this function to pass field and value as separate parameters
    const handleChange = (field, value) => {
        updateFormData(field, value); // Changed from updateFormData({ [field]: value })
    };

    return (
        <div className="space-y-6">
            {/* Environment Information */}
            <div className="space-y-4">
                <div className="flex items-center space-x-2">
                    <Monitor className="h-5 w-5 text-gray-600" />
                    <h3 className="text-lg font-medium text-gray-900">Environment Information</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-900">Browser</label>
                        <input
                            type="text"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00897B] focus:border-transparent transition-all duration-200"
                            value={formData.browser || ""}
                            onChange={(e) => handleChange("browser", e.target.value)}
                            placeholder="e.g., Chrome 120"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-900">Operating System</label>
                        <input
                            type="text"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00897B] focus:border-transparent transition-all duration-200"
                            value={formData.operatingSystem || ""}
                            onChange={(e) => handleChange("operatingSystem", e.target.value)}
                            placeholder="e.g., Windows 11, macOS Sonoma"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-900">Device Type</label>
                        <select
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00897B] focus:border-transparent transition-all duration-200"
                            value={formData.deviceType || "Desktop"}
                            onChange={(e) => handleChange("deviceType", e.target.value)}
                        >
                            <option value="Desktop">Desktop</option>
                            <option value="Laptop">Laptop</option>
                            <option value="Tablet">Tablet</option>
                            <option value="Mobile">Mobile</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-900">Screen Resolution</label>
                        <input
                            type="text"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00897B] focus:border-transparent transition-all duration-200"
                            value={formData.screenResolution || ""}
                            onChange={(e) => handleChange("screenResolution", e.target.value)}
                            placeholder="e.g., 1920x1080"
                        />
                    </div>
                </div>
            </div>

            {/* Network Information */}
            <div className="space-y-4">
                <div className="flex items-center space-x-2">
                    <Globe className="h-5 w-5 text-gray-600" />
                    <h3 className="text-lg font-medium text-gray-900">Network & URL Information</h3>
                </div>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-900">Page URL</label>
                        <input
                            type="url"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00897B] focus:border-transparent transition-all duration-200"
                            value={formData.pageUrl || window.location.href}
                            onChange={(e) => handleChange("pageUrl", e.target.value)}
                            placeholder="https://example.com/page"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-900">Connection Type</label>
                            <select
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00897B] focus:border-transparent transition-all duration-200"
                                value={formData.connectionType || "WiFi"}
                                onChange={(e) => handleChange("connectionType", e.target.value)}
                            >
                                <option value="WiFi">WiFi</option>
                                <option value="Ethernet">Ethernet</option>
                                <option value="Mobile Data">Mobile Data</option>
                                <option value="Unknown">Unknown</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-900">Network Speed</label>
                            <select
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00897B] focus:border-transparent transition-all duration-200"
                                value={formData.networkSpeed || "Fast"}
                                onChange={(e) => handleChange("networkSpeed", e.target.value)}
                            >
                                <option value="Fast">Fast (&gt;10 Mbps)</option>
                                <option value="Medium">Medium (1-10 Mbps)</option>
                                <option value="Slow">Slow (&lt;1 Mbps)</option>
                                <option value="Unknown">Unknown</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Error Details */}
            <div className="space-y-4">
                <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-5 w-5 text-gray-600" />
                    <h3 className="text-lg font-medium text-gray-900">Error Details</h3>
                </div>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-900">Error Message</label>
                        <textarea
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00897B] focus:border-transparent transition-all duration-200 resize-none"
                            rows="3"
                            value={formData.errorMessage || ""}
                            onChange={(e) => handleChange("errorMessage", e.target.value)}
                            placeholder="Copy and paste any error messages you saw..."
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-900">Console Logs</label>
                        <textarea
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00897B] focus:border-transparent transition-all duration-200 resize-none font-mono text-sm"
                            rows="4"
                            value={formData.consoleLogs || ""}
                            onChange={(e) => handleChange("consoleLogs", e.target.value)}
                            placeholder="Paste console logs here (F12 > Console)..."
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-900">Expected Behavior</label>
                        <textarea
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00897B] focus:border-transparent transition-all duration-200 resize-none"
                            rows="2"
                            value={formData.expectedBehavior || ""}
                            onChange={(e) => handleChange("expectedBehavior", e.target.value)}
                            placeholder="What should have happened instead?"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-900">Actual Behavior</label>
                        <textarea
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00897B] focus:border-transparent transition-all duration-200 resize-none"
                            rows="2"
                            value={formData.actualBehavior || ""}
                            onChange={(e) => handleChange("actualBehavior", e.target.value)}
                            placeholder="What actually happened?"
                        />
                    </div>
                </div>
            </div>

            {/* Technical Context */}
            <div className="space-y-4">
                <div className="flex items-center space-x-2">
                    <Code className="h-5 w-5 text-gray-600" />
                    <h3 className="text-lg font-medium text-gray-900">Additional Technical Context</h3>
                </div>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-900">User Agent</label>
                        <textarea
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00897B] focus:border-transparent transition-all duration-200 resize-none font-mono text-xs"
                            rows="2"
                            value={formData.userAgent || ""}
                            onChange={(e) => handleChange("userAgent", e.target.value)}
                            placeholder="Browser user agent string..."
                            readOnly
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-900">Additional Notes</label>
                        <textarea
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00897B] focus:border-transparent transition-all duration-200 resize-none"
                            rows="3"
                            value={formData.technicalNotes || ""}
                            onChange={(e) => handleChange("technicalNotes", e.target.value)}
                            placeholder="Any other technical details that might be relevant..."
                        />
                    </div>
                </div>
            </div>

            {/* Auto-detected Information Display */}
            {Object.keys(browserInfo).length > 0 && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Auto-detected Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-gray-600">
                        <div>Browser: {browserInfo.browser}</div>
                        <div>OS: {browserInfo.os}</div>
                        <div>Viewport: {browserInfo.viewportSize}</div>
                        <div>Language: {browserInfo.language}</div>
                        <div>Timezone: {browserInfo.timezone}</div>
                        <div>Online: {browserInfo.onLine ? 'Yes' : 'No'}</div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BugReportTechnicalDetails;