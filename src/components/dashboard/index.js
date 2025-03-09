/* eslint-disable @typescript-eslint/no-require-imports */
// Make sure these paths point to the correct files
const { KeyMetrics } = require("./KeyMetrics");
const { MetricCard } = require("./MetricCard");
const { ChartCard } = require("./ChartCard");
const { BugStatusChart } = require("./BugStatusChart");
const { DefectTrendsChart } = require("./DefectTrendsChart");
const { TestCoverageChart } = require("./TestCoverageChart");
const { TestResultChart } = require("./TestResultsChart");
const { ActivityFeed } = require("./ActivityFeed");
const { ViewToggle } = require("./ViewToggle");

// Export as default exports to match your original pattern
module.exports = {
    KeyMetrics: KeyMetrics,
    MetricCard: MetricCard,
    ChartCard: ChartCard,
    BugStatusChart: BugStatusChart,
    DefectTrendsChart: DefectTrendsChart,
    TestCoverageChart: TestCoverageChart,
    TestResultChart: TestResultChart,
    ActivityFeed: ActivityFeed,
    ViewToggle: ViewToggle
};