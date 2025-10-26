import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Send, 
  Loader2, 
  Sparkles,
  FileText,
  Lightbulb,
  Edit3,
  List,
  CheckCircle2,
  Wand2,
  ChevronDown,
  ChevronUp,
  Copy,
  Check
} from 'lucide-react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getRoot } from 'lexical';
import { $generateNodesFromDOM } from '@lexical/html';
import { useAI } from '@/context/AIContext';

export default function AIAssistantDrawer({ 
  isOpen, 
  onClose,
  documentTitle = 'Untitled Document',
  documentType = 'document',
  onInsertContent,
  onReplaceContent
}) {
  const [editor] = useLexicalComposerContext();
  
  const {
    checkGrammar,
    generatePlainTextContent,
    isCheckingGrammar,
    isInitialized,
    isHealthy,
    error: aiError,
    clearError
  } = useAI();

  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Hi! I'm your AI writing assistant. I can help you with:

• **Summarize** - Create concise summaries
• **Explain** - Break down complex concepts  
• **Improve Writing** - Enhance clarity and professionalism
• **Bullet Points** - Convert to structured lists
• **Grammar Check** - Fix errors and typos
• **Generate Content** - Create new sections or documents

What would you like me to help with?`,
      timestamp: new Date().toISOString()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [showQuickActions, setShowQuickActions] = useState(true);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    if (aiError) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `⚠️ ${aiError}`,
        isError: true,
        timestamp: new Date().toISOString()
      }]);
      clearError();
    }
  }, [aiError, clearError]);

  // Get plain text content from editor
  const getEditorContent = () => {
    let content = '';
    editor.getEditorState().read(() => {
      const root = $getRoot();
      content = root.getTextContent();
    });
    return content;
  };

  // Insert HTML content into editor at cursor position
  const insertIntoEditor = (htmlContent) => {
    editor.update(() => {
      const parser = new DOMParser();
      const htmlDoc = htmlContent.includes('<html') 
        ? htmlContent 
        : `<!DOCTYPE html><html><body>${htmlContent}</body></html>`;
      
      const dom = parser.parseFromString(htmlDoc, 'text/html');
      const nodes = $generateNodesFromDOM(editor, dom);
      
      const selection = editor._editorState._selection;
      
      if (selection) {
        const anchor = selection.anchor;
        const focus = selection.focus;
        
        if (anchor && focus) {
          const anchorNode = anchor.getNode();
          nodes.forEach(node => {
            if (node) {
              anchorNode.getParentOrThrow().insertAfter(node);
            }
          });
        }
      } else {
        const root = $getRoot();
        nodes.forEach(node => {
          if (node) {
            root.append(node);
          }
        });
      }
    });

    if (onInsertContent) {
      onInsertContent(htmlContent);
    }
  };

  // Replace entire editor content
  const replaceEditorContent = (htmlContent) => {
    editor.update(() => {
      const root = $getRoot();
      root.clear();

      const parser = new DOMParser();
      const htmlDoc = htmlContent.includes('<html') 
        ? htmlContent 
        : `<!DOCTYPE html><html><body>${htmlContent}</body></html>`;
      
      const dom = parser.parseFromString(htmlDoc, 'text/html');
      const nodes = $generateNodesFromDOM(editor, dom);

      if (nodes && nodes.length > 0) {
        nodes.forEach(node => {
          if (node) {
            root.append(node);
          }
        });
      }
    });

    if (onReplaceContent) {
      onReplaceContent(htmlContent);
    }
  };

  const quickActions = [
    {
      icon: FileText,
      label: 'Summarize',
      description: 'Create a concise summary',
      prompt: `Please create a concise summary of this document`,
      needsContent: true,
      action: 'summarize',
      showActions: false
    },
    {
      icon: Lightbulb,
      label: 'Explain',
      description: 'Simplify complex concepts',
      prompt: `Please explain the key concepts in simple terms`,
      needsContent: true,
      action: 'explain',
      showActions: false
    },
    {
      icon: Edit3,
      label: 'Improve',
      description: 'Enhance writing quality',
      prompt: `Please review and suggest improvements for clarity and professionalism`,
      needsContent: true,
      action: 'improve',
      showActions: true
    },
    {
      icon: List,
      label: 'Bullet Points',
      description: 'Convert to structured list',
      prompt: `Convert the main points into a bulleted list`,
      needsContent: true,
      action: 'bullets',
      showActions: true
    },
    {
      icon: CheckCircle2,
      label: 'Grammar',
      description: 'Check for errors',
      prompt: 'Check grammar and spelling',
      needsContent: true,
      action: 'grammar',
      showActions: true
    },
    {
      icon: Wand2,
      label: 'Generate',
      description: 'Create new content',
      prompt: `Create a new ${documentType} document with appropriate structure`,
      needsContent: false,
      action: 'generate',
      showActions: true
    }
  ];

  const handleQuickAction = async (action) => {
    const currentContent = getEditorContent();
    
    if (action.needsContent && !currentContent.trim()) {
      addMessage('assistant', 'Please add some content to your document first before using this action.', true);
      return;
    }

    if (action.action === 'grammar') {
      await handleGrammarCheck(currentContent, action.showActions);
    } else {
      await handleGenerateContent(action.prompt, action.action, currentContent, action.showActions);
    }
  };

  const handleGrammarCheck = async (content, showActions = true) => {
    if (!content || !content.trim()) {
      addMessage('assistant', 'Please add some content to check for grammar.', true);
      return;
    }

    addMessage('user', '🔍 Check grammar and spelling');
    setIsProcessing(true);

    try {
      const result = await checkGrammar(content, {
        includeStyleSuggestions: true,
        checkSpelling: true
      });

      if (result.success && result.data) {
        const { issues = [], correctedText, summary, overallScore } = result.data;
        
        let responseContent = '';
        
        if (issues.length === 0) {
          responseContent = '✅ Great! No grammar or spelling issues found.';
        } else {
          responseContent = `📝 Grammar Check Results${overallScore ? ` (Score: ${overallScore}/100)` : ''}\n\n`;
          responseContent += `Found ${issues.length} issue${issues.length > 1 ? 's' : ''}:\n\n`;
          
          issues.slice(0, 10).forEach((issue, idx) => {
            responseContent += `${idx + 1}. **${issue.type}** (${issue.severity}): "${issue.original}" → "${issue.suggestion}"\n   ${issue.explanation}\n\n`;
          });

          if (issues.length > 10) {
            responseContent += `\n...and ${issues.length - 10} more issues.`;
          }

          if (summary) {
            responseContent += `\n\n📊 Summary:\n`;
            responseContent += `- Total Issues: ${summary.totalIssues}\n`;
            responseContent += `- Errors: ${summary.errors}\n`;
            responseContent += `- Warnings: ${summary.warnings}\n`;
            responseContent += `- Suggestions: ${summary.suggestions}`;
          }
        }

        addMessage('assistant', responseContent, false, {
          hasActions: showActions && correctedText && issues.length > 0,
          generatedContent: correctedText
        });
      } else {
        throw new Error(result.error || 'Grammar check failed');
      }
    } catch (error) {
      console.error('Grammar check error:', error);
      addMessage('assistant', `Failed to check grammar: ${error.message}`, true);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGenerateContent = async (userPrompt, actionType, currentContent, showActions = true) => {
    addMessage('user', userPrompt);
    setIsProcessing(true);

    try {
      const prompt = buildDocumentPrompt(userPrompt, actionType, currentContent);
      
      const result = await generatePlainTextContent(prompt, {
        temperature: actionType === 'summarize' ? 0.3 : actionType === 'explain' ? 0.4 : 0.7,
        maxTokens: 2000
      });

      if (result.success && result.data) {
        const content = result.data.trim();
        
        addMessage('assistant', content, false, {
          hasActions: showActions,
          generatedContent: content
        });
      } else {
        throw new Error(result.error || 'Failed to generate content');
      }
    } catch (error) {
      console.error('Generate content error:', error);
      addMessage('assistant', `Failed to generate content: ${error.message}`, true);
    } finally {
      setIsProcessing(false);
    }
  };

  const buildDocumentPrompt = (userPrompt, actionType, currentContent) => {
    const baseContext = `You are a professional writing assistant helping with a document.
Document Title: ${documentTitle}
Document Type: ${documentType}

`;

    switch (actionType) {
      case 'summarize':
        return `${baseContext}Please provide a clear, concise summary of the following document content. Focus on the main points and key takeaways. Write in paragraph form, not bullets.

Content to summarize:
${currentContent}

Provide a well-structured summary in 2-3 paragraphs.`;

      case 'explain':
        return `${baseContext}Please explain the key concepts and ideas in this document in simple, easy-to-understand terms. Break down complex topics into digestible explanations.

Content to explain:
${currentContent}

Provide a clear, engaging explanation that anyone can understand.`;

      case 'improve':
        return `${baseContext}Please improve the following content for better clarity, professionalism, and readability. Maintain the original meaning but enhance the writing quality. Return ONLY the improved content, no explanations.

Content to improve:
${currentContent}

Provide the improved version with better flow and structure.`;

      case 'bullets':
        return `${baseContext}Please convert the following content into a well-organized bulleted list, extracting the main points and key information. Use proper markdown bullet formatting.

Content to convert:
${currentContent}

Provide a clear bulleted list with hierarchical structure if needed.`;

      case 'generate':
        return `${baseContext}${userPrompt}

Please generate comprehensive, well-structured content for this document. Write in a professional, clear style with proper formatting.`;

      default:
        return `${baseContext}${userPrompt}

${currentContent ? `Current document content:\n${currentContent}\n\n` : ''}

Please provide a helpful, well-formatted response.`;
    }
  };

  const handleSendMessage = async (messageText = inputValue) => {
    if (!messageText.trim()) return;

    if (!isInitialized || !isHealthy) {
      addMessage('assistant', 'AI service is not available. Please check your configuration.', true);
      return;
    }

    setInputValue('');

    const currentContent = getEditorContent();
    const lowerMessage = messageText.toLowerCase();
    
    if (lowerMessage.includes('grammar') || lowerMessage.includes('spelling') || lowerMessage.includes('check')) {
      await handleGrammarCheck(currentContent, true);
    } else if (lowerMessage.includes('summarize') || lowerMessage.includes('summary')) {
      await handleGenerateContent('Please create a concise summary', 'summarize', currentContent, false);
    } else if (lowerMessage.includes('improve') || lowerMessage.includes('enhance')) {
      await handleGenerateContent('Please improve the writing quality', 'improve', currentContent, true);
    } else if (lowerMessage.includes('explain')) {
      await handleGenerateContent('Please explain the key concepts', 'explain', currentContent, false);
    } else if (lowerMessage.includes('bullet') || lowerMessage.includes('list')) {
      await handleGenerateContent('Convert to bullet points', 'bullets', currentContent, true);
    } else {
      await handleGenerateContent(messageText, 'custom', currentContent, true);
    }
  };

  const addMessage = (role, content, isError = false, extras = {}) => {
    setMessages(prev => [...prev, {
      role,
      content,
      isError,
      timestamp: new Date().toISOString(),
      ...extras
    }]);
  };

  const handleInsertContent = (content) => {
    insertIntoEditor(content);
    addMessage('assistant', '✅ Content inserted into your document.');
  };

  const handleReplaceDocument = (content) => {
    const confirmed = window.confirm(
      'This will replace your entire document. Are you sure?'
    );
    
    if (confirmed) {
      replaceEditorContent(content);
      addMessage('assistant', '✅ Document replaced successfully.');
    }
  };

  const handleCopyContent = (content, index) => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;
    const textContent = tempDiv.textContent || tempDiv.innerText || content;
    
    navigator.clipboard.writeText(textContent);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) return null;

  const isLoading = isCheckingGrammar || isProcessing;

  return (
    <div className="h-full flex flex-col bg-card animate-slide-in-right overflow-hidden">
      {/* Fixed Header */}
      <div className="flex-shrink-0 text-foreground p-3 bg-card border-b border-border z-10">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-base">AI Assistant</h3>
            {!isInitialized && (
              <span className="text-xs text-yellow-600 bg-yellow-50 px-2 py-1 rounded">Initializing...</span>
            )}
            {isInitialized && !isHealthy && (
              <span className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded">Offline</span>
            )}
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-secondary rounded-full transition-colors"
            title="Close AI assistant"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <button
          onClick={() => setShowQuickActions(!showQuickActions)}
          className="w-full flex items-center justify-between p-2 hover:bg-secondary/50 rounded transition-colors"
        >
          <span className="text-sm text-foreground font-medium">Quick Actions</span>
          {showQuickActions ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </button>
      </div>

      {showQuickActions && (
        <div className="flex-shrink-0 p-3 border-b border-border bg-secondary/30">
          <div className="grid grid-cols-3 gap-2">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              const currentContent = getEditorContent();
              const isDisabled = isLoading || (action.needsContent && !currentContent.trim());
              
              return (
                <button
                  key={index}
                  onClick={() => handleQuickAction(action)}
                  className="flex flex-col items-center gap-1 p-2 bg-background hover:bg-primary/10 rounded border border-border hover:border-primary transition-colors text-center disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isDisabled}
                  title={isDisabled && action.needsContent ? 'Add content first' : action.description}
                >
                  <Icon className="w-4 h-4 text-primary" />
                  <span className="text-xs text-foreground">{action.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-3 bg-card">
        <div className="space-y-3">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-lg p-3 ${
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : message.isError
                    ? 'bg-red-50 text-red-900 border border-red-200'
                    : 'bg-secondary text-foreground'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                
                {message.role === 'assistant' && message.hasActions && message.generatedContent && (
                  <div className="mt-3 pt-3 border-t border-border space-y-2">
                    <button
                      onClick={() => handleCopyContent(message.generatedContent, index)}
                      className="w-full px-3 py-2 text-xs bg-background text-foreground border border-border rounded hover:bg-secondary transition-colors flex items-center justify-center gap-2"
                    >
                      {copiedIndex === index ? (
                        <>
                          <Check className="w-3 h-3" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          Copy Content
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleInsertContent(message.generatedContent)}
                      className="w-full px-3 py-2 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                    >
                      <Edit3 className="w-3 h-3" />
                      Insert into Document
                    </button>
                    <button
                      onClick={() => handleReplaceDocument(message.generatedContent)}
                      className="w-full px-3 py-2 text-xs bg-background text-foreground border border-border rounded hover:bg-destructive hover:text-destructive-foreground transition-colors flex items-center justify-center gap-2"
                    >
                      <FileText className="w-3 h-3" />
                      Replace Entire Document
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-secondary text-foreground rounded-lg p-3 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">AI is thinking...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="flex-shrink-0 p-3 bg-card border-t border-border">
        <div className="flex items-end gap-2">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={isInitialized ? "Ask me anything about this document..." : "Initializing AI service..."}
              rows={2}
              disabled={isLoading || !isInitialized}
              className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none disabled:bg-secondary disabled:cursor-not-allowed bg-background text-foreground"
              style={{ minHeight: '60px', maxHeight: '120px' }}
            />
          </div>

          <button
            onClick={() => handleSendMessage()}
            disabled={!inputValue.trim() || isLoading || !isInitialized}
            className="p-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:bg-muted disabled:cursor-not-allowed transition-colors flex-shrink-0"
            title="Send message"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
        <p className="text-xs text-muted-foreground mt-2 px-1">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>

      <style>{`
        @keyframes slide-in-right {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}