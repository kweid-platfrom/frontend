import React from 'react';

const NewBugRow = ({
    newBugData,
    onNewBugChange,
    onCreateBug,
    onCancelNewBug,
    onNewBugKeyDown,
    teamMembers = [],
    environments = [],
    isCreatingBug = false
}) => {
    return (
        <tr className="bg-blue-50 border-l-4 border-[#00897B]">
            {/* Checkbox column */}
            <td className="w-10 px-2 py-4 border-r border-gray-200">
                <div className="flex items-center justify-center h-full">
                    <button
                        onClick={onCreateBug}
                        disabled={!newBugData.title.trim() || isCreatingBug}
                        className="flex items-center justify-center w-6 h-6 rounded-full bg-[#00897B] text-white hover:bg-[#00796B] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Save new bug"
                    >
                        {isCreatingBug ? (
                            <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : (
                            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        )}
                    </button>
                </div>
            </td>

            {/* Bug Title column */}
            <td className="px-4 py-3 w-[300px] min-w-[300px] max-w-[300px] border-r border-gray-200">
                <input
                    type="text"
                    value={newBugData.title}
                    onChange={(e) => onNewBugChange('title', e.target.value)}
                    onKeyDown={onNewBugKeyDown}
                    placeholder="Enter bug title..."
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#00897B] focus:border-transparent"
                    autoFocus
                />
            </td>

            {/* Bug ID - will be generated */}
            <td className="px-4 py-3 text-sm text-gray-400 border-r border-gray-200">
                Auto-generated
            </td>

            {/* Tags */}
            <td className="px-4 py-3 text-sm text-gray-400 border-r border-gray-200">
                -
            </td>

            {/* Status */}
            <td className="px-4 py-3 border-r border-gray-200">
                <select
                    value={newBugData.status}
                    onChange={(e) => onNewBugChange('status', e.target.value)}
                    className="text-xs px-2 py-1 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#00897B]"
                >
                    <option value="New">New</option>
                    <option value="Open">Open</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Fixed">Fixed</option>
                    <option value="Closed">Closed</option>
                </select>
            </td>

            {/* Assigned To */}
            <td className="px-4 py-3 border-r border-gray-200">
                <select
                    value={newBugData.assignedTo}
                    onChange={(e) => onNewBugChange('assignedTo', e.target.value)}
                    className="text-xs px-2 py-1 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#00897B] max-w-28"
                >
                    <option value="">Unassigned</option>
                    {teamMembers.map((member) => (
                        <option key={member.id || member} value={member.firstName || member.name || member}>
                            {member.firstName || member.name || member}
                        </option>
                    ))}
                </select>
            </td>

            {/* Priority */}
            <td className="px-4 py-3 text-sm text-gray-400 border-r border-gray-200">
                -
            </td>

            {/* Severity */}
            <td className="px-4 py-3 border-r border-gray-200">
                <select
                    value={newBugData.severity}
                    onChange={(e) => onNewBugChange('severity', e.target.value)}
                    className="text-xs px-2 py-1 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#00897B]"
                >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                </select>
            </td>

            {/* Evidence */}
            <td className="px-4 py-3 text-sm text-gray-400 border-r border-gray-200">
                -
            </td>

            {/* Reporter */}
            <td className="px-4 py-3 text-sm text-gray-400 border-r border-gray-200">
                Current User
            </td>

            {/* Source */}
            <td className="px-4 py-3 text-sm text-gray-400 border-r border-gray-200">
                -
            </td>

            {/* Environment */}
            <td className="px-4 py-3 border-r border-gray-200">
                <select
                    value={newBugData.environment}
                    onChange={(e) => onNewBugChange('environment', e.target.value)}
                    className="text-xs px-2 py-1 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#00897B] max-w-28"
                >
                    {environments.map((env) => (
                        <option key={env} value={env}>{env}</option>
                    ))}
                </select>
            </td>

            {/* Device/Browser */}
            <td className="px-4 py-3 text-sm text-gray-400 border-r border-gray-200">
                -
            </td>

            {/* Due Date */}
            <td className="px-4 py-3 text-sm text-gray-400 border-r border-gray-200">
                -
            </td>

            {/* Created */}
            <td className="px-4 py-3 text-sm text-gray-400 border-r border-gray-200">
                Now
            </td>

            {/* Frequency */}
            <td className="px-4 py-3 text-sm text-gray-400 border-r border-gray-200">
                -
            </td>

            {/* Actions */}
            <td className="px-4 py-3">
                <button
                    onClick={onCancelNewBug}
                    className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-400 text-white hover:bg-gray-500 transition-colors"
                    title="Cancel"
                >
                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </td>
        </tr>
    );
};

export default NewBugRow;