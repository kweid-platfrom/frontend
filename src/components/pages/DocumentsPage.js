'use client';
//@ts-nocheck

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import {
    FileText, Plus, Search, Trash2, Archive, ExternalLink,
    Edit, Download, Share2, Copy, MoreVertical, ArchiveRestore, Loader2,
    Tag, Clock, User, SortAsc, SortDesc, Grid, List as ListIcon
} from 'lucide-react';
import DocumentEditor from '@/components/DocumentEditor';
import { useApp } from '@/context/AppProvider';

export default function DocumentsDashboard({ suiteId: propSuiteId, sprintId: propSprintId = null }) {
    // Get context
    const { activeSuite, actions } = useApp();
    const searchParams = useSearchParams();
    
    // Extract actual string IDs - handle if objects are passed
    const suiteId = typeof propSuiteId === 'string' 
        ? propSuiteId 
        : propSuiteId?.id || activeSuite?.id;
        
    const sprintId = typeof propSprintId === 'string'
        ? propSprintId
        : propSprintId?.id || null;
    
    // Check if we should auto-open create mode from URL
    const shouldAutoCreate = searchParams?.get('create') === 'true';
    
    const [documents, setDocuments] = useState([]);
    const [archivedDocs, setArchivedDocs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showEditor, setShowEditor] = useState(shouldAutoCreate);
    const [selectedDocument, setSelectedDocument] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [sortBy, setSortBy] = useState('created_at');
    const [sortDirection, setSortDirection] = useState('desc');
    const [viewMode, setViewMode] = useState('grid');
    const [showArchived, setShowArchived] = useState(false);
    const [selectedDocs, setSelectedDocs] = useState([]);
    
    // Log for debugging
    useEffect(() => {
        console.log('DocumentsDashboard IDs:', { 
            suiteId, 
            sprintId,
            propSuiteId,
            activeSuiteId: activeSuite?.id,
            shouldAutoCreate 
        });
    }, [suiteId, sprintId, propSuiteId, activeSuite, shouldAutoCreate]);
    
    // Auto-open editor if create=true in URL
    useEffect(() => {
        if (shouldAutoCreate && suiteId) {
            setShowEditor(true);
            setSelectedDocument(null);
        }
    }, [shouldAutoCreate, suiteId]);

    useEffect(() => {
        if (suiteId) {
            loadDocuments();
            if (showArchived) {
                loadArchivedDocuments();
            }
        }
    }, [suiteId, sprintId, showArchived, sortBy, sortDirection]);

    const loadDocuments = async () => {
        if (!suiteId) return;
        
        try {
            setLoading(true);
            const result = await actions.documents.getDocuments(suiteId, sprintId, {
                excludeStatus: ['deleted', 'archived'],
                orderBy: sortBy,
                orderDirection: sortDirection
            });

            if (result.success) {
                setDocuments(result.data || []);
                setError('');
            } else {
                setError(result.error?.message || 'Failed to load documents');
            }
        } catch (err) {
            console.error('Error loading documents:', err);
            setError('Failed to load documents');
        } finally {
            setLoading(false);
        }
    };

    const loadArchivedDocuments = async () => {
        if (!suiteId) return;
        
        try {
            const result = await actions.archive.loadArchivedItems(suiteId, 'documents', sprintId);
            if (result.success) {
                setArchivedDocs(result.data || []);
            }
        } catch (err) {
            console.error('Error loading archived documents:', err);
        }
    };

    const handleCreateNew = () => {
        setSelectedDocument(null);
        setShowEditor(true);
    };

    const handleEdit = (doc) => {
        setSelectedDocument(doc);
        setShowEditor(true);
    };

    const handleSaveSuccess = () => {
        setShowEditor(false);
        setSelectedDocument(null);
        loadDocuments();
        
        // Clear the create parameter from URL if present
        if (shouldAutoCreate && window.history.replaceState) {
            const url = new URL(window.location.href);
            url.searchParams.delete('create');
            window.history.replaceState({}, '', url);
        }
    };

    const handleDelete = async (docId) => {
        if (!confirm('Move this document to trash?')) return;

        try {
            const result = await actions.documents.deleteDocument(docId, suiteId, sprintId);
            if (result.success) {
                loadDocuments();
            }
        } catch (err) {
            console.error('Error deleting document:', err);
        }
    };

    const handleArchive = async (docId) => {
        try {
            const result = await actions.documents.archiveDocument(docId, suiteId, sprintId);
            if (result.success) {
                loadDocuments();
                if (showArchived) loadArchivedDocuments();
            }
        } catch (err) {
            console.error('Error archiving document:', err);
        }
    };

    const handleUnarchive = async (docId) => {
        try {
            const result = await actions.archive.unarchiveItem(suiteId, 'documents', docId, sprintId);
            if (result.success) {
                loadDocuments();
                loadArchivedDocuments();
            }
        } catch (err) {
            console.error('Error unarchiving document:', err);
        }
    };

    const handleDuplicate = async (doc) => {
        try {
            const result = await actions.documents.createDocument({
                title: `${doc.title} (Copy)`,
                content: doc.content,
                type: doc.type,
                tags: doc.tags || []
            }, suiteId, sprintId);

            if (result.success) {
                loadDocuments();
            }
        } catch (err) {
            console.error('Error duplicating document:', err);
        }
    };

    const handleExport = async (doc) => {
        try {
            const response = await fetch('/api/docs/export', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    docId: doc.docId,
                    format: 'pdf'
                })
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${doc.title}.pdf`;
                a.click();
                window.URL.revokeObjectURL(url);
            }
        } catch (err) {
            console.error('Error exporting document:', err);
        }
    };

    const handleShare = async (doc) => {
        const emails = prompt('Enter email addresses (comma-separated):');
        if (!emails) return;

        try {
            const response = await fetch('/api/documents/share', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    documentId: doc.id,
                    suiteId,
                    sprintId,
                    shareConfig: {
                        emails: emails.split(',').map(e => e.trim()),
                        role: 'writer'
                    }
                })
            });

            const result = await response.json();
            if (result.success) {
                actions.ui.showNotification?.({
                    id: 'doc-share-success',
                    type: 'success',
                    message: 'Document shared successfully',
                    duration: 3000
                });
            }
        } catch (err) {
            console.error('Error sharing document:', err);
        }
    };

    const handleBulkDelete = async () => {
        if (!confirm(`Move ${selectedDocs.length} documents to trash?`)) return;

        try {
            const result = await actions.archive.bulkDelete(suiteId, 'documents', selectedDocs, sprintId);
            if (result.success) {
                setSelectedDocs([]);
                loadDocuments();
            }
        } catch (err) {
            console.error('Error bulk deleting:', err);
        }
    };

    const handleBulkArchive = async () => {
        try {
            const result = await actions.archive.bulkArchive(suiteId, 'documents', selectedDocs, sprintId);
            if (result.success) {
                setSelectedDocs([]);
                loadDocuments();
                if (showArchived) loadArchivedDocuments();
            }
        } catch (err) {
            console.error('Error bulk archiving:', err);
        }
    };

    const toggleDocSelection = (docId) => {
        setSelectedDocs(prev =>
            prev.includes(docId)
                ? prev.filter(id => id !== docId)
                : [...prev, docId]
        );
    };

    const filteredDocuments = (showArchived ? archivedDocs : documents).filter(doc => {
        const matchesSearch =
            doc.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            doc.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            doc.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesType = filterType === 'all' || doc.type === filterType;
        return matchesSearch && matchesType;
    });

    const documentTypes = [...new Set(documents.map(d => d.type).filter(Boolean))];

    if (showEditor) {
        return (
            <DocumentEditor
                suiteId={suiteId}
                sprintId={sprintId}
                existingDocument={selectedDocument}
                onSaveSuccess={handleSaveSuccess}
                onCancel={() => {
                    setShowEditor(false);
                    setSelectedDocument(null);
                    
                    // Clear the create parameter from URL if present
                    if (shouldAutoCreate && window.history.replaceState) {
                        const url = new URL(window.location.href);
                        url.searchParams.delete('create');
                        window.history.replaceState({}, '', url);
                    }
                }}
            />
        );
    };

    if (!suiteId) {
        return (
            <div className="h-full flex items-center justify-center bg-background">
                <div className="text-center">
                    <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">No Suite Selected</h3>
                    <p className="text-muted-foreground">Please select a test suite to manage documents</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-background">
            {/* Header */}
            <div className="bg-card border-b border-border px-6 py-4">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Documents</h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            {showArchived ? 'Archived documents' : 'Create and manage test documentation'}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setShowArchived(!showArchived)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${showArchived
                                    ? 'bg-secondary text-secondary-foreground'
                                    : 'text-muted-foreground hover:bg-secondary'
                                }`}
                        >
                            <Archive className="w-4 h-4" />
                            {showArchived ? 'Show Active' : 'Show Archived'}
                        </button>
                        {!showArchived && (
                            <button
                                onClick={handleCreateNew}
                                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/80 transition-colors"
                            >
                                <Plus className="w-5 h-5" />
                                New
                            </button>
                        )}
                    </div>
                </div>

                {/* Search, Filters, and View Options */}
                <div className="flex items-center gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search documents by title, content, or tags..."
                            className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>

                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="px-8 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                        <option value="all">All Types</option>
                        {documentTypes.map(type => (
                            <option key={type} value={type}>
                                {type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' ')}
                            </option>
                        ))}
                    </select>

                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="px-8 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                        <option value="created_at">Created Date</option>
                        <option value="updated_at">Modified Date</option>
                        <option value="title">Title</option>
                        <option value="type">Type</option>
                    </select>

                    <button
                        onClick={() => setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')}
                        className="p-2 border border-border rounded-lg hover:bg-secondary"
                        title={`Sort ${sortDirection === 'asc' ? 'Descending' : 'Ascending'}`}
                    >
                        {sortDirection === 'asc' ? <SortAsc className="w-5 h-5" /> : <SortDesc className="w-5 h-5" />}
                    </button>

                    <div className="flex border border-border rounded-lg">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-2 ${viewMode === 'grid' ? 'bg-secondary' : 'hover:bg-secondary'}`}
                            title="Grid View"
                        >
                            <Grid className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-2 ${viewMode === 'list' ? 'bg-secondary' : 'hover:bg-secondary'}`}
                            title="List View"
                        >
                            <ListIcon className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Bulk Actions Bar */}
                {selectedDocs.length > 0 && (
                    <div className="mt-4 p-3 bg-teal-50 border border-teal-300 rounded-lg flex items-center justify-between">
                        <span className="text-sm text-teal-800">
                            {selectedDocs.length} document{selectedDocs.length > 1 ? 's' : ''} selected
                        </span>
                        <div className="flex gap-2">
                            <button
                                onClick={handleBulkArchive}
                                className="px-3 py-1 text-sm bg-card hover:bg-secondary border border-border rounded-lg transition-colors"
                            >
                                <Archive className="w-4 h-4 inline mr-1" />
                                Archive
                            </button>
                            <button
                                onClick={handleBulkDelete}
                                className="px-3 py-1 text-sm bg-card hover:bg-secondary border border-border text-destructive rounded-lg transition-colors"
                            >
                                <Trash2 className="w-4 h-4 inline mr-1" />
                                Delete
                            </button>
                            <button
                                onClick={() => setSelectedDocs([])}
                                className="px-3 py-1 text-sm text-foreground hover:bg-secondary rounded-lg transition-colors"
                            >
                                Clear
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-6">
                {loading ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                            <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
                            <p className="text-muted-foreground">Loading documents...</p>
                        </div>
                    </div>
                ) : error ? (
                    <div className="bg-destructive/10 border border-destructive rounded-lg p-4 text-destructive">
                        {error}
                    </div>
                ) : filteredDocuments.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                            <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-foreground mb-2">
                                No documents found
                            </h3>
                            <p className="text-muted-foreground mb-6">
                                {searchQuery || filterType !== 'all'
                                    ? 'Try adjusting your search or filters'
                                    : showArchived
                                        ? 'No archived documents yet'
                                        : 'Get started by creating your first document'}
                            </p>
                            {!searchQuery && filterType === 'all' && !showArchived && (
                                <button
                                    onClick={handleCreateNew}
                                    className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/80 transition-colors"
                                >
                                    Create Document
                                </button>
                            )}
                        </div>
                    </div>
                ) : viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredDocuments.map(doc => (
                            <DocumentCard
                                key={doc.id}
                                document={doc}
                                isSelected={selectedDocs.includes(doc.id)}
                                onSelect={() => toggleDocSelection(doc.id)}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                                onArchive={handleArchive}
                                onUnarchive={handleUnarchive}
                                onDuplicate={handleDuplicate}
                                onExport={handleExport}
                                onShare={handleShare}
                                showArchived={showArchived}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="bg-card rounded-lg shadow-theme-sm overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-secondary border-b border-border">
                                <tr>
                                    <th className="w-12 px-6 py-3">
                                        <input
                                            type="checkbox"
                                            checked={selectedDocs.length === filteredDocuments.length && filteredDocuments.length > 0}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setSelectedDocs(filteredDocuments.map(d => d.id));
                                                } else {
                                                    setSelectedDocs([]);
                                                }
                                            }}
                                            className="rounded border-border"
                                        />
                                    </th>
                                    <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">Title</th>
                                    <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">Type</th>
                                    <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">Tags</th>
                                    <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">Modified</th>
                                    <th className="text-right px-6 py-3 text-xs font-medium text-muted-foreground uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {filteredDocuments.map(doc => (
                                    <DocumentRow
                                        key={doc.id}
                                        document={doc}
                                        isSelected={selectedDocs.includes(doc.id)}
                                        onSelect={() => toggleDocSelection(doc.id)}
                                        onEdit={handleEdit}
                                        onDelete={handleDelete}
                                        onArchive={handleArchive}
                                        onUnarchive={handleUnarchive}
                                        onDuplicate={handleDuplicate}
                                        onExport={handleExport}
                                        onShare={handleShare}
                                        showArchived={showArchived}
                                    />
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

// Document Card Component for Grid View
function DocumentCard({ document, isSelected, onSelect, onEdit, onDelete, onArchive, onUnarchive, onDuplicate, onExport, onShare, showArchived }) {
    const [showMenu, setShowMenu] = useState(false);

    const formatDate = (timestamp) => {
        if (!timestamp) return 'Unknown';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    };

    return (
        <div className={`bg-card rounded-lg border ${isSelected ? 'border-primary ring-2 ring-primary/20' : 'border-border'} hover:shadow-theme-md transition-shadow`}>
            <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-3 flex-1">
                        <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={onSelect}
                            className="mt-1 rounded border-border"
                        />
                        <div className="w-10 h-10 bg-teal-50 rounded-lg flex items-center justify-center flex-shrink-0">
                            <FileText className="w-5 h-5 text-teal-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-foreground line-clamp-2 mb-1">
                                {document.title}
                            </h3>
                            <span className="text-xs text-muted-foreground capitalize">
                                {document.type?.replace('-', ' ')}
                            </span>
                        </div>
                    </div>
                    <div className="relative">
                        <button
                            onClick={() => setShowMenu(!showMenu)}
                            className="p-1 hover:bg-secondary rounded"
                        >
                            <MoreVertical className="w-5 h-5 text-muted-foreground" />
                        </button>
                        {showMenu && (
                            <>
                                <div 
                                    className="fixed inset-0 z-10" 
                                    onClick={() => setShowMenu(false)}
                                />
                                <div className="absolute right-0 mt-2 w-48 bg-card rounded-lg shadow-theme-lg border border-border py-1 z-20">
                                    <button
                                        onClick={() => { onEdit(document); setShowMenu(false); }}
                                        className="w-full px-4 py-2 text-left text-sm hover:bg-secondary flex items-center gap-2 text-foreground"
                                    >
                                        <Edit className="w-4 h-4" /> Edit
                                    </button>
                                    <button
                                        onClick={() => { onDuplicate(document); setShowMenu(false); }}
                                        className="w-full px-4 py-2 text-left text-sm hover:bg-secondary flex items-center gap-2 text-foreground"
                                    >
                                        <Copy className="w-4 h-4" /> Duplicate
                                    </button>
                                    <button
                                        onClick={() => { onShare(document); setShowMenu(false); }}
                                        className="w-full px-4 py-2 text-left text-sm hover:bg-secondary flex items-center gap-2 text-foreground"
                                    >
                                        <Share2 className="w-4 h-4" /> Share
                                    </button>
                                    <button
                                        onClick={() => { onExport(document); setShowMenu(false); }}
                                        className="w-full px-4 py-2 text-left text-sm hover:bg-secondary flex items-center gap-2 text-foreground"
                                    >
                                        <Download className="w-4 h-4" /> Export
                                    </button>
                                    <div className="border-t border-border my-1" />
                                    {showArchived ? (
                                        <button
                                            onClick={() => { onUnarchive(document.id); setShowMenu(false); }}
                                            className="w-full px-4 py-2 text-left text-sm hover:bg-secondary flex items-center gap-2 text-foreground"
                                        >
                                            <ArchiveRestore className="w-4 h-4" /> Unarchive
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => { onArchive(document.id); setShowMenu(false); }}
                                            className="w-full px-4 py-2 text-left text-sm hover:bg-secondary flex items-center gap-2 text-foreground"
                                        >
                                            <Archive className="w-4 h-4" /> Archive
                                        </button>
                                    )}
                                    <button
                                        onClick={() => { onDelete(document.id); setShowMenu(false); }}
                                        className="w-full px-4 py-2 text-left text-sm hover:bg-secondary text-destructive flex items-center gap-2"
                                    >
                                        <Trash2 className="w-4 h-4" /> Delete
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        <span className="text-xs">Modified: {formatDate(document.updated_at || document.created_at)}</span>
                    </div>
                    {document.created_by && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <User className="w-4 h-4" />
                            <span className="text-xs">Creator</span>
                        </div>
                    )}
                </div>

                {document.tags && document.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                        {document.tags.slice(0, 3).map((tag, index) => (
                            <span
                                key={index}
                                className="px-2 py-1 bg-secondary text-secondary-foreground text-xs rounded-full flex items-center gap-1"
                            >
                                <Tag className="w-3 h-3" />
                                {tag}
                            </span>
                        ))}
                        {document.tags.length > 3 && (
                            <span className="px-2 py-1 bg-secondary text-muted-foreground text-xs rounded-full">
                                +{document.tags.length - 3}
                            </span>
                        )}
                    </div>
                )}

                {document.url && (
                    <a
                        href={document.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 w-full px-3 py-2 text-sm text-primary hover:bg-teal-50 rounded-lg transition-colors"
                    >
                        <ExternalLink className="w-4 h-4" />
                        Open in Google Docs
                    </a>
                )}
            </div>
        </div>
    );
}

// Document Row Component for List View
function DocumentRow({ document, isSelected, onSelect, onEdit, onDelete, onArchive, onUnarchive, onDuplicate, onExport, onShare, showArchived }) {
    const [showMenu, setShowMenu] = useState(false);

    const formatDate = (timestamp) => {
        if (!timestamp) return 'Unknown';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        }).format(date);
    };

    return (
        <tr className="hover:bg-secondary">
            <td className="px-6 py-4">
                <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={onSelect}
                    className="rounded border-border"
                />
            </td>
            <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-muted-foreground" />
                    <span className="font-medium text-foreground">{document.title}</span>
                </div>
            </td>
            <td className="px-6 py-4">
                <span className="px-2 py-1 bg-secondary text-secondary-foreground text-xs rounded-full capitalize">
                    {document.type?.replace('-', ' ')}
                </span>
            </td>
            <td className="px-6 py-4">
                <div className="flex flex-wrap gap-1">
                    {document.tags?.slice(0, 2).map((tag, idx) => (
                        <span key={idx} className="px-2 py-1 bg-teal-50 text-teal-800 text-xs rounded-full">
                            {tag}
                        </span>
                    ))}
                    {document.tags?.length > 2 && (
                        <span className="px-2 py-1 bg-secondary text-muted-foreground text-xs rounded-full">
                            +{document.tags.length - 2}
                        </span>
                    )}
                </div>
            </td>
            <td className="px-6 py-4 text-sm text-muted-foreground">
                {formatDate(document.updated_at || document.created_at)}
            </td>
            <td className="px-6 py-4">
                <div className="flex items-center justify-end gap-2">
                    {document.url && (
                        <a
                            href={document.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-primary hover:bg-teal-50 rounded"
                            title="Open in Google Docs"
                        >
                            <ExternalLink className="w-4 h-4" />
                        </a>
                    )}
                    <button
                        onClick={() => onEdit(document)}
                        className="p-2 text-muted-foreground hover:bg-secondary rounded"
                        title="Edit"
                    >
                        <Edit className="w-4 h-4" />
                    </button>
                    <div className="relative">
                        <button
                            onClick={() => setShowMenu(!showMenu)}
                            className="p-2 text-muted-foreground hover:bg-secondary rounded"
                        >
                            <MoreVertical className="w-4 h-4" />
                        </button>
                        {showMenu && (
                            <>
                                <div 
                                    className="fixed inset-0 z-10" 
                                    onClick={() => setShowMenu(false)}
                                />
                                <div className="absolute right-0 mt-2 w-48 bg-card rounded-lg shadow-theme-lg border border-border py-1 z-20">
                                    <button
                                        onClick={() => { onDuplicate(document); setShowMenu(false); }}
                                        className="w-full px-4 py-2 text-left text-sm hover:bg-secondary flex items-center gap-2 text-foreground"
                                    >
                                        <Copy className="w-4 h-4" /> Duplicate
                                    </button>
                                    <button
                                        onClick={() => { onShare(document); setShowMenu(false); }}
                                        className="w-full px-4 py-2 text-left text-sm hover:bg-secondary flex items-center gap-2 text-foreground"
                                    >
                                        <Share2 className="w-4 h-4" /> Share
                                    </button>
                                    <button
                                        onClick={() => { onExport(document); setShowMenu(false); }}
                                        className="w-full px-4 py-2 text-left text-sm hover:bg-secondary flex items-center gap-2 text-foreground"
                                    >
                                        <Download className="w-4 h-4" /> Export
                                    </button>
                                    <div className="border-t border-border my-1" />
                                    {showArchived ? (
                                        <button
                                            onClick={() => { onUnarchive(document.id); setShowMenu(false); }}
                                            className="w-full px-4 py-2 text-left text-sm hover:bg-secondary flex items-center gap-2 text-foreground"
                                        >
                                            <ArchiveRestore className="w-4 h-4" /> Unarchive
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => { onArchive(document.id); setShowMenu(false); }}
                                            className="w-full px-4 py-2 text-left text-sm hover:bg-secondary flex items-center gap-2 text-foreground"
                                        >
                                            <Archive className="w-4 h-4" /> Archive
                                        </button>
                                    )}
                                    <button
                                        onClick={() => { onDelete(document.id); setShowMenu(false); }}
                                        className="w-full px-4 py-2 text-left text-sm hover:bg-secondary text-destructive flex items-center gap-2"
                                    >
                                        <Trash2 className="w-4 h-4" /> Delete
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </td>
        </tr>
    );
}