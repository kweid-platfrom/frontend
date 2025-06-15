// components/EditableField.js
import React from "react";
import { Edit, Save, X } from "lucide-react";

const EditableField = ({ 
    field, 
    value, 
    type = "text", 
    options = null, 
    icon: Icon,
    editingField,
    tempValues,
    loading,
    onEdit,
    onSave,
    onCancel,
    setTempValues
}) => {
    const isEditing = editingField === field;
    
    return (
        <div className="group relative">
            <div className="flex items-start space-x-3">
                {Icon && <Icon className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />}
                <div className="flex-1 min-w-0">
                    {isEditing ? (
                        <div className="flex items-start space-x-2">
                            {type === "select" ? (
                                <select
                                    value={tempValues[field] || value}
                                    onChange={(e) => setTempValues({...tempValues, [field]: e.target.value})}
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    disabled={loading}
                                >
                                    {options?.map(option => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            ) : type === "textarea" ? (
                                <textarea
                                    value={tempValues[field] || value}
                                    onChange={(e) => setTempValues({...tempValues, [field]: e.target.value})}
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                    rows={4}
                                    disabled={loading}
                                />
                            ) : (
                                <input
                                    type={type}
                                    value={tempValues[field] || value}
                                    onChange={(e) => setTempValues({...tempValues, [field]: e.target.value})}
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    disabled={loading}
                                />
                            )}
                            <div className="flex flex-col space-y-1 flex-shrink-0">
                                <button
                                    onClick={() => onSave(field)}
                                    disabled={loading}
                                    className="p-1.5 text-green-600 hover:text-green-800 hover:bg-green-50 rounded disabled:opacity-50 transition-colors"
                                >
                                    <Save className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={onCancel}
                                    disabled={loading}
                                    className="p-1.5 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded disabled:opacity-50 transition-colors"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-start justify-between group">
                            <div className="flex-1 min-w-0">
                                <span className={`text-sm block ${value ? 'text-gray-900' : 'text-gray-500 italic'} ${type === 'textarea' ? 'whitespace-pre-wrap' : ''}`}>
                                    {value || 'Not set'}
                                </span>
                            </div>
                            <button
                                onClick={() => onEdit(field, value)}
                                className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded transition-all flex-shrink-0 ml-2"
                            >
                                <Edit className="h-3 w-3" />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EditableField;