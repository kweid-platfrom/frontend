import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronDown, Plus, Play, Pause, CheckCircle, Clock, Target } from 'lucide-react';
import { useApp } from '../context/AppProvider';

const SprintSelector = ({ onCreateSprint, disabled = false }) => {
    const { state, actions } = useApp();
    const { sprints = [], activeSprint } = state.sprints || {};
    const { activeSuite } = state.suites || {};

    const [showDropdown, setShowDropdown] = useState(false);
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, right: 'auto' });
    
    const dropdownRef = useRef(null);
    const buttonRef = useRef(null);

    // Get status icon and color
    const getStatusInfo = (status) => {
        switch (status) {
            case 'active':
                return { icon: Play, color: 'text-green-600', bgColor: 'bg-green-100' };
            case 'completed':
                return { icon: CheckCircle, color: 'text-blue-600', bgColor: 'bg-blue-100' };
            case 'on-hold':
                return { icon: Pause, color: 'text-yellow-600', bgColor: 'bg-yellow-100' };
            case 'planning':
            default:
                return { icon: Clock, color: 'text-gray-600', bgColor: 'bg-gray-100' };
        }
    };

    // Calculate dropdown position
    useEffect(() => {
        if (showDropdown && buttonRef.current && !disabled) {
            const rect = buttonRef.current.getBoundingClientRect();
            const dropdownWidth = 350;
            const windowWidth = window.innerWidth;
            const spaceOnRight = windowWidth - rect.left;

            setDropdownPosition({
                top: rect.bottom + window.scrollY,
                left: spaceOnRight >= dropdownWidth ? rect.left : 'auto',
                right: spaceOnRight >= dropdownWidth ? 'auto' : windowWidth - rect.right,
            });
        }
    }, [showDropdown, disabled]);

    // Close dropdown when clicking outside
    useEffect(() => {
        if (disabled) return;

        const handleClickOutside = (event) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target) &&
                buttonRef.current &&
                !buttonRef.current.contains(event.target)
            ) {
                setShowDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [disabled]);

    const handleSelectSprint = (sprint) => {
        if (disabled) return;
        actions.sprints?.setActiveSprint?.(sprint);
        setShowDropdown(false);
    };

    const handleCreateSprint = () => {
        if (disabled) return;
        setShowDropdown(false);
        onCreateSprint?.();
    };

    const formatDate = (date) => {
        if (!date) return '';
        const d = typeof date === 'string' ? new Date(date) : date;
        return d.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric' 
        });
    };

    const getDaysRemaining = (endDate) => {
        if (!endDate) return null;
        const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
        const today = new Date();
        const diffTime = end - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    const getSprintProgress = (sprint) => {
        // This would need to be calculated based on sprint assets
        // For now, return mock data
        return sprint?.progress || { completed: 0, total: 0, percentage: 0 };
    };

    if (!activeSuite) {
        return null;
    }

    return (
        <div className="relative">
            <button
                ref={buttonRef}
                onClick={() => {
                    if (disabled) return;
                    setShowDropdown(!showDropdown);
                }}
                className={`flex items-center space-x-2 px-3 py-2 text-sm font-medium text-secondary-foreground bg-secondary rounded-lg border border-border transition-colors ${
                    disabled 
                        ? 'cursor-not-allowed opacity-50' 
                        : 'hover:bg-secondary/80'
                }`}
                disabled={disabled}
            >
                <Calendar className="h-4 w-4 text-primary" />
                <span className="max-w-24 sm:max-w-32 lg:max-w-48 truncate">
                    {activeSprint ? activeSprint.name : 'All Sprints'}
                </span>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </button>

            {showDropdown && !disabled && (
                <div
                    ref={dropdownRef}
                    className="fixed bg-card border border-border shadow-theme-lg rounded-lg z-50"
                    style={{
                        top: `${dropdownPosition.top}px`,
                        left: dropdownPosition.left !== 'auto' ? `${dropdownPosition.left}px` : 'auto',
                        right: dropdownPosition.right !== 'auto' ? `${dropdownPosition.right}px` : 'auto',
                        minWidth: '350px',
                        maxWidth: '400px',
                    }}
                >
                    <div className="p-2">
                        {/* Create New Sprint */}
                        <button
                            onClick={handleCreateSprint}
                            className="w-full flex items-center px-3 py-2 text-sm text-primary hover:bg-teal-50 hover:text-teal-800 rounded-md border-b border-border mb-2"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Create New Sprint
                        </button>

                        {/* All Sprints Option */}
                        <button
                            onClick={() => handleSelectSprint(null)}
                            className={`w-full flex items-center px-3 py-2 text-sm rounded-md text-left transition-colors mb-1 ${
                                !activeSprint
                                    ? 'bg-teal-50 text-teal-800 font-medium'
                                    : 'text-foreground hover:bg-secondary/80'
                            }`}
                        >
                            <div className={`w-2 h-2 rounded-full mr-3 flex-shrink-0 ${
                                !activeSprint ? 'bg-primary' : 'bg-muted'
                            }`}></div>
                            <div className="flex-1">
                                <p className="truncate">All Sprints</p>
                                <p className="text-xs text-muted-foreground">View all assets across sprints</p>
                            </div>
                        </button>

                        <div className="max-h-64 overflow-y-auto">
                            {sprints.length === 0 ? (
                                <div className="px-3 py-4 text-center text-muted-foreground text-sm">
                                    <Calendar className="h-8 w-8 mx-auto mb-2 text-muted" />
                                    <p>No sprints yet</p>
                                    <p className="text-xs">Create your first sprint to organize work</p>
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    {sprints.map((sprint) => {
                                        const statusInfo = getStatusInfo(sprint.status);
                                        const StatusIcon = statusInfo.icon;
                                        const progress = getSprintProgress(sprint);
                                        const daysRemaining = getDaysRemaining(sprint.endDate);
                                        
                                        return (
                                            <button
                                                key={sprint.id}
                                                onClick={() => handleSelectSprint(sprint)}
                                                className={`w-full flex items-start px-3 py-2 text-sm rounded-md text-left transition-colors ${
                                                    activeSprint?.id === sprint.id
                                                        ? 'bg-teal-50 text-teal-800 font-medium'
                                                        : 'text-foreground hover:bg-secondary/80'
                                                }`}
                                            >
                                                <div className={`w-2 h-2 rounded-full mr-3 flex-shrink-0 mt-2 ${
                                                    activeSprint?.id === sprint.id ? 'bg-primary' : 'bg-muted'
                                                }`}></div>
                                                
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between">
                                                        <p className="truncate font-medium" title={sprint.name}>
                                                            {sprint.name}
                                                        </p>
                                                        <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs ${statusInfo.bgColor}`}>
                                                            <StatusIcon className={`h-3 w-3 ${statusInfo.color}`} />
                                                            <span className={statusInfo.color}>
                                                                {sprint.status.charAt(0).toUpperCase() + sprint.status.slice(1).replace('-', ' ')}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    
                                                    {sprint.description && (
                                                        <p className="text-xs text-muted-foreground truncate mt-1" title={sprint.description}>
                                                            {sprint.description}
                                                        </p>
                                                    )}
                                                    
                                                    <div className="flex items-center justify-between mt-2">
                                                        <div className="flex items-center space-x-3 text-xs text-muted-foreground">
                                                            {sprint.startDate && sprint.endDate && (
                                                                <span>
                                                                    {formatDate(sprint.startDate)} - {formatDate(sprint.endDate)}
                                                                </span>
                                                            )}
                                                            {daysRemaining !== null && (
                                                                <span className={
                                                                    daysRemaining < 0 
                                                                        ? 'text-red-600' 
                                                                        : daysRemaining <= 7 
                                                                            ? 'text-yellow-600' 
                                                                            : 'text-muted-foreground'
                                                                }>
                                                                    {daysRemaining < 0 
                                                                        ? `${Math.abs(daysRemaining)} days overdue` 
                                                                        : daysRemaining === 0 
                                                                            ? 'Due today' 
                                                                            : `${daysRemaining} days left`
                                                                    }
                                                                </span>
                                                            )}
                                                        </div>
                                                        
                                                        {progress.total > 0 && (
                                                            <div className="flex items-center space-x-1">
                                                                <div className="w-12 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                                                    <div 
                                                                        className="h-full bg-primary rounded-full transition-all"
                                                                        style={{ width: `${progress.percentage}%` }}
                                                                    />
                                                                </div>
                                                                <span className="text-xs text-muted-foreground">
                                                                    {progress.percentage}%
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    
                                                    {sprint.goals && (
                                                        <div className="flex items-start mt-2">
                                                            <Target className="h-3 w-3 text-muted-foreground mt-0.5 mr-1 flex-shrink-0" />
                                                            <p className="text-xs text-muted-foreground line-clamp-2">
                                                                {sprint.goals}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SprintSelector;