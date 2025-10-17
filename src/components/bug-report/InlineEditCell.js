import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { ChevronDown } from 'lucide-react';

const InlineEditCell = React.memo(({ 
    value, 
    options = [], 
    onChange, 
    className = '', 
    placeholder = 'Select...',
    disabled = false,
    noSearch = false 
}) => {
    // Fix: Convert object values to strings safely
    const safeValue = useMemo(() => {
        if (!value) return '';
        if (typeof value === 'string') return value;
        if (typeof value === 'object' && value !== null) {
            // If it's an evidence object (browser, os, device), return empty string
            if (value.browser || value.os || value.device || value.url) {
                console.warn('Object value passed to InlineEditCell, using empty string:', value);
                return '';
            }
            // Try to extract meaningful string from other objects
            if (value.name) return String(value.name);
            if (value.label) return String(value.label);
            if (value.value) return String(value.value);
            return '';
        }
        return String(value);
    }, [value]);

    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [optimisticValue, setOptimisticValue] = useState(safeValue);
    const dropdownRef = useRef(null);
    const errorTimeoutRef = useRef(null);

    // Update optimistic value when prop changes
    useEffect(() => {
        setOptimisticValue(safeValue);
    }, [safeValue]);

    // Cleanup error timeout on unmount
    useEffect(() => {
        return () => {
            if (errorTimeoutRef.current) {
                clearTimeout(errorTimeoutRef.current);
            }
        };
    }, []);

    const handleClickOutside = useCallback((event) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
            setIsOpen(false);
            setSearchTerm('');
        }
    }, []);

    useEffect(() => {
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [isOpen, handleClickOutside]);

    const filteredOptions = useMemo(() => {
        if (noSearch || !searchTerm) return options;
        return options.filter(option => 
            option.label.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [options, searchTerm, noSearch]);

    const selectedOption = useMemo(() => 
        options.find(opt => opt.value === optimisticValue), 
        [options, optimisticValue]
    );
    
    const displayValue = selectedOption ? selectedOption.label : (optimisticValue || placeholder);

    const handleSelect = useCallback(async (optionValue) => {
        if (!onChange || optionValue === optimisticValue) {
            setIsOpen(false);
            setSearchTerm('');
            return;
        }

        // Optimistic update
        setOptimisticValue(optionValue);
        setIsUpdating(true);
        setHasError(false);
        setIsOpen(false);
        setSearchTerm('');

        // Clear any existing error timeout
        if (errorTimeoutRef.current) {
            clearTimeout(errorTimeoutRef.current);
        }
        
        try {
            const result = await onChange(optionValue);
            
            // Check if the update was successful
            if (result && result.success === false) {
                console.error('Update failed:', result.error?.message);
                // Revert optimistic update
                setOptimisticValue(safeValue);
                setHasError(true);
                
                // Clear error after 3 seconds
                errorTimeoutRef.current = setTimeout(() => {
                    setHasError(false);
                }, 3000);
            }
            // If successful, the optimistic value stays
        } catch (error) {
            console.error('Error updating value:', error);
            // Revert optimistic update
            setOptimisticValue(safeValue);
            setHasError(true);
            
            // Clear error after 3 seconds
            errorTimeoutRef.current = setTimeout(() => {
                setHasError(false);
            }, 3000);
        } finally {
            setIsUpdating(false);
        }
    }, [onChange, optimisticValue, safeValue]);

    const toggleDropdown = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isUpdating) {
            setIsOpen(!isOpen);
        }
    }, [isOpen, isUpdating]);

    const handleSearchChange = useCallback((e) => {
        setSearchTerm(e.target.value);
    }, []);

    if (disabled) {
        return (
            <span className={`px-3 py-2 text-xs rounded text-muted-foreground ${className}`}>
                {displayValue}
            </span>
        );
    }

    const isPlaceholder = displayValue === placeholder;
    const textClass = isPlaceholder ? 'text-muted-foreground' : 'text-foreground';

    const buttonClassName = `px-2.5 py-1.5 text-xs rounded border border-transparent hover:border-border focus:border-primary focus:outline-none focus:ring-1 focus:ring-ring flex items-center justify-between min-w-0 w-24 ${className} ${textClass} ${
        isUpdating ? 'opacity-50 cursor-wait' : ''
    } ${
        hasError ? 'border-destructive bg-destructive/5' : ''
    }`;

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                type="button"
                onClick={toggleDropdown}
                disabled={isUpdating}
                className={buttonClassName}
                title={hasError ? 'Update failed' : undefined}
            >
                <span className="truncate">{displayValue}</span>
                <div className="flex items-center ml-1 flex-shrink-0">
                    {isUpdating && (
                        <div className="w-3 h-3 border border-muted border-t-primary rounded-full animate-spin mr-1"></div>
                    )}
                    <ChevronDown className="w-3 h-3" />
                </div>
            </button>
            {isOpen && !isUpdating && (
                <div className="absolute z-50 mt-1 w-full min-w-[120px] bg-card border-border rounded shadow-theme-lg">
                    {!noSearch && options.length > 5 && (
                        <div className="p-2 border-b border-border">
                            <input
                                type="text"
                                placeholder="Search..."
                                value={searchTerm}
                                onChange={handleSearchChange}
                                className="w-full px-3 py-2 text-xs bg-input text-foreground border-border rounded focus:outline-none focus:ring-1 focus:ring-ring"
                                onClick={(e) => e.stopPropagation()}
                            />
                        </div>
                    )}
                    <div className="max-h-48 overflow-y-auto">
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map((option) => (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleSelect(option.value);
                                    }}
                                    className={`w-full text-left px-3 py-2 text-xs hover:bg-accent focus:bg-accent focus:outline-none text-foreground ${
                                        optimisticValue === option.value ? 'bg-primary/10 text-primary' : ''
                                    }`}
                                >
                                    {option.label}
                                </button>
                            ))
                        ) : (
                            <div className="px-3 py-2 text-xs text-muted-foreground">No options found</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
});

InlineEditCell.displayName = 'InlineEditCell';

export default InlineEditCell;