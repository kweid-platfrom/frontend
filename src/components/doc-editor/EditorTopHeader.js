import React, { useState } from 'react';
import { Loader2, Download, MessageSquare, Share2, Eye } from 'lucide-react';
import { getTemplate } from '../../utils/documentTemplates';

export default function EditorTopHeader({ 
  title, 
  onTitleChange, 
  type, 
  onTypeChange, 
  isSaving, 
  lastSaved, 
  onExport, 
  onToggleChat, 
  onToggleShare,
  chatOpen,
  documentUrl,
  onApplyTemplate // New prop to handle template application
}) {
  const [showExportMenu, setShowExportMenu] = useState(false);

  const handleTypeChange = (newType) => {
    const currentType = type;
    
    // Check if content should be replaced with template
    if (currentType !== newType) {
      const shouldApply = window.confirm(
        'Do you want to apply the template for this document type? This will replace your current content.'
      );
      
      if (shouldApply && onApplyTemplate) {
        const template = getTemplate(newType);
        onApplyTemplate(template);
      }
    }
    
    onTypeChange(newType);
  };

  return (
    <div className="border-b border-gray-200 bg-white px-6 py-3">
      <div className="flex items-center gap-4">
        {/* Title Input */}
        <input
          type="text"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Untitled Document"
          className="flex-1 text-lg font-medium border-none outline-none focus:ring-0 placeholder-gray-400"
        />

        {/* Document Type */}
        <select
          value={type}
          onChange={(e) => handleTypeChange(e.target.value)}
          className="px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-orange-500 focus:border-transparent"
        >
          <option value="general">General</option>
          <option value="test-plan">Test Plan</option>
          <option value="test-strategy">Test Strategy</option>
          <option value="requirement">Requirement</option>
          <option value="specification">Specification</option>
          <option value="notes">Notes</option>
        </select>

        {/* Saving Indicator */}
        <div className="text-sm text-gray-600 min-w-[120px]">
          {isSaving ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-3 h-3 animate-spin" />
              Saving...
            </span>
          ) : lastSaved ? (
            <span>Saved {new Date(lastSaved).toLocaleTimeString()}</span>
          ) : (
            <span className="text-gray-400">Not saved</span>
          )}
        </div>

        {/* Export Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="px-4 py-1.5 text-sm text-gray-700 border border-gray-300 rounded hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          
          {showExportMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded shadow-lg border border-gray-200 py-1 z-20">
              <button
                onClick={() => { onExport('pdf'); setShowExportMenu(false); }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50"
              >
                Export as PDF
              </button>
              <button
                onClick={() => { onExport('docx'); setShowExportMenu(false); }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50"
              >
                Export as DOCX
              </button>
              <button
                onClick={() => { onExport('txt'); setShowExportMenu(false); }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50"
              >
                Export as TXT
              </button>
              <button
                onClick={() => { onExport('html'); setShowExportMenu(false); }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50"
              >
                Export as HTML
              </button>
              <button
                onClick={() => { onExport('rtf'); setShowExportMenu(false); }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50"
              >
                Export as RTF
              </button>
            </div>
          )}
        </div>

        {/* Share Button */}
        <button
          onClick={onToggleShare}
          className="px-4 py-1.5 text-sm text-gray-700 border border-gray-300 rounded hover:bg-gray-50 transition-colors flex items-center gap-2"
        >
          <Share2 className="w-4 h-4" />
          Share
        </button>

        {/* Google Docs Link */}
        {documentUrl && (
          <a
            href={documentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-1.5 text-sm text-orange-600 border border-orange-300 rounded hover:bg-blue-50 transition-colors flex items-center gap-2"
          >
            <Eye className="w-4 h-4" />
            Google Docs
          </a>
        )}

        {/* Chat Toggle */}
        <button
          onClick={onToggleChat}
          className={`px-4 py-1.5 text-sm rounded transition-colors flex items-center gap-2 ${
            chatOpen 
              ? 'bg-primary text-white' 
              : 'text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          Chat
        </button>
      </div>
    </div>
  );
}