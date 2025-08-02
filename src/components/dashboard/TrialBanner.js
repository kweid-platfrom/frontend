// components/dashboard/TrialBanner.jsx
export const TrialBanner = ({ trialDaysRemaining }) => (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 shadow rounded-lg p-6">
        <p className="text-gray-600">
            🎉 Trial active: {trialDaysRemaining} days remaining
        </p>
    </div>
);
