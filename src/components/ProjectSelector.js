import { useState } from "react";
import { ChevronDown, Folder, FolderOpen, CheckCircle } from "lucide-react";

const ProjectSelector = ({
    organizationProjects,
    selectedProjects,
    onProjectSelection,
    onSelectAllProjects
}) => {
    const [showProjectDropdown, setShowProjectDropdown] = useState(false);

    const selectedProjectNames = selectedProjects.map(id => 
        organizationProjects.find(p => p.id === id)?.name
    ).filter(Boolean);

    return (
        <div className="mb-6 sm:mb-8">
            <label className="block text-sm font-medium text-slate-700 mb-3">
                Select Projects to Invite To
            </label>
            <div className="relative">
                <button
                    type="button"
                    onClick={() => setShowProjectDropdown(!showProjectDropdown)}
                    className="w-full px-4 py-3 text-left bg-white border border-slate-200 rounded-lg shadow-sm hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Folder className="w-4 h-4 text-slate-500" />
                            <span className="text-sm text-slate-700">
                                {selectedProjects.length === 0 
                                    ? "Select projects..." 
                                    : selectedProjects.length === organizationProjects.length
                                    ? "All projects selected"
                                    : `${selectedProjects.length} project${selectedProjects.length !== 1 ? 's' : ''} selected`
                                }
                            </span>
                        </div>
                        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showProjectDropdown ? 'rotate-180' : ''}`} />
                    </div>
                </button>

                {showProjectDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                        <div className="p-2">
                            <button
                                type="button"
                                onClick={onSelectAllProjects}
                                className="w-full px-3 py-2 text-left text-sm font-medium text-teal-600 hover:bg-teal-50 rounded-md transition-colors"
                            >
                                {selectedProjects.length === organizationProjects.length ? 'Deselect All' : 'Select All'}
                            </button>
                            <div className="border-t border-slate-100 my-2"></div>
                            {organizationProjects.map((project) => (
                                <button
                                    key={project.id}
                                    type="button"
                                    onClick={() => onProjectSelection(project.id)}
                                    className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 rounded-md transition-colors flex items-center gap-3"
                                >
                                    <div className={`w-4 h-4 border-2 rounded flex items-center justify-center ${
                                        selectedProjects.includes(project.id)
                                            ? 'bg-teal-600 border-teal-600 text-white'
                                            : 'border-slate-300'
                                    }`}>
                                        {selectedProjects.includes(project.id) && (
                                            <CheckCircle className="w-3 h-3" />
                                        )}
                                    </div>
                                    <FolderOpen className="w-4 h-4 text-slate-400" />
                                    <span>{project.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
            
            {/* Selected projects preview */}
            {selectedProjects.length > 0 && selectedProjects.length < organizationProjects.length && (
                <div className="mt-2 p-3 bg-slate-50 rounded-lg">
                    <div className="text-xs font-medium text-slate-600 mb-1">Selected projects:</div>
                    <div className="flex flex-wrap gap-1">
                        {selectedProjectNames.map((name, index) => (
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

export default ProjectSelector;