'use client';
//@ts-nocheck

import React, { useState, useEffect, useRef } from 'react';
import {
    ArrowLeft, Edit, Share2, Clock, User, Tag, List
} from 'lucide-react';
import TableOfContents from '@/components/doc-editor/TableOfContents';

export default function DocumentPreview({ 
    document, 
    onEdit, 
    onClose, 
    onShare 
}) {
    const [headings, setHeadings] = useState([]);
    const [tocCollapsed, setTocCollapsed] = useState(false);
    const contentRef = useRef(null);
    const headingElementsRef = useRef(new Map());

    const formatDate = (timestamp) => {
        if (!timestamp) return 'Unknown';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return new Intl.DateTimeFormat('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    };

    // Extract headings from HTML content
    useEffect(() => {
        if (!document.content || !contentRef.current) return;

        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = document.content;
        
        const headingElements = tempDiv.querySelectorAll('h1, h2, h3, h4, h5, h6');
        const extractedHeadings = [];
        const stack = [{ level: 0, children: extractedHeadings }];
        
        headingElements.forEach((el, index) => {
            const level = parseInt(el.tagName.substring(1));
            const text = el.textContent.trim();
            const id = `heading-${index}-${text.replace(/\s+/g, '-').toLowerCase()}`;
            
            const heading = {
                id,
                level: el.tagName.toLowerCase(), // 'h1', 'h2', etc. to match TOC component format
                text,
                children: []
            };

            while (stack.length > 1 && stack[stack.length - 1].level >= level) {
                stack.pop();
            }

            stack[stack.length - 1].children.push(heading);
            stack.push({ level, children: heading.children });
        });

        setHeadings(extractedHeadings);

        // Add IDs to actual rendered headings for scrolling
        const renderedHeadings = contentRef.current.querySelectorAll('h1, h2, h3, h4, h5, h6');
        headingElementsRef.current.clear();
        
        renderedHeadings.forEach((el, index) => {
            const text = el.textContent.trim();
            const id = `heading-${index}-${text.replace(/\s+/g, '-').toLowerCase()}`;
            el.id = id;
            el.style.scrollMarginTop = '100px'; // Offset for header
            headingElementsRef.current.set(id, el);
        });
    }, [document.content]);

    const handleHeadingClick = (headingId) => {
        const element = headingElementsRef.current.get(headingId);
        if (element) {
            element.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    };

    const handleToggleTOC = () => {
        setTocCollapsed(!tocCollapsed);
    };

    return (
        <div className="h-full flex flex-col bg-background">
            {/* Preview Header */}
            <div className="bg-card border-b border-border px-4 sm:px-6 py-3 sm:py-4 flex-shrink-0">
                {/* Single Row: Back and Title on left, Share and Edit on right */}
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        <button
                            onClick={onClose}
                            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            <span className="hidden sm:inline">Back</span>
                        </button>
                        <div className="flex-1 min-w-0">
                            <h1 className="text-xl sm:text-2xl font-bold text-foreground truncate">{document.title}</h1>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                            onClick={handleToggleTOC}
                            className="flex items-center gap-2 px-4 py-2 border border-border rounded hover:bg-secondary transition-colors text-foreground"
                            title={tocCollapsed ? 'Show Contents' : 'Hide Contents'}
                        >
                            <List className="w-4 h-4" />
                            <span className="hidden sm:inline">Contents</span>
                        </button>
                        <button
                            onClick={() => onShare(document)}
                            className="flex items-center gap-2 px-4 py-2 border border-border rounded hover:bg-secondary transition-colors text-foreground"
                        >
                            <Share2 className="w-4 h-4" />
                            <span className="hidden sm:inline">Share</span>
                        </button>
                        <button
                            onClick={() => onEdit(document)}
                            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
                        >
                            <Edit className="w-4 h-4" />
                            <span className="hidden sm:inline">Edit</span>
                        </button>
                    </div>
                </div>

                {/* Document Meta Info */}
                <div className="mt-3 space-y-2">
                    <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                        <span className="px-3 py-1 bg-secondary text-secondary-foreground rounded-full capitalize">
                            {document.type?.replace('-', ' ')}
                        </span>
                        <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            Updated {formatDate(document.updated_at || document.created_at)}
                        </span>
                        {document.created_by && (
                            <span className="flex items-center gap-1">
                                <User className="w-4 h-4" />
                                {document.created_by}
                            </span>
                        )}
                    </div>
                    
                    {/* Tags */}
                    {document.tags && document.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {document.tags.map((tag, index) => (
                                <span
                                    key={index}
                                    className="px-2 py-1 bg-teal-50 dark:bg-teal-900/30 text-teal-800 dark:text-teal-200 text-xs rounded-full flex items-center gap-1"
                                >
                                    <Tag className="w-3 h-3" />
                                    {tag}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Preview Content with Page Layout and TOC */}
            <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950">
                <div className="max-w-7xl mx-auto py-8 px-6">
                    <div className="flex gap-8 items-start">
                        {/* Table of Contents - Using External Component */}
                        <TableOfContents
                            headings={headings}
                            onHeadingClick={handleHeadingClick}
                            isCollapsed={tocCollapsed}
                            onToggleCollapse={handleToggleTOC}
                        />

                        {/* Document Pages Container */}
                        <div className="flex-1 space-y-8">
                            {/* Page 1 */}
                            <div 
                                className="bg-card border border-border shadow-lg mx-auto"
                                style={{
                                    width: '210mm',
                                    minHeight: '297mm',
                                    padding: '25mm 20mm'
                                }}
                            >
                                <div 
                                    ref={contentRef}
                                    className="prose prose-slate dark:prose-invert max-w-none"
                                    dangerouslySetInnerHTML={{ 
                                        __html: document.content || '<p class="text-muted-foreground">No content available</p>' 
                                    }}
                                    style={{
                                        fontSize: '16px',
                                        lineHeight: '1.8',
                                        fontFamily: 'Arial, sans-serif'
                                    }}
                                />
                            </div>

                            {/* Page Break Indicator */}
                            <div className="flex items-center justify-center gap-4 py-4">
                                <div className="h-px flex-1 bg-border"></div>
                                <span className="text-xs text-muted-foreground px-3 py-1 bg-card border border-border rounded-full">
                                    Page 1
                                </span>
                                <div className="h-px flex-1 bg-border"></div>
                            </div>

                            {/* Additional pages would be added here dynamically based on content length */}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}