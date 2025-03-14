"use client"
import React, { useState } from 'react';
import BugItem from './BugItem';
import ColorPicker from './ColorPicker';
import { ChevronDown, ChevronRight, Palette } from 'lucide-react';

const BugGroup = ({
    title,
    bugs,
    groupColor,
    onColorChange,
    selectedBugs,
    onBugSelection,
    onGroupSelection
}) => {
    const [expanded, setExpanded] = useState(true);
    const [colorPickerOpen, setColorPickerOpen] = useState(false);

    const toggleExpanded = () => setExpanded(!expanded);

    // Check if all bugs in this group are selected
    const allSelected = bugs.length > 0 && bugs.every(bug => selectedBugs.includes(bug.id));

    // Handle select all checkbox for this group
    const handleSelectAll = () => {
        onGroupSelection(title, !allSelected);
    };

    return (
        <div className="border border-gray-200 rounded-md shadow-sm overflow-hidden">
            <div
                className="flex items-center px-4 py-3 bg-gray-50"
                style={{ borderLeft: `6px solid ${groupColor}` }}
            >
                <div
                    className="flex items-center cursor-pointer mr-4"
                    onClick={toggleExpanded}
                >
                    {expanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                </div>

                <div className="flex items-center">
                    <h3
                        className="font-medium text-lg mr-2"
                        style={{ color: groupColor }}
                    >
                        {title}
                    </h3>
                    <div className="relative">
                        <button
                            className="p-1 hover:bg-gray-200 rounded"
                            onClick={() => setColorPickerOpen(!colorPickerOpen)}
                        >
                            <Palette size={16} />
                        </button>
                        {colorPickerOpen && (
                            <div className="absolute top-full left-0 z-10 mt-1">
                                <ColorPicker
                                    currentColor={groupColor}
                                    onColorChange={(color) => {
                                        onColorChange(color);
                                        setColorPickerOpen(false);
                                    }}
                                />
                            </div>
                        )}
                    </div>
                </div>

                <div className="ml-auto flex items-center gap-2 text-sm text-gray-500">
                    <span>{bugs.length} bugs</span>
                </div>
            </div>

            {expanded && (
                <div className="overflow-x-auto">
                    <div className="min-w-max">
                        <div className="flex items-center bg-gray-100 py-2 px-2 border-b border-gray-200">
                            <div className="min-w-[20px]">
                                <input
                                    type="checkbox"
                                    checked={allSelected}
                                    onChange={handleSelectAll}
                                    className="w-4 h-4"
                                />
                            </div>
                            <div className="font-medium min-w-[300px] pl-6">Title</div>
                            <div className="font-medium min-w-[100px] px-2">Status</div>
                            <div className="font-medium min-w-[100px] px-2">Priority</div>
                            <div className="font-medium min-w-[100px] px-2">Severity</div>
                            <div className="font-medium min-w-[150px] px-2">Assigned To</div>
                            <div className="font-medium min-w-[150px] px-2">Created At</div>
                            <div className="font-medium min-w-[100px] px-2">Automated</div>
                            <div className="font-medium min-w-[100px] px-2">Test Link</div>
                            <div className="font-medium min-w-[140px] px-2">Source</div>
                        </div>

                        {bugs.map(bug => (
                            <BugItem
                                key={bug.id}
                                bug={bug}
                                isSelected={selectedBugs.includes(bug.id)}
                                onSelectBug={(bugId, selected) => onBugSelection(bugId, selected)}
                                groupColor={groupColor}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default BugGroup;