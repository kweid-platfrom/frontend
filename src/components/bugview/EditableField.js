// components/EditableField.js
import React from "react";
import { Edit, Check, X } from "lucide-react";

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
    setTempValues,
    className = "",
    disabled = false,
    showEditIcon = true,
    isTitle = false
}) => {
    const isEditing = editingField === field;
    const isLargeTitle = isTitle || className.includes('text-2xl');
    
    return (
        <div className="group relative">
            <div className="flex items-start space-x-3">
                {Icon && <Icon className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />}
                <div className="flex-1 min-w-0">
                    {isEditing ? (
                        <div className="flex items-start space-x-2">
                            {isLargeTitle ? (
                                <div className="relative w-full">
                                    <input
                                        type={type}
                                        value={tempValues[field] || value}
                                        onChange={(e) => setTempValues({...tempValues, [field]: e.target.value})}
                                        className={`w-full pr-20 px-3 py-2 border border-input rounded text-2xl md:text-3xl font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-transparent bg-background ${className}`}
                                        disabled={disabled || loading}
                                    />
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex space-x-2">
                                        <button
                                            onClick={() => onSave(field)}
                                            disabled={disabled || loading}
                                            className="p-1.5 text-success hover:text-success/80 hover:bg-accent rounded disabled:opacity-50 transition-colors"
                                        >
                                            <Check className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={onCancel}
                                            disabled={disabled || loading}
                                            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded disabled:opacity-50 transition-colors"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            ) : type === "select" ? (
                                <select
                                    value={tempValues[field] || value}
                                    onChange={(e) => setTempValues({...tempValues, [field]: e.target.value})}
                                    className={`flex-1 px-3 py-2 border border-input rounded text-sm focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-transparent bg-background text-foreground ${className}`}
                                    disabled={disabled || loading}
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
                                    className={`flex-1 px-3 py-2 border border-input rounded text-sm focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-transparent resize-none bg-background text-foreground ${className}`}
                                    rows={4}
                                    disabled={disabled || loading}
                                />
                            ) : (
                                <input
                                    type={type}
                                    value={tempValues[field] || value}
                                    onChange={(e) => setTempValues({...tempValues, [field]: e.target.value})}
                                    className={`flex-1 px-3 py-2 border border-input rounded text-sm focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-transparent bg-background text-foreground ${className}`}
                                    disabled={disabled || loading}
                                />
                            )}
                            {!isLargeTitle && (
                                <div className="flex flex-col space-y-1 flex-shrink-0">
                                    <button
                                        onClick={() => onSave(field)}
                                        disabled={disabled || loading}
                                        className="p-1.5 text-success hover:text-success/80 hover:bg-accent rounded disabled:opacity-50 transition-colors"
                                    >
                                        <Check className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={onCancel}
                                        disabled={disabled || loading}
                                        className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded disabled:opacity-50 transition-colors"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex items-start justify-between group">
                            <div className="flex-1 min-w-0">
                                <span className={`text-sm block ${value ? 'text-foreground' : 'text-muted-foreground italic'} ${type === 'textarea' ? 'whitespace-pre-wrap' : ''} ${className}`}>
                                    {value || 'Not set'}
                                </span>
                            </div>
                            {showEditIcon && (
                                <button
                                    onClick={() => onEdit(field, value)}
                                    className="opacity-0 group-hover:opacity-100 p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded transition-all flex-shrink-0 ml-2"
                                >
                                    <Edit className="h-3 w-3" />
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EditableField;