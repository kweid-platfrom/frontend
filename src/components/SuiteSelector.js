import { useState } from "react";
import { ChevronDown, Folder, CheckCircle, Building, User } from "lucide-react";

const SuiteSelector = ({
    organizationSuites = [],
    selectedSuites = [],
    onSuiteSelection,
    onSelectAllSuites
}) => {
    const [showSuiteDropdown, setShowSuiteDropdown] = useState(false);

    // Get selected suite names for display
    const selectedSuiteNames = selectedSuites.map(id => 
        organizationSuites.find(suite => suite.id === id)?.name
    ).filter(Boolean);

    const toggleSuite = (suiteId) => {
        if (onSuiteSelection) {
            onSuiteSelection(suiteId);
        }
    };

    const handleSelectAll = () => {
        if (onSelectAllSuites) {
            onSelectAllSuites();
        }
    };

    const isAllSelected = organizationSuites.length > 0 && selectedSuites.length === organizationSuites.length;

    return (
        <div className="mb-6 sm:mb-8">
            <label className="block text-sm font-medium text-slate-700 mb-3">
                Select Suites to Invite To
            </label>
            <div className="relative">
                <button
                    type="button"
                    onClick={() => setShowSuiteDropdown(!showSuiteDropdown)}
                    className="w-full px-4 py-3 text-left bg-white border border-slate-200 rounded-lg shadow-sm hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Folder className="w-4 h-4 text-slate-500" />
                            <span className="text-sm text-slate-700">
                                {selectedSuites.length === 0 
                                    ? "Select suites..." 
                                    : isAllSelected
                                    ? "All suites selected"
                                    : `${selectedSuites.length} suite${selectedSuites.length !== 1 ? 's' : ''} selected`
                                }
                            </span>
                        </div>
                        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showSuiteDropdown ? 'rotate-180' : ''}`} />
                    </div>
                </button>

                {showSuiteDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                        <div className="p-2">
                            {organizationSuites.length > 0 && (
                                <>
                                    <button
                                        type="button"
                                        onClick={handleSelectAll}
                                        className="w-full px-3 py-2 text-left text-sm font-medium text-teal-600 hover:bg-teal-50 rounded-md transition-colors"
                                    >
                                        {isAllSelected ? 'Deselect All' : 'Select All'}
                                    </button>
                                    <div className="border-t border-slate-100 my-2"></div>
                                </>
                            )}
                            
                            {organizationSuites.length === 0 ? (
                                <div className="px-3 py-4 text-center text-sm text-slate-500">
                                    No suites available
                                </div>
                            ) : (
                                organizationSuites.map((suite) => {
                                    const isSelected = selectedSuites.includes(suite.id);
                                    const isPersonalSuite = !suite.organizationId || suite.membershipType === 'individual';
                                    
                                    return (
                                        <button
                                            key={suite.id}
                                            type="button"
                                            onClick={() => toggleSuite(suite.id)}
                                            className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 rounded-md transition-colors flex items-center gap-3"
                                        >
                                            <div className={`w-4 h-4 border-2 rounded flex items-center justify-center flex-shrink-0 ${
                                                isSelected
                                                    ? 'bg-teal-600 border-teal-600 text-white'
                                                    : 'border-slate-300'
                                            }`}>
                                                {isSelected && (
                                                    <CheckCircle className="w-3 h-3" />
                                                )}
                                            </div>
                                            
                                            <div className="flex items-center gap-2 min-w-0 flex-1">
                                                {isPersonalSuite ? (
                                                    <User className="w-4 h-4 text-slate-400 flex-shrink-0" />
                                                ) : (
                                                    <Building className="w-4 h-4 text-slate-400 flex-shrink-0" />
                                                )}
                                                
                                                <div className="min-w-0 flex-1">
                                                    <div className="font-medium text-slate-700 truncate">
                                                        {suite.name}
                                                    </div>
                                                    {suite.organizationName && (
                                                        <div className="text-xs text-slate-500 truncate">
                                                            {suite.organizationName}
                                                        </div>
                                                    )}
                                                    {suite.description && (
                                                        <div className="text-xs text-slate-400 truncate mt-1">
                                                            {suite.description}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </div>
                )}
            </div>
            
            {/* Selected suites preview */}
            {selectedSuites.length > 0 && selectedSuites.length < organizationSuites.length && (
                <div className="mt-3 p-3 bg-slate-50 rounded-lg">
                    <div className="text-xs font-medium text-slate-600 mb-2">Selected suites:</div>
                    <div className="flex flex-wrap gap-2">
                        {selectedSuiteNames.map((name, index) => {
                            const suite = organizationSuites.find(s => s.name === name);
                            const isPersonal = !suite?.organizationId || suite?.membershipType === 'individual';
                            
                            return (
                                <span key={index} className="inline-flex items-center gap-1 px-2 py-1 bg-teal-100 text-teal-700 text-xs rounded-full">
                                    {isPersonal ? (
                                        <User className="w-3 h-3" />
                                    ) : (
                                        <Folder className="w-3 h-3" />
                                    )}
                                    <span className="truncate max-w-32">{name}</span>
                                </span>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Show all selected when all are selected */}
            {isAllSelected && organizationSuites.length > 0 && (
                <div className="mt-3 p-3 bg-teal-50 rounded-lg">
                    <div className="text-xs font-medium text-teal-700 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        All {organizationSuites.length} suite{organizationSuites.length !== 1 ? 's' : ''} selected
                    </div>
                </div>
            )}
        </div>
    );
};

export default SuiteSelector;