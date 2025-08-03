/* eslint-disable @typescript-eslint/no-unused-vars */
// app/documents/create.js
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
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
    Save,
    FileDown,
    Eye,
    Type,
    Palette,
    Minus
} from 'lucide-react';

export default function CreateDocument() {
    const router = useRouter();
    const editorRef = useRef(null);
    const fileInputRef = useRef(null);
    
    const [documentTitle, setDocumentTitle] = useState('Untitled Document');
    const [isLoading, setIsLoading] = useState(false);
    const [showColorPicker, setShowColorPicker] = useState(false);
    const [showFontSizes, setShowFontSizes] = useState(false);
    const [currentFormat, setCurrentFormat] = useState({
        bold: false,
        italic: false,
        underline: false,
        fontSize: '14',
        fontFamily: 'Arial',
        textAlign: 'left'
    });

    const fontSizes = ['8', '9', '10', '11', '12', '14', '16', '18', '20', '22', '24', '26', '28', '36', '48', '72'];
    const fontFamilies = ['Arial', 'Times New Roman', 'Helvetica', 'Georgia', 'Verdana', 'Courier New'];
    const colors = ['#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080', '#FFC0CB'];

    useEffect(() => {
        if (editorRef.current) {
            editorRef.current.focus();
        }
        
        // Update format state when selection changes
        const updateFormatState = () => {
            if (document.queryCommandSupported('queryCommandState')) {
                setCurrentFormat({
                    bold: document.queryCommandState('bold'),
                    italic: document.queryCommandState('italic'),
                    underline: document.queryCommandState('underline'),
                    fontSize: document.queryCommandValue('fontSize') || '14',
                    fontFamily: document.queryCommandValue('fontName') || 'Arial',
                    textAlign: 'left'
                });
            }
        };

        document.addEventListener('selectionchange', updateFormatState);
        return () => document.removeEventListener('selectionchange', updateFormatState);
    }, []);

    const executeCommand = (command, value = null) => {
        document.execCommand(command, false, value);
        editorRef.current?.focus();
    };

    const handleFormat = (command, value = null) => {
        executeCommand(command, value);
    };

    const handleFontSize = (size) => {
        executeCommand('fontSize', '7'); // First set to size 7
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
        editorRef.current?.focus();
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

    const handleSave = async () => {
        setIsLoading(true);
        try {
            const content = editorRef.current?.innerHTML || '';
            const documentData = {
                title: documentTitle,
                content: content,
                createdAt: new Date().toISOString()
            };
            
            console.log('Saving document:', documentData);
            
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            alert('Document saved successfully!');
            router.push('/documents');
        } catch (error) {
            console.error('Error saving document:', error);
            alert('Failed to save document. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleExport = () => {
        const content = editorRef.current?.innerHTML || '';
        const blob = new Blob([`
            <!DOCTYPE html>
            <html>
            <head>
                <title>${documentTitle}</title>
                <style>
                    body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
                </style>
            </head>
            <body>
                <h1>${documentTitle}</h1>
                ${content}
            </body>
            </html>
        `], { type: 'text/html' });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${documentTitle}.html`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handlePreview = () => {
        const content = editorRef.current?.innerHTML || '';
        const previewWindow = window.open('', '_blank');
        previewWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>${documentTitle} - Preview</title>
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
                <h1>${documentTitle}</h1>
                ${content}
            </body>
            </html>
        `);
        previewWindow.document.close();
    };

    return (
        <div className="min-h-screen">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-4 py-2">
                <div className="max-w-full mx-auto flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={() => router.push('/documents')}
                            className="text-gray-600 hover:text-gray-800 px-3 py-1 rounded"
                        >
                            ← Back
                        </button>
                        <input
                            type="text"
                            value={documentTitle}
                            onChange={(e) => setDocumentTitle(e.target.value)}
                            className="text-lg font-medium border-none outline-none bg-transparent max-w-md"
                            placeholder="Document title"
                        />
                    </div>
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={handlePreview}
                            className="flex items-center px-3 py-1 text-gray-600 hover:bg-gray-100 rounded"
                        >
                            <Eye className="w-4 h-4 mr-1" />
                            Preview
                        </button>
                        <button
                            onClick={handleExport}
                            className="flex items-center px-3 py-1 text-gray-600 hover:bg-gray-100 rounded"
                        >
                            <FileDown className="w-4 h-4 mr-1" />
                            Export
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isLoading}
                            className="flex items-center px-3 py-1 bg-teal-600 text-white rounded hover:bg-teal-700 disabled:opacity-50"
                        >
                            <Save className="w-4 h-4 mr-1" />
                            {isLoading ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Toolbar */}
            <div className="bg-white border-b border-gray-200 px-4 py-2 sticky top-0 z-10">
                <div className="max-w-6xl mx-auto">
                    <div className="flex flex-wrap items-center gap-1">
                        {/* Font Family */}
                        <select
                            onChange={(e) => handleFormat('fontName', e.target.value)}
                            className="px-2 py-1 border border-gray-300 rounded text-sm"
                            value={currentFormat.fontFamily}
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
                            className={`p-2 rounded hover:bg-gray-100 ${currentFormat.bold ? 'bg-gray-200' : ''}`}
                        >
                            <Bold className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => handleFormat('italic')}
                            className={`p-2 rounded hover:bg-gray-100 ${currentFormat.italic ? 'bg-gray-200' : ''}`}
                        >
                            <Italic className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => handleFormat('underline')}
                            className={`p-2 rounded hover:bg-gray-100 ${currentFormat.underline ? 'bg-gray-200' : ''}`}
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
                        <button
                            onClick={() => handleFormat('justifyFull')}
                            className="p-2 rounded hover:bg-gray-100"
                        >
                            <AlignJustify className="w-4 h-4" />
                        </button>

                        <div className="w-px h-6 bg-gray-300 mx-1"></div>

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

                        <div className="w-px h-6 bg-gray-300 mx-1"></div>

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
                            <Image alt='insert-image' className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => handleFormat('insertHorizontalRule')}
                            className="p-2 rounded hover:bg-gray-100"
                        >
                            <Minus className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Editor */}
            <div className="max-w-5xl mx-auto py-8 px-4">
                <div className="bg-white shadow-3xl rounded-lg overflow-hidden">
                    <div 
                        ref={editorRef}
                        contentEditable
                        className="min-h-[600px] p-8 outline-none"
                        style={{ 
                            fontSize: '14px',
                            lineHeight: '1.6',
                            fontFamily: 'Arial, sans-serif'
                        }}
                        suppressContentEditableWarning={true}
                        onKeyDown={(e) => {
                            // Handle keyboard shortcuts
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
                    >
                        <p className='text-gray-400'>Start writing your document here...</p>
                    </div>
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