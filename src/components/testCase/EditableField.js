// components/testCase/EditableField.js
'use client';
import React, { useState, useEffect } from 'react';
import { Check, X, Edit3 } from 'lucide-react';

const EditableField = ({ field, value, type = 'text', options = [], className = '', placeholder, onSave }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(value);
    const [showEditIcon, setShowEditIcon] = useState(false);

    useEffect(() => {
        setEditValue(value);
    }, [value]);

    const handleSave = () => {
        if (onSave) {
            onSave(field, editValue);
        }
        setIsEditing(false);
    };

    const handleCancel = () => {
        setEditValue(value);
        setIsEditing(false);
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && type !== 'textarea') {
            e.preventDefault();
            handleSave();
        } else if (e.key === 'Escape') {
            handleCancel();
        }
    };

    if (isEditing) {
        return (
            <div className="flex items-center space-x-2">
                {type === 'select' ? (
                    <select
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="flex-1 px-3 py-2 text-sm rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
                        autoFocus
                    >
                        {options.map(option => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                ) : type === 'textarea' ? (
                    <textarea
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={handleKeyPress}
                        className="flex-1 px-3 py-2 text-sm rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring resize-none"
                        rows={3}
                        placeholder={placeholder}
                        autoFocus
                    />
                ) : (
                    <input
                        type={type}
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={handleKeyPress}
                        className="flex-1 px-3 py-2 text-sm rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring placeholder:text-muted-foreground"
                        placeholder={placeholder}
                        autoFocus
                    />
                )}
                <button
                    onClick={handleSave}
                    className="p-1.5 rounded hover:bg-secondary text-success hover:text-success/80 transition-colors"
                    title="Save"
                >
                    <Check className="h-4 w-4" />
                </button>
                <button
                    onClick={handleCancel}
                    className="p-1.5 rounded hover:bg-secondary text-destructive hover:text-destructive/80 transition-colors"
                    title="Cancel"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>
        );
    }

    return (
        <div
            className={`group relative ${className}`}
            onMouseEnter={() => setShowEditIcon(true)}
            onMouseLeave={() => setShowEditIcon(false)}
        >
            <div className="flex items-center space-x-2">
                <span className={`flex-1 ${value ? 'text-foreground' : 'text-muted-foreground italic'}`}>{value || placeholder || 'Not set'}</span>
                {showEditIcon && (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
                        title="Edit"
                    >
                        <Edit3 className="h-4 w-4" />
                    </button>
                )}
            </div>
        </div>
    );
};

export default EditableField;