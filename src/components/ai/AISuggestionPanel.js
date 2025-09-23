// components/ai/AISuggestionPanel.jsx - Fixed version
'use client'

import React, { useState, useMemo } from 'react';
import { 
  X, 
  Brain, 
  AlertTriangle, 
  Info, 
  CheckCircle, 
  Clock,
  ChevronDown,
  ChevronRight,
  Lightbulb,
  Target,
  FileText,
  Bug
} from 'lucide-react';
import { useApp } from '../../context/AppProvider';

const AISuggestionPanel = ({ 
  className = '',
  maxSuggestions = 5,
  showTimestamp = true,
  autoCollapse = true,
  filterTypes = null // ['test-priority', 'document-quality', 'bug-severity']
}) => {
  const { aiSuggestions = [], actions } = useApp();
  const [collapsed, setCollapsed] = useState(false);
  const [expandedSuggestions, setExpandedSuggestions] = useState(new Set());

  // Memoize filtered suggestions to prevent unnecessary re-renders
  const displaySuggestions = useMemo(() => {
    let filtered = Array.isArray(aiSuggestions) ? aiSuggestions : [];
    
    if (filterTypes && filterTypes.length > 0) {
      filtered = filtered.filter(s => filterTypes.includes(s.type));
    }
    
    return filtered
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, maxSuggestions);
  }, [aiSuggestions, filterTypes, maxSuggestions]);

  const toggleSuggestionExpanded = (suggestionId) => {
    setExpandedSuggestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(suggestionId)) {
        newSet.delete(suggestionId);
      } else {
        newSet.add(suggestionId);
      }
      return newSet;
    });
  };

  const getSuggestionIcon = (type) => {
    switch (type) {
      case 'test-priority':
        return <Target className="w-4 h-4 text-blue-500" />;
      case 'document-quality':
        return <FileText className="w-4 h-4 text-green-500" />;
      case 'bug-severity':
        return <Bug className="w-4 h-4 text-red-500" />;
      default:
        return <Lightbulb className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high':
        return 'border-red-200 bg-red-50 text-red-800';
      case 'medium':
        return 'border-yellow-200 bg-yellow-50 text-yellow-800';
      case 'low':
        return 'border-blue-200 bg-blue-50 text-blue-800';
      default:
        return 'border-gray-200 bg-gray-50 text-gray-800';
    }
  };

  const handleSuggestionAction = async (suggestion, actionType) => {
    // Handle different action types without causing re-renders
    try {
      switch (actionType) {
        case 'apply-priority':
          if (suggestion.data?.prioritizedTests) {
            console.log('Applying test priority:', suggestion.data);
          }
          break;
        case 'apply-severity':
          if (suggestion.data?.assessment) {
            console.log('Applying bug severity:', suggestion.data);
          }
          break;
        case 'improve-document':
          console.log('Improving document:', suggestion.data);
          break;
        case 'view-analysis':
          console.log('Viewing analysis:', suggestion.data);
          break;
        default:
          console.log('Unknown action:', actionType);
      }
      
      // Dismiss suggestion after action
      if (actions.ai?.dismissSuggestion) {
        actions.ai.dismissSuggestion(suggestion.id);
      }
    } catch (error) {
      console.error('Error handling suggestion action:', error);
    }
  };

  if (displaySuggestions.length === 0) return null;

  return (
    <div className={`bg-white rounded-lg border shadow-sm ${className}`}>
      {/* Header */}
      <div 
        className="flex items-center justify-between p-4 border-b cursor-pointer hover:bg-gray-50"
        onClick={() => setCollapsed(!collapsed)}
      >
        <div className="flex items-center space-x-2">
          <Brain className="w-5 h-5 text-purple-500" />
          <h3 className="font-medium text-gray-900">AI Suggestions</h3>
          <span className="px-2 py-1 text-xs bg-purple-100 text-purple-600 rounded-full">
            {displaySuggestions.length}
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          {autoCollapse && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (actions.ai?.clearSuggestions) {
                  actions.ai.clearSuggestions();
                }
              }}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Clear All
            </button>
          )}
          {collapsed ? 
            <ChevronRight className="w-4 h-4 text-gray-400" /> : 
            <ChevronDown className="w-4 h-4 text-gray-400" />
          }
        </div>
      </div>

      {/* Suggestions List */}
      {!collapsed && (
        <div className="divide-y">
          {displaySuggestions.map((suggestion) => {
            const isExpanded = expandedSuggestions.has(suggestion.id);
            
            return (
              <div key={suggestion.id} className="p-4">
                <div className="flex items-start space-x-3">
                  {getSuggestionIcon(suggestion.type)}
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(suggestion.severity)}`}>
                          {suggestion.severity}
                        </span>
                        {showTimestamp && (
                          <span className="text-xs text-gray-500">
                            {new Date(suggestion.timestamp).toLocaleTimeString()}
                          </span>
                        )}
                      </div>
                      
                      <button
                        onClick={() => {
                          if (actions.ai?.dismissSuggestion) {
                            actions.ai.dismissSuggestion(suggestion.id);
                          }
                        }}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <p className="mt-1 text-sm text-gray-700">
                      {suggestion.message}
                    </p>
                    
                    {/* Actions */}
                    {suggestion.actions && suggestion.actions.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {suggestion.actions.map((action, index) => (
                          <button
                            key={index}
                            onClick={() => handleSuggestionAction(suggestion, action.action)}
                            className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                          >
                            {action.label}
                          </button>
                        ))}
                        
                        {/* Expand/Collapse details */}
                        {suggestion.data && (
                          <button
                            onClick={() => toggleSuggestionExpanded(suggestion.id)}
                            className="inline-flex items-center px-3 py-1 text-xs text-gray-500 hover:text-gray-700"
                          >
                            {isExpanded ? 'Less' : 'More'} Details
                            {isExpanded ? 
                              <ChevronDown className="ml-1 w-3 h-3" /> : 
                              <ChevronRight className="ml-1 w-3 h-3" />
                            }
                          </button>
                        )}
                      </div>
                    )}
                    
                    {/* Expanded Details */}
                    {isExpanded && suggestion.data && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-md">
                        <pre className="text-xs text-gray-600 whitespace-pre-wrap max-h-32 overflow-y-auto">
                          {JSON.stringify(suggestion.data, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AISuggestionPanel;