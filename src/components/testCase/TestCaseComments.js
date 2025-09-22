// components/TestCaseComments.js
import React, { useRef } from 'react';
import { Send, Paperclip, X, MessageSquare, Image } from 'lucide-react';

const TestCaseComments = ({ comments, onAddComment, formatDate }) => {
    const [newComment, setNewComment] = React.useState('');
    const [attachments, setAttachments] = React.useState([]);
    const [loading, setLoading] = React.useState(false);
    const fileInputRef = useRef(null);

    const getUserInitials = (userName) => {
        if (!userName) return 'U';
        return userName.split(' ').map(name => name.charAt(0)).join('').toUpperCase().slice(0, 2);
    };

    const getUserColor = (userName) => {
        if (!userName) return 'bg-muted-foreground';
        const colors = [
            'bg-primary', 'bg-success', 'bg-destructive', 'bg-warning',
            'bg-secondary', 'bg-accent', 'bg-muted', 'bg-card'
        ];
        const index = userName.length % colors.length;
        return colors[index];
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (newComment.trim() || attachments.length > 0) {
            setLoading(true);
            try {
                await onAddComment(newComment, attachments);
                setNewComment('');
                setAttachments([]);
            } catch (error) {
                console.error('Error adding comment:', error);
            } finally {
                setLoading(false);
            }
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    const handleFileUpload = (e) => {
        const files = Array.from(e.target.files);
        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = (event) => {
                const newAttachment = {
                    name: file.name,
                    url: event.target.result,
                    size: file.size,
                    type: file.type
                };
                setAttachments(prev => [...prev, newAttachment]);
            };
            reader.readAsDataURL(file);
        });
        e.target.value = '';
    };

    const removeAttachment = (index) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
    };

    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 space-y-4 max-h-80 overflow-y-auto py-4">
                {comments.length > 0 ? (
                    comments.map((comment, index) => (
                        <div key={comment.id || index} className="flex items-start space-x-3 group">
                            <div className="flex-shrink-0">
                                <div className={`w-8 h-8 ${getUserColor(comment.user)} rounded-full flex items-center justify-center`}>
                                    <span className="text-primary-foreground text-xs font-medium">
                                        {getUserInitials(comment.user)}
                                    </span>
                                </div>
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2 mb-1">
                                    <span className="text-sm font-medium text-foreground">
                                        {comment.user || 'Unknown User'}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                        {formatDate(comment.createdAt)}
                                    </span>
                                </div>
                                {comment.text && (
                                    <div className="text-sm text-foreground whitespace-pre-wrap mb-2">
                                        {comment.text}
                                    </div>
                                )}
                                {comment.attachments && comment.attachments.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {comment.attachments.map((att, i) => (
                                            <span key={i} className="inline-flex items-center px-2 py-1 bg-muted text-xs rounded border">
                                                <Paperclip className="h-3 w-3 mr-1" />
                                                {att.name || att}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center text-muted-foreground text-sm py-8">
                        <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                        No comments yet. Be the first to add one!
                    </div>
                )}
            </div>

            <div className="flex-shrink-0 pt-4">
                <form onSubmit={handleSubmit} className="space-y-3">
                    <div className="flex items-center space-x-2">
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded transition-colors"
                            title="Upload file"
                        >
                            <Paperclip className="h-4 w-4" />
                        </button>
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded transition-colors"
                            title="Upload image"
                        >
                            <Image alt="upload image" className="h-4 w-4" />
                        </button>
                    </div>

                    {attachments.length > 0 && (
                        <div className="flex flex-wrap gap-2 p-3 bg-muted rounded-lg border">
                            {attachments.map((attachment, index) => (
                                <div key={index} className="relative group">
                                    {attachment.type?.startsWith('image/') ? (
                                        <div className="relative">
                                            <Image
                                                src={attachment.url}
                                                alt={attachment.name}
                                                className="w-16 h-16 object-cover rounded border"
                                                width={128}
                                                height={128}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeAttachment(index)}
                                                className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-destructive/90"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center space-x-2 bg-card rounded border p-2 pr-6 relative">
                                            <Paperclip className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-xs text-foreground truncate max-w-20">
                                                {attachment.name}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => removeAttachment(index)}
                                                className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-destructive/90"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="relative">
                        <textarea
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Add a comment..."
                            className="w-full pl-3 pr-12 py-3 border border-input rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent resize-none bg-background text-foreground"
                            rows={2}
                            disabled={loading}
                        />
                        <button
                            type="submit"
                            disabled={loading || (!newComment.trim() && attachments.length === 0)}
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 text-muted-foreground hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {loading ? (
                                <div className="w-4 h-4 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <Send className="h-4 w-4" />
                            )}
                        </button>
                    </div>

                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept="image/*,application/pdf,.doc,.docx,.txt"
                        onChange={handleFileUpload}
                        className="hidden"
                    />

                    <div className="text-xs text-muted-foreground px-1">
                        Enter to submit, Shift+Enter for new line
                    </div>
                </form>
            </div>
        </div>
    );
};

export default TestCaseComments;