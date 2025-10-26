"use client";

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
import { HeadingNode, QuoteNode, $isHeadingNode } from '@lexical/rich-text';
import { ListNode, ListItemNode } from '@lexical/list';
import { LinkNode } from '@lexical/link';
import { CodeNode } from '@lexical/code';
import { $getRoot, $createParagraphNode, $createTextNode } from 'lexical';
import { $generateNodesFromDOM, $generateHtmlFromNodes } from '@lexical/html';
import CompleteToolbar from '../components/doc-editor/Toolbar';
import EditorTopHeader from '../components/doc-editor/EditorTopHeader';
import ChatDrawer from '../components/doc-editor/ChatDrawer';
import ShareModal from '../components/doc-editor/ShareModal';
import AIAssistantDrawer from '../components/doc-editor/AIAssistantDrawer';
import TableOfContents from '../components/doc-editor/TableOfContents';
import { useApp } from '../context/AppProvider';
import FirestoreService from '../services';
import CommentsService from '../services/commentsService';
import {
  getTemplate,
  DOCUMENT_TYPES
} from '../utils/documentTemplates';

// ============================================================================
// TABLE OF CONTENTS PLUGIN - EXTRACTS HEADINGS
// ============================================================================
function TableOfContentsPlugin({ onChange, headingIdMapRef }) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    // Extract headings function
    const extractHeadings = () => {
      editor.getEditorState().read(() => {
        const root = $getRoot();
        const headings = [];
        const stack = [{ level: 0, children: headings }];
        const newHeadingIdMap = new Map();

        root.getChildren().forEach((node, nodeIndex) => {
          if ($isHeadingNode(node)) {
            const tag = node.getTag();
            const level = parseInt(tag.substring(1));
            const text = node.getTextContent();
            const id = `heading-${nodeIndex}-${text.replace(/\s+/g, '-').toLowerCase()}`;
            const nodeKey = node.getKey();

            // Store mapping of ID to node key externally
            newHeadingIdMap.set(id, nodeKey);

            const heading = {
              id,
              level,
              text,
              children: [],
              nodeKey
            };

            // Build hierarchy
            while (stack.length > 1 && stack[stack.length - 1].level >= level) {
              stack.pop();
            }

            stack[stack.length - 1].children.push(heading);
            stack.push({ level, children: heading.children });
          }
        });

        // Update the ref with the new mapping
        if (headingIdMapRef) {
          headingIdMapRef.current = newHeadingIdMap;
        }

        onChange(headings);
      });
    };

    // Extract headings immediately on mount
    extractHeadings();

    // Register update listener for changes
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const root = $getRoot();
        const headings = [];
        const stack = [{ level: 0, children: headings }];
        const newHeadingIdMap = new Map();

        root.getChildren().forEach((node, nodeIndex) => {
          if ($isHeadingNode(node)) {
            const tag = node.getTag();
            const level = parseInt(tag.substring(1));
            const text = node.getTextContent();
            const id = `heading-${nodeIndex}-${text.replace(/\s+/g, '-').toLowerCase()}`;
            const nodeKey = node.getKey();

            // Store mapping of ID to node key externally
            newHeadingIdMap.set(id, nodeKey);

            const heading = {
              id,
              level: tag,
              text,
              children: [],
              nodeKey
            };

            // Build hierarchy
            while (stack.length > 1 && stack[stack.length - 1].level >= level) {
              stack.pop();
            }

            stack[stack.length - 1].children.push(heading);
            stack.push({ level, children: heading.children });
          }
        });

        // Update the ref with the new mapping
        if (headingIdMapRef) {
          headingIdMapRef.current = newHeadingIdMap;
        }

        onChange(headings);
      });
    });
  }, [editor, onChange, headingIdMapRef]);

  return null;
}

// ============================================================================
// SCROLL TO HEADING PLUGIN
// ============================================================================
function ScrollToHeadingPlugin({ targetHeadingId, onScrollComplete, headingIdMapRef }) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (!targetHeadingId || !headingIdMapRef?.current) return;

    // Get the node key from the map
    const nodeKey = headingIdMapRef.current.get(targetHeadingId);

    if (nodeKey) {
      const targetElement = editor.getElementByKey(nodeKey);

      if (targetElement) {
        targetElement.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
          inline: 'nearest'
        });

        if (onScrollComplete) {
          setTimeout(onScrollComplete, 600);
        }
      }
    }
  }, [targetHeadingId, editor, onScrollComplete, headingIdMapRef]);

  return null;
}

// ============================================================================
// AUTO-SAVE HOOK - DEBOUNCED
// ============================================================================
function useAutoSave(callback, delay = 10000) {
  const timeoutRef = useRef(null);
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const trigger = useCallback(() => {
    // Clear any existing timeout (user is still typing)
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout - save will happen after delay if no more changes
    timeoutRef.current = setTimeout(() => {
      callbackRef.current();
    }, delay);
  }, [delay]);

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return { trigger, cancel };
}

// ============================================================================
// CONTENT SETTER PLUGIN
// ============================================================================
function SetContentPlugin({ content, shouldUpdate, isHtml }) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (content && shouldUpdate) {
      editor.update(() => {
        const root = $getRoot();
        root.clear();

        if (isHtml) {
          try {
            const htmlContent = content.includes('<html')
              ? content
              : `<!DOCTYPE html><html><body>${content}</body></html>`;

            const parser = new DOMParser();
            const dom = parser.parseFromString(htmlContent, 'text/html');
            const nodes = $generateNodesFromDOM(editor, dom);

            if (nodes && nodes.length > 0) {
              nodes.forEach(node => {
                if (node) {
                  root.append(node);
                }
              });
            }
          } catch (error) {
            console.error('Error parsing HTML:', error);
            const paragraph = $createParagraphNode();
            const textNode = $createTextNode(content);
            paragraph.append(textNode);
            root.append(paragraph);
          }
        } else {
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

// ============================================================================
// MAIN DOCUMENT EDITOR
// ============================================================================
export default function DocumentEditor({
  suiteId: propSuiteId,
  sprintId: propSprintId = null,
  existingDocument = null,
  onSaveSuccess,
  onCancel
}) {
  const { currentUser, activeSuite, actions } = useApp();
  const suiteId = propSuiteId || activeSuite?.id;
  const sprintId = propSprintId;

  // Ref to store heading ID to node key mapping
  const headingIdMapRef = useRef(new Map());
  const commentsServiceRef = useRef(null);

  useEffect(() => {
    if (!commentsServiceRef.current) {
      commentsServiceRef.current = new CommentsService(FirestoreService);
    }
  }, []);

  // Document state
  const [title, setTitle] = useState(existingDocument?.title || 'Untitled Document');
  const [type, setType] = useState(existingDocument?.type || DOCUMENT_TYPES.GENERAL);
  const [tags, setTags] = useState(existingDocument?.tags || []);
  const [content, setContent] = useState('');
  const [metadata, setMetadata] = useState(existingDocument?.metadata || {
    status: 'draft',
    metrics: {},
    version: '1.0'
  });

  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [aiAssistantOpen, setAiAssistantOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [documentUrl, setDocumentUrl] = useState(existingDocument?.url || '');

  // Table of Contents state
  const [headings, setHeadings] = useState([]);
  const [targetHeadingId, setTargetHeadingId] = useState(null);
  const [tocCollapsed, setTocCollapsed] = useState(false);

  // Template state
  const [templateContent, setTemplateContent] = useState('');
  const [shouldUpdateContent, setShouldUpdateContent] = useState(false);
  const [isHtmlContent, setIsHtmlContent] = useState(false);

  // Dialog state for template confirmation
  const [templateDialog, setTemplateDialog] = useState({
    isOpen: false,
    newType: null
  });

  const initialConfig = {
    namespace: 'DocumentEditor',
    nodes: [HeadingNode, QuoteNode, ListNode, ListItemNode, LinkNode, CodeNode],
    theme: {
      heading: {
        h1: 'text-4xl font-bold my-6 scroll-mt-8',
        h2: 'text-3xl font-bold my-5 scroll-mt-8',
        h3: 'text-2xl font-bold my-4 scroll-mt-8',
        h4: 'text-xl font-bold my-3 scroll-mt-8',
        h5: 'text-lg font-bold my-2 scroll-mt-8',
        h6: 'text-base font-bold my-2 scroll-mt-8'
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

  const handleHeadingsChange = useCallback((newHeadings) => {
    setHeadings(newHeadings);
  }, []);

  const handleHeadingClick = useCallback((headingId) => {
    setTargetHeadingId(headingId);
  }, []);

  const handleScrollComplete = useCallback(() => {
    setTargetHeadingId(null);
  }, []);

  const performSave = async () => {
    if (!title.trim()) {
      console.warn('Cannot save: title is empty');
      return;
    }

    setIsSaving(true);

    try {
      // Prepare metadata-only data for Firestore
      const firestoreMetadata = {
        title,
        type,
        tags,
        metadata: {
          ...metadata,
          lastModified: new Date().toISOString(),
          modifiedBy: currentUser?.uid
        }
      };

      let result;

      if (existingDocument) {
        console.log('📝 Updating existing document:', existingDocument.id);
        // UPDATE: Pass content as separate parameter
        result = await actions.documents.updateDocument(
          existingDocument.id,
          firestoreMetadata,  // metadata updates
          suiteId,
          sprintId,
          content  // content as 5th parameter
        );
      } else {
        console.log('📄 Creating new document');
        // CREATE: Pass content as separate parameter
        result = await actions.documents.createDocument(
          suiteId,
          firestoreMetadata,  // metadata only
          sprintId,
          content  // content as 4th parameter
        );
      }

      console.log('💾 Save result:', result);

      if (result.success) {
        // Update local state with the saved document info
        if (result.data?.url) {
          setDocumentUrl(result.data.url);
        }

        setLastSaved(new Date());
        setHasUnsavedChanges(false);

        console.log('✅ Document saved successfully');

        actions.ui.showNotification?.({
          id: `save-success-${Date.now()}`,
          type: 'success',
          message: `Document "${title}" saved successfully`,
          duration: 3000,
        });

        // Call onSaveSuccess callback if provided
        if (onSaveSuccess && result.data) {
          onSaveSuccess(result.data);
        }
      } else {
        console.error('❌ Save failed:', result.error);
        actions.ui.showNotification?.({
          id: `save-error-${Date.now()}`,
          type: 'error',
          message: `Failed to save: ${result.error?.message || 'Unknown error'}`,
          duration: 5000,
        });
      }
    } catch (err) {
      console.error('💥 Save exception:', err);
      actions.ui.showNotification?.({
        id: `save-exception-${Date.now()}`,
        type: 'error',
        message: `Failed to save document: ${err.message}`,
        duration: 5000,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const { trigger: triggerAutoSave, cancel: cancelAutoSave } = useAutoSave(performSave, 10000);

  // Trigger auto-save when content or metadata changes
  useEffect(() => {
    if (hasUnsavedChanges) {
      triggerAutoSave();
    }

    return () => {
      cancelAutoSave();
    };
  }, [content, metadata, hasUnsavedChanges, triggerAutoSave, cancelAutoSave]);

  const handleApplyTemplate = (template) => {
    setTitle(template.title);
    setMetadata(template.metadata || {});

    setTemplateContent(template.html);
    setIsHtmlContent(true);
    setShouldUpdateContent(true);
    setHasUnsavedChanges(true);

    // Force TOC to refresh after template is applied
    setTimeout(() => {
      setShouldUpdateContent(false);
    }, 300);
  };

  const handleTypeChange = (newType) => {
    if (type !== newType) {
      setTemplateDialog({
        isOpen: true,
        newType: newType
      });
    } else {
      setType(newType);
    }
  };

  const handleConfirmTemplateApply = () => {
    const template = getTemplate(templateDialog.newType);
    handleApplyTemplate(template);
    setType(templateDialog.newType);
    setTemplateDialog({ isOpen: false, newType: null });
  };

  const handleCancelTemplateApply = () => {
    setType(templateDialog.newType);
    setTemplateDialog({ isOpen: false, newType: null });
  };

  const handleStatusChange = (newStatus) => {
    setMetadata(prev => ({
      ...prev,
      status: newStatus
    }));
    setHasUnsavedChanges(true);
  };

  const handleExport = async (format) => {
    if (!existingDocument?.docId) {
      actions.ui.showNotification?.({
        id: `export-warning-${Date.now()}`,
        type: 'warning',
        message: 'Document must be saved before exporting',
        duration: 4000,
      });
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

      actions.ui.showNotification?.({
        id: `export-success-${Date.now()}`,
        type: 'success',
        message: `Document exported as ${format.toUpperCase()}`,
        duration: 3000,
      });
    } catch (err) {
      console.error('Export failed:', err);
      actions.ui.showNotification?.({
        id: `export-error-${Date.now()}`,
        type: 'error',
        message: 'Export failed. Please try again.',
        duration: 5000,
      });
    }
  };

  const handleShare = async (shareConfig) => {
    if (!existingDocument?.id) {
      actions.ui.showNotification?.({
        id: `share-warning-${Date.now()}`,
        type: 'warning',
        message: 'Document must be saved before sharing',
        duration: 4000,
      });
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
        actions.ui.showNotification?.({
          id: `share-success-${Date.now()}`,
          type: 'success',
          message: 'Document shared successfully',
          duration: 3000,
        });
      } else {
        actions.ui.showNotification?.({
          id: `share-error-${Date.now()}`,
          type: 'error',
          message: 'Failed to share document',
          duration: 5000,
        });
      }
    } catch (err) {
      console.error('Share failed:', err);
      actions.ui.showNotification?.({
        id: `share-exception-${Date.now()}`,
        type: 'error',
        message: 'Failed to share document',
        duration: 5000,
      });
    }
  };

  // MUTUAL EXCLUSIVITY HANDLERS
  const handleToggleChat = () => {
    if (aiAssistantOpen) {
      setAiAssistantOpen(false);
    }
    setChatOpen(!chatOpen);
  };

  const handleToggleAI = () => {
    if (chatOpen) {
      setChatOpen(false);
    }
    setAiAssistantOpen(!aiAssistantOpen);
  };

  const handleToggleTOC = () => {
    setTocCollapsed(!tocCollapsed);
  };

  // Handle content insertion from AI Assistant
  const handleInsertContent = (content) => {
    console.log('Inserting content:', content);
    actions.ui.showNotification?.({
      id: `insert-success-${Date.now()}`,
      type: 'success',
      message: 'Content inserted successfully',
      duration: 3000,
    });
  };

  const handleReplaceContent = (content) => {
    setTemplateContent(content);
    setIsHtmlContent(true);
    setShouldUpdateContent(true);
    setHasUnsavedChanges(true);

    setTimeout(() => {
      setShouldUpdateContent(false);
    }, 200);

    actions.ui.showNotification?.({
      id: `replace-success-${Date.now()}`,
      type: 'success',
      message: 'Document content replaced',
      duration: 3000,
    });
  };

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <LexicalComposer initialConfig={initialConfig}>
        {/* Fixed Header */}
        <EditorTopHeader
          title={title}
          onTitleChange={setTitle}
          type={type}
          onTypeChange={handleTypeChange}
          isSaving={isSaving}
          lastSaved={lastSaved}
          hasUnsavedChanges={hasUnsavedChanges}
          onExport={handleExport}
          onToggleChat={handleToggleChat}
          onToggleAI={handleToggleAI}
          onToggleShare={() => setShareOpen(true)}
          onToggleLinking={handleToggleTOC}
          chatOpen={chatOpen}
          aiAssistantOpen={aiAssistantOpen}
          linkingPanelOpen={!tocCollapsed}
          documentUrl={documentUrl}
          onApplyTemplate={handleApplyTemplate}
          documentStatus={metadata.status}
          onStatusChange={handleStatusChange}
          showLinkingToggle={true}
        />

        {/* Fixed Toolbar */}
        <CompleteToolbar />

        {/* Main Content Area - Fixed Height with Flex */}
        <div className="flex-1 flex overflow-hidden transition-none">
          {/* Scrollable Content Wrapper */}
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-7xl mx-auto py-8 px-6">
              <div className="flex gap-8 items-start">
                {/* Table of Contents - Suspended next to document */}
                <TableOfContents
                  headings={headings}
                  onHeadingClick={handleHeadingClick}
                  isCollapsed={tocCollapsed}
                  onToggleCollapse={handleToggleTOC}
                />

                {/* Editor Area */}
                <div className="flex-1 min-w-0">
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
                      shouldUpdate={shouldUpdateContent || (!existingDocument && !templateContent)}
                      isHtml={isHtmlContent || (existingDocument?.content && existingDocument.content.includes('<'))}
                    />
                    <TableOfContentsPlugin
                      onChange={handleHeadingsChange}
                      headingIdMapRef={headingIdMapRef}
                    />
                    <ScrollToHeadingPlugin
                      targetHeadingId={targetHeadingId}
                      onScrollComplete={handleScrollComplete}
                      headingIdMapRef={headingIdMapRef}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Drawer - Chat OR AI Assistant (Fixed with own scroll) */}
          {chatOpen && (
            <div className="w-[25%] min-w-[320px] h-full flex-shrink-0">
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

          {aiAssistantOpen && (
            <div className="w-[25%] min-w-[320px] h-full flex-shrink-0">
              <AIAssistantDrawer
                isOpen={aiAssistantOpen}
                onClose={() => setAiAssistantOpen(false)}
                documentContent={content}
                documentTitle={title}
                documentType={type}
                onInsertContent={handleInsertContent}
                onReplaceContent={handleReplaceContent}
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

      {/* Close Editor Button */}
      {onCancel && !chatOpen && !aiAssistantOpen && (
        <div className="fixed bottom-6 right-6 z-40">
          <button
            onClick={onCancel}
            className="px-6 py-3 bg-card text-foreground border border-border rounded-lg hover:bg-secondary shadow-theme-lg transition-colors"
          >
            Close Editor
          </button>
        </div>
      )}

      {/* Template Confirmation Dialog */}
      {templateDialog.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card border border-border rounded-lg shadow-lg max-w-md w-full mx-4 p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Apply Document Template?
              </h3>
              <p className="text-sm text-muted-foreground">
                Do you want to apply the template for this document type? This will replace your current content.
              </p>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={handleCancelTemplateApply}
                className="px-4 py-2 text-sm border border-border rounded-md hover:bg-secondary transition-colors"
              >
                No, Keep Current Content
              </button>
              <button
                onClick={handleConfirmTemplateApply}
                className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                Yes, Apply Template
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}