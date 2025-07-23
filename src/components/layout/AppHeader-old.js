import React from 'react';
import { useSuite } from '../context/hooks/useSuite';
import { useUI } from '../../hooks/useUI';
import { useAuth } from '../context/hooks/useAuth';

const AppHeader = () => {
    const { suites, activeSuite, sprints, activeSprint, setActiveSuite, setActiveSprint } = useSuite();
    const { notification, clearNotification } = useUI();
    const { user, logout } = useAuth();

    const handleSuiteChange = (e) => {
        const selectedSuite = suites.find((suite) => suite.id === e.target.value);
        setActiveSuite(selectedSuite);
    };

    const handleSprintChange = (e) => {
        const selectedSprint = sprints.find((sprint) => sprint.id === e.target.value);
        setActiveSprint(selectedSprint);
    };

    return (
        <header className="bg-blue-600 text-white p-4 flex justify-between items-center">
            <div className="flex items-center gap-4">
                <h1 className="text-lg font-bold">QA Platform</h1>
                <select
                    value={activeSuite?.id || ''}
                    onChange={handleSuiteChange}
                    className="p-2 bg-white text-black rounded"
                >
                    <option value="" disabled>Select Suite</option>
                    {suites.map((suite) => (
                        <option key={suite.id} value={suite.id}>
                            {suite.name}
                        </option>
                    ))}
                </select>
                {activeSuite && (
                    <select
                        value={activeSprint?.id || ''}
                        onChange={handleSprintChange}
                        className="p-2 bg-white text-black rounded"
                    >
                        <option value="" disabled>Select Sprint</option>
                        {sprints.map((sprint) => (
                            <option key={sprint.id} value={sprint.id}>
                                {sprint.metadata.name}
                            </option>
                        ))}
                    </select>
                )}
            </div>
            <div className="flex items-center gap-4">
                {notification && (
                    <div className="bg-green-500 p-2 rounded">
                        {notification.message}
                        <button onClick={clearNotification} className="ml-2 text-sm">✕</button>
                    </div>
                )}
                <div className="flex items-center gap-2">
                    <span>{user?.profile?.display_name || user?.email}</span>
                    <button onClick={logout} className="p-2 bg-red-500 rounded hover:bg-red-600">
                        Logout
                    </button>
                </div>
            </div>
        </header>
    );
};

export default AppHeader;