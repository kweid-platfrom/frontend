import { useState } from "react";
import { ChevronDown, Folder, FolderOpen, CheckCircle } from "lucide-react";

const SuiteSelector = ({
    organizationSuites,
    selectedSuites,
    onSuiteSelection,
    onSelectAllSuites
}) => {
    const [showSuiteDropdown, setShowSuiteDropdown] = useState(false);

    const selectedSuiteNames = selectedSuites.map(id => 
        organizationSuites.find(p => p.id === id)?.name
    ).filter(Boolean);

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
                                    : selectedSuites.length === organizationSuites.length
                                    ? "All suites selected"
                                    : `${selectedSuites.length} suite${selectedSuites.length !== 1 ? 's' : ''} selected`
                                }
                            </span>
                        </div>
                        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showSuiteDropdown ? 'rotate-180' : ''}`} />
                    </div>
                </button>

                {showSuiteDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                        <div className="p-2">
                            <button
                                type="button"
                                onClick={onSelectAllSuites}
                                className="w-full px-3 py-2 text-left text-sm font-medium text-teal-600 hover:bg-teal-50 rounded-md transition-colors"
                            >
                                {selectedSuites.length === organizationSuites.length ? 'Deselect All' : 'Select All'}
                            </button>
                            <div className="border-t border-slate-100 my-2"></div>
                            {organizationSuites.map((suite) => (
                                <button
                                    key={suite.id}
                                    type="button"
                                    onClick={() => onSuiteSelection(suite.id)}
                                    className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 rounded-md transition-colors flex items-center gap-3"
                                >
                                    <div className={`w-4 h-4 border-2 rounded flex items-center justify-center ${
                                        selectedSuites.includes(suite.id)
                                            ? 'bg-teal-600 border-teal-600 text-white'
                                            : 'border-slate-300'
                                    }`}>
                                        {selectedSuites.includes(suite.id) && (
                                            <CheckCircle className="w-3 h-3" />
                                        )}
                                    </div>
                                    <FolderOpen className="w-4 h-4 text-slate-400" />
                                    <span>{suite.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
            
            {/* Selected suites preview */}
            {selectedSuites.length > 0 && selectedSuites.length < organizationSuites.length && (
                <div className="mt-2 p-3 bg-slate-50 rounded-lg">
                    <div className="text-xs font-medium text-slate-600 mb-1">Selected suites:</div>
                    <div className="flex flex-wrap gap-1">
                        {selectedSuiteNames.map((name, index) => (
                            <span key={index} className="inline-flex items-center gap-1 px-2 py-1 bg-teal-100 text-teal-700 text-xs rounded-full">
                                <Folder className="w-3 h-3" />
                                {name}
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SuiteSelector;