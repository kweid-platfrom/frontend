"use client"
import React, { useState } from "react";
import { X, Copy, Check } from "lucide-react";

const SelectionActionsModal = ({ 
    selectedBugs, 
    onClose, 
    statusOptions, 
    priorityOptions, 
    severityOptions, 
    teamMembers, 
    updateMultipleBugs
}) => {
    const [bulkEditField, setBulkEditField] = useState("");
    const [bulkEditValue, setBulkEditValue] = useState("");
    
    const handleApplyChanges = () => {
        if (!bulkEditField || !bulkEditValue) return;
        
        const updates = selectedBugs.map(bug => ({
            ...bug,
            [bulkEditField]: bulkEditValue
        }));
        
        updateMultipleBugs(updates);
        onClose();
    };
    
    const copyToClipboard = () => {
        const textToCopy = selectedBugs.map(bug => 
            `${bug.id} - ${bug.title} - ${bug.status} - ${bug.priority} - ${bug.severity}`
        ).join('\n');
        
        navigator.clipboard.writeText(textToCopy)
            .then(() => {
                alert("Bug information copied to clipboard!");
            })
            .catch(err => {
                console.error("Failed to copy text: ", err);
            });
    };

    // Generate field options for bulk editing
    const fieldOptions = [
        {value: "status", label: "Status", options: statusOptions},
        {value: "priority", label: "Priority", options: priorityOptions},
        {value: "severity", label: "Severity", options: severityOptions},
        {value: "assignedTo", label: "Assigned To", options: teamMembers},
        {value: "category", label: "Category", options: null}, // Free text
        {value: "dueDate", label: "Due Date", options: null}, // Free text
    ];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
            <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-auto">
                <div className="sticky top-0 bg-white p-4 border-b flex justify-between items-center">
                    <h2 className="text-xl font-semibold">Selected Bugs ({selectedBugs.length})</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100">
                        <X size={20} />
                    </button>
                </div>
                
                <div className="p-6">
                    {/* Selected bugs list */}
                    <div className="mb-6">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="text-lg font-medium">Selected Items</h3>
                            <button 
                                onClick={copyToClipboard}
                                className="flex items-center text-sm text-blue-600 hover:text-blue-800"
                            >
                                <Copy size={16} className="mr-1" />
                                Copy List
                            </button>
                        </div>
                        
                        <div className="max-h-64 overflow-y-auto border rounded">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50 sticky top-0">
                                    <tr>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {selectedBugs.map(bug => (
                                        <tr key={bug.id}>
                                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{bug.id}</td>
                                            <td className="px-3 py-2 text-sm text-gray-900 truncate max-w-xs">{bug.title}</td>
                                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{bug.status}</td>
                                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{bug.priority}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    
                    {/* Bulk edit section */}
                    <div className="mt-8 p-4 border rounded bg-gray-50">
                        <h3 className="text-lg font-medium mb-4">Bulk Edit</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Field selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Field to Update</label>
                                <select 
                                    value={bulkEditField}
                                    onChange={(e) => {
                                        setBulkEditField(e.target.value);
                                        setBulkEditValue(""); // Reset value when field changes
                                    }}
                                    className="w-full p-2 border rounded"
                                >
                                    <option value="">Select Field</option>
                                    {fieldOptions.map(field => (
                                        <option key={field.value} value={field.value}>{field.label}</option>
                                    ))}
                                </select>
                            </div>
                            
                            {/* Value selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">New Value</label>
                                {bulkEditField && fieldOptions.find(f => f.value === bulkEditField)?.options ? (
                                    <select 
                                        value={bulkEditValue}
                                        onChange={(e) => setBulkEditValue(e.target.value)}
                                        className="w-full p-2 border rounded"
                                    >
                                        <option value="">Select Value</option>
                                        {fieldOptions.find(f => f.value === bulkEditField).options.map(option => (
                                            <option key={option} value={option}>{option}</option>
                                        ))}
                                    </select>
                                ) : (
                                    <input 
                                        type="text" 
                                        value={bulkEditValue}
                                        onChange={(e) => setBulkEditValue(e.target.value)}
                                        className="w-full p-2 border rounded"
                                        placeholder={`Enter new ${fieldOptions.find(f => f.value === bulkEditField)?.label || 'value'}`}
                                        disabled={!bulkEditField}
                                    />
                                )}
                            </div>
                        </div>
                        
                        <div className="mt-4 text-sm text-gray-600">
                            <p>
                                {selectedBugs.length} bugs will be updated with {bulkEditField ? `${fieldOptions.find(f => f.value === bulkEditField).label}` : "the selected field"} 
                                {bulkEditValue ? ` set to "${bulkEditValue}"` : ""}
                            </p>
                        </div>
                    </div>
                </div>
                
                {/* Action Buttons */}
                <div className="sticky bottom-0 bg-gray-50 p-4 border-t flex justify-end space-x-2">
                    <button 
                        className="px-4 py-2 border rounded hover:bg-gray-100"
                        onClick={onClose}
                    >
                        Cancel
                    </button>
                    <button 
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center disabled:bg-blue-300"
                        onClick={handleApplyChanges}
                        disabled={!bulkEditField || !bulkEditValue}
                    >
                        <Check size={16} className="mr-1" />
                        Apply Changes
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SelectionActionsModal;