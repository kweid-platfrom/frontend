// components/stats/TestExecutionSummary.js
import { ProgressBar } from "./ProgressBar";

export const TestExecutionSummary = ({ data }) => {
    const total = data.passed + data.failed + data.pending + data.skipped;
    const passRate = total > 0 ? Math.round((data.passed / total) * 100) : 0;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Test Execution Summary</h3>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{data.passed}</div>
                    <div className="text-sm text-gray-600">Passed</div>
                </div>
                <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{data.failed}</div>
                    <div className="text-sm text-gray-600">Failed</div>
                </div>
                <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">{data.pending}</div>
                    <div className="text-sm text-gray-600">Pending</div>
                </div>
                <div className="text-center">
                    <div className="text-2xl font-bold text-gray-600">{data.skipped || 0}</div>
                    <div className="text-sm text-gray-600">Skipped</div>
                </div>
            </div>

            <div className="space-y-3">
                <div className="flex justify-between text-sm">
                    <span>Pass Rate</span>
                    <span className="font-medium">{passRate}%</span>
                </div>
                <ProgressBar value={passRate} color={passRate >= 80 ? 'green' : passRate >= 60 ? 'yellow' : 'red'} />

                <div className="flex justify-between text-sm text-gray-600">
                    <span>Total Tests</span>
                    <span>{total}</span>
                </div>
            </div>
        </div>
    );
};
