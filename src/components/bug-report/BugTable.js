import React, { useState } from 'react';
import BugTableRow from './BugTableRow'; // Adjust import path as needed

// Import utility functions
import {
    VALID_ENVIRONMENTS // Add this to your utils if not already there
} from '../../utils/bugUtils';

// Default environment options if not available in utils
const DEFAULT_ENVIRONMENTS = ['Development', 'Staging', 'Production', 'Testing', 'Unknown'];

const BugTable = ({
    bugs,
    selectedBugs,
    onBugSelect,
    selectedBug,
    onToggleSelection,
    onToggleGroupSelection,
    allGroupSelected,
    isGroupSelected,
    onDragStart,
    onUpdateBugStatus,
    onUpdateBugSeverity,
    onUpdateBugAssignment,
    onUpdateBugEnvironment,
    onUpdateBugTitle,
    onShowBugDetails,
    onAddNewBug,
    teamMembers = [],
    environments = VALID_ENVIRONMENTS || DEFAULT_ENVIRONMENTS,
    isUpdating = new Set()
}) => {
    const [editingTitle, setEditingTitle] = useState(null);
    const [titleValue, setTitleValue] = useState('');
    const [showNewRow, setShowNewRow] = useState(false);
    const [newBugData, setNewBugData] = useState({
        title: '',
        status: 'New',
        severity: 'Low',
        assignedTo: '',
        environment: 'Unknown'
    });
    const [isCreatingBug, setIsCreatingBug] = useState(false);

    const handleTitleEdit = (bugId, currentTitle) => {
        setEditingTitle(bugId);
        setTitleValue(currentTitle);
    };

    const handleTitleSave = async (bugId) => {
        if (onUpdateBugTitle && titleValue.trim()) {
            try {
                await onUpdateBugTitle(bugId, titleValue.trim());
            } catch (error) {
                console.error('Failed to update title:', error);
            }
        }
        setEditingTitle(null);
        setTitleValue('');
    };

    const handleTitleCancel = () => {
        setEditingTitle(null);
        setTitleValue('');
    };

    const handleTitleKeyDown = (e, bugId) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleTitleSave(bugId);
        } else if (e.key === 'Escape') {
            handleTitleCancel();
        }
    };

    const handleTitleChange = (value) => {
        setTitleValue(value);
    };

    const handleShowNewRow = () => {
        setShowNewRow(true);
        setNewBugData({
            title: '',
            status: 'New',
            severity: 'Low',
            assignedTo: '',
            environment: 'Unknown'
        });
    };

    const handleCreateBug = async () => {
        if (onAddNewBug && newBugData.title.trim()) {
            setIsCreatingBug(true);
            try {
                await onAddNewBug(newBugData);
                setShowNewRow(false);
                setNewBugData({
                    title: '',
                    status: 'New',
                    severity: 'Low',
                    assignedTo: '',
                    environment: 'Unknown'
                });
            } catch (error) {
                console.error('Failed to create bug:', error);
            } finally {
                setIsCreatingBug(false);
            }
        }
    };

    const handleCancelNewBug = () => {
        setShowNewRow(false);
        setNewBugData({
            title: '',
            status: 'New',
            severity: 'Low',
            assignedTo: '',
            environment: 'Unknown'
        });
    };

    const handleNewBugChange = (field, value) => {
        setNewBugData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleNewBugKeyDown = (e) => {
        if (e.key === 'Enter' && newBugData.title.trim()) {
            e.preventDefault();
            handleCreateBug();
        } else if (e.key === 'Escape') {
            handleCancelNewBug();
        }
    };

    return (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr className="h-10">
                            <th scope="col" className="w-10 px-2 py-4 border-r border-gray-200">
                                <div className="flex items-center justify-center h-full">
                                    {onToggleGroupSelection && (
                                        <input
                                            type="checkbox"
                                            className="rounded border-gray-300 text-[#00897B] focus:ring-[#00897B]"
                                            onChange={onToggleGroupSelection}
                                            checked={allGroupSelected}
                                            ref={(input) => {
                                                if (input) input.indeterminate = isGroupSelected && !allGroupSelected;
                                            }}
                                        />
                                    )}
                                </div>
                            </th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider w-[300px] min-w-[300px] max-w-[300px] border-r border-gray-200">
                                <div className="flex items-center h-full">
                                    Bug Title
                                </div>
                            </th>
                            <th scope="col" className="border-r border-gray-200 px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap w-32">
                                <div className="flex items-center h-full">Bug ID</div>
                            </th>
                            <th scope="col" className="border-r border-gray-200 px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap w-32">
                                <div className="flex items-center h-full">Tags</div>
                            </th>
                            <th scope="col" className="border-r border-gray-200 px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap ">
                                <div className="flex items-center h-full w-20">Status</div>
                            </th>
                            <th scope="col" className="border-r border-gray-200 px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap w-32">
                                <div className="flex items-center h-full w-28">Assigned To</div>
                            </th>
                            <th scope="col" className="border-r border-gray-200 px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap w-20">
                                <div className="flex items-center h-full w-20">Priority</div>
                            </th>
                            <th scope="col" className="border-r border-gray-200 px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap w-32">
                                <div className="flex items-center h-full w-20">Severity</div>
                            </th>
                            <th scope="col" className="border-r border-gray-200 px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap w-32">
                                <div className="flex items-center h-full w-auto">Evidence</div>
                            </th>
                            <th scope="col" className="border-r border-gray-200 px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap w-32">
                                <div className="flex items-center h-full">Reporter</div>
                            </th>
                            <th scope="col" className="border-r border-gray-200 px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap w-32">
                                <div className="flex items-center h-full">Source</div>
                            </th>
                            <th scope="col" className="border-r border-gray-200 px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap w-28">
                                <div className="flex items-center h-full w-28">Environment</div>
                            </th>
                            <th scope="col" className="border-r border-gray-200 px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap w-32">
                                <div className="flex items-center h-full">Device/Browser</div>
                            </th>
                            <th scope="col" className="border-r border-gray-200 px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap w-28">
                                <div className="flex items-center h-full">Due Date</div>
                            </th>
                            <th scope="col" className="border-r border-gray-200 px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap w-24">
                                <div className="flex items-center h-full">Created</div>
                            </th>
                            <th scope="col" className="border-r border-gray-200 px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap w-24">
                                <div className="flex items-center h-full">Frequency</div>
                            </th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap w-8">
                                <div className="flex items-center h-full">
                                    <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                                    </svg>
                                </div>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {bugs && bugs.length > 0 ? (
                            <>
                                {bugs.map((bug) => (
                                    <BugTableRow
                                        key={bug.id}
                                        bug={bug}
                                        selectedBugs={selectedBugs}
                                        selectedBug={selectedBug}
                                        onToggleSelection={onToggleSelection}
                                        onBugSelect={onBugSelect}
                                        onDragStart={onDragStart}
                                        onUpdateBugStatus={onUpdateBugStatus}
                                        onUpdateBugSeverity={onUpdateBugSeverity}
                                        onUpdateBugAssignment={onUpdateBugAssignment}
                                        onUpdateBugEnvironment={onUpdateBugEnvironment}
                                        onUpdateBugTitle={onUpdateBugTitle}
                                        onShowBugDetails={onShowBugDetails}
                                        teamMembers={teamMembers}
                                        environments={environments}
                                        isUpdating={isUpdating}
                                        editingTitle={editingTitle}
                                        titleValue={titleValue}
                                        onTitleEdit={handleTitleEdit}
                                        onTitleSave={handleTitleSave}
                                        onTitleCancel={handleTitleCancel}
                                        onTitleChange={handleTitleChange}
                                        onTitleKeyDown={handleTitleKeyDown}
                                    />
                                ))}
                                {/* New Row for adding bugs - Custom implementation */}
                                {showNewRow ? (
                                    <tr className="bg-blue-50 border-l-4 border-[#00897B]">
                                        {/* Checkbox column */}
                                        <td className="w-10 px-2 py-4 border-r border-gray-200">
                                            <div className="flex items-center justify-center h-full">
                                                <button
                                                    onClick={handleCreateBug}
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
                                                onChange={(e) => handleNewBugChange('title', e.target.value)}
                                                onKeyDown={handleNewBugKeyDown}
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
                                                onChange={(e) => handleNewBugChange('status', e.target.value)}
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
                                                onChange={(e) => handleNewBugChange('assignedTo', e.target.value)}
                                                className="text-xs px-2 py-1 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#00897B] max-w-28"
                                            >
                                                <option value="">Unassigned</option>
                                                {teamMembers.map((member) => (
                                                    <option key={member.id || member} value={member.name || member}>
                                                        {member.name || member}
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
                                                onChange={(e) => handleNewBugChange('severity', e.target.value)}
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
                                                onChange={(e) => handleNewBugChange('environment', e.target.value)}
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
                                                onClick={handleCancelNewBug}
                                                className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-400 text-white hover:bg-gray-500 transition-colors"
                                                title="Cancel"
                                            >
                                                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </td>
                                    </tr>
                                ) : (
                                    /* Add New Bug Row - Placeholder */
                                    <tr className="h-12 bg-gray-50 border-dashed border-2 border-gray-300 opacity-60 hover:opacity-100 transition-opacity">
                                        <td className="px-2 py-3 w-10">
                                            <div className="flex items-center justify-center h-full">
                                                <button
                                                    onClick={handleShowNewRow}
                                                    className="flex items-center justify-center w-6 h-6 rounded-full bg-[#00897B] text-white hover:bg-[#00796B] transition-colors"
                                                    title="Add new bug"
                                                >
                                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </td>
                                        <td colSpan="16" className="px-6 py-3 text-center">
                                            <span className="text-sm text-gray-400">Click + to add new bug</span>
                                        </td>
                                    </tr>
                                )}
                            </>
                        ) : (
                            <tr>
                                <td colSpan="17" className="px-6 py-8 text-center">
                                    <div className="flex flex-col items-center justify-center space-y-3">
                                        <svg className="h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        <div className="text-sm text-gray-500">
                                            No bugs found
                                        </div>
                                        {onAddNewBug && (
                                            <button
                                                onClick={handleShowNewRow}
                                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-[#00897B] hover:bg-[#00796B] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00897B] transition-colors"
                                            >
                                                <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                                </svg>
                                                Add First Bug
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default BugTable;