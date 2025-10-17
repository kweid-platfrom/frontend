'use client';
//@ts-nocheck

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import {
    FileText, Plus, Search, Trash2, ExternalLink,
    Edit, Download, Share2, Copy, MoreVertical, Loader2,
    Tag, Clock, User, SortAsc, SortDesc, Grid, List as ListIcon, X
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
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showEditor, setShowEditor] = useState(shouldAutoCreate);
    const [selectedDocument, setSelectedDocument] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [sortBy, setSortBy] = useState('created_at');
    const [sortDirection, setSortDirection] = useState('desc');
    const [viewMode, setViewMode] = useState('grid');
    const [selectedDocs, setSelectedDocs] = useState([]);
    const [showFilters, setShowFilters] = useState(false);
    
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
        }
    }, [suiteId, sprintId, sortBy, sortDirection]);

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

    const toggleDocSelection = (docId) => {
        setSelectedDocs(prev =>
            prev.includes(docId)
                ? prev.filter(id => id !== docId)
                : [...prev, docId]
        );
    };

    const filteredDocuments = documents.filter(doc => {
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
            <div className="h-full flex items-center justify-center bg-background p-4">
                <div className="text-center">
                    <FileText className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-base sm:text-lg font-medium text-foreground mb-2">No Suite Selected</h3>
                    <p className="text-sm text-muted-foreground">Please select a test suite to manage documents</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-background">
            {/* Header */}
            <div className="bg-card border-b border-border px-4 sm:px-6 py-3 sm:py-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-3 sm:mb-4">
                    <div className="flex-1 min-w-0">
                        <h1 className="text-xl sm:text-2xl font-bold text-foreground truncate">Documents</h1>
                        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                            Create and manage test documentation
                        </p>
                    </div>
                    <button
                        onClick={handleCreateNew}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/80 transition-colors whitespace-nowrap"
                    >
                        <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                        <span className="hidden sm:inline">New Document</span>
                        <span className="sm:hidden">New</span>
                    </button>
                </div>

                {/* Search and Filters Row */}
                <div className="flex flex-col gap-2">
                    {/* Mobile: Search Bar - Full Width Row 1 */}
                    <div className="relative sm:hidden">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search documents..."
                            className="w-full pl-9 pr-4 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>

                    {/* Mobile: Row 2 - Filters Button & View Toggle | Desktop: All in one row */}
                    <div className="flex items-center gap-2 sm:gap-3">
                        {/* Desktop: Search Bar */}
                        <div className="relative hidden sm:block sm:max-w-md">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search documents..."
                                className="w-full pl-10 pr-4 py-2 text-base border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>

                        {/* Toggle Filters Button (Mobile Only) */}
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="sm:hidden flex items-center justify-center gap-2 px-4 py-2 border border-border rounded-lg text-sm"
                        >
                            <span>Filters</span>
                            {showFilters ? <X className="w-4 h-4" /> : <SortAsc className="w-4 h-4" />}
                        </button>

                        {/* Filters (Desktop always visible, Mobile collapsible dropdown) */}
                        <div className={`${showFilters ? 'flex' : 'hidden'} sm:flex flex-col sm:flex-row gap-2 sm:gap-3 ${showFilters ? 'absolute left-0 right-0 bg-card border-t border-b border-border p-4 z-10 mt-10' : ''}`}>
                            <select
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value)}
                                className="px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-card"
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
                                className="px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-card"
                            >
                                <option value="created_at">Created Date</option>
                                <option value="updated_at">Modified Date</option>
                                <option value="title">Title</option>
                                <option value="type">Type</option>
                            </select>

                            <button
                                onClick={() => setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')}
                                className="p-2 border border-border rounded-lg hover:bg-secondary flex items-center justify-center"
                                title={`Sort ${sortDirection === 'asc' ? 'Descending' : 'Ascending'}`}
                            >
                                {sortDirection === 'asc' ? <SortAsc className="w-4 h-4 sm:w-5 sm:h-5" /> : <SortDesc className="w-4 h-4 sm:w-5 sm:h-5" />}
                            </button>
                        </div>

                        {/* View Toggle - Always on the right */}
                        <div className="flex border border-border rounded-lg ml-auto">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-2 ${viewMode === 'grid' ? 'bg-secondary' : 'hover:bg-secondary'}`}
                                title="Grid View"
                            >
                                <Grid className="w-4 h-4 sm:w-5 sm:h-5" />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-2 ${viewMode === 'list' ? 'bg-secondary' : 'hover:bg-secondary'}`}
                                title="List View"
                            >
                                <ListIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Bulk Actions Bar */}
                {selectedDocs.length > 0 && (
                    <div className="mt-3 sm:mt-4 p-3 bg-teal-50 border border-teal-300 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <span className="text-sm text-teal-800">
                            {selectedDocs.length} document{selectedDocs.length > 1 ? 's' : ''} selected
                        </span>
                        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                            <button
                                onClick={handleBulkDelete}
                                className="flex-1 sm:flex-none px-3 py-1.5 text-sm bg-card hover:bg-secondary border border-border text-destructive rounded-lg transition-colors"
                            >
                                <Trash2 className="w-4 h-4 inline mr-1" />
                                Delete
                            </button>
                            <button
                                onClick={() => setSelectedDocs([])}
                                className="flex-1 sm:flex-none px-3 py-1.5 text-sm text-foreground hover:bg-secondary rounded-lg transition-colors"
                            >
                                Clear
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-4 sm:p-6">
                {loading ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                            <Loader2 className="w-10 h-10 sm:w-12 sm:h-12 text-primary animate-spin mx-auto mb-4" />
                            <p className="text-sm text-muted-foreground">Loading documents...</p>
                        </div>
                    </div>
                ) : error ? (
                    <div className="bg-destructive/10 border border-destructive rounded-lg p-4 text-destructive text-sm">
                        {error}
                    </div>
                ) : filteredDocuments.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center px-4">
                            <FileText className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-base sm:text-lg font-medium text-foreground mb-2">
                                No documents found
                            </h3>
                            <p className="text-sm text-muted-foreground mb-6">
                                {searchQuery || filterType !== 'all'
                                    ? 'Try adjusting your search or filters'
                                    : 'Get started by creating your first document'}
                            </p>
                            {!searchQuery && filterType === 'all' && (
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                        {filteredDocuments.map(doc => (
                            <DocumentCard
                                key={doc.id}
                                document={doc}
                                isSelected={selectedDocs.includes(doc.id)}
                                onSelect={() => toggleDocSelection(doc.id)}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                                onDuplicate={handleDuplicate}
                                onExport={handleExport}
                                onShare={handleShare}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="bg-card rounded-lg shadow-theme-sm overflow-hidden">
                        {/* Desktop Table */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-secondary border-b border-border">
                                    <tr>
                                        <th className="w-12 px-4 lg:px-6 py-3">
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
                                        <th className="text-left px-4 lg:px-6 py-3 text-xs font-medium text-muted-foreground uppercase">Title</th>
                                        <th className="text-left px-4 lg:px-6 py-3 text-xs font-medium text-muted-foreground uppercase">Type</th>
                                        <th className="text-left px-4 lg:px-6 py-3 text-xs font-medium text-muted-foreground uppercase">Tags</th>
                                        <th className="text-left px-4 lg:px-6 py-3 text-xs font-medium text-muted-foreground uppercase">Modified</th>
                                        <th className="text-right px-4 lg:px-6 py-3 text-xs font-medium text-muted-foreground uppercase">Actions</th>
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
                                            onDuplicate={handleDuplicate}
                                            onExport={handleExport}
                                            onShare={handleShare}
                                        />
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile List */}
                        <div className="md:hidden divide-y divide-border">
                            {filteredDocuments.map(doc => (
                                <DocumentCard
                                    key={doc.id}
                                    document={doc}
                                    isSelected={selectedDocs.includes(doc.id)}
                                    onSelect={() => toggleDocSelection(doc.id)}
                                    onEdit={handleEdit}
                                    onDelete={handleDelete}
                                    onDuplicate={handleDuplicate}
                                    onExport={handleExport}
                                    onShare={handleShare}
                                    compact
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// Document Card Component for Grid View
function DocumentCard({ document, isSelected, onSelect, onEdit, onDelete, onDuplicate, onExport, onShare, compact = false }) {
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

    if (compact) {
        return (
            <div className={`bg-card p-4 ${isSelected ? 'bg-primary/5' : ''}`}>
                <div className="flex items-start gap-3">
                    <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={onSelect}
                        className="mt-1 rounded border-border flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                            <h3 className="font-semibold text-foreground line-clamp-2 text-sm flex-1">
                                {document.title}
                            </h3>
                            <div className="relative flex-shrink-0">
                                <button
                                    onClick={() => setShowMenu(!showMenu)}
                                    className="p-1 hover:bg-secondary rounded"
                                >
                                    <MoreVertical className="w-4 h-4 text-muted-foreground" />
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
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mb-2">
                            <span className="px-2 py-1 bg-secondary text-secondary-foreground rounded-full capitalize">
                                {document.type?.replace('-', ' ')}
                            </span>
                            <span>{formatDate(document.updated_at || document.created_at)}</span>
                        </div>
                        {document.tags && document.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                                {document.tags.slice(0, 2).map((tag, index) => (
                                    <span
                                        key={index}
                                        className="px-2 py-0.5 bg-teal-50 text-teal-800 text-xs rounded-full"
                                    >
                                        {tag}
                                    </span>
                                ))}
                                {document.tags.length > 2 && (
                                    <span className="px-2 py-0.5 bg-secondary text-muted-foreground text-xs rounded-full">
                                        +{document.tags.length - 2}
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`bg-card rounded-lg border ${isSelected ? 'border-primary ring-2 ring-primary/20' : 'border-border'} hover:shadow-theme-md transition-shadow`}>
            <div className="p-4 sm:p-6">
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
                        <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={onSelect}
                            className="mt-1 rounded border-border flex-shrink-0"
                        />
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-teal-50 rounded-lg flex items-center justify-center flex-shrink-0">
                            <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-teal-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-sm sm:text-base text-foreground line-clamp-2 mb-1">
                                {document.title}
                            </h3>
                            <span className="text-xs text-muted-foreground capitalize">
                                {document.type?.replace('-', ' ')}
                            </span>
                        </div>
                    </div>
                    <div className="relative flex-shrink-0">
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
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                        <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="text-xs">Modified: {formatDate(document.updated_at || document.created_at)}</span>
                    </div>
                    {document.created_by && (
                        <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                            <User className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span className="text-xs">Creator</span>
                        </div>
                    )}
                </div>

                {document.tags && document.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-4">
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
                        className="flex items-center justify-center gap-2 w-full px-3 py-2 text-xs sm:text-sm text-primary hover:bg-teal-50 rounded-lg transition-colors"
                    >
                        <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4" />
                        Open in Google Docs
                    </a>
                )}
            </div>
        </div>
    );
}

// Document Row Component for List View (Desktop)
function DocumentRow({ document, isSelected, onSelect, onEdit, onDelete, onDuplicate, onExport, onShare }) {
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
            <td className="px-4 lg:px-6 py-4">
                <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={onSelect}
                    className="rounded border-border"
                />
            </td>
            <td className="px-4 lg:px-6 py-4">
                <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                    <span className="font-medium text-foreground truncate">{document.title}</span>
                </div>
            </td>
            <td className="px-4 lg:px-6 py-4">
                <span className="px-2 py-1 bg-secondary text-secondary-foreground text-xs rounded-full capitalize whitespace-nowrap">
                    {document.type?.replace('-', ' ')}
                </span>
            </td>
            <td className="px-4 lg:px-6 py-4">
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
            <td className="px-4 lg:px-6 py-4 text-sm text-muted-foreground whitespace-nowrap">
                {formatDate(document.updated_at || document.created_at)}
            </td>
            <td className="px-4 lg:px-6 py-4">
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