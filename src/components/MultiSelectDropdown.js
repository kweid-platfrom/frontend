import { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Search } from 'lucide-react';

const MultiSelectDropdown = ({ options = [], value = [], onChange, placeholder, type = 'bugs' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [dropdownPosition, setDropdownPosition] = useState({ top: '100%', bottom: 'auto', left: '0', right: 'auto' });
    const dropdownRef = useRef(null);
    const buttonRef = useRef(null);
    const searchInputRef = useRef(null);

    // Validate and filter options
    const validOptions = useMemo(() =>
        Array.isArray(options) ? options.filter((opt) => opt?.value && opt?.label) : [],
        [options]
    );

    // Filter options based on search query
    const filteredOptions = useMemo(() => {
        if (!searchQuery) return validOptions;
        const query = searchQuery.toLowerCase();
        return validOptions.filter((opt) =>
            opt.label.toLowerCase().includes(query) || opt.value.toLowerCase().includes(query)
        );
    }, [searchQuery, validOptions]);

    // Dynamic positioning
    useEffect(() => {
        if (isOpen && buttonRef.current && dropdownRef.current) {
            const buttonRect = buttonRef.current.getBoundingClientRect();
            const dropdownHeight = dropdownRef.current.offsetHeight;
            const viewportHeight = window.innerHeight;
            const viewportWidth = window.innerWidth;

            // Vertical positioning: prefer above if near bottom
            const spaceBelow = viewportHeight - buttonRect.bottom;
            const spaceAbove = buttonRect.top;
            const threshold = 100; // Pixels from bottom to prefer above

            const verticalPosition = (spaceBelow < threshold || spaceBelow < dropdownHeight) && spaceAbove > dropdownHeight
                ? { top: 'auto', bottom: '100%' }
                : { top: '100%', bottom: 'auto' };

            // Horizontal positioning
            let horizontalPosition = { left: '0', right: 'auto' };
            const dropdownWidth = Math.max(300, buttonRect.width);
            const dropdownRight = buttonRect.left + dropdownWidth;
            if (dropdownRight > viewportWidth - 10) { // 10px buffer
                horizontalPosition = { left: 'auto', right: '0' };
            }

            setDropdownPosition({ ...verticalPosition, ...horizontalPosition });
        }
    }, [isOpen]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
                setSearchQuery('');
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [isOpen]);

    // Focus search input when dropdown opens
    useEffect(() => {
        if (isOpen && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [isOpen]);

    const handleToggle = (optionValue) => {
        try {
            const newValue = value.includes(optionValue)
                ? value.filter((v) => v !== optionValue)
                : [...value, optionValue];
            onChange(newValue);
        } catch (error) {
            console.error(`Error updating ${type} selection:`, error);
        }
    };

    const handleDropdownToggle = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsOpen(!isOpen);
    };

    const handleOptionClick = (e, optionValue) => {
        e.preventDefault();
        e.stopPropagation();
        handleToggle(optionValue);
    };

    const handleCheckboxChange = (e, optionValue) => {
        e.preventDefault();
        e.stopPropagation();
        handleToggle(optionValue);
    };

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
    };

    const displayText = useMemo(() => {
        if (value.length === 0 || validOptions.length === 0) {
            return placeholder;
        }

        const selectedLabels = value
            .map((v) => validOptions.find((o) => o.value === v)?.label)
            .filter(Boolean);

        if (selectedLabels.length === 0) {
            return placeholder;
        }

        if (selectedLabels.length === 1) {
            return selectedLabels[0];
        }

        if (selectedLabels.length <= 2) {
            return selectedLabels.join(', ');
        }

        return `${selectedLabels[0]} +${selectedLabels.length - 1} more`;
    }, [value, validOptions, placeholder]);

    return (
        <div className="relative w-full" ref={dropdownRef}>
            <button
                ref={buttonRef}
                type="button"
                className="text-xs px-2 py-1 rounded border border-gray-300 focus:ring-2 focus:ring-teal-500 cursor-pointer w-full bg-white flex items-center justify-between hover:border-gray-400 transition-colors"
                onClick={handleDropdownToggle}
                onMouseDown={(e) => e.stopPropagation()}
                onFocus={(e) => e.stopPropagation()}
            >
                <span className="truncate flex-1 text-left">
                    {displayText}
                </span>
                <ChevronDown className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div
                    className="absolute z-100 bg-white border border-gray-200 rounded shadow-lg max-h-60 overflow-y-auto"
                    style={{
                        top: dropdownPosition.top,
                        bottom: dropdownPosition.bottom,
                        left: dropdownPosition.left,
                        right: dropdownPosition.right,
                        minWidth: '300px',
                        maxWidth: '90vw',
                        width: 'max-content',
                    }}
                >
                    <div className="px-3 py-2 border-b border-gray-200">
                        <div className="relative">
                            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                ref={searchInputRef}
                                type="text"
                                value={searchQuery}
                                onChange={handleSearchChange}
                                placeholder={`Search ${type}...`}
                                className="w-full pl-8 pr-2 py-1 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-teal-500 focus:outline-none"
                                onClick={(e) => e.stopPropagation()}
                            />
                        </div>
                    </div>
                    {filteredOptions.length > 0 ? (
                        filteredOptions.map((option) => (
                            <div
                                key={option.value}
                                className="flex items-center px-3 py-2 text-xs hover:bg-gray-100 cursor-pointer"
                                onClick={(e) => handleOptionClick(e, option.value)}
                                onMouseDown={(e) => e.stopPropagation()}
                            >
                                <input
                                    type="checkbox"
                                    checked={value.includes(option.value)}
                                    onChange={(e) => handleCheckboxChange(e, option.value)}
                                    onClick={(e) => e.stopPropagation()}
                                    className="mr-2 h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
                                />
                                <span className="truncate max-w-[270px]">{option.label}</span>
                            </div>
                        ))
                    ) : (
                        <div className="px-3 py-2 text-xs text-gray-500">No {type} found</div>
                    )}
                </div>
            )}
        </div>
    );
};

export default MultiSelectDropdown;