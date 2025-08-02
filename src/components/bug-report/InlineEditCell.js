import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react';

const InlineEditCell = ({ 
    value, 
    options = [], 
    onChange, 
    className = '', 
    placeholder = 'Select...',
    disabled = false,
    noSearch = false 
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
                setSearchTerm('');
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredOptions = noSearch 
        ? options 
        : options.filter(option => 
            option.label.toLowerCase().includes(searchTerm.toLowerCase())
        );

    const selectedOption = options.find(opt => opt.value === value);
    const displayValue = selectedOption ? selectedOption.label : (value || placeholder);

    const handleSelect = (optionValue) => {
        if (onChange) {
            onChange(optionValue);
        }
        setIsOpen(false);
        setSearchTerm('');
    };

    if (disabled) {
        return (
            <span className={`px-2 py-1 text-xs rounded ${className}`}>
                {displayValue}
            </span>
        );
    }

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`px-2 py-1 text-xs rounded border border-transparent hover:border-gray-300 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 flex items-center justify-between min-w-0 w-full ${className}`}
            >
                <span className="truncate">{displayValue}</span>
                <ChevronDown className="w-3 h-3 ml-1 flex-shrink-0" />
            </button>
            {isOpen && (
                <div className="absolute z-50 mt-1 w-full min-w-[120px] bg-white border border-gray-200 rounded-md shadow-lg">
                    {!noSearch && options.length > 5 && (
                        <div className="p-2 border-b border-gray-200">
                            <input
                                type="text"
                                placeholder="Search..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-teal-500"
                            />
                        </div>
                    )}
                    <div className="max-h-48 overflow-y-auto">
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map((option) => (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => handleSelect(option.value)}
                                    className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-100 focus:bg-gray-100 focus:outline-none ${
                                        value === option.value ? 'bg-teal-50 text-teal-700' : ''
                                    }`}
                                >
                                    {option.label}
                                </button>
                            ))
                        ) : (
                            <div className="px-3 py-2 text-xs text-gray-500">No options found</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default InlineEditCell;