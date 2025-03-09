/* eslint-disable @typescript-eslint/no-require-imports */
const KeyMetrics = require("./KeyMetrics").default;
const MetricCard = require("./MetricCard").default;
const ChartCard = require("./ChartCard").default;
const BugStatusChart = require("./BugStatusChart").default;
const DefectTrendsChart = require("./DefectTrendsChart").default;
const TestCoverageChart = require("./TestCoverageChart").default;
const TestResultChart = require("./TestResultsChart").default;
const ActivityFeed = require("./ActivityFeed").default;

module.exports = {
    KeyMetrics,
    MetricCard,
    ChartCard,
    BugStatusChart,
    DefectTrendsChart,
    TestCoverageChart,
    TestResultChart,
    ActivityFeed,
};
