'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { 
  $getSelection, 
  $isRangeSelection,
  FORMAT_TEXT_COMMAND,
  FORMAT_ELEMENT_COMMAND,
  UNDO_COMMAND,
  REDO_COMMAND,
  CLEAR_EDITOR_COMMAND,
  $getRoot
} from 'lexical';
import { $createHeadingNode, $createQuoteNode } from '@lexical/rich-text';
import { 
  INSERT_ORDERED_LIST_COMMAND, 
  INSERT_UNORDERED_LIST_COMMAND,
  INSERT_CHECK_LIST_COMMAND
} from '@lexical/list';
import { INSERT_HORIZONTAL_RULE_COMMAND } from '@lexical/react/LexicalHorizontalRuleNode';
import { $createCodeNode } from '@lexical/code';
import { 
  Bold, Italic, Underline, Strikethrough, AlignLeft, AlignCenter, 
  AlignRight, AlignJustify, List, ListOrdered, Quote, Link2, 
  Code, Undo, Redo, ChevronDown, Type, Palette, Trash2,
  Minus, CheckSquare, FileCode, Superscript, Subscript,
  RemoveFormatting, FileDown
} from 'lucide-react';

const FONT_FAMILY_OPTIONS = [
  ['Arial', 'Arial'],
  ['Courier New', 'Courier New'],
  ['Georgia', 'Georgia'],
  ['Times New Roman', 'Times New Roman'],
  ['Trebuchet MS', 'Trebuchet MS'],
  ['Verdana', 'Verdana'],
  ['Comic Sans MS', 'Comic Sans MS'],
  ['Impact', 'Impact'],
];

const FONT_SIZE_OPTIONS = [
  ['10px', '10px'],
  ['11px', '11px'],
  ['12px', '12px'],
  ['14px', '14px'],
  ['16px', '16px'],
  ['18px', '18px'],
  ['20px', '20px'],
  ['24px', '24px'],
  ['28px', '28px'],
  ['32px', '32px'],
  ['40px', '40px'],
  ['48px', '48px'],
];

const TEXT_COLORS = [
  '#000000', '#434343', '#666666', '#999999', '#cccccc',
  '#e74c3c', '#e67e22', '#f39c12', '#f1c40f', '#2ecc71',
  '#1abc9c', '#3498db', '#9b59b6', '#34495e', '#ffffff'
];

const BACKGROUND_COLORS = [
  'transparent', '#fef5e7', '#fdebd0', '#fadbd8', '#f5eef8',
  '#e8f8f5', '#e8f6f3', '#ebf5fb', '#eaf2f8', '#f4ecf7'
];

export default function CompleteToolbar() {
  const [editor] = useLexicalComposerContext();
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isStrikethrough, setIsStrikethrough] = useState(false);
  const [isCode, setIsCode] = useState(false);
  const [isSuperscript, setIsSuperscript] = useState(false);
  const [isSubscript, setIsSubscript] = useState(false);
  const [fontFamily, setFontFamily] = useState('Arial');
  const [fontSize, setFontSize] = useState('16px');
  const [blockType, setBlockType] = useState('paragraph');
  const [showTextColor, setShowTextColor] = useState(false);
  const [showBgColor, setShowBgColor] = useState(false);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');

  const updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      setIsBold(selection.hasFormat('bold'));
      setIsItalic(selection.hasFormat('italic'));
      setIsUnderline(selection.hasFormat('underline'));
      setIsStrikethrough(selection.hasFormat('strikethrough'));
      setIsCode(selection.hasFormat('code'));
      setIsSuperscript(selection.hasFormat('superscript'));
      setIsSubscript(selection.hasFormat('subscript'));
    }
  }, []);

  useEffect(() => {
    return editor.registerCommand(
      UNDO_COMMAND,
      () => {
        setCanUndo(editor.getEditorState().canUndo);
        return false;
      },
      1
    );
  }, [editor]);

  useEffect(() => {
    return editor.registerCommand(
      REDO_COMMAND,
      () => {
        setCanRedo(editor.getEditorState().canRedo);
        return false;
      },
      1
    );
  }, [editor]);

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        updateToolbar();
      });
    });
  }, [editor, updateToolbar]);

  const formatText = (format) => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, format);
  };

  const formatAlignment = (alignment) => {
    editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, alignment);
  };

  const formatHeading = (headingSize) => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        const nodes = selection.getNodes();
        nodes.forEach((node) => {
          const parent = node.getParent();
          if (parent) {
            const headingNode = $createHeadingNode(headingSize);
            parent.replace(headingNode);
            headingNode.append(node);
          }
        });
      }
    });
  };

  const formatQuote = () => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        const nodes = selection.getNodes();
        nodes.forEach((node) => {
          const parent = node.getParent();
          if (parent) {
            const quoteNode = $createQuoteNode();
            parent.replace(quoteNode);
            quoteNode.append(node);
          }
        });
      }
    });
  };

  const formatCodeBlock = () => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        const codeNode = $createCodeNode();
        selection.insertNodes([codeNode]);
      }
    });
  };

  const insertList = (listType) => {
    if (listType === 'bullet') {
      editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
    } else if (listType === 'number') {
      editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
    } else if (listType === 'check') {
      editor.dispatchCommand(INSERT_CHECK_LIST_COMMAND, undefined);
    }
  };

  const insertHorizontalRule = () => {
    editor.dispatchCommand(INSERT_HORIZONTAL_RULE_COMMAND, undefined);
  };

  const clearFormatting = () => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        selection.getNodes().forEach((node) => {
          if (node.getType() === 'text') {
            node.setFormat(0);
            node.setStyle('');
          }
        });
      }
    });
  };

  const clearEditor = () => {
    if (window.confirm('Are you sure you want to clear all content?')) {
      editor.dispatchCommand(CLEAR_EDITOR_COMMAND, undefined);
    }
  };

  const applyStyleText = (styles) => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        selection.getNodes().forEach((node) => {
          if (node.getType() === 'text') {
            const currentStyle = node.getStyle();
            let newStyle = currentStyle;
            Object.keys(styles).forEach((key) => {
              const regex = new RegExp(`${key}:\\s*[^;]+;?`, 'gi');
              newStyle = newStyle.replace(regex, '');
              newStyle += `${key}: ${styles[key]}; `;
            });
            node.setStyle(newStyle.trim());
          }
        });
      }
    });
  };

  const insertLink = () => {
    if (linkUrl) {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          // For full link implementation, you'd need @lexical/link plugin
          // This is a placeholder showing the UI
          alert('Link plugin needed: ' + linkUrl);
        }
      });
      setShowLinkInput(false);
      setLinkUrl('');
    }
  };

  const exportDocument = (format) => {
    editor.getEditorState().read(() => {
      const root = $getRoot();
      const text = root.getTextContent();
      
      if (format === 'txt') {
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'document.txt';
        a.click();
        URL.revokeObjectURL(url);
      } else if (format === 'html') {
        const html = root.getChildren().map(node => {
          return `<p>${node.getTextContent()}</p>`;
        }).join('\n');
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'document.html';
        a.click();
        URL.revokeObjectURL(url);
      }
    });
  };

  return (
    <div className="border-b border-border bg-card sticky top-0 z-20 shadow-theme-sm">
      {/* Row 1: History, Font, Size, Block Type */}
      <div className="px-4 py-2 flex items-center gap-2 border-b border-border flex-wrap">
        {/* Undo/Redo */}
        <button
          onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)}
          disabled={!canUndo}
          className="p-2 hover:bg-secondary rounded disabled:opacity-40 disabled:cursor-not-allowed text-foreground"
          title="Undo (Ctrl+Z)"
        >
          <Undo className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)}
          disabled={!canRedo}
          className="p-2 hover:bg-secondary rounded disabled:opacity-40 disabled:cursor-not-allowed text-foreground"
          title="Redo (Ctrl+Y)"
        >
          <Redo className="w-4 h-4" />
        </button>

        <div className="w-px h-6 bg-border mx-1" />

        {/* Font Family */}
        <select
          value={fontFamily}
          onChange={(e) => {
            setFontFamily(e.target.value);
            applyStyleText({ 'font-family': e.target.value });
          }}
          className="px-3 py-1.5 text-sm border border-border rounded hover:bg-secondary min-w-[140px] bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        >
          {FONT_FAMILY_OPTIONS.map(([option, value]) => (
            <option key={option} value={value}>
              {option}
            </option>
          ))}
        </select>

        {/* Font Size */}
        <select
          value={fontSize}
          onChange={(e) => {
            setFontSize(e.target.value);
            applyStyleText({ 'font-size': e.target.value });
          }}
          className="px-3 py-1.5 text-sm border border-border rounded hover:bg-secondary min-w-[80px] bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        >
          {FONT_SIZE_OPTIONS.map(([option, value]) => (
            <option key={option} value={value}>
              {option}
            </option>
          ))}
        </select>

        <div className="w-px h-6 bg-border mx-1" />

        {/* Block Type */}
        <select
          value={blockType}
          onChange={(e) => {
            setBlockType(e.target.value);
            if (e.target.value === 'h1') formatHeading('h1');
            else if (e.target.value === 'h2') formatHeading('h2');
            else if (e.target.value === 'h3') formatHeading('h3');
            else if (e.target.value === 'quote') formatQuote();
          }}
          className="px-3 py-1.5 text-sm border border-border rounded hover:bg-secondary min-w-[120px] bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="paragraph">Normal</option>
          <option value="h1">Heading 1</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
          <option value="quote">Quote</option>
        </select>

        <div className="w-px h-6 bg-border mx-1" />

        {/* Clear & Export */}
        <button
          onClick={clearEditor}
          className="p-2 hover:bg-secondary rounded text-destructive"
          title="Clear All Content"
        >
          <Trash2 className="w-4 h-4" />
        </button>
        
        <div className="relative group">
          <button
            className="p-2 hover:bg-secondary rounded text-foreground"
            title="Export Document"
          >
            <FileDown className="w-4 h-4" />
          </button>
          <div className="hidden group-hover:block absolute top-full left-0 mt-1 bg-card border border-border rounded shadow-theme-lg py-1 z-30 min-w-[120px]">
            <button
              onClick={() => exportDocument('txt')}
              className="w-full px-4 py-2 text-left text-sm hover:bg-secondary text-foreground"
            >
              Export as TXT
            </button>
            <button
              onClick={() => exportDocument('html')}
              className="w-full px-4 py-2 text-left text-sm hover:bg-secondary text-foreground"
            >
              Export as HTML
            </button>
          </div>
        </div>
      </div>

      {/* Row 2: Text Formatting, Colors, Alignment, Lists */}
      <div className="px-4 py-2 flex items-center gap-1 overflow-x-auto">
        {/* Text Formatting */}
        <button
          onClick={() => formatText('bold')}
          className={`p-2 rounded ${isBold ? 'bg-primary/20 text-primary' : 'hover:bg-secondary'} text-foreground`}
          title="Bold (Ctrl+B)"
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          onClick={() => formatText('italic')}
          className={`p-2 rounded ${isItalic ? 'bg-primary/20 text-primary' : 'hover:bg-secondary'} text-foreground`}
          title="Italic (Ctrl+I)"
        >
          <Italic className="w-4 h-4" />
        </button>
        <button
          onClick={() => formatText('underline')}
          className={`p-2 rounded ${isUnderline ? 'bg-primary/20 text-primary' : 'hover:bg-secondary'} text-foreground`}
          title="Underline (Ctrl+U)"
        >
          <Underline className="w-4 h-4" />
        </button>
        <button
          onClick={() => formatText('strikethrough')}
          className={`p-2 rounded ${isStrikethrough ? 'bg-primary/20 text-primary' : 'hover:bg-secondary'} text-foreground`}
          title="Strikethrough"
        >
          <Strikethrough className="w-4 h-4" />
        </button>
        <button
          onClick={() => formatText('code')}
          className={`p-2 rounded ${isCode ? 'bg-primary/20 text-primary' : 'hover:bg-secondary'} text-foreground`}
          title="Inline Code"
        >
          <Code className="w-4 h-4" />
        </button>
        <button
          onClick={() => formatText('superscript')}
          className={`p-2 rounded ${isSuperscript ? 'bg-primary/20 text-primary' : 'hover:bg-secondary'} text-foreground`}
          title="Superscript"
        >
          <Superscript className="w-4 h-4" />
        </button>
        <button
          onClick={() => formatText('subscript')}
          className={`p-2 rounded ${isSubscript ? 'bg-primary/20 text-primary' : 'hover:bg-secondary'} text-foreground`}
          title="Subscript"
        >
          <Subscript className="w-4 h-4" />
        </button>

        <div className="w-px h-6 bg-border mx-2" />

        {/* Text Color */}
        <div className="relative">
          <button
            onClick={() => {
              setShowTextColor(!showTextColor);
              setShowBgColor(false);
            }}
            className="p-2 hover:bg-secondary rounded flex items-center gap-1 text-foreground"
            title="Text Color"
          >
            <Type className="w-4 h-4" />
            <ChevronDown className="w-3 h-3" />
          </button>
          {showTextColor && (
            <div className="absolute top-full left-0 mt-1 p-2 bg-card border border-border rounded-lg shadow-theme-lg z-30">
              <div className="grid grid-cols-5 gap-1 w-40">
                {TEXT_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => {
                      applyStyleText({ color });
                      setShowTextColor(false);
                    }}
                    className="w-7 h-7 rounded border border-border hover:scale-110 transition-transform"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Background Color */}
        <div className="relative">
          <button
            onClick={() => {
              setShowBgColor(!showBgColor);
              setShowTextColor(false);
            }}
            className="p-2 hover:bg-secondary rounded flex items-center gap-1 text-foreground"
            title="Background Color"
          >
            <Palette className="w-4 h-4" />
            <ChevronDown className="w-3 h-3" />
          </button>
          {showBgColor && (
            <div className="absolute top-full left-0 mt-1 p-2 bg-card border border-border rounded-lg shadow-theme-lg z-30">
              <div className="grid grid-cols-5 gap-1 w-40">
                {BACKGROUND_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => {
                      applyStyleText({ 'background-color': color });
                      setShowBgColor(false);
                    }}
                    className="w-7 h-7 rounded border border-border hover:scale-110 transition-transform"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        <button
          onClick={clearFormatting}
          className="p-2 hover:bg-secondary rounded text-foreground"
          title="Clear Formatting"
        >
          <RemoveFormatting className="w-4 h-4" />
        </button>

        <div className="w-px h-6 bg-border mx-2" />

        {/* Alignment */}
        <button
          onClick={() => formatAlignment('left')}
          className="p-2 hover:bg-secondary rounded text-foreground"
          title="Align Left"
        >
          <AlignLeft className="w-4 h-4" />
        </button>
        <button
          onClick={() => formatAlignment('center')}
          className="p-2 hover:bg-secondary rounded text-foreground"
          title="Align Center"
        >
          <AlignCenter className="w-4 h-4" />
        </button>
        <button
          onClick={() => formatAlignment('right')}
          className="p-2 hover:bg-secondary rounded text-foreground"
          title="Align Right"
        >
          <AlignRight className="w-4 h-4" />
        </button>
        <button
          onClick={() => formatAlignment('justify')}
          className="p-2 hover:bg-secondary rounded text-foreground"
          title="Justify"
        >
          <AlignJustify className="w-4 h-4" />
        </button>

        <div className="w-px h-6 bg-border mx-2" />

        {/* Lists */}
        <button
          onClick={() => insertList('bullet')}
          className="p-2 hover:bg-secondary rounded text-foreground"
          title="Bullet List"
        >
          <List className="w-4 h-4" />
        </button>
        <button
          onClick={() => insertList('number')}
          className="p-2 hover:bg-secondary rounded text-foreground"
          title="Numbered List"
        >
          <ListOrdered className="w-4 h-4" />
        </button>
        <button
          onClick={() => insertList('check')}
          className="p-2 hover:bg-secondary rounded text-foreground"
          title="Check List"
        >
          <CheckSquare className="w-4 h-4" />
        </button>

        <div className="w-px h-6 bg-border mx-2" />

        {/* Quote & Code Block */}
        <button
          onClick={formatQuote}
          className="p-2 hover:bg-secondary rounded text-foreground"
          title="Quote Block"
        >
          <Quote className="w-4 h-4" />
        </button>
        <button
          onClick={formatCodeBlock}
          className="p-2 hover:bg-secondary rounded text-foreground"
          title="Code Block"
        >
          <FileCode className="w-4 h-4" />
        </button>

        <div className="w-px h-6 bg-border mx-2" />

        {/* Horizontal Rule */}
        <button
          onClick={insertHorizontalRule}
          className="p-2 hover:bg-secondary rounded text-foreground"
          title="Horizontal Line"
        >
          <Minus className="w-4 h-4" />
        </button>

        {/* Link */}
        <div className="relative">
          <button
            onClick={() => setShowLinkInput(!showLinkInput)}
            className="p-2 hover:bg-secondary rounded text-foreground"
            title="Insert Link"
          >
            <Link2 className="w-4 h-4" />
          </button>
          {showLinkInput && (
            <div className="absolute top-full left-0 mt-1 p-3 bg-card border border-border rounded-lg shadow-theme-lg z-30 w-64">
              <input
                type="url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="Enter URL..."
                className="w-full px-3 py-2 text-sm border border-border rounded mb-2 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <div className="flex gap-2">
                <button
                  onClick={insertLink}
                  className="flex-1 px-3 py-1.5 bg-primary text-primary-foreground text-sm rounded hover:bg-primary/80"
                >
                  Insert
                </button>
                <button
                  onClick={() => {
                    setShowLinkInput(false);
                    setLinkUrl('');
                  }}
                  className="flex-1 px-3 py-1.5 bg-secondary text-secondary-foreground text-sm rounded hover:bg-secondary/80"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}