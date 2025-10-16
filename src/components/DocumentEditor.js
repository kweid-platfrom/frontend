'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { ListNode, ListItemNode } from '@lexical/list';
import { LinkNode } from '@lexical/link';
import { CodeNode } from '@lexical/code';
import { $getRoot, $createParagraphNode, $createTextNode } from 'lexical';
import { $generateNodesFromDOM, $generateHtmlFromNodes } from '@lexical/html';
import CompleteToolbar from '../components/doc-editor/Toolbar';
import EditorTopHeader from '../components/doc-editor/EditorTopHeader';
import ChatDrawer from '../components/doc-editor/ChatDrawer';
import ShareModal from '../components/doc-editor/ShareModal';
import { useApp } from '../context/AppProvider';
import FirestoreService from '../services';
import CommentsService from '../services/commentsService'

// Auto-save hook
function useAutoSave(callback, delay = 10000) {
  const timeoutRef = useRef(null);
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const trigger = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      callbackRef.current();
    }, delay);
  }, [delay]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return trigger;
}

// Content setter plugin
function SetContentPlugin({ content, shouldUpdate, isHtml }) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (content && shouldUpdate) {
      editor.update(() => {
        const root = $getRoot();
        root.clear();

        if (isHtml) {
          // Parse HTML content
          const parser = new DOMParser();
          const dom = parser.parseFromString(content, 'text/html');
          const nodes = $generateNodesFromDOM(editor, dom);
          root.append(...nodes);
        } else {
          // Plain text content
          const paragraph = $createParagraphNode();
          const textNode = $createTextNode(content);
          paragraph.append(textNode);
          root.append(paragraph);
        }
      });
    }
  }, [content, shouldUpdate, isHtml, editor]);

  return null;
}

// Main Document Editor
export default function DocumentEditor({
  suiteId: propSuiteId,
  sprintId: propSprintId = null,
  existingDocument = null,
  onSaveSuccess,
  onCancel
}) {
  // Get context
  const { currentUser, activeSuite, actions } = useApp();

  // Use suite from context if not provided
  const suiteId = propSuiteId || activeSuite?.id;
  const sprintId = propSprintId;

  // Initialize CommentsService
  const commentsServiceRef = useRef(null);

  useEffect(() => {
    if (!commentsServiceRef.current) {
      commentsServiceRef.current = new CommentsService(FirestoreService);
    }
  }, []);
  const [title, setTitle] = useState(existingDocument?.title || 'Untitled Document');
  const [type, setType] = useState(existingDocument?.type || 'general');
  const [tags, setTags] = useState(existingDocument?.tags || []);
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [documentUrl, setDocumentUrl] = useState(existingDocument?.url || '');
  const [templateContent, setTemplateContent] = useState('');
  const [shouldUpdateContent, setShouldUpdateContent] = useState(false);
  const [isHtmlContent, setIsHtmlContent] = useState(false);

  const initialConfig = {
    namespace: 'DocumentEditor',
    nodes: [HeadingNode, QuoteNode, ListNode, ListItemNode, LinkNode, CodeNode],
    theme: {
      heading: {
        h1: 'text-4xl font-bold my-6',
        h2: 'text-3xl font-bold my-5',
        h3: 'text-2xl font-bold my-4'
      },
      list: {
        ul: 'list-disc list-inside my-3 ml-4',
        ol: 'list-decimal list-inside my-3 ml-4',
        listitem: 'ml-6 my-1'
      },
      quote: 'border-l-4 border-primary pl-4 italic my-4 text-muted-foreground',
      link: 'text-primary underline hover:text-primary/80 cursor-pointer',
      text: {
        bold: 'font-bold',
        italic: 'italic',
        underline: 'underline',
        strikethrough: 'line-through',
        code: 'bg-secondary px-2 py-1 rounded font-mono text-sm text-destructive'
      },
      code: 'bg-muted text-muted-foreground font-mono text-sm p-4 rounded-lg my-4 overflow-x-auto',
      paragraph: 'my-2'
    },
    onError: (error) => console.error('Lexical Error:', error)
  };

  const handleChange = useCallback((editorState, editor) => {
    editorState.read(() => {
      const htmlString = $generateHtmlFromNodes(editor, null);
      setContent(htmlString);
      setHasUnsavedChanges(true);
    });
  }, []);

  const performSave = async () => {
    if (!title.trim()) return;

    // For new documents, need at least some content
    if (!existingDocument && !content.trim()) return;

    setIsSaving(true);

    try {
      console.log('DocumentEditor.performSave - Parameters:', {
        suiteId,
        sprintId,
        title,
        hasContent: !!content,
        isUpdate: !!existingDocument
      });

      // FIXED: Correct parameter order - suiteId FIRST, then documentData, then sprintId
      const result = existingDocument
        ? await actions.documents.updateDocument(
          existingDocument.id,
          { title, content, type, tags },
          suiteId,
          sprintId
        )
        : await actions.documents.createDocument(
          suiteId,  // ✅ suiteId FIRST
          { title, content, type, tags },  // ✅ documentData SECOND
          sprintId  // ✅ sprintId THIRD
        );

      console.log('Save result:', {
        success: result.success,
        hasData: !!result.data,
        error: result.error
      });

      if (result.success) {
        setDocumentUrl(result.data.url || result.data.googleDoc?.url || '');
        setLastSaved(new Date());
        setHasUnsavedChanges(false);
        if (!existingDocument && onSaveSuccess) {
          onSaveSuccess(result.data);
        }
      } else {
        console.error('Save failed:', result.error);
        alert(`Failed to save: ${result.error?.message || result.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Save error:', err);

      // Show user-friendly error message
      if (err.code === 'permission-denied') {
        alert('Permission denied. Please check your Firestore security rules.');
      } else {
        alert(`Failed to save document: ${err.message}`);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const triggerAutoSave = useAutoSave(performSave, 10000);

  useEffect(() => {
    if (hasUnsavedChanges) {
      triggerAutoSave();
    }
  }, [content, hasUnsavedChanges, triggerAutoSave]);

  const handleApplyTemplate = (template) => {
    setTitle(template.title);
    setTemplateContent(template.html);
    setIsHtmlContent(true);
    setShouldUpdateContent(true);
    setHasUnsavedChanges(true);

    // Reset the update flag after a short delay
    setTimeout(() => {
      setShouldUpdateContent(false);
      setIsHtmlContent(false);
    }, 100);
  };

  const handleExport = async (format) => {
    if (!existingDocument?.docId) {
      return;
    }

    try {
      const response = await fetch(`/api/docs/export?docId=${existingDocument.docId}&format=${format}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  const handleShare = async (shareConfig) => {
    if (!existingDocument?.id) {
      return;
    }

    try {
      const response = await fetch('/api/documents/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId: existingDocument.id,
          suiteId,
          sprintId,
          shareConfig
        })
      });

      const result = await response.json();
      if (result.success) {
        setShareOpen(false);
      }
    } catch (err) {
      console.error('Share failed:', err);
    }
  };

  return (
    <div className="h-full flex flex-col bg-background relative">
      <LexicalComposer initialConfig={initialConfig}>
        {/* Top Header */}
        <EditorTopHeader
          title={title}
          onTitleChange={setTitle}
          type={type}
          onTypeChange={setType}
          isSaving={isSaving}
          lastSaved={lastSaved}
          onExport={handleExport}
          onToggleChat={() => setChatOpen(!chatOpen)}
          onToggleShare={() => setShareOpen(true)}
          chatOpen={chatOpen}
          documentUrl={documentUrl}
          onApplyTemplate={handleApplyTemplate}
        />

        {/* Complete Toolbar */}
        <CompleteToolbar />

        {/* Main Content Area - Split Layout */}
        <div className="flex-1 overflow-hidden flex">
          {/* Editor Area */}
          <div
            className={`transition-all duration-300 ease-in-out overflow-auto ${chatOpen ? 'w-[75%]' : 'w-full'
              }`}
          >
            <div className="max-w-5xl mx-auto py-8 px-6">
              <div className="bg-card rounded-lg shadow-theme-sm min-h-[900px] p-16 relative">
                <RichTextPlugin
                  contentEditable={
                    <ContentEditable
                      className="min-h-[850px] outline-none focus:outline-none"
                      style={{
                        fontSize: '16px',
                        lineHeight: '1.8',
                        fontFamily: 'Arial, sans-serif'
                      }}
                    />
                  }
                  placeholder={
                    <div className="absolute top-16 left-16 text-muted-foreground pointer-events-none text-base">
                      Start writing...
                    </div>
                  }
                  ErrorBoundary={LexicalErrorBoundary}
                />
                <HistoryPlugin />
                <ListPlugin />
                <LinkPlugin />
                <AutoFocusPlugin />
                <OnChangePlugin onChange={handleChange} ignoreSelectionChange />
                <SetContentPlugin
                  content={templateContent || existingDocument?.content}
                  shouldUpdate={shouldUpdateContent || !existingDocument}
                  isHtml={isHtmlContent}
                />
              </div>
            </div>
          </div>

          {/* Chat Drawer Area */}
          {chatOpen && (
            <div className="w-[25%] min-w-[320px] border-l border-border bg-card overflow-hidden animate-slide-in">
              <ChatDrawer
                isOpen={chatOpen}
                onClose={() => setChatOpen(false)}
                documentId={existingDocument?.id}
                suiteId={suiteId}
                sprintId={sprintId}
                tags={tags}
                onAddTag={(tag) => setTags([...tags, tag])}
                onRemoveTag={(tag) => setTags(tags.filter(t => t !== tag))}
                currentUser={{
                  id: currentUser?.uid,
                  name: currentUser?.displayName || currentUser?.name || 'You',
                  avatar: currentUser?.photoURL || null
                }}
                commentsService={commentsServiceRef.current}
              />
            </div>
          )}
        </div>
      </LexicalComposer>

      {/* Share Modal */}
      <ShareModal
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
        documentTitle={title}
        onShare={handleShare}
      />

      {/* Close Button (if needed) */}
      {onCancel && !chatOpen && (
        <div className="fixed bottom-6 right-6 z-40">
          <button
            onClick={onCancel}
            className="px-6 py-3 bg-card text-foreground border border-border rounded-lg hover:bg-secondary shadow-theme-lg transition-colors"
          >
            Close Editor
          </button>
        </div>
      )}

      <style jsx>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}