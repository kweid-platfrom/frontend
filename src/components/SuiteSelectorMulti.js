// SuiteSelectorMulti.jsx
import { useState, useRef, useEffect } from 'react';
import { Building2, ChevronDownIcon, Check } from 'lucide-react';
import { Button } from './ui/button';
import { safeArray, safeLength, safeMap } from '../utils/safeArrayUtils';

const SuiteSelectorMulti = ({ 
    suites = [], 
    selectedSuites = [],
    onSuiteToggle,
    onSelectAll,
    disabled = false 
}) => {
    const [showDropdown, setShowDropdown] = useState(false);
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, right: 'auto' });
    const [isMobile, setIsMobile] = useState(false);

    const dropdownRef = useRef(null);
    const buttonRef = useRef(null);

    const safeSuites = safeArray(suites);
    const allSelected = safeLength(selectedSuites) === safeLength(safeSuites);
    const someSelected = safeLength(selectedSuites) > 0 && !allSelected;

    // Detect mobile
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 640);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Close on outside click
    useEffect(() => {
        if (disabled || !showDropdown) return;

        const handleClickOutside = (e) => {
            if (dropdownRef.current?.contains(e.target) || buttonRef.current?.contains(e.target)) return;
            setShowDropdown(false);
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showDropdown, disabled]);

    // Calculate position (desktop only)
    useEffect(() => {
        if (disabled || isMobile || !showDropdown || !buttonRef.current) return;

        const rect = buttonRef.current.getBoundingClientRect();
        const dropdownWidth = 300;
        const windowWidth = window.innerWidth;
        const spaceOnRight = windowWidth - rect.left;

        setDropdownPosition({
            top: rect.bottom + window.scrollY + 8,
            left: spaceOnRight >= dropdownWidth ? rect.left : 'auto',
            right: spaceOnRight >= dropdownWidth ? 'auto' : windowWidth - rect.right,
        });
    }, [showDropdown, disabled, isMobile]);

    const handleToggleSuite = (suiteId) => {
        if (disabled) return;
        onSuiteToggle(suiteId);
    };

    const handleSelectAll = () => {
        if (disabled) return;
        onSelectAll();
    };

    const getButtonLabel = () => {
        const count = safeLength(selectedSuites);
        if (count === 0) return 'Select Suites';
        if (count === safeLength(safeSuites)) return 'All Suites';
        return `${count} Suite${count !== 1 ? 's' : ''}`;
    };

    return (
        <div className="relative w-full">
            <Button
                ref={buttonRef}
                variant="ghost"
                onClick={() => !disabled && setShowDropdown(!showDropdown)}
                disabled={disabled}
                leftIcon={<Building2 className="h-4 w-4 text-primary flex-shrink-0" />}
                rightIcon={
                    <ChevronDownIcon 
                        className={`h-4 w-4 text-muted-foreground flex-shrink-0 transition-transform ${
                            showDropdown ? 'rotate-180' : ''
                        }`}
                    />
                }
                className="w-full justify-between px-3"
            >
                <span className="truncate text-left text-sm">{getButtonLabel()}</span>
            </Button>

            {/* Mobile Bottom Sheet */}
            {showDropdown && !disabled && isMobile && (
                <div 
                    className="fixed inset-0 z-50 bg-black/50"
                    onClick={() => setShowDropdown(false)}
                >
                    <div
                        ref={dropdownRef}
                        className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl max-h-[70vh] overflow-hidden flex flex-col shadow-lg"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-center pt-2">
                            <div className="w-12 h-1 bg-gray-300 rounded-full" />
                        </div>

                        <div className="px-4 py-3 border-b font-semibold text-slate-900">
                            Select Suites
                        </div>

                        <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
                            <Button
                                variant="ghost"
                                onClick={handleSelectAll}
                                fullWidth
                                className="justify-start gap-3 h-auto py-3 mb-2 pb-3 border-b"
                            >
                                <div
                                    className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                                        allSelected ? 'bg-teal-600 border-teal-600' : someSelected ? 'bg-teal-200 border-teal-400' : 'border-gray-300'
                                    }`}
                                >
                                    {(allSelected || someSelected) && <Check className="h-3 w-3 text-white" />}
                                </div>
                                <span className="font-medium">Select All</span>
                            </Button>

                            {safeLength(safeSuites) === 0 ? (
                                <div className="text-center py-8 text-gray-500">No suites available</div>
                            ) : (
                                safeMap(safeSuites, (suite) => {
                                    const isSelected = selectedSuites.includes(suite.id);
                                    return (
                                        <Button
                                            key={suite.id}
                                            variant="ghost"
                                            onClick={() => handleToggleSuite(suite.id)}
                                            fullWidth
                                            className="justify-start gap-3 h-auto py-3"
                                        >
                                            <div
                                                className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                                                    isSelected ? 'bg-teal-600 border-teal-600' : 'border-gray-300'
                                                }`}
                                            >
                                                {isSelected && <Check className="h-3 w-3 text-white" />}
                                            </div>
                                            <div className="flex-1 min-w-0 text-left">
                                                <p className="truncate font-medium text-sm">{suite.name}</p>
                                                {suite.description && (
                                                    <p className="truncate text-xs text-gray-500 mt-0.5">{suite.description}</p>
                                                )}
                                            </div>
                                        </Button>
                                    );
                                })
                            )}
                        </div>

                        <div className="border-t p-3">
                            <Button
                                onClick={() => setShowDropdown(false)}
                                fullWidth
                                className="bg-teal-600 hover:bg-teal-700 text-white"
                            >
                                Done
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Desktop Dropdown */}
            {showDropdown && !disabled && !isMobile && (
                <div
                    ref={dropdownRef}
                    className="fixed bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-2"
                    style={{
                        top: `${dropdownPosition.top}px`,
                        left: dropdownPosition.left !== 'auto' ? `${dropdownPosition.left}px` : 'auto',
                        right: dropdownPosition.right !== 'auto' ? `${dropdownPosition.right}px` : 'auto',
                        minWidth: '280px',
                        maxWidth: '400px',
                    }}
                >
                    <Button
                        variant="ghost"
                        onClick={handleSelectAll}
                        fullWidth
                        className="justify-start gap-2 mb-2 pb-3 border-b h-auto py-2"
                    >
                        <div
                            className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                                allSelected ? 'bg-teal-600 border-teal-600' : someSelected ? 'bg-teal-200 border-teal-400' : 'border-gray-300'
                            }`}
                        >
                            {(allSelected || someSelected) && <Check className="h-3 w-3 text-white" />}
                        </div>
                        <span className="font-medium text-sm">Select All</span>
                    </Button>

                    <div className="max-h-64 overflow-y-auto space-y-1">
                        {safeLength(safeSuites) === 0 ? (
                            <div className="text-center py-4 text-gray-500 text-sm">No suites available</div>
                        ) : (
                            safeMap(safeSuites, (suite) => {
                                const isSelected = selectedSuites.includes(suite.id);
                                return (
                                    <Button
                                        key={suite.id}
                                        variant="ghost"
                                        onClick={() => handleToggleSuite(suite.id)}
                                        fullWidth
                                        className="justify-start gap-2 h-auto py-2"
                                    >
                                        <div
                                            className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                                                isSelected ? 'bg-teal-600 border-teal-600' : 'border-gray-300'
                                            }`}
                                        >
                                            {isSelected && <Check className="h-3 w-3 text-white" />}
                                        </div>
                                        <div className="flex-1 min-w-0 text-left">
                                            <p className="truncate font-medium text-sm">{suite.name}</p>
                                            {suite.description && (
                                                <p className="truncate text-xs text-gray-500 mt-0.5">{suite.description}</p>
                                            )}
                                        </div>
                                    </Button>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SuiteSelectorMulti;