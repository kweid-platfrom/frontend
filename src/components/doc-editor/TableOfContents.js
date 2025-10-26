import React, { useState } from 'react';
import { ChevronRight, ChevronDown, FileText, List } from 'lucide-react';

/**
 * TableOfContents Component
 * Displays a hierarchical table of contents based on document headings
 * 
 * @param {Array} headings - Array of heading objects with structure: { id, level, text, children }
 * @param {Function} onHeadingClick - Callback when a heading is clicked
 * @param {Boolean} isCollapsed - Whether the TOC is collapsed
 * @param {Function} onToggleCollapse - Callback to toggle collapse state
 */
export default function TableOfContents({ 
  headings = [], 
  onHeadingClick, 
  isCollapsed = false, 
  onToggleCollapse 
}) {
  const [expandedSections, setExpandedSections] = useState({});

  const toggleSection = (id) => {
    setExpandedSections(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const renderHeading = (heading) => {
    const hasChildren = heading.children && heading.children.length > 0;
    const isExpanded = expandedSections[heading.id] !== false; // Default expanded
    const indentClass = heading.level === 1 ? 'pl-0' : heading.level === 2 ? 'pl-3' : 'pl-6';


    return (
      <div key={heading.id} className="select-none">
        <div
          className={`flex items-start gap-2 py-1.5 px-2 rounded-md cursor-pointer hover:bg-secondary transition-colors ${indentClass}`}
          onClick={() => onHeadingClick(heading.id)}
        >
          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleSection(heading.id);
              }}
              className="flex-shrink-0 mt-0.5 p-0.5 hover:bg-muted rounded"
              aria-label={isExpanded ? "Collapse section" : "Expand section"}
            >
              {isExpanded ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronRight className="w-3 h-3" />
              )}
            </button>
          )}
          {!hasChildren && <div className="w-4" />}
          <div className="flex-1 min-w-0">
            <div
              className={`${
                heading.level === 'h1'
                  ? 'text-xs font-semibold text-foreground'
                  : heading.level === 'h2'
                  ? 'text-xs font-medium text-foreground'
                  : 'text-xs text-muted-foreground'
              } truncate`}
              title={heading.text}
            >
              {heading.text}
            </div>
          </div>
        </div>
        {hasChildren && isExpanded && (
          <div className="ml-1">
            {heading.children.map((child) => renderHeading(child))}
          </div>
        )}
      </div>
    );
  };

  // Collapsed state - show icon button only
  if (isCollapsed) {
    return (
      <div className="sticky top-8">
        <button
          onClick={onToggleCollapse}
          className="p-3 bg-card border border-border rounded-lg hover:bg-secondary transition-colors shadow-sm"
          title="Expand Table of Contents"
          aria-label="Expand Table of Contents"
        >
          <List className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>
    );
  }

  // Expanded state - show full TOC
  return (
    <div className="w-[240px] flex-shrink-0 sticky top-8">
      <div className="bg-card rounded-lg border border-border shadow-sm">
        {/* Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Contents</h3>
            </div>
            <button
              onClick={onToggleCollapse}
              className="p-1 hover:bg-secondary rounded transition-colors"
              title="Collapse"
              aria-label="Collapse Table of Contents"
            >
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            {headings.length} {headings.length === 1 ? 'section' : 'sections'}
          </p>
        </div>

        {/* Content */}
        <div className="p-3 max-h-[70vh] overflow-y-auto">
          {headings.length === 0 ? (
            <div className="text-center py-8 px-4">
              <p className="text-xs text-muted-foreground">
                Add headings to see document structure
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {headings.map((heading) => renderHeading(heading))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}