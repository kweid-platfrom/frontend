// components/AppHeader.js
import React from "react";
import { useApp } from "@/context/AppProvider";
import { LogOut } from "lucide-react";

const AppHeader = () => {
    const { state: { auth, suites }, actions } = useApp();

    const handleSuiteChange = (e) => {
        const selectedSuite = suites.userSuites.find((suite) => suite.suite_id === e.target.value);
        if (selectedSuite) actions.activateSuite(selectedSuite);
    };

    return (
        <header className="bg-white shadow-sm p-4 flex justify-between items-center">
            <div className="flex items-center gap-4">
                <h1 className="text-lg font-semibold text-gray-900">QA Platform</h1>
                {suites.userSuites.length > 0 && (
                    <select
                        value={suites.activeSuite?.suite_id || ""}
                        onChange={handleSuiteChange}
                        className="p-2 bg-gray-50 border border-gray-200 text-gray-900 rounded-md focus:ring-teal-500 focus:border-teal-500"
                        aria-label="Select active test suite"
                    >
                        <option value="" disabled>
                            Select a suite
                        </option>
                        {suites.userSuites.map((suite) => (
                            <option key={suite.suite_id} value={suite.suite_id}>
                                {suite.name}
                            </option>
                        ))}
                    </select>
                )}
            </div>
            <div className="flex items-center gap-4">
                {auth.currentUser && (
                    <span className="text-sm text-gray-600">
                        {auth.currentUser.displayName || auth.currentUser.email}
                    </span>
                )}
                {auth.isAuthenticated && (
                    <button
                        onClick={actions.logout}
                        className="flex items-center px-3 py-2 text-sm text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                        aria-label="Log out"
                    >
                        <LogOut className="w-4 h-4 mr-2" />
                        Logout
                    </button>
                )}
            </div>
        </header>
    );
};

export default AppHeader;