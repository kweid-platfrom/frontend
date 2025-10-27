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
  $getRoot,
  $createParagraphNode,
  SELECTION_CHANGE_COMMAND,
  CAN_UNDO_COMMAND,
  CAN_REDO_COMMAND,
  COMMAND_PRIORITY_LOW,
} from 'lexical';
import { 
  $isHeadingNode,
  $createHeadingNode, 
  $createQuoteNode,
} from '@lexical/rich-text';
import { 
  INSERT_ORDERED_LIST_COMMAND, 
  INSERT_UNORDERED_LIST_COMMAND,
  INSERT_CHECK_LIST_COMMAND,
  REMOVE_LIST_COMMAND,
  $isListNode
} from '@lexical/list';
import { $createCodeNode } from '@lexical/code';
import { $setBlocksType } from '@lexical/selection';
import { 
  Bold, Italic, Underline, Strikethrough, AlignLeft, AlignCenter, 
  AlignRight, AlignJustify, List, ListOrdered, Quote,
  Code, Undo, Redo, CheckSquare, FileCode,
  RemoveFormatting, Search, BookOpen, FileType
} from 'lucide-react';

const TEXT_COLORS = [
  { color: '#000000', label: 'Black' },
  { color: '#e74c3c', label: 'Red' },
  { color: '#f39c12', label: 'Orange' },
  { color: '#2ecc71', label: 'Green' },
  { color: '#3498db', label: 'Blue' },
  { color: '#9b59b6', label: 'Purple' },
];

const BACKGROUND_COLORS = [
  { color: 'transparent', label: 'None' },
  { color: '#fef5e7', label: 'Yellow' },
  { color: '#fadbd8', label: 'Red' },
  { color: '#e8f8f5', label: 'Green' },
  { color: '#ebf5fb', label: 'Blue' },
  { color: '#f4ecf7', label: 'Purple' },
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
  const [blockType, setBlockType] = useState('paragraph');
  const [showFindReplace, setShowFindReplace] = useState(false);
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');

  const updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      setIsBold(selection.hasFormat('bold'));
      setIsItalic(selection.hasFormat('italic'));
      setIsUnderline(selection.hasFormat('underline'));
      setIsStrikethrough(selection.hasFormat('strikethrough'));
      setIsCode(selection.hasFormat('code'));

      const anchorNode = selection.anchor.getNode();
      const element =
        anchorNode.getKey() === 'root'
          ? anchorNode
          : anchorNode.getTopLevelElementOrThrow();
      const elementKey = element.getKey();
      const elementDOM = editor.getElementByKey(elementKey);

      if (elementDOM !== null) {
        if ($isListNode(element)) {
          const parentList = element;
          const type = parentList.getListType();
          setBlockType(type);
        } else {
          const type = $isHeadingNode(element)
            ? element.getTag()
            : element.getType();
          setBlockType(type);
        }
      }
    }
  }, [editor]);

  useEffect(() => {
    return editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      () => {
        updateToolbar();
        return false;
      },
      COMMAND_PRIORITY_LOW
    );
  }, [editor, updateToolbar]);

  useEffect(() => {
    return editor.registerCommand(
      CAN_UNDO_COMMAND,
      (payload) => {
        setCanUndo(payload);
        return false;
      },
      COMMAND_PRIORITY_LOW
    );
  }, [editor]);

  useEffect(() => {
    return editor.registerCommand(
      CAN_REDO_COMMAND,
      (payload) => {
        setCanRedo(payload);
        return false;
      },
      COMMAND_PRIORITY_LOW
    );
  }, [editor]);

  const handleUndo = useCallback(() => {
    editor.dispatchCommand(UNDO_COMMAND, undefined);
  }, [editor]);

  const handleRedo = useCallback(() => {
    editor.dispatchCommand(REDO_COMMAND, undefined);
  }, [editor]);

  const formatText = (format) => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, format);
  };

  const formatAlignment = (alignment) => {
    editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, alignment);
  };

  const formatHeading = (headingTag) => {
    if (blockType !== headingTag) {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          $setBlocksType(selection, () => $createHeadingNode(headingTag));
        }
      });
      setBlockType(headingTag);
    } else {
      formatParagraph();
    }
  };

  const formatParagraph = () => {
    if (blockType !== 'paragraph') {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          $setBlocksType(selection, () => $createParagraphNode());
        }
      });
      setBlockType('paragraph');
    }
  };

  const formatQuote = () => {
    if (blockType !== 'quote') {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          $setBlocksType(selection, () => $createQuoteNode());
        }
      });
      setBlockType('quote');
    }
  };

  const formatCodeBlock = () => {
    if (blockType !== 'code') {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          $setBlocksType(selection, () => $createCodeNode());
        }
      });
      setBlockType('code');
    }
  };

  const insertList = (listType) => {
    if (listType === 'bullet') {
      if (blockType !== 'bullet') {
        editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
      } else {
        editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
      }
    } else if (listType === 'number') {
      if (blockType !== 'number') {
        editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
      } else {
        editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
      }
    } else if (listType === 'check') {
      if (blockType !== 'check') {
        editor.dispatchCommand(INSERT_CHECK_LIST_COMMAND, undefined);
      } else {
        editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
      }
    }
  };

  const clearFormatting = () => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        selection.getNodes().forEach((node) => {
          if (node.__type === 'text') {
            node.setFormat(0);
            node.setStyle('');
          }
        });
      }
    });
  };

  const applyStyleText = (styles) => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        selection.getNodes().forEach((node) => {
          if (node.__type === 'text') {
            const currentStyle = node.getStyle() || '';
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

  const handleFind = () => {
    if (!findText) return;
    
    editor.update(() => {
      const root = $getRoot();
      const textContent = root.getTextContent();
      const index = textContent.toLowerCase().indexOf(findText.toLowerCase());
      
      if (index !== -1) {
        console.log('Found at index:', index);
      } else {
        alert('Text not found');
      }
    });
  };

  const handleReplace = () => {
    if (!findText || !replaceText) return;
    
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        const selectedText = selection.getTextContent();
        if (selectedText.toLowerCase() === findText.toLowerCase()) {
          selection.insertText(replaceText);
        } else {
          alert('Please select the text to replace first');
        }
      }
    });
  };

  const handleReplaceAll = () => {
    if (!findText || !replaceText) return;
    
    editor.update(() => {
      const root = $getRoot();
      const allTextNodes = root.getAllTextNodes();
      let replacedCount = 0;
      
      allTextNodes.forEach(node => {
        const text = node.getTextContent();
        const regex = new RegExp(findText, 'gi');
        if (regex.test(text)) {
          const newText = text.replace(regex, replaceText);
          node.setTextContent(newText);
          replacedCount++;
        }
      });
      
      if (replacedCount > 0) {
        alert(`Replaced ${replacedCount} occurrence(s)`);
      } else {
        alert('Text not found');
      }
    });
  };

  const getWordCount = () => {
    let wordCount = 0;
    editor.getEditorState().read(() => {
      const root = $getRoot();
      const text = root.getTextContent();
      wordCount = text.trim().split(/\s+/).filter(word => word.length > 0).length;
    });
    return wordCount;
  };

  const handleBlockTypeChange = (value) => {
    if (value === 'paragraph') formatParagraph();
    else if (value === 'h1') formatHeading('h1');
    else if (value === 'h2') formatHeading('h2');
    else if (value === 'h3') formatHeading('h3');
    else if (value === 'h4') formatHeading('h4');
    else if (value === 'h5') formatHeading('h5');
    else if (value === 'h6') formatHeading('h6');
    else if (value === 'quote') formatQuote();
    else if (value === 'code') formatCodeBlock();
  };

  return (
    <div className="border-b border-border bg-card sticky top-0 z-40 shadow-sm">
      {/* Row 1: History, Block Type, Document Tools */}
      <div className="px-4 py-2 flex items-center gap-2 border-b border-border flex-wrap">
        {/* Undo/Redo */}
        <button
          onClick={handleUndo}
          disabled={!canUndo}
          className="p-2 hover:bg-secondary rounded disabled:opacity-40 disabled:cursor-not-allowed text-foreground"
          title="Undo (Ctrl+Z)"
          type="button"
        >
          <Undo className="w-4 h-4" />
        </button>
        <button
          onClick={handleRedo}
          disabled={!canRedo}
          className="p-2 hover:bg-secondary rounded disabled:opacity-40 disabled:cursor-not-allowed text-foreground"
          title="Redo (Ctrl+Y)"
          type="button"
        >
          <Redo className="w-4 h-4" />
        </button>

        <div className="w-px h-6 bg-border mx-1" />

        {/* Block Type */}
        <select
          value={blockType}
          onChange={(e) => handleBlockTypeChange(e.target.value)}
          className="px-3 py-1.5 text-sm border border-border rounded hover:bg-secondary min-w-[140px] bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="paragraph">Normal Text</option>
          <option value="h1">Heading 1</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
          <option value="h4">Heading 4</option>
          <option value="h5">Heading 5</option>
          <option value="h6">Heading 6</option>
          <option value="quote">Quote</option>
          <option value="code">Code Block</option>
        </select>

        <div className="w-px h-6 bg-border mx-1" />

        {/* Document Tools */}
        <button
          onClick={() => setShowFindReplace(!showFindReplace)}
          className={`px-3 py-1.5 text-sm rounded transition-colors flex items-center gap-1 ${
            showFindReplace ? 'bg-primary/20 text-primary' : 'hover:bg-secondary text-foreground'
          }`}
          title="Find & Replace (Ctrl+F)"
          type="button"
        >
          <Search className="w-4 h-4" />
          Find
        </button>

        <button
          onClick={() => {
            const count = getWordCount();
            alert(`Word Count: ${count}`);
          }}
          className="px-3 py-1.5 text-sm hover:bg-secondary rounded text-foreground flex items-center gap-1"
          title="Word Count"
          type="button"
        >
          <FileType className="w-4 h-4" />
          Count
        </button>

        <button
          onClick={() => {
            editor.getEditorState().read(() => {
              const root = $getRoot();
              const text = root.getTextContent();
              navigator.clipboard.writeText(text);
              alert('Text copied to clipboard!');
            });
          }}
          className="px-3 py-1.5 text-sm hover:bg-secondary rounded text-foreground flex items-center gap-1"
          title="Copy as Plain Text"
          type="button"
        >
          <BookOpen className="w-4 h-4" />
          Copy
        </button>
      </div>

      {/* Find & Replace Panel */}
      {showFindReplace && (
        <div className="px-4 py-3 bg-secondary/50 border-b border-border flex items-center gap-2 flex-wrap">
          <input
            type="text"
            placeholder="Find..."
            value={findText}
            onChange={(e) => setFindText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleFind();
              }
            }}
            className="px-3 py-1.5 text-sm border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary min-w-[200px]"
          />
          <input
            type="text"
            placeholder="Replace with..."
            value={replaceText}
            onChange={(e) => setReplaceText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleReplace();
              }
            }}
            className="px-3 py-1.5 text-sm border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary min-w-[200px]"
          />
          <button
            onClick={handleFind}
            className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90"
            type="button"
          >
            Find
          </button>
          <button
            onClick={handleReplace}
            className="px-3 py-1.5 text-sm border border-border rounded hover:bg-secondary"
            type="button"
          >
            Replace
          </button>
          <button
            onClick={handleReplaceAll}
            className="px-3 py-1.5 text-sm border border-border rounded hover:bg-secondary"
            type="button"
          >
            Replace All
          </button>
          <button
            onClick={() => setShowFindReplace(false)}
            className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground"
            type="button"
          >
            Close
          </button>
        </div>
      )}

      {/* Row 2: Text Formatting, Colors, Alignment, Lists */}
      <div className="px-4 py-2 flex items-center gap-1 overflow-x-auto flex-wrap">
        {/* Text Formatting */}
        <button
          onClick={() => formatText('bold')}
          className={`p-2 rounded ${isBold ? 'bg-primary/20 text-primary' : 'hover:bg-secondary text-foreground'}`}
          title="Bold (Ctrl+B)"
          type="button"
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          onClick={() => formatText('italic')}
          className={`p-2 rounded ${isItalic ? 'bg-primary/20 text-primary' : 'hover:bg-secondary text-foreground'}`}
          title="Italic (Ctrl+I)"
          type="button"
        >
          <Italic className="w-4 h-4" />
        </button>
        <button
          onClick={() => formatText('underline')}
          className={`p-2 rounded ${isUnderline ? 'bg-primary/20 text-primary' : 'hover:bg-secondary text-foreground'}`}
          title="Underline (Ctrl+U)"
          type="button"
        >
          <Underline className="w-4 h-4" />
        </button>
        <button
          onClick={() => formatText('strikethrough')}
          className={`p-2 rounded ${isStrikethrough ? 'bg-primary/20 text-primary' : 'hover:bg-secondary text-foreground'}`}
          title="Strikethrough"
          type="button"
        >
          <Strikethrough className="w-4 h-4" />
        </button>
        <button
          onClick={() => formatText('code')}
          className={`p-2 rounded ${isCode ? 'bg-primary/20 text-primary' : 'hover:bg-secondary text-foreground'}`}
          title="Inline Code"
          type="button"
        >
          <Code className="w-4 h-4" />
        </button>

        <div className="w-px h-6 bg-border mx-2" />

        {/* Text Colors */}
        <span className="text-xs text-muted-foreground mr-1">Text:</span>
        {TEXT_COLORS.map((item) => (
          <button
            key={item.color}
            onClick={() => applyStyleText({ color: item.color })}
            className="w-6 h-6 rounded border border-border hover:scale-110 transition-transform"
            style={{ backgroundColor: item.color }}
            title={`Text ${item.label}`}
            type="button"
          />
        ))}

        <div className="w-px h-6 bg-border mx-2" />

        {/* Background Colors */}
        <span className="text-xs text-muted-foreground mr-1">BG:</span>
        {BACKGROUND_COLORS.map((item) => (
          <button
            key={item.color}
            onClick={() => applyStyleText({ 'background-color': item.color })}
            className="w-6 h-6 rounded border border-border hover:scale-110 transition-transform"
            style={{ 
              backgroundColor: item.color,
              backgroundImage: item.color === 'transparent' ? 'linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc), linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc)' : 'none',
              backgroundSize: item.color === 'transparent' ? '8px 8px' : 'auto',
              backgroundPosition: item.color === 'transparent' ? '0 0, 4px 4px' : 'initial'
            }}
            title={`Background ${item.label}`}
            type="button"
          />
        ))}

        <button
          onClick={clearFormatting}
          className="p-2 hover:bg-secondary rounded text-foreground ml-2"
          title="Clear Formatting"
          type="button"
        >
          <RemoveFormatting className="w-4 h-4" />
        </button>

        <div className="w-px h-6 bg-border mx-2" />

        {/* Alignment */}
        <button
          onClick={() => formatAlignment('left')}
          className="p-2 hover:bg-secondary rounded text-foreground"
          title="Align Left"
          type="button"
        >
          <AlignLeft className="w-4 h-4" />
        </button>
        <button
          onClick={() => formatAlignment('center')}
          className="p-2 hover:bg-secondary rounded text-foreground"
          title="Align Center"
          type="button"
        >
          <AlignCenter className="w-4 h-4" />
        </button>
        <button
          onClick={() => formatAlignment('right')}
          className="p-2 hover:bg-secondary rounded text-foreground"
          title="Align Right"
          type="button"
        >
          <AlignRight className="w-4 h-4" />
        </button>
        <button
          onClick={() => formatAlignment('justify')}
          className="p-2 hover:bg-secondary rounded text-foreground"
          title="Justify"
          type="button"
        >
          <AlignJustify className="w-4 h-4" />
        </button>

        <div className="w-px h-6 bg-border mx-2" />

        {/* Lists */}
        <button
          onClick={() => insertList('bullet')}
          className={`p-2 rounded ${blockType === 'bullet' ? 'bg-primary/20 text-primary' : 'hover:bg-secondary text-foreground'}`}
          title="Bullet List"
          type="button"
        >
          <List className="w-4 h-4" />
        </button>
        <button
          onClick={() => insertList('number')}
          className={`p-2 rounded ${blockType === 'number' ? 'bg-primary/20 text-primary' : 'hover:bg-secondary text-foreground'}`}
          title="Numbered List"
          type="button"
        >
          <ListOrdered className="w-4 h-4" />
        </button>
        <button
          onClick={() => insertList('check')}
          className={`p-2 rounded ${blockType === 'check' ? 'bg-primary/20 text-primary' : 'hover:bg-secondary text-foreground'}`}
          title="Check List"
          type="button"
        >
          <CheckSquare className="w-4 h-4" />
        </button>

        <div className="w-px h-6 bg-border mx-2" />

        {/* Quote */}
        <button
          onClick={formatQuote}
          className={`p-2 rounded ${blockType === 'quote' ? 'bg-primary/20 text-primary' : 'hover:bg-secondary text-foreground'}`}
          title="Quote Block"
          type="button"
        >
          <Quote className="w-4 h-4" />
        </button>
        
        {/* Code Block */}
        <button
          onClick={formatCodeBlock}
          className={`p-2 rounded ${blockType === 'code' ? 'bg-primary/20 text-primary' : 'hover:bg-secondary text-foreground'}`}
          title="Code Block"
          type="button"
        >
          <FileCode className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}