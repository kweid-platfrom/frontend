"use client";
import React, { useState, useRef, useEffect } from "react";
import { Filter, ChevronLeft, X } from "lucide-react";

export const ViewToggle = ({ options, defaultOption, onChange }) => {
    const [selectedOption, setSelectedOption] = useState(defaultOption || options[0]);
    const [showFilters, setShowFilters] = useState(false);
    const [showFilterOptions, setShowFilterOptions] = useState(false);
    const [activeFilter, setActiveFilter] = useState(null);
    const [selectedFilters, setSelectedFilters] = useState({
        status: [],
        priority: [],
        assignedTo: []
    });
    
    // Refs for positioning
    const filterButtonRef = useRef(null);
    const filterOverlayRef = useRef(null);
    const optionsOverlayRef = useRef(null);
    
    // State for overlay positions
    const [overlayPosition, setOverlayPosition] = useState({ top: 0, left: 0 });
    const [secondaryOverlayPosition, setSecondaryOverlayPosition] = useState({ top: 0, left: 0 });

    // Handle clicks outside the overlays
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (filterOverlayRef.current && !filterOverlayRef.current.contains(event.target) &&
                filterButtonRef.current && !filterButtonRef.current.contains(event.target) &&
                (!optionsOverlayRef.current || !optionsOverlayRef.current.contains(event.target))) {
                setShowFilters(false);
                setShowFilterOptions(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    // Calculate overlay positions
    useEffect(() => {
        if (showFilters && filterButtonRef.current) {
            const rect = filterButtonRef.current.getBoundingClientRect();
            
            setOverlayPosition({
                top: rect.bottom + window.scrollY,
                left: 1375 // Fixed left position at 1375px
            });
        }
    }, [showFilters]);

    // Calculate secondary overlay position
    useEffect(() => {
        if (showFilterOptions && filterOverlayRef.current) {
            const rect = filterOverlayRef.current.getBoundingClientRect();
            const viewportWidth = window.innerWidth;
            
            // Default position (to the right of primary overlay)
            let newPosition = {
                top: rect.top + window.scrollY,
                left: rect.right + 10 + window.scrollX
            };
            
            // Check if there's enough space to the right
            if (rect.right + 250 > viewportWidth) {
                // Not enough space to the right, place to the left instead
                newPosition.left = Math.max(10, rect.left - 250 + window.scrollX);
                
                // If still not enough space, place below
                if (newPosition.left < 10) {
                    newPosition = {
                        top: rect.bottom + 10 + window.scrollY,
                        left: rect.left + window.scrollX
                    };
                }
            }
            
            setSecondaryOverlayPosition(newPosition);
        }
    }, [showFilterOptions]);

    const handleOptionChange = (option) => {
        setSelectedOption(option);
        if (onChange) {
            onChange(option);
        }
    };

    const handleFilterSelection = (filterType) => {
        setActiveFilter(filterType);
        setShowFilterOptions(true);
    };

    const handleFilterOptionSelect = (filterType, option) => {
        setSelectedFilters(prev => {
            const currentOptions = [...prev[filterType]];
            const optionIndex = currentOptions.indexOf(option);
            
            if (optionIndex >= 0) {
                currentOptions.splice(optionIndex, 1);
            } else {
                currentOptions.push(option);
            }
            
            return {
                ...prev,
                [filterType]: currentOptions
            };
        });
    };

    const clearFilters = (filterType = null) => {
        if (filterType) {
            setSelectedFilters(prev => ({
                ...prev,
                [filterType]: []
            }));
        } else {
            setSelectedFilters({
                status: [],
                priority: [],
                assignedTo: []
            });
        }
    };

    const closeFilterOptions = () => {
        setShowFilterOptions(false);
        setActiveFilter(null);
    };

    const getFilterOptions = () => {
        switch(activeFilter) {
            case 'status':
                return {
                    title: 'Status',
                    options: ['To Do', 'In Progress', 'In Review', 'Done']
                };
            case 'priority':
                return {
                    title: 'Priority',
                    options: ['Low', 'Medium', 'High', 'Urgent']
                };
            case 'assignedTo':
                return {
                    title: 'Assigned To',
                    options: ['John Doe', 'Jane Smith', 'Alex Johnson', 'Sam Wilson']
                };
            default:
                return { title: '', options: [] };
        }
    };

    const { title, options: filterOptions } = getFilterOptions();

    // Function to determine the correct style for the pill buttons
    const getPillButtonStyle = (option, index) => {
        const isSelected = selectedOption.value === option.value;
        
        // Base styles
        let className = "px-3 py-2 flex items-center ";
        
        // First button in pill
        if (index === 0) {
            className += "rounded-l-lg ";
        } 
        // Last button in pill
        else if (index === options.length - 1) {
            className += "rounded-r-lg ";
        }
        // Middle buttons
        else {
            className += "border-l border-r border-gray-300 ";
        }
        
        // Selected state
        if (isSelected) {
            className += "bg-[#00897B] text-white";
        } else {
            className += "bg-[#eaeaea] text-gray-700 hover:bg-[#f0f0f0]";
        }
        
        return className;
    };

    return (
        <div className="relative">
            <div className="flex flex-wrap items-center gap-2 mb-4">
                {/* Pill-shaped toggle buttons */}
                <div className="flex overflow-hidden rounded-md">
                    {options.map((option, index) => (
                        <button
                            key={option.value}
                            className={getPillButtonStyle(option, index)}
                            onClick={() => handleOptionChange(option)}
                        >
                            {option.icon && (
                                <span className="mr-2">{option.icon}</span>
                            )}
                            <span className="whitespace-nowrap">{option.label}</span>
                        </button>
                    ))}
                </div>

                {/* Filters Button - Separate from toggle pill */}
                <button
                    ref={filterButtonRef}
                    className={`px-3 py-2 rounded-xs flex items-center ${
                        showFilters ? "bg-[#00897B] text-white" : "bg-[#eaeaea] text-gray-700 hover:bg-[#f0f0f0]"
                    }`}
                    onClick={() => setShowFilters(!showFilters)}
                >
                    <Filter className="w-4 h-4 mr-3" />
                    <span className="whitespace-nowrap">Filters</span>
                    {Object.values(selectedFilters).some(arr => arr.length > 0) && (
                        <span className="ml-2 bg-[#00897B] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                            {Object.values(selectedFilters).reduce((sum, arr) => sum + arr.length, 0)}
                        </span>
                    )}
                </button>
            </div>

            {/* Filter Types Overlay */}
            {showFilters && (
                <div 
                    ref={filterOverlayRef}
                    className="fixed bg-white border border-gray-200 rounded-md shadow-lg p-4 z-10 w-48 md:w-56"
                    style={{
                        top: `${overlayPosition.top}px`,
                        left: `${overlayPosition.left}px`,
                        maxHeight: '80vh',
                        overflowY: 'auto'
                    }}
                >
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="font-medium">Filter By:</h3>
                        {Object.values(selectedFilters).some(arr => arr.length > 0) && (
                            <button 
                                className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
                                onClick={() => clearFilters()}
                            >
                                <X className="w-3 h-3 mr-1" />
                                Clear all
                            </button>
                        )}
                    </div>
                    
                    {/* Selected filters display */}
                    {Object.entries(selectedFilters).map(([filterType, values]) => {
                        if (values.length === 0) return null;
                        
                        return (
                            <div key={filterType} className="mb-2 p-2 bg-gray-50 rounded">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-xs font-medium capitalize">{filterType}:</span>
                                    <button 
                                        className="text-xs text-gray-500 hover:text-gray-700"
                                        onClick={() => clearFilters(filterType)}
                                    >
                                        Clear
                                    </button>
                                </div>
                                <div className="flex flex-wrap gap-1">
                                    {values.map(value => (
                                        <span 
                                            key={value} 
                                            className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded flex items-center"
                                        >
                                            {value}
                                            <button
                                                className="ml-1"
                                                onClick={() => handleFilterOptionSelect(filterType, value)}
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                    
                    <ul className="space-y-2">
                        <li 
                            className="cursor-pointer hover:bg-gray-100 p-2 rounded flex justify-between items-center"
                            onClick={() => handleFilterSelection('status')}
                        >
                            <span>Status</span>
                            {selectedFilters.status.length > 0 && (
                                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                                    {selectedFilters.status.length}
                                </span>
                            )}
                        </li>
                        <li 
                            className="cursor-pointer hover:bg-gray-100 p-2 rounded flex justify-between items-center"
                            onClick={() => handleFilterSelection('priority')}
                        >
                            <span>Priority</span>
                            {selectedFilters.priority.length > 0 && (
                                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                                    {selectedFilters.priority.length}
                                </span>
                            )}
                        </li>
                        <li 
                            className="cursor-pointer hover:bg-gray-100 p-2 rounded flex justify-between items-center"
                            onClick={() => handleFilterSelection('assignedTo')}
                        >
                            <span>Assigned To</span>
                            {selectedFilters.assignedTo.length > 0 && (
                                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                                    {selectedFilters.assignedTo.length}
                                </span>
                            )}
                        </li>
                    </ul>
                </div>
            )}

            {/* Filter Options Secondary Overlay */}
            {showFilterOptions && (
                <div 
                    ref={optionsOverlayRef}
                    className="fixed bg-white border border-gray-200 rounded-md shadow-lg p-4 z-20 w-48 md:w-56"
                    style={{
                        top: `${secondaryOverlayPosition.top}px`,
                        left: `${secondaryOverlayPosition.left}px`,
                        maxHeight: '80vh',
                        overflowY: 'auto'
                    }}
                >
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center">
                            <button 
                                className="mr-2 hover:bg-gray-100 p-1 rounded"
                                onClick={closeFilterOptions}
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <h3 className="font-medium">{title}</h3>
                        </div>
                        {selectedFilters[activeFilter]?.length > 0 && (
                            <button 
                                className="text-xs text-blue-600 hover:text-blue-800"
                                onClick={() => clearFilters(activeFilter)}
                            >
                                Clear
                            </button>
                        )}
                    </div>
                    <ul className="space-y-2">
                        {filterOptions.map((option) => (
                            <li 
                                key={option}
                                className="cursor-pointer hover:bg-gray-100 p-2 rounded flex items-center"
                                onClick={() => handleFilterOptionSelect(activeFilter, option)}
                            >
                                <input 
                                    type="checkbox" 
                                    className="mr-2"
                                    checked={selectedFilters[activeFilter].includes(option)}
                                    onChange={() => {}}
                                />
                                <span>{option}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};