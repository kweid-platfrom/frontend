// components/stats/PerformanceMetrics.js
export const PerformanceMetrics = ({ metrics }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">
                    {metrics.avgExecutionTime}s
                </div>
                <div className="text-sm text-gray-600">Avg Execution Time</div>
                <div className="text-xs text-gray-500 mt-1">
                    {metrics.executionTrend >= 0 ? '↑' : '↓'} {Math.abs(metrics.executionTrend)}% from last week
                </div>
            </div>

            <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">
                    {metrics.throughput}
                </div>
                <div className="text-sm text-gray-600">Tests/Hour</div>
                <div className="text-xs text-gray-500 mt-1">
                    Peak: {metrics.peakThroughput} tests/hour
                </div>
            </div>

            <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">
                    {metrics.reliability}%
                </div>
                <div className="text-sm text-gray-600">Test Reliability</div>
                <div className="text-xs text-gray-500 mt-1">
                    {metrics.flakiness} flaky tests detected
                </div>
            </div>
        </div>
    </div>
);