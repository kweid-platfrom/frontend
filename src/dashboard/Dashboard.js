import React from "react";

const DashboardPage = () => {
    return (
        <div className="min-h-screen flex flex-col bg-gray-100">
            {/* Navbar */}
            <nav className="bg-green-700 text-white p-4 flex justify-between items-center">
                <div className="text-xl font-bold">Dashboard</div>
                <button className="bg-red-500 px-4 py-2 rounded-md hover:bg-red-600">
                    Logout
                </button>
            </nav>

            {/* Main Content */}
            <div className="flex flex-1 flex-col md:flex-row p-6">
                {/* Sidebar */}
                <aside className="w-full md:w-1/4 bg-white shadow-md p-4">
                    <ul className="space-y-4">
                        <li className="p-2 bg-green-600 text-white rounded-md text-center">
                            Overview
                        </li>
                        <li className="p-2 bg-gray-200 rounded-md text-center hover:bg-gray-300">
                            Test Cases
                        </li>
                        <li className="p-2 bg-gray-200 rounded-md text-center hover:bg-gray-300">
                            Defect Tracking
                        </li>
                        <li className="p-2 bg-gray-200 rounded-md text-center hover:bg-gray-300">
                            Reports
                        </li>
                    </ul>
                </aside>

                {/* Content Area */}
                <main className="flex-1 bg-white shadow-md p-6 ml-0 md:ml-4">
                    <h2 className="text-2xl font-bold mb-4">Dashboard Overview</h2>
                    <p>Welcome to your test case management and defect tracking dashboard.</p>

                    {/* Sample Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                        <div className="bg-blue-500 text-white p-4 rounded-md text-center">
                            <h3 className="text-xl font-semibold">Test Cases</h3>
                            <p className="text-3xl">120</p>
                        </div>
                        <div className="bg-red-500 text-white p-4 rounded-md text-center">
                            <h3 className="text-xl font-semibold">Defects</h3>
                            <p className="text-3xl">35</p>
                        </div>
                        <div className="bg-green-500 text-white p-4 rounded-md text-center">
                            <h3 className="text-xl font-semibold">Reports</h3>
                            <p className="text-3xl">50</p>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default DashboardPage;
