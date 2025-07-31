/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
// app/documents/[id].js
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
    ArrowLeft, 
    Edit, 
    Trash2, 
    Download, 
    Share, 
    Save,
    Eye,
    EyeOff,
    ExternalLink,
    Bold, 
    Italic, 
    Underline, 
    AlignLeft, 
    AlignCenter, 
    AlignRight, 
    AlignJustify,
    List,
    ListOrdered,
    Link,
    Image,
    Type,
    Palette,
    Minus
} from 'lucide-react';

export default function DocumentDetail() {
    const router = useRouter();
    const params = useParams();
    const editorRef = useRef(null);
    const fileInputRef = useRef(null);
    
    const [document, setDocument] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editedContent, setEditedContent] = useState('');
    const [editedTitle, setEditedTitle] = useState('');
    const [showColorPicker, setShowColorPicker] = useState(false);
    const [showFontSizes, setShowFontSizes] = useState(false);

    const fontSizes = ['8', '9', '10', '11', '12', '14', '16', '18', '20', '22', '24', '26', '28', '36', '48', '72'];
    const fontFamilies = ['Arial', 'Times New Roman', 'Helvetica', 'Georgia', 'Verdana', 'Courier New'];
    const colors = ['#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080', '#FFC0CB'];

    // Sample document data - replace with actual API call
    const sampleDocuments = {
        'doc1': {
            id: 'doc1',
            title: 'Project Plan',
            createdAt: '2025-07-30',
            createdBy: 'User A',
            lastModified: '2025-07-30',
            content: `<h1>Project Plan</h1>

<h2>Overview</h2>
<p>This document outlines the comprehensive plan for our upcoming project initiative.</p>

<h2>Objectives</h2>
<ul>
<li>Establish clear project goals and deliverables</li>
<li>Define timeline and milestones</li>
<li>Allocate resources effectively</li>
<li>Identify potential risks and mitigation strategies</li>
</ul>

<h2>Timeline</h2>
<h3>Phase 1: Planning (Week 1-2)</h3>
<ul>
<li>Requirements gathering</li>
<li>Stakeholder meetings</li>
<li>Resource allocation</li>
</ul>

<h3>Phase 2: Development (Week 3-8)</h3>
<ul>
<li>Design and development</li>
<li>Testing and quality assurance</li>
<li>Documentation</li>
</ul>

<h3>Phase 3: Deployment (Week 9-10)</h3>
<ul>
<li>Production deployment</li>
<li>User training</li>
<li>Go-live support</li>
</ul>

<h2>Resources</h2>
<ul>
<li><strong>Project Manager:</strong> User A</li>
<li><strong>Developers:</strong> 3 team members</li>
<li><strong>Designers:</strong> 2 team members</li>
<li><strong>QA Engineers:</strong> 2 team members</li>
</ul>

<h2>Budget</h2>
<p><strong>Total estimated budget:</strong> $50,000</p>
<ul>
<li>Development: $30,000</li>
<li>Design: $10,000</li>
<li>Testing: $5,000</li>
<li>Contingency: $5,000</li>
</ul>`
        },
        'doc2': {
            id: 'doc2',
            title: 'Requirements Spec',
            createdAt: '2025-07-29',
            createdBy: 'User B',
            lastModified: '2025-07-29',
            content: `<h1>Requirements Specification</h1>

<h2>Introduction</h2>
<p>This document details the functional and non-functional requirements for the project.</p>

<h2>Functional Requirements</h2>

<h3>User Management</h3>
<ul>
<li><strong>FR-001:</strong> Users must be able to create accounts</li>
<li><strong>FR-002:</strong> Users must be able to log in securely</li>
<li><strong>FR-003:</strong> Users must be able to reset passwords</li>
<li><strong>FR-004:</strong> Administrators must be able to manage user accounts</li>
</ul>

<h3>Content Management</h3>
<ul>
<li><strong>FR-005:</strong> Users must be able to create documents</li>
<li><strong>FR-006:</strong> Users must be able to edit existing documents</li>
<li><strong>FR-007:</strong> Users must be able to delete documents</li>
<li><strong>FR-008:</strong> Users must be able to search for documents</li>
</ul>

<h2>Non-Functional Requirements</h2>

<h3>Performance</h3>
<ul>
<li><strong>NFR-001:</strong> System must support 1000 concurrent users</li>
<li><strong>NFR-002:</strong> Page load times must be under 2 seconds</li>
<li><strong>NFR-003:</strong> System uptime must be 99.9%</li>
</ul>

<h3>Security</h3>
<ul>
<li><strong>NFR-004:</strong> All data must be encrypted in transit and at rest</li>
<li><strong>NFR-005:</strong> User authentication must use industry standards</li>
<li><strong>NFR-006:</strong> Regular security audits must be conducted</li>
</ul>`
        }
    };

    useEffect(() => {
        const fetchDocument = async () => {
            setIsLoading(true);
            try {
                await new Promise(resolve => setTimeout(resolve, 500));
                
                const doc = sampleDocuments[params.id];
                if (doc) {
                    setDocument(doc);
                    setEditedContent(doc.content);
                    setEditedTitle(doc.title);
                } else {
                    alert('Document not found');
                    router.push('/documents');
                }
            } catch (error) {
                console.error('Error fetching document:', error);
                alert('Failed to load document');
            } finally {
                setIsLoading(false);
            }
        };

        if (params.id) {
            fetchDocument();
        }
    }, [params.id, router]);

    const handleBack = () => {
        if (isEditing) {
            const confirmLeave = window.confirm('You have unsaved changes. Are you sure you want to leave?');
            if (!confirmLeave) return;
        }
        router.push('/documents');
    };

    const handleEdit = () => {
        setIsEditing(true);
        setTimeout(() => {
            if (editorRef.current) {
                editorRef.current.focus();
            }
        }, 100);
    };

    const handleCancelEdit = () => {
        const confirmCancel = window.confirm('Are you sure you want to cancel editing? All changes will be lost.');
        if (confirmCancel) {
            setIsEditing(false);
            setEditedContent(document.content);
            setEditedTitle(document.title);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const updatedDoc = {
                ...document,
                title: editedTitle,
                content: editedContent,
                lastModified: new Date().toISOString()
            };
            
            console.log('Saving document:', updatedDoc);
            
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            setDocument(updatedDoc);
            setIsEditing(false);
            alert('Document saved successfully!');
        } catch (error) {
            console.error('Error saving document:', error);
            alert('Failed to save document');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = () => {
        if (window.confirm('Are you sure you want to delete this document?')) {
            alert('Document deleted successfully');
            router.push('/documents');
        }
    };

    const handleDownload = () => {
        const content = isEditing ? editedContent : document.content;
        const title = isEditing ? editedTitle : document.title;
        
        const blob = new Blob([`
            <!DOCTYPE html>
            <html>
            <head>
                <title>${title}</title>
                <style>
                    body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
                </style>
            </head>
            <body>
                ${content}
            </body>
            </html>
        `], { type: 'text/html' });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${title}.html`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleShare = () => {
        navigator.clipboard?.writeText(window.location.href);
        alert('Document link copied to clipboard');
    };

    const handlePreviewInNewTab = () => {
        const content = isEditing ? editedContent : document.content;
        const title = isEditing ? editedTitle : document.title;
        
        const previewWindow = window.open('', '_blank');
        previewWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>${title} - Preview</title>
                <style>
                    body { 
                        font-family: Arial, sans-serif; 
                        max-width: 800px; 
                        margin: 0 auto; 
                        padding: 20px; 
                        background: white;
                    }
                </style>
            </head>
            <body>
                ${content}
            </body>
            </html>
        `);
        previewWindow.document.close();
    };

    // Rich text editor functions
    const executeCommand = (command, value = null) => {
        document.execCommand(command, false, value);
        if (editorRef.current) {
            setEditedContent(editorRef.current.innerHTML);
            editorRef.current.focus();
        }
    };

    const handleFormat = (command, value = null) => {
        executeCommand(command, value);
    };

    const handleFontSize = (size) => {
        executeCommand('fontSize', '7');
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            const span = document.createElement('span');
            span.style.fontSize = size + 'px';
            try {
                range.surroundContents(span);
            } catch (e) {
                span.appendChild(range.extractContents());
                range.insertNode(span);
            }
        }
        setShowFontSizes(false);
        if (editorRef.current) {
            setEditedContent(editorRef.current.innerHTML);
            editorRef.current.focus();
        }
    };

    const handleColorChange = (color) => {
        executeCommand('foreColor', color);
        setShowColorPicker(false);
    };

    const handleImageUpload = () => {
        fileInputRef.current?.click();
    };

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                executeCommand('insertImage', e.target.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleInsertLink = () => {
        const url = prompt('Enter URL:');
        if (url) {
            executeCommand('createLink', url);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading document...</p>
                </div>
            </div>
        );
    }

    if (!document) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Document Not Found</h2>
                    <p className="text-gray-600 mb-4">The document you&apos;re looking for doesn&apos;t exist.</p>
                    <button
                        onClick={handleBack}
                        className="inline-flex items-center px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Documents
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-4 py-2 sticky top-0 z-20">
                <div className="max-w-full mx-auto flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <button 
                            onClick={handleBack}
                            className="text-gray-600 hover:text-gray-800 px-3 py-1 rounded flex items-center"
                        >
                            <ArrowLeft className="mr-1 h-4 w-4" />
                            Back
                        </button>
                        {isEditing ? (
                            <input
                                type="text"
                                value={editedTitle}
                                onChange={(e) => setEditedTitle(e.target.value)}
                                className="text-lg font-medium border-none outline-none bg-transparent max-w-md"
                                placeholder="Document title"
                            />
                        ) : (
                            <h1 className="text-lg font-medium">{document.title}</h1>
                        )}
                        {!isEditing && (
                            <div className="text-sm text-gray-500">
                                <span>by {document.createdBy}</span>
                                <span className="mx-2">•</span>
                                <span>Modified {new Date(document.lastModified).toLocaleDateString()}</span>
                            </div>
                        )}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                        {isEditing ? (
                            <>
                                <button
                                    onClick={handleCancelEdit}
                                    className="px-3 py-1 text-gray-600 hover:bg-gray-100 rounded"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="flex items-center px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700 disabled:opacity-50"
                                >
                                    <Save className="w-4 h-4 mr-1" />
                                    {isSaving ? 'Saving...' : 'Save'}
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    onClick={handleEdit}
                                    className="flex items-center px-3 py-1 text-gray-600 hover:bg-gray-100 rounded"
                                >
                                    <Edit className="mr-1 h-4 w-4" />
                                    Edit
                                </button>
                                <button
                                    onClick={handlePreviewInNewTab}
                                    className="flex items-center px-3 py-1 text-gray-600 hover:bg-gray-100 rounded"
                                >
                                    <ExternalLink className="mr-1 h-4 w-4" />
                                    Preview in New Tab
                                </button>
                                <button
                                    onClick={handleShare}
                                    className="flex items-center px-3 py-1 text-gray-600 hover:bg-gray-100 rounded"
                                >
                                    <Share className="mr-1 h-4 w-4" />
                                    Share
                                </button>
                                <button
                                    onClick={handleDownload}
                                    className="flex items-center px-3 py-1 text-gray-600 hover:bg-gray-100 rounded"
                                >
                                    <Download className="mr-1 h-4 w-4" />
                                    Download
                                </button>
                                <button
                                    onClick={handleDelete}
                                    className="flex items-center px-3 py-1 text-red-600 hover:bg-red-50 rounded"
                                >
                                    <Trash2 className="mr-1 h-4 w-4" />
                                    Delete
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Toolbar (only visible in edit mode) */}
            {isEditing && (
                <div className="bg-white border-b border-gray-200 px-4 py-2 sticky top-16 z-10">
                    <div className="max-w-6xl mx-auto">
                        <div className="flex flex-wrap items-center gap-1">
                            {/* Font Family */}
                            <select
                                onChange={(e) => handleFormat('fontName', e.target.value)}
                                className="px-2 py-1 border border-gray-300 rounded text-sm"
                            >
                                {fontFamilies.map(font => (
                                    <option key={font} value={font}>{font}</option>
                                ))}
                            </select>

                            {/* Font Size */}
                            <div className="relative">
                                <button
                                    onClick={() => setShowFontSizes(!showFontSizes)}
                                    className="flex items-center px-2 py-1 border border-gray-300 rounded text-sm"
                                >
                                    <Type className="w-4 h-4 mr-1" />
                                    14
                                </button>
                                {showFontSizes && (
                                    <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded shadow-lg z-20 max-h-40 overflow-y-auto">
                                        {fontSizes.map(size => (
                                            <button
                                                key={size}
                                                onClick={() => handleFontSize(size)}
                                                className="block w-full px-3 py-1 text-left hover:bg-gray-100 text-sm"
                                            >
                                                {size}px
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="w-px h-6 bg-gray-300 mx-1"></div>

                            {/* Text Formatting */}
                            <button
                                onClick={() => handleFormat('bold')}
                                className="p-2 rounded hover:bg-gray-100"
                            >
                                <Bold className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => handleFormat('italic')}
                                className="p-2 rounded hover:bg-gray-100"
                            >
                                <Italic className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => handleFormat('underline')}
                                className="p-2 rounded hover:bg-gray-100"
                            >
                                <Underline className="w-4 h-4" />
                            </button>

                            {/* Text Color */}
                            <div className="relative">
                                <button
                                    onClick={() => setShowColorPicker(!showColorPicker)}
                                    className="p-2 rounded hover:bg-gray-100"
                                >
                                    <Palette className="w-4 h-4" />
                                </button>
                                {showColorPicker && (
                                    <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded shadow-lg z-20 p-2">
                                        <div className="grid grid-cols-5 gap-1">
                                            {colors.map(color => (
                                                <button
                                                    key={color}
                                                    onClick={() => handleColorChange(color)}
                                                    className="w-6 h-6 rounded border border-gray-300"
                                                    style={{ backgroundColor: color }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="w-px h-6 bg-gray-300 mx-1"></div>

                            {/* Alignment */}
                            <button
                                onClick={() => handleFormat('justifyLeft')}
                                className="p-2 rounded hover:bg-gray-100"
                            >
                                <AlignLeft className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => handleFormat('justifyCenter')}
                                className="p-2 rounded hover:bg-gray-100"
                            >
                                <AlignCenter className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => handleFormat('justifyRight')}
                                className="p-2 rounded hover:bg-gray-100"
                            >
                                <AlignRight className="w-4 h-4" />
                            </button>

                            {/* Lists */}
                            <button
                                onClick={() => handleFormat('insertUnorderedList')}
                                className="p-2 rounded hover:bg-gray-100"
                            >
                                <List className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => handleFormat('insertOrderedList')}
                                className="p-2 rounded hover:bg-gray-100"
                            >
                                <ListOrdered className="w-4 h-4" />
                            </button>

                            {/* Insert Elements */}
                            <button
                                onClick={handleInsertLink}
                                className="p-2 rounded hover:bg-gray-100"
                            >
                                <Link className="w-4 h-4" />
                            </button>
                            <button
                                onClick={handleImageUpload}
                                className="p-2 rounded hover:bg-gray-100"
                            >
                                <Image alt='doc-image' className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Document Content */}
            <div className="max-w-5xl mx-auto py-8 px-4">
                <div className="bg-white shadow-lg rounded-lg overflow-hidden">
                    {isEditing ? (
                        <div 
                            ref={editorRef}
                            contentEditable
                            className="min-h-[600px] p-8 outline-none"
                            style={{ 
                                fontSize: '14px',
                                lineHeight: '1.6',
                                fontFamily: 'Arial, sans-serif'
                            }}
                            dangerouslySetInnerHTML={{ __html: editedContent }}
                            onInput={(e) => setEditedContent(e.target.innerHTML)}
                            suppressContentEditableWarning={true}
                            onKeyDown={(e) => {
                                if (e.ctrlKey || e.metaKey) {
                                    switch (e.key) {
                                        case 'b':
                                            e.preventDefault();
                                            handleFormat('bold');
                                            break;
                                        case 'i':
                                            e.preventDefault();
                                            handleFormat('italic');
                                            break;
                                        case 'u':
                                            e.preventDefault();
                                            handleFormat('underline');
                                            break;
                                        case 's':
                                            e.preventDefault();
                                            handleSave();
                                            break;
                                    }
                                }
                            }}
                        />
                    ) : (
                        <div 
                            className="p-8 prose max-w-none"
                            dangerouslySetInnerHTML={{ __html: document.content }}
                        />
                    )}
                </div>
            </div>

            {/* Hidden file input for image uploads */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
            />
        </div>
    );
}