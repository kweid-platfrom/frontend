import React, { useState, useEffect } from 'react';
import { Loader2, Download, MessageSquare, Share2, Link2, CheckCircle2, Sparkles, CloudOff, Check } from 'lucide-react';
import { DOCUMENT_TYPES } from '../../utils/documentTemplates';

export default function EditorTopHeader({
  title,
  onTitleChange,
  type,
  onTypeChange,
  isSaving,
  lastSaved,
  hasUnsavedChanges,
  onExport,
  onToggleChat,
  onToggleAI,
  onToggleShare,
  onToggleLinking,
  chatOpen,
  aiAssistantOpen,
  linkingPanelOpen,
  documentStatus,
  onStatusChange,
  showLinkingToggle = true
}) {
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [timeSinceLastSave, setTimeSinceLastSave] = useState('');

  const handleTypeChange = (newType) => {
    // Just pass the type change to parent - parent will handle the confirmation dialog
    onTypeChange(newType);
  };

  const statusOptions = [
    { value: 'draft', label: 'Draft', color: 'text-gray-600' },
    { value: 'in-review', label: 'In Review', color: 'text-yellow-600' },
    { value: 'approved', label: 'Approved', color: 'text-green-600' },
    { value: 'archived', label: 'Archived', color: 'text-gray-400' }
  ];

  const currentStatus = statusOptions.find(s => s.value === documentStatus) || statusOptions[0];

  // Update time since last save
  useEffect(() => {
    if (!lastSaved) {
      setTimeSinceLastSave('');
      return;
    }

    const updateTimeSince = () => {
      const now = new Date();
      const diff = Math.floor((now - lastSaved) / 1000);
      
      if (diff < 10) {
        setTimeSinceLastSave('just now');
      } else if (diff < 60) {
        setTimeSinceLastSave(`${diff}s ago`);
      } else if (diff < 3600) {
        const minutes = Math.floor(diff / 60);
        setTimeSinceLastSave(`${minutes}m ago`);
      } else {
        const hours = Math.floor(diff / 3600);
        setTimeSinceLastSave(`${hours}h ago`);
      }
    };

    // Update immediately
    updateTimeSince();

    // Update every 10 seconds
    const interval = setInterval(updateTimeSince, 10000);

    return () => clearInterval(interval);
  }, [lastSaved]);

  // Render saving status indicator
  const renderSavingStatus = () => {
    if (isSaving) {
      return (
        <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Saving...</span>
        </div>
      );
    }
    
    if (hasUnsavedChanges) {
      return (
        <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-500">
          <CloudOff className="w-4 h-4" />
          <span>Unsaved</span>
        </div>
      );
    }
    
    if (lastSaved) {
      return (
        <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-500">
          <Check className="w-4 h-4" />
          <span>Saved {timeSinceLastSave}</span>
        </div>
      );
    }
    
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>Not saved</span>
      </div>
    );
  };

  return (
    <div className="border-b border-border bg-card px-6 py-3">
      <div className="flex items-center gap-4">
        {/* Title Input */}
        <input
          type="text"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Untitled Document"
          className="flex-1 text-lg font-medium border-none outline-none focus:ring-0 placeholder-muted-foreground bg-transparent text-foreground"
        />

        {/* Document Type */}
        <select
          value={type}
          onChange={(e) => handleTypeChange(e.target.value)}
          className="px-3 py-1.5 text-sm border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value={DOCUMENT_TYPES.GENERAL}>General</option>
          <option value={DOCUMENT_TYPES.TEST_PLAN}>Test Plan</option>
          <option value={DOCUMENT_TYPES.TEST_STRATEGY}>Test Strategy</option>
          <option value={DOCUMENT_TYPES.TEST_REPORT}>Test Report</option>
          <option value={DOCUMENT_TYPES.REQUIREMENT}>Requirement</option>
          <option value={DOCUMENT_TYPES.SPECIFICATION}>Specification</option>
          <option value={DOCUMENT_TYPES.BUG_ANALYSIS}>Bug Analysis</option>
          <option value={DOCUMENT_TYPES.NOTES}>Notes</option>
        </select>

        {/* Status Dropdown */}
        {(type === DOCUMENT_TYPES.TEST_PLAN || type === DOCUMENT_TYPES.TEST_STRATEGY) && (
          <div className="relative">
            <button
              onClick={() => setShowStatusMenu(!showStatusMenu)}
              className={`px-3 py-1.5 text-sm border border-border rounded hover:bg-secondary transition-colors flex items-center gap-2 ${currentStatus.color}`}
            >
              <CheckCircle2 className="w-4 h-4" />
              {currentStatus.label}
            </button>

            {showStatusMenu && (
              <>
                {/* Backdrop to close menu */}
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowStatusMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-48 bg-card rounded shadow-theme-lg border border-border py-1 z-50">
                  {statusOptions.map(status => (
                    <button
                      key={status.value}
                      onClick={() => {
                        onStatusChange(status.value);
                        setShowStatusMenu(false);
                      }}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-secondary flex items-center gap-2 ${status.color}`}
                    >
                      {status.value === documentStatus && <CheckCircle2 className="w-4 h-4" />}
                      <span className={status.value !== documentStatus ? 'ml-6' : ''}>
                        {status.label}
                      </span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Saving Status Indicator */}
        <div className="min-w-[140px]">
          {renderSavingStatus()}
        </div>

        {/* Link Toggle */}
        {showLinkingToggle && (
          <button
            onClick={onToggleLinking}
            className={`px-4 py-1.5 text-sm rounded transition-colors flex items-center gap-2 ${linkingPanelOpen
                ? 'bg-primary text-primary-foreground'
                : 'text-foreground border border-border hover:bg-secondary'
              }`}
            title="Table of Contents"
          >
            <Link2 className="w-4 h-4" />
            TOC
          </button>
        )}

        {/* Export Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="px-4 py-1.5 text-sm text-foreground border border-border rounded hover:bg-secondary transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export
          </button>

          {showExportMenu && (
            <>
              {/* Backdrop to close menu */}
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setShowExportMenu(false)}
              />
              <div className="absolute right-0 mt-2 w-48 bg-card rounded shadow-theme-lg border border-border py-1 z-50">
                <button
                  onClick={() => { onExport('pdf'); setShowExportMenu(false); }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-secondary text-foreground"
                >
                  Export as PDF
                </button>
                <button
                  onClick={() => { onExport('docx'); setShowExportMenu(false); }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-secondary text-foreground"
                >
                  Export as DOCX
                </button>
                <button
                  onClick={() => { onExport('txt'); setShowExportMenu(false); }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-secondary text-foreground"
                >
                  Export as TXT
                </button>
                <button
                  onClick={() => { onExport('html'); setShowExportMenu(false); }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-secondary text-foreground"
                >
                  Export as HTML
                </button>
              </div>
            </>
          )}
        </div>

        {/* Share Button */}
        <button
          onClick={onToggleShare}
          className="px-4 py-1.5 text-sm text-foreground border border-border rounded hover:bg-secondary transition-colors flex items-center gap-2"
        >
          <Share2 className="w-4 h-4" />
          Share
        </button>

        {/* Chat Toggle */}
        <button
          onClick={onToggleChat}
          className={`px-4 py-1.5 text-sm rounded transition-colors flex items-center gap-2 ${
            chatOpen
              ? 'bg-primary text-primary-foreground'
              : 'text-foreground border border-border hover:bg-secondary'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          Chat
        </button>

        {/* AI Assistant Toggle */}
        <button
          onClick={onToggleAI}
          className={`px-4 py-1.5 text-sm rounded transition-colors flex items-center gap-2 ${
            aiAssistantOpen
              ? 'bg-primary text-primary-foreground'
              : 'bg-orange-500 text-white hover:bg-orange-600'
          }`}
          title="AI Writing Assistant"
        >
          <Sparkles className="w-4 h-4" />
          AI
        </button>
      </div>
    </div>
  );
}