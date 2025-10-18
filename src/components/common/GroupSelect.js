'use client';
import React, { useState, useRef, useEffect } from 'react';
import { Layers, ChevronDown, X } from 'lucide-react';

/**
 * Reusable GroupSelect Dropdown Component
 * Allows users to group items by various criteria
 */
const GroupSelect = ({ 
  value, 
  onChange, 
  options = [],
  placeholder = "Group by...",
  className = "",
  disabled = false 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const selectedOption = options.find(opt => opt.id === value);

  const handleSelect = (optionId) => {
    onChange(optionId);
    setIsOpen(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange(null);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          inline-flex items-center justify-between w-full px-3 py-2 text-sm font-medium
          rounded-lg border transition-all duration-200
          ${disabled 
            ? 'bg-muted text-muted-foreground cursor-not-allowed opacity-50' 
            : value
              ? 'bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 border-teal-300 dark:border-teal-700 hover:bg-teal-100 dark:hover:bg-teal-900/50'
              : 'bg-background text-foreground border-border hover:bg-accent'
          }
          focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1
        `}
      >
        <div className="flex items-center gap-2 min-w-0">
          <Layers className="w-4 h-4 flex-shrink-0" />
          <span className="truncate">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>
        
        <div className="flex items-center gap-1 ml-2 flex-shrink-0">
          {value && !disabled && (
            <X 
              className="w-3 h-3 hover:text-red-600 dark:hover:text-red-400" 
              onClick={handleClear}
            />
          )}
          <ChevronDown 
            className={`w-4 h-4 transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`} 
          />
        </div>
      </button>

      {isOpen && !disabled && (
        <div className="absolute top-full left-0 mt-2 w-full min-w-[200px] bg-card border border-border rounded-lg shadow-theme-lg z-50 max-h-80 overflow-y-auto">
          <div className="py-1">
            {options.length === 0 ? (
              <div className="px-4 py-3 text-sm text-muted-foreground text-center">
                No grouping options available
              </div>
            ) : (
              options.map((option) => (
                <button
                  key={option.id}
                  onClick={() => handleSelect(option.id)}
                  className={`
                    w-full text-left px-4 py-2.5 text-sm transition-colors duration-150
                    ${value === option.id
                      ? 'bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 font-medium'
                      : 'text-foreground hover:bg-accent'
                    }
                  `}
                >
                  <div className="flex items-center gap-2">
                    {option.icon && (
                      <span className="text-muted-foreground">{option.icon}</span>
                    )}
                    <span className="flex-1">{option.label}</span>
                    {option.count !== undefined && (
                      <span className="text-xs text-muted-foreground">
                        ({option.count})
                      </span>
                    )}
                  </div>
                  {option.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 ml-6">
                      {option.description}
                    </p>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupSelect;