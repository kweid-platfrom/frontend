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
import { useAI } from '../context/AIContext';

export default function AIAssistantDrawer({ 
  isOpen, 
  onClose, 
  documentContent = '',
  documentTitle = 'Untitled Document',
  documentType = 'document',
  onInsertContent,
  onReplaceContent
}) {
  const {
    checkGrammar,
    generateDocumentation,
    isLoading: aiLoading,
    error: aiError,
    isInitialized,
    isHealthy,
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
  const [isProcessing, setIsProcessing] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(true);
  const [copiedIndex, setCopiedIndex] = useState(null);
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

  const quickActions = [
    {
      icon: FileText,
      label: 'Summarize',
      prompt: `Please create a concise summary of this document:\n\nTitle: ${documentTitle}\n\nContent:\n${documentContent.slice(0, 2000)}`,
      needsContent: true
    },
    {
      icon: Lightbulb,
      label: 'Explain',
      prompt: `Please explain the key concepts in this document in simple terms:\n\nTitle: ${documentTitle}\n\nContent:\n${documentContent.slice(0, 2000)}`,
      needsContent: true
    },
    {
      icon: Edit3,
      label: 'Improve',
      prompt: `Please review this document and suggest improvements for clarity and professionalism:\n\nTitle: ${documentTitle}\n\nContent:\n${documentContent.slice(0, 2000)}`,
      needsContent: true
    },
    {
      icon: List,
      label: 'Bullet Points',
      prompt: `Convert the main points of this document into a bulleted list:\n\nTitle: ${documentTitle}\n\nContent:\n${documentContent.slice(0, 2000)}`,
      needsContent: true
    },
    {
      icon: CheckCircle2,
      label: 'Grammar',
      prompt: 'grammar_check',
      needsContent: true,
      isSpecial: true
    },
    {
      icon: Wand2,
      label: 'Generate',
      prompt: `Create a new ${documentType} document with appropriate structure and content based on the title: ${documentTitle}`,
      needsContent: false
    }
  ];

  const handleQuickAction = async (action) => {
    if (action.needsContent && !documentContent.trim()) {
      addMessage('assistant', 'Please add some content to your document first before using this action.', true);
      return;
    }

    if (action.isSpecial && action.prompt === 'grammar_check') {
      await handleGrammarCheck();
    } else {
      await handleSendMessage(action.prompt);
    }
  };

  const handleGrammarCheck = async () => {
    if (!documentContent.trim()) {
      addMessage('assistant', 'Please add some content to check for grammar.', true);
      return;
    }

    addMessage('user', '🔍 Check grammar and spelling');
    setIsProcessing(true);

    try {
      const result = await checkGrammar(documentContent, {
        includeStyleSuggestions: true,
        checkSpelling: true
      });

      if (result.success && result.data) {
        const { suggestions = [], correctedText, summary } = result.data;
        
        let responseContent = '';
        
        if (suggestions.length === 0) {
          responseContent = '✅ Great! No grammar or spelling issues found.';
        } else {
          responseContent = `Found ${suggestions.length} suggestion${suggestions.length > 1 ? 's' : ''}:\n\n`;
          
          suggestions.slice(0, 10).forEach((suggestion, idx) => {
            responseContent += `${idx + 1}. **${suggestion.type}**: "${suggestion.original}" → "${suggestion.suggestion}"\n`;
          });

          if (suggestions.length > 10) {
            responseContent += `\n...and ${suggestions.length - 10} more suggestions.`;
          }
        }

        addMessage('assistant', responseContent, false, {
          hasActions: correctedText && suggestions.length > 0,
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

  const handleSendMessage = async (messageText = inputValue) => {
    if (!messageText.trim() || isProcessing || aiLoading) return;

    if (!isInitialized || !isHealthy) {
      addMessage('assistant', 'AI service is not available. Please check your configuration.', true);
      return;
    }

    addMessage('user', messageText);
    setInputValue('');
    setIsProcessing(true);

    try {
      // Determine the type of request
      const lowerMessage = messageText.toLowerCase();
      
      if (lowerMessage.includes('grammar') || lowerMessage.includes('spelling')) {
        await handleGrammarCheck();
        return;
      }

      // For documentation generation
      const docType = lowerMessage.includes('test') ? 'test_plan' :
                      lowerMessage.includes('report') ? 'report' :
                      lowerMessage.includes('guide') ? 'guide' : 
                      'general';

      const result = await generateDocumentation(
        `${messageText}\n\nDocument Context:\nTitle: ${documentTitle}\nType: ${documentType}\nContent: ${documentContent.slice(0, 1500)}`,
        docType
      );

      if (result.success && result.data) {
        const content = result.data.content || result.data.text || 'Content generated successfully.';
        
        addMessage('assistant', content, false, {
          hasActions: true,
          generatedContent: content
        });
      } else {
        throw new Error(result.error || 'Failed to generate response');
      }
    } catch (error) {
      console.error('AI Error:', error);
      addMessage('assistant', `Sorry, I encountered an error: ${error.message}`, true);
    } finally {
      setIsProcessing(false);
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
    if (onInsertContent) {
      onInsertContent(content);
      addMessage('assistant', '✅ Content inserted into your document.');
    }
  };

  const handleReplaceDocument = (content) => {
    if (onReplaceContent) {
      const confirmed = window.confirm(
        'This will replace your entire document. Are you sure?'
      );
      if (confirmed) {
        onReplaceContent(content);
        addMessage('assistant', '✅ Document replaced successfully.');
      }
    }
  };

  const handleCopyContent = (content, index) => {
    navigator.clipboard.writeText(content);
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

  const isLoading = isProcessing || aiLoading;

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

        {/* Quick Actions Toggle */}
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

      {/* Collapsible Quick Actions */}
      {showQuickActions && (
        <div className="flex-shrink-0 p-3 border-b border-border bg-secondary/30">
          <div className="grid grid-cols-3 gap-2">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <button
                  key={index}
                  onClick={() => handleQuickAction(action)}
                  className="flex flex-col items-center gap-1 p-2 bg-background hover:bg-primary/10 rounded border border-border hover:border-primary transition-colors text-center disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isLoading}
                  title={action.needsContent && !documentContent.trim() ? 'Add content first' : ''}
                >
                  <Icon className="w-4 h-4 text-primary" />
                  <span className="text-xs text-foreground">{action.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Scrollable Messages Area */}
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
                
                {/* Action Buttons for AI Responses with Generated Content */}
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

      {/* Fixed Input Area at Bottom */}
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

      {/* Animation Styles */}
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