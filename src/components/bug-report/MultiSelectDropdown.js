import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

// Component: MultiSelectDropdown
const MultiSelectDropdown = ({ options = [], value = [], onChange, placeholder }) => {
    const [isOpen, setIsOpen] = useState(false);

    const validOptions = Array.isArray(options) ? options.filter((opt) => opt?.value && opt?.label) : [];

    const handleToggle = (optionValue) => {
        const newValue = value.includes(optionValue)
            ? value.filter((v) => v !== optionValue)
            : [...value, optionValue];
        onChange(newValue);
    };

    return (
        <div className="relative w-full" onClick={(e) => e.stopPropagation()}>
            <div
                className="text-xs px-2 py-1 rounded border border-gray-300 focus:ring-2 focus:ring-teal-500 cursor-pointer w-full bg-white flex items-center justify-between"
                onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    setIsOpen(!isOpen);
                }}
            >
                <span className="truncate">
                    {value.length > 0 && validOptions.length > 0
                        ? value.map((v) => validOptions.find((o) => o.value === v)?.label).filter(Boolean).join(', ')
                        : placeholder}
                </span>
                <ChevronDown className="w-4 h-4 text-gray-400" />
            </div>
            {isOpen && (
                <div className="absolute z-30 mt-1 w-full bg-white border border-gray-200 rounded shadow-lg max-h-60 overflow-y-auto">
                    {validOptions.length > 0 ? (
                        validOptions.map((option) => (
                            <div
                                key={option.value}
                                className="flex items-center px-3 py-2 text-xs hover:bg-gray-100 cursor-pointer"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    handleToggle(option.value);
                                }}
                            >
                                <input
                                    type="checkbox"
                                    checked={value.includes(option.value)}
                                    onChange={(e) => {
                                        e.stopPropagation();
                                        e.preventDefault();
                                        handleToggle(option.value);
                                    }}
                                    className="mr-2 h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
                                />
                                <span className="truncate">{option.label}</span>
                            </div>
                        ))
                    ) : (
                        <div className="px-3 py-2 text-xs text-gray-500">No test cases available</div>
                    )}
                </div>
            )}
        </div>
    );
};

export default MultiSelectDropdown;