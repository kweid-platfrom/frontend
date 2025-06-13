/* eslint-disable @typescript-eslint/no-require-imports */
// Make sure these paths point to the correct files
const { MetricCard } = require("./MetricCard");
const { StatusBadge } = require("./StatusBadge");
const { ChartContainer } = require("./ChartContainer");
const { TestExecutionChart } = require("./TestExecutionChart");
const { TestCoverageChart } = require("./TestCoverageChart");
const { BugTrendsChart } = require("./BugTrendsChart");
const { AutomationProgressChart } = require("./AutomationProgressChart");
const { QuickActionButton } = require("./QuickActionButtons");
const { RealTimeIndicator } = require("./RealTimeIndicator");
const { ProgressBar } = require("./ProgressBar");
const { AlertCard } = require("./AlertCard");
const { TestExecutionSummary } = require("./TestExecutionSummary");
const { PerformanceMetrics } = require("./PerformanceMetrics");
const { TeamProductivity } = require("./TeamProductivity");

// components/stats/index.js - Main export file
export {
    MetricCard,
    StatusBadge,
    ChartContainer,
    TestExecutionChart,
    TestCoverageChart,
    BugTrendsChart,
    AutomationProgressChart,
    QuickActionButton,
    RealTimeIndicator,
    ProgressBar,
    AlertCard,
    TestExecutionSummary,
    PerformanceMetrics,
    TeamProductivity
};