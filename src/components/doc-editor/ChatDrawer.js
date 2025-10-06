import React, { useState, useRef, useEffect } from 'react';
import { 
  X, Send, Tag, User, Smile, Paperclip, Search, Loader2
} from 'lucide-react';
import Image from 'next/image';

export default function ChatDrawer({ 
  isOpen, 
  onClose, 
  documentId,
  suiteId,
  sprintId = null,
  tags, 
  onAddTag, 
  onRemoveTag,
  currentUser = { 
    id: null,
    name: 'You', 
    avatar: null 
  },
  commentsService // Pass the CommentsService instance
}) {
  const [activeTab, setActiveTab] = useState('chat');
  const [comments, setComments] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [comments]);

  // Subscribe to real-time comments
  useEffect(() => {
    if (!documentId || !suiteId || !commentsService) return;

    setIsLoading(true);
    
    const unsubscribe = commentsService.subscribeToComments(
      suiteId,
      documentId,
      (fetchedComments) => {
        setComments(fetchedComments);
        setIsLoading(false);
      },
      (error) => {
        console.error('Error loading comments:', error);
        setIsLoading(false);
      },
      sprintId
    );

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [documentId, suiteId, sprintId, commentsService]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !documentId || !commentsService) return;

    setIsSending(true);

    try {
      const result = await commentsService.addComment(
        suiteId,
        documentId,
        {
          text: newMessage.trim(),
          userName: currentUser.name,
          userAvatar: currentUser.avatar
        },
        sprintId
      );

      if (result.success) {
        setNewMessage('');
        // Reset textarea height
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
        }
      } else {
        console.error('Failed to send message:', result.error);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!commentsService || !documentId) return;

    const result = await commentsService.deleteComment(
      suiteId,
      documentId,
      commentId,
      sprintId
    );

    if (!result.success) {
      console.error('Failed to delete comment:', result.error);
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      onAddTag(tagInput.trim());
      setTagInput('');
    }
  };

  const handleTextareaChange = (e) => {
    setNewMessage(e.target.value);
    // Auto-resize textarea
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px';
  };

  if (!isOpen) return null;

  return (
    <div className="h-screen w-full bg-white border-l border-gray-200 shadow-lg flex flex-col">
      {/* Fixed Header */}
      <div className="flex-shrink-0 text-gray-800 p-3 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-base">Team Chat</h3>
          <div className="flex items-center gap-1">
            <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <Search className="w-4 h-4" />
            </button>
            <button 
              onClick={onClose} 
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              title="Close chat panel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('chat')}
            className={`pb-1 px-1 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'chat'
                ? 'border-teal-600 text-teal-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Chat {comments.length > 0 && `(${comments.length})`}
          </button>
          <button
            onClick={() => setActiveTab('details')}
            className={`pb-1 px-1 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'details'
                ? 'border-teal-600 text-teal-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Details
          </button>
        </div>
      </div>

      {activeTab === 'chat' ? (
        <>
          {/* Scrollable Messages Area */}
          <div className="flex-1 overflow-y-auto p-3 bg-white">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
              </div>
            ) : comments.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-4">
                <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mb-3">
                  <Send className="w-8 h-8 text-teal-600" />
                </div>
                <h4 className="font-medium text-gray-900 mb-1 text-sm">Start Collaborating!</h4>
                <p className="text-xs text-gray-600">
                  Send messages and discuss changes with your team in real-time.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {comments.map((comment, index) => {
                  const isOwn = comment.userId === currentUser.id;
                  const showAvatar = index === 0 || comments[index - 1].userId !== comment.userId;

                  return (
                    <div
                      key={comment.id}
                      className={`flex gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
                    >
                      {/* Avatar */}
                      <div className={`w-7 h-7 flex-shrink-0 ${!showAvatar && 'opacity-0'}`}>
                        {!isOwn && (
                          comment.userAvatar ? (
                            <Image 
                              src={comment.userAvatar} 
                              alt={comment.userName}
                              className="w-7 h-7 rounded-full object-cover"
                              width={28}
                              height={28}
                            />
                          ) : (
                            <div className="w-7 h-7 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                              {comment.userName.charAt(0).toUpperCase()}
                            </div>
                          )
                        )}
                      </div>

                      {/* Message Bubble */}
                      <div className={`max-w-[80%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
                        {showAvatar && !isOwn && (
                          <span className="text-xs text-gray-600 mb-0.5 px-2">{comment.userName}</span>
                        )}
                        <div
                          className={`rounded-2xl px-3 py-2 group relative ${
                            isOwn
                              ? 'bg-teal-600 text-white rounded-br-sm'
                              : 'bg-orange-100 text-gray-900 rounded-bl-sm'
                          }`}
                        >
                          <p className="text-xs break-words leading-relaxed whitespace-pre-wrap">{comment.text}</p>
                          <div className={`flex items-center gap-1 mt-0.5 justify-between ${isOwn ? 'text-teal-100' : 'text-orange-700'}`}>
                            <span className="text-[10px]">
                              {comment.timestamp?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {isOwn && (
                              <button
                                onClick={() => handleDeleteComment(comment.id)}
                                className="opacity-0 group-hover:opacity-100 text-[10px] hover:underline transition-opacity"
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Fixed Input Area at Bottom */}
          <div className="flex-shrink-0 p-3 bg-white border-t border-gray-200">
            <div className="flex items-end gap-2">
              {/* Attachments */}
              <button 
                className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
                title="Attach file (coming soon)"
              >
                <Paperclip className="w-4 h-4" />
              </button>

              {/* Message Input */}
              <div className="flex-1 relative">
                <textarea
                  ref={textareaRef}
                  value={newMessage}
                  onChange={handleTextareaChange}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Type a message..."
                  rows={1}
                  disabled={!documentId || isSending}
                  className="w-full px-3 py-2 pr-9 text-xs border border-gray-300 rounded-full focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                  style={{ minHeight: '36px', maxHeight: '100px' }}
                />
                <button 
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  title="Emoji (coming soon)"
                >
                  <Smile className="w-4 h-4" />
                </button>
              </div>

              {/* Send Button */}
              <button
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || !documentId || isSending}
                className="p-2 bg-teal-600 text-white rounded-full hover:bg-teal-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex-shrink-0"
                title={!documentId ? 'Save document first to enable chat' : 'Send message'}
              >
                {isSending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
            {!documentId && (
              <p className="text-xs text-orange-600 mt-1 px-2">
                Save the document to enable chat
              </p>
            )}
          </div>
        </>
      ) : (
        /* Details Tab - Scrollable */
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {/* Tags Section */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2 text-sm">
              <Tag className="w-4 h-4" />
              Tags
            </h4>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                placeholder="Add tag..."
                className="flex-1 px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
              <button
                onClick={handleAddTag}
                className="px-3 py-1.5 text-xs bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
              >
                Add
              </button>
            </div>
            {tags.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs flex items-center gap-1 hover:bg-orange-200 transition-colors"
                  >
                    <Tag className="w-3 h-3" />
                    {tag}
                    <button
                      onClick={() => onRemoveTag(tag)}
                      className="hover:text-orange-900"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-500 italic">No tags yet</p>
            )}
          </div>

          {/* Document Info */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-2 text-sm">Document Info</h4>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-600">Document ID:</span>
                <span className="text-gray-900 font-mono text-[10px]">
                  {documentId ? documentId.substring(0, 8) + '...' : 'Not saved'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Comments:</span>
                <span className="text-gray-900">{comments.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Created:</span>
                <span className="text-gray-900">{new Date().toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Last Modified:</span>
                <span className="text-gray-900">{new Date().toLocaleTimeString()}</span>
              </div>
            </div>
          </div>

          {/* Collaborators */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-2 text-sm">Collaborators</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg">
                {currentUser.avatar ? (
                  <Image
                    src={currentUser.avatar} 
                    alt={currentUser.name}
                    className="w-8 h-8 rounded-full object-cover"
                    width={32}
                    height={32}
                  />
                ) : (
                  <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-teal-600 rounded-full flex items-center justify-center text-white font-bold text-xs">
                    {currentUser.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1">
                  <p className="text-xs font-medium text-gray-900">{currentUser.name}</p>
                  <p className="text-[10px] text-gray-500">Owner</p>
                </div>
                <div className="w-2 h-2 bg-green-500 rounded-full" title="Online"></div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-2 text-sm">Recent Activity</h4>
            <div className="space-y-2">
              {comments.slice(-3).reverse().map((comment) => (
                <div key={comment.id} className="flex gap-2 text-xs">
                  <div className="w-7 h-7 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-3 h-3 text-teal-600" />
                  </div>
                  <div>
                    <p className="text-gray-900">
                      <span className="font-medium">{comment.userName}</span> commented
                    </p>
                    <p className="text-[10px] text-gray-500">
                      {comment.timestamp?.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
              {comments.length === 0 && (
                <div className="flex gap-2 text-xs">
                  <div className="w-7 h-7 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-3 h-3 text-teal-600" />
                  </div>
                  <div>
                    <p className="text-gray-900">Document created</p>
                    <p className="text-[10px] text-gray-500">Just now</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}   