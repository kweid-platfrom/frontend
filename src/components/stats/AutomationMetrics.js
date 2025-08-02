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

    const getColorClasses = (color) => {
        const colorMap = {
            success: {
                bg: 'bg-[rgb(var(--color-success)/0.1)]',
                text: 'text-[rgb(var(--color-success))]',
                bar: 'bg-[rgb(var(--color-success))]',
                border: 'border-[rgb(var(--color-success)/0.2)]'
            },
            info: {
                bg: 'bg-[rgb(var(--color-info)/0.1)]',
                text: 'text-[rgb(var(--color-info))]',
                bar: 'bg-[rgb(var(--color-info))]',
                border: 'border-[rgb(var(--color-info)/0.2)]'
            },
            warning: {
                bg: 'bg-[rgb(var(--color-warning)/0.1)]',
                text: 'text-[rgb(var(--color-warning))]',
                bar: 'bg-[rgb(var(--color-warning))]',
                border: 'border-[rgb(var(--color-warning)/0.2)]'
            },
            error: {
                bg: 'bg-[rgb(var(--color-error)/0.1)]',
                text: 'text-[rgb(var(--color-error))]',
                bar: 'bg-[rgb(var(--color-error))]',
                border: 'border-[rgb(var(--color-error)/0.2)]'
            }
        };
        return colorMap[color] || colorMap.info; // Default to info if color is not found
    };

    const MetricCard = ({ title, value, change, icon: Icon, color = "info", suffix = "" }) => {
        const colors = getColorClasses(color);
        return (
            <div className="bg-card rounded-lg border border-border p-6 hover:shadow-theme-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-lg ${colors.bg}`}>
                        <Icon className={`w-6 h-6 ${colors.text}`} />
                    </div>
                    {change && (
                        <div className={`flex items-center text-sm ${change >= 0 ? 'text-[rgb(var(--color-success))]' : 'text-[rgb(var(--color-error))]'}`}>
                            <TrendingUp className="w-4 h-4 mr-1" />
                            {change > 0 ? '+' : ''}{change}%
                        </div>
                    )}
                </div>
                <div className="space-y-1">
                    <p className="text-2xl font-bold text-foreground">
                        {typeof value === 'number' ? value.toLocaleString() : value}{suffix}
                    </p>
                    <p className="text-sm text-muted-foreground">{title}</p>
                </div>
            </div>
        );
    };

    const ProgressBar = ({ label, value, max = 100, color = "info" }) => {
        const colors = getColorClasses(color);
        return (
            <div className="space-y-2">
                <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-medium text-foreground">{value}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                    <div
                        className={`h-2 rounded-full transition-all duration-300 ${colors.bar}`}
                        style={{ width: `${Math.min(value, max)}%` }}
                    />
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-foreground mb-2">Automation Metrics</h2>
                    <p className="text-muted-foreground">Test automation coverage, performance, and ROI tracking</p>
                </div>
                <div className="flex items-center space-x-2 bg-[rgb(var(--color-success)/0.1)] px-3 py-2 rounded-lg">
                    <Bot className="w-5 h-5 text-[rgb(var(--color-success))]" />
                    <span className="text-sm font-medium text-[rgb(var(--color-success))]">
                        {automationRatio.toFixed(1)}% Automated
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                    title="Automation Coverage"
                    value={automationRatio.toFixed(1)}
                    suffix="%"
                    icon={Bot}
                    color="success"
                    change={5.2}
                />
                <MetricCard
                    title="Cypress Scripts Generated"
                    value={cypressScriptsGenerated}
                    icon={GitBranch}
                    color="info"
                    change={12.3}
                />
                <MetricCard
                    title="CI/CD Integrations"
                    value={cicdIntegrationsActive}
                    icon={Zap}
                    color="warning"
                />
                <MetricCard
                    title="Hours Saved"
                    value={timesSavedByAutomation}
                    icon={Clock}
                    color="info"
                    change={8.7}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-card rounded-lg border border-border p-6">
                    <h3 className="text-lg font-semibold text-foreground mb-6">Automation Quality</h3>
                    <div className="space-y-6">
                        <ProgressBar
                            label="Test Pass Rate"
                            value={automatedTestPassRate}
                            color="success"
                        />
                        <ProgressBar
                            label="Test Stability"
                            value={automatedTestStability}
                            color="info"
                        />
                        <ProgressBar
                            label="Cypress Success Rate"
                            value={cypressGenerationSuccessRate}
                            color="info"
                        />
                        <ProgressBar
                            label="Manual Reduction"
                            value={manualTestingReduction}
                            color="warning"
                        />
                    </div>
                </div>

                <div className="bg-card rounded-lg border border-border p-6">
                    <h3 className="text-lg font-semibold text-foreground mb-6">ROI & Efficiency</h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-[rgb(var(--color-success)/0.1)] rounded-lg">
                            <div className="flex items-center space-x-3">
                                <DollarSign className="w-5 h-5 text-[rgb(var(--color-success))]" />
                                <div>
                                    <p className="font-medium text-foreground">Automation ROI</p>
                                    <p className="text-sm text-muted-foreground">Return on investment</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-2xl font-bold text-[rgb(var(--color-success))]">{automationROI}%</p>
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-[rgb(var(--color-info)/0.1)] rounded-lg">
                            <div className="flex items-center space-x-3">
                                <TrendingUp className="w-5 h-5 text-[rgb(var(--color-info))]" />
                                <div>
                                    <p className="font-medium text-foreground">Conversions</p>
                                    <p className="text-sm text-muted-foreground">Manual to automated</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-2xl font-bold text-[rgb(var(--color-info))]">{manualToAutomatedConversions}</p>
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-[rgb(var(--color-info)/0.1)] rounded-lg">
                            <div className="flex items-center space-x-3">
                                <GitBranch className="w-5 h-5 text-[rgb(var(--color-info))]" />
                                <div>
                                    <p className="font-medium text-foreground">GitHub Syncs</p>
                                    <p className="text-sm text-muted-foreground">Completed integrations</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-2xl font-bold text-[rgb(var(--color-info))]">{githubSyncsCompleted}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-card rounded-lg border border-border p-6">
                <h3 className="text-lg font-semibold text-foreground mb-6">Automation Progress</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                        <div className="inline-flex items-center justify-center w-12 h-12 bg-[rgb(var(--color-success)/0.1)] rounded-full mb-3">
                            <CheckCircle className="w-6 h-6 text-[rgb(var(--color-success))]" />
                        </div>
                        <h4 className="font-medium text-foreground mb-1">Test Creation</h4>
                        <p className="text-2xl font-bold text-[rgb(var(--color-success))] mb-1">{cypressScriptsGenerated}</p>
                        <p className="text-sm text-muted-foreground">Scripts generated</p>
                    </div>

                    <div className="text-center">
                        <div className="inline-flex items-center justify-center w-12 h-12 bg-[rgb(var(--color-info)/0.1)] rounded-full mb-3">
                            <Zap className="w-6 h-6 text-[rgb(var(--color-info))]" />
                        </div>
                        <h4 className="font-medium text-foreground mb-1">Execution</h4>
                        <p className="text-2xl font-bold text-[rgb(var(--color-info))] mb-1">{automationExecutionRate}</p>
                        <p className="text-sm text-muted-foreground">Execution rate</p>
                    </div>

                    <div className="text-center">
                        <div className="inline-flex items-center justify-center w-12 h-12 bg-[rgb(var(--color-warning)/0.1)] rounded-full mb-3">
                            <Clock className="w-6 h-6 text-[rgb(var(--color-warning))]" />
                        </div>
                        <h4 className="font-medium text-foreground mb-1">Maintenance</h4>
                        <p className="text-2xl font-bold text-[rgb(var(--color-warning))] mb-1">{automationMaintenanceEffort}</p>
                        <p className="text-sm text-muted-foreground">Hours per week</p>
                    </div>
                </div>
            </div>

            {(automatedTestPassRate < 80 || automatedTestStability < 85) && (
                <div className="bg-[rgb(var(--color-warning)/0.1)] border border-[rgb(var(--color-warning)/0.2)] rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                        <AlertCircle className="w-5 h-5 text-[rgb(var(--color-warning))] mt-0.5" />
                        <div>
                            <h4 className="font-medium text-[rgb(var(--color-warning))]">Automation Health Alert</h4>
                            <p className="text-sm text-[rgb(var(--color-warning))] mt-1">
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