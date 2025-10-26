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
  ChevronUp
} from 'lucide-react';

export default function AIAssistantDrawer({ 
  isOpen, 
  onClose, 
  documentContent,
  documentTitle,
  documentType,
  onInsertContent,
  onReplaceContent
}) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Hi! I'm your AI writing assistant. I can help you with:
• Summarize this document
• Explain complex sections
• Improve writing quality
• Generate new content
• Create document from scratch
• Format and structure

What would you like me to help with?`
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
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
      inputRef.current.focus();
    }
  }, [isOpen]);

  const quickActions = [
    {
      icon: FileText,
      label: 'Summarize',
      prompt: 'Please provide a concise summary of this document.'
    },
    {
      icon: Lightbulb,
      label: 'Explain',
      prompt: 'Explain the key concepts in this document in simple terms.'
    },
    {
      icon: Edit3,
      label: 'Improve',
      prompt: 'Review this document and suggest improvements for clarity and professionalism.'
    },
    {
      icon: List,
      label: 'Bullet Points',
      prompt: 'Convert the main points of this document into a bulleted list.'
    },
    {
      icon: CheckCircle2,
      label: 'Grammar Check',
      prompt: 'Check this document for grammar, spelling, and punctuation errors.'
    },
    {
      icon: Wand2,
      label: 'Generate',
      prompt: `Create a new ${documentType} document with appropriate structure and content.`
    }
  ];

  const handleQuickAction = (prompt) => {
    handleSendMessage(prompt);
  };

  const handleSendMessage = async (messageText = inputValue) => {
    if (!messageText.trim() || isLoading) return;

    const userMessage = {
      role: 'user',
      content: messageText
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Call your AI API endpoint
      const response = await fetch('/api/ai/assist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          documentContent,
          documentTitle,
          documentType,
          action: messageText
        })
      });

      const data = await response.json();

      if (data.success) {
        const assistantMessage = {
          role: 'assistant',
          content: data.response,
          hasActions: data.hasContent,
          generatedContent: data.generatedContent
        };

        setMessages(prev => [...prev, assistantMessage]);
      } else {
        throw new Error(data.error || 'Failed to get AI response');
      }
    } catch (error) {
      console.error('AI Error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        isError: true
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInsertContent = (content) => {
    if (onInsertContent) {
      onInsertContent(content);
    }
  };

  const handleReplaceDocument = (content) => {
    if (onReplaceContent) {
      const confirmed = window.confirm(
        'This will replace your entire document. Are you sure?'
      );
      if (confirmed) {
        onReplaceContent(content);
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="h-full flex flex-col bg-card animate-slide-in-right overflow-hidden">
      {/* Fixed Header */}
      <div className="flex-shrink-0 text-foreground p-3 bg-card border-b border-border z-10">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-base">AI Assistant</h3>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-secondary rounded-full transition-colors"
            title="Close AI assistant panel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Actions Toggle */}
        <button
          onClick={() => setShowQuickActions(!showQuickActions)}
          className="w-full flex items-center justify-between p-2 hover:bg-secondary/50 rounded transition-colors"
        >
          <p className="text-sm text-foreground font-medium">Quick Actions</p>
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
                  onClick={() => handleQuickAction(action.prompt)}
                  className="flex flex-col items-center gap-1 p-2 bg-background hover:bg-primary/10 rounded border border-border hover:border-primary transition-colors text-center"
                  disabled={isLoading}
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
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-3">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <h4 className="font-medium text-foreground mb-1 text-sm">AI Writing Assistant</h4>
            <p className="text-xs text-muted-foreground">
              Ask me anything about your document or use quick actions above.
            </p>
          </div>
        ) : (
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
                        onClick={() => handleInsertContent(message.generatedContent)}
                        className="w-full px-3 py-2 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                      >
                        <Edit3 className="w-3 h-3" />
                        Insert into Document
                      </button>
                      <button
                        onClick={() => handleReplaceDocument(message.generatedContent)}
                        className="w-full px-3 py-2 text-xs bg-background text-foreground border border-border rounded hover:bg-secondary transition-colors flex items-center justify-center gap-2"
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
        )}
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
              placeholder="Ask me anything about this document..."
              rows={2}
              disabled={isLoading}
              className="w-full px-3 py-2 text-xs border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none disabled:bg-secondary disabled:cursor-not-allowed bg-background text-foreground"
              style={{ minHeight: '60px', maxHeight: '120px' }}
            />
          </div>

          <button
            onClick={() => handleSendMessage()}
            disabled={!inputValue.trim() || isLoading}
            className="p-2 bg-primary text-primary-foreground rounded-full hover:bg-primary/80 disabled:bg-muted disabled:cursor-not-allowed transition-colors flex-shrink-0"
            title="Send message"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
        <p className="text-xs text-muted-foreground mt-1 px-1">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>

      {/* Animation Styles */}
      <style jsx>{`
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