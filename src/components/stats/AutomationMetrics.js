import React from 'react';
import { Bot, TrendingUp, GitBranch, CheckCircle, AlertCircle, Clock, DollarSign, Zap } from 'lucide-react';

const AutomationMetrics = ({ metrics = {} }) => {
    const {
        automationRatio = 0,
        manualToAutomatedConversions = 0,
        cypressScriptsGenerated = 0,
        cypressGenerationSuccessRate = 0,
        githubSyncsCompleted = 0,
        cicdIntegrationsActive = 0,
        automationExecutionRate = 0,
        automatedTestPassRate = 0,
        automatedTestStability = 0,
        automationMaintenanceEffort = 0,
        timesSavedByAutomation = 0,
        automationROI = 0,
        manualTestingReduction = 0
    } = metrics;

    const MetricCard = ({ title, value, change, icon: Icon, color = "blue", suffix = "" }) => (
        <div className="bg-white rounded-lg border p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg bg-${color}-50`}>
                    <Icon className={`w-6 h-6 text-${color}-600`} />
                </div>
                {change && (
                    <div className={`flex items-center text-sm ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        <TrendingUp className="w-4 h-4 mr-1" />
                        {change > 0 ? '+' : ''}{change}%
                    </div>
                )}
            </div>
            <div className="space-y-1">
                <p className="text-2xl font-bold text-gray-900">
                    {typeof value === 'number' ? value.toLocaleString() : value}{suffix}
                </p>
                <p className="text-sm text-gray-600">{title}</p>
            </div>
        </div>
    );

    const ProgressBar = ({ label, value, max = 100, color = "blue" }) => (
        <div className="space-y-2">
            <div className="flex justify-between text-sm">
                <span className="text-gray-600">{label}</span>
                <span className="font-medium">{value}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                    className={`bg-${color}-500 h-2 rounded-full transition-all duration-300`}
                    style={{ width: `${Math.min(value, max)}%` }}
                />
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Automation Metrics</h2>
                    <p className="text-gray-600">Test automation coverage, performance, and ROI tracking</p>
                </div>
                <div className="flex items-center space-x-2 bg-green-50 px-3 py-2 rounded-lg">
                    <Bot className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-medium text-green-700">
                        {automationRatio.toFixed(1)}% Automated
                    </span>
                </div>
            </div>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                    title="Automation Coverage"
                    value={automationRatio.toFixed(1)}
                    suffix="%"
                    icon={Bot}
                    color="green"
                    change={5.2}
                />
                <MetricCard
                    title="Cypress Scripts Generated"
                    value={cypressScriptsGenerated}
                    icon={GitBranch}
                    color="purple"
                    change={12.3}
                />
                <MetricCard
                    title="CI/CD Integrations"
                    value={cicdIntegrationsActive}
                    icon={Zap}
                    color="orange"
                />
                <MetricCard
                    title="Hours Saved"
                    value={timesSavedByAutomation}
                    icon={Clock}
                    color="blue"
                    change={8.7}
                />
            </div>

            {/* Automation Performance */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg border p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-6">Automation Quality</h3>
                    <div className="space-y-6">
                        <ProgressBar
                            label="Test Pass Rate"
                            value={automatedTestPassRate}
                            color="green"
                        />
                        <ProgressBar
                            label="Test Stability"
                            value={automatedTestStability}
                            color="blue"
                        />
                        <ProgressBar
                            label="Cypress Success Rate"
                            value={cypressGenerationSuccessRate}
                            color="purple"
                        />
                        <ProgressBar
                            label="Manual Reduction"
                            value={manualTestingReduction}
                            color="orange"
                        />
                    </div>
                </div>

                <div className="bg-white rounded-lg border p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-6">ROI & Efficiency</h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                            <div className="flex items-center space-x-3">
                                <DollarSign className="w-5 h-5 text-green-600" />
                                <div>
                                    <p className="font-medium text-gray-900">Automation ROI</p>
                                    <p className="text-sm text-gray-600">Return on investment</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-2xl font-bold text-green-600">{automationROI}%</p>
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                            <div className="flex items-center space-x-3">
                                <TrendingUp className="w-5 h-5 text-blue-600" />
                                <div>
                                    <p className="font-medium text-gray-900">Conversions</p>
                                    <p className="text-sm text-gray-600">Manual to automated</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-2xl font-bold text-blue-600">{manualToAutomatedConversions}</p>
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                            <div className="flex items-center space-x-3">
                                <GitBranch className="w-5 h-5 text-purple-600" />
                                <div>
                                    <p className="font-medium text-gray-900">GitHub Syncs</p>
                                    <p className="text-sm text-gray-600">Completed integrations</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-2xl font-bold text-purple-600">{githubSyncsCompleted}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Automation Timeline */}
            <div className="bg-white rounded-lg border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Automation Progress</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                        <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-3">
                            <CheckCircle className="w-6 h-6 text-green-600" />
                        </div>
                        <h4 className="font-medium text-gray-900 mb-1">Test Creation</h4>
                        <p className="text-2xl font-bold text-green-600 mb-1">{cypressScriptsGenerated}</p>
                        <p className="text-sm text-gray-600">Scripts generated</p>
                    </div>

                    <div className="text-center">
                        <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-3">
                            <Zap className="w-6 h-6 text-blue-600" />
                        </div>
                        <h4 className="font-medium text-gray-900 mb-1">Execution</h4>
                        <p className="text-2xl font-bold text-blue-600 mb-1">{automationExecutionRate}</p>
                        <p className="text-sm text-gray-600">Execution rate</p>
                    </div>

                    <div className="text-center">
                        <div className="inline-flex items-center justify-center w-12 h-12 bg-orange-100 rounded-full mb-3">
                            <Clock className="w-6 h-6 text-orange-600" />
                        </div>
                        <h4 className="font-medium text-gray-900 mb-1">Maintenance</h4>
                        <p className="text-2xl font-bold text-orange-600 mb-1">{automationMaintenanceEffort}</p>
                        <p className="text-sm text-gray-600">Hours per week</p>
                    </div>
                </div>
            </div>

            {/* Automation Alerts */}
            {(automatedTestPassRate < 80 || automatedTestStability < 85) && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                        <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                        <div>
                            <h4 className="font-medium text-yellow-800">Automation Health Alert</h4>
                            <p className="text-sm text-yellow-700 mt-1">
                                {automatedTestPassRate < 80 && "Test pass rate is below 80%. "}
                                {automatedTestStability < 85 && "Test stability needs attention. "}
                                Consider reviewing flaky tests and updating automation scripts.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AutomationMetrics;