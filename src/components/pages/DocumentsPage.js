'use client';
//@ts-nocheck

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import {
    FileText, Plus, Search, Trash2,
    Edit, Share2, Copy, MoreVertical, Loader2,
    Tag, Clock, User, SortAsc, SortDesc, Grid, List as ListIcon, X,
    Eye, ChevronLeft, ChevronRight, RefreshCw
} from 'lucide-react';
import DocumentEditor from '@/components/DocumentEditor';
import DocumentPreview from '@/components/doc-editor/DocumentPreview';
import { useApp } from '@/context/AppProvider';

export default function DocumentsDashboard({ suiteId: propSuiteId, sprintId: propSprintId = null }) {
    const { activeSuite, actions, currentUser } = useApp();
    const searchParams = useSearchParams();

    const suiteId = typeof propSuiteId === 'string'
        ? propSuiteId
        : propSuiteId?.id || activeSuite?.id;

    const sprintId = typeof propSprintId === 'string'
        ? propSprintId
        : propSprintId?.id || null;

    const shouldAutoCreate = searchParams?.get('create') === 'true';

    // State
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // View modes: 'list', 'preview', 'edit'
    const [viewMode, setViewMode] = useState('list');
    const [displayMode, setDisplayMode] = useState('grid'); // grid or list display
    const [selectedDocument, setSelectedDocument] = useState(null);
    const [loadingContent, setLoadingContent] = useState(false);

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [sortBy, setSortBy] = useState('updated_at');
    const [sortDirection, setSortDirection] = useState('desc');
    const [selectedDocs, setSelectedDocs] = useState([]);
    const [showFilters, setShowFilters] = useState(false);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 20;

    // Debug logging
    useEffect(() => {
        console.log('📄 DocumentsDashboard mounted/updated:', {
            suiteId,
            sprintId,
            documentsCount: documents.length,
            loading,
            viewMode,
            actionsAvailable: !!actions.documents
        });
    }, [suiteId, sprintId, documents.length, loading, viewMode]);

    // Check auto-create on mount
    useEffect(() => {
        if (shouldAutoCreate && suiteId) {
            console.log('🆕 Auto-creating document from URL param');
            setViewMode('edit');
            setSelectedDocument(null);
        }
    }, [shouldAutoCreate, suiteId]);

    // FIXED: Load documents using proper API call
    const loadDocuments = useCallback(async () => {
        if (!suiteId) {
            console.log('⚠️ No suiteId, skipping document load');
            setLoading(false);
            return;
        }

        if (!currentUser) {
            console.log('⚠️ No authenticated user');
            setLoading(false);
            return;
        }

        console.log('🔄 Loading documents...', { suiteId, sprintId, sortBy, sortDirection });

        try {
            setLoading(true);
            setError('');
            
            // Build query parameters
            const params = new URLSearchParams({
                suiteId,
                orderBy: sortBy,
                orderDirection: sortDirection
            });

            if (sprintId) {
                params.append('sprintId', sprintId);
            }

            // Fetch documents metadata from Firestore (NO CONTENT)
            const response = await fetch(`/api/documents?${params.toString()}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error?.message || 'Failed to load documents');
            }

            const result = await response.json();

            console.log('📊 Documents load result:', {
                success: result?.success,
                dataCount: result?.data?.length || 0,
                error: result?.error?.message
            });

            if (result?.success) {
                const docs = Array.isArray(result.data) ? result.data : [];
                console.log('✅ Documents loaded successfully:', docs.length);

                // Documents now only contain metadata + Google Doc URL
                // Content is NOT loaded here for performance
                setDocuments(docs);
                setError('');
            } else {
                const errorMsg = result?.error?.message || 'Failed to load documents';
                console.error('❌ Load failed:', errorMsg);
                setError(errorMsg);
                setDocuments([]);
            }
        } catch (err) {
            console.error('💥 Exception loading documents:', err);
            setError('Failed to load documents: ' + err.message);
            setDocuments([]);

            actions.ui.showNotification?.({
                id: 'docs-load-error',
                type: 'error',
                message: `Failed to load documents: ${err.message}`,
                duration: 5000
            });
        } finally {
            setLoading(false);
        }
    }, [suiteId, sprintId, sortBy, sortDirection, currentUser]);

    // Load on mount and when dependencies change
    useEffect(() => {
        console.log('🎯 Load effect triggered');
        if (suiteId && currentUser) {
            loadDocuments();
        }
    }, [suiteId, sprintId, sortBy, sortDirection, loadDocuments, currentUser]);

    // FIXED: Fetch document content on-demand for viewing/editing
    const fetchDocumentWithContent = useCallback(async (doc) => {
        if (!doc.googleDoc?.docId) {
            console.warn('⚠️ Document has no Google Doc integration:', doc.id);
            return doc;
        }

        console.log('📥 Fetching content for document:', doc.id);
        setLoadingContent(true);

        try {

            // ✅ JUST MAKE THE REQUEST
            const response = await fetch(`/api/docs/${doc.googleDoc.docId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch document content');
            }

            const googleDocData = await response.json();

            return {
                ...doc,
                content: googleDocData.content
            };
        } catch (err) {
            console.error('💥 Error fetching content:', err);
            actions.ui.showNotification?.({
                id: 'fetch-content-error',
                type: 'error',
                message: `Failed to load content: ${err.message}`,
                duration: 5000
            });
            return doc;
        } finally {
            setLoadingContent(false);
        }
    }, [actions.ui]); // ✅ Remove currentUser from dependencies

    // Filtered documents with client-side pagination
    const { paginatedDocuments, totalPages, totalFiltered } = useMemo(() => {
        const filtered = documents.filter(doc => {
            const matchesSearch =
                doc.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                doc.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
            const matchesType = filterType === 'all' || doc.type === filterType;
            return matchesSearch && matchesType;
        });

        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const paginated = filtered.slice(startIndex, endIndex);
        const pages = Math.ceil(filtered.length / itemsPerPage);

        return {
            paginatedDocuments: paginated,
            totalPages: pages,
            totalFiltered: filtered.length
        };
    }, [documents, searchQuery, filterType, currentPage, itemsPerPage]);

    const documentTypes = useMemo(() =>
        [...new Set(documents.map(d => d.type).filter(Boolean))],
        [documents]
    );

    // FIXED: Handlers to fetch content when needed
    const handleView = async (doc) => {
        console.log('👁️ Viewing document:', doc.id);

        // Fetch content if not already loaded
        const docWithContent = doc.content ? doc : await fetchDocumentWithContent(doc);

        setSelectedDocument(docWithContent);
        setViewMode('preview');
    };

    const handleEdit = async (doc) => {
        console.log('✏️ Editing document:', doc.id);

        // Fetch content if not already loaded
        const docWithContent = doc.content ? doc : await fetchDocumentWithContent(doc);

        setSelectedDocument(docWithContent);
        setViewMode('edit');
    };

    const handleCreateNew = () => {
        console.log('🆕 Creating new document');
        setSelectedDocument(null);
        setViewMode('edit');
    };

    const handleBackToList = () => {
        console.log('◀️ Returning to list view');
        setViewMode('list');
        setSelectedDocument(null);

        // Clear URL param if present
        if (shouldAutoCreate && window.history.replaceState) {
            const url = new URL(window.location.href);
            url.searchParams.delete('create');
            window.history.replaceState({}, '', url);
        }
    };

    const handleSaveSuccess = () => {
        console.log('💾 Document saved, refreshing list...');
        handleBackToList();
        // Reload documents immediately
        loadDocuments();
    };

    const handleRefresh = () => {
        console.log('🔄 Manual refresh triggered');
        loadDocuments();
    };

    const handleDelete = async (docId) => {
        if (!confirm('Move this document to trash?')) return;

        console.log('🗑️ Deleting document:', docId);
        try {
            const result = await actions.documents.deleteDocument(docId, suiteId, sprintId);
            if (result?.success) {
                console.log('✅ Document deleted');
                if (viewMode === 'preview' || viewMode === 'edit') {
                    handleBackToList();
                }
                loadDocuments(); // Refresh list
            } else {
                console.error('❌ Delete failed:', result?.error);
            }
        } catch (err) {
            console.error('💥 Delete exception:', err);
        }
    };

    const handleDuplicate = async (doc) => {
        console.log('📋 Duplicating document:', doc.id);

        try {
            // Fetch content first if not already loaded
            const docWithContent = doc.content ? doc : await fetchDocumentWithContent(doc);

            // Create duplicate with content
            const result = await actions.documents.createDocument(
                suiteId,
                {
                    title: `${doc.title} (Copy)`,
                    content: docWithContent.content || '',
                    type: doc.type,
                    tags: doc.tags || [],
                    metadata: {
                        status: 'draft',
                        version: '1.0'
                    }
                },
                sprintId
            );

            if (result?.success) {
                console.log('✅ Document duplicated');
                actions.ui.showNotification?.({
                    id: 'duplicate-success',
                    type: 'success',
                    message: 'Document duplicated successfully',
                    duration: 3000
                });
                loadDocuments(); // Refresh list
            } else {
                console.error('❌ Duplicate failed:', result?.error);
            }
        } catch (err) {
            console.error('💥 Duplicate exception:', err);
        }
    };

    const handleShare = async (doc) => {
        const emails = prompt('Enter email addresses (comma-separated):');
        if (!emails) return;

        try {
            const response = await fetch('/api/documents/share', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
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
            actions.ui.showNotification?.({
                id: 'share-error',
                type: 'error',
                message: `Failed to share: ${err.message}`,
                duration: 5000
            });
        }
    };
    const handleBulkDelete = async () => {
        if (!confirm(`Move ${selectedDocs.length} documents to trash?`)) return;

        try {
            const result = await actions.archive.bulkDelete(suiteId, 'documents', selectedDocs, sprintId);
            if (result?.success) {
                console.log('✅ Bulk delete completed');
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

    // Render edit mode
    if (viewMode === 'edit') {
        return (
            <DocumentEditor
                suiteId={suiteId}
                sprintId={sprintId}
                existingDocument={selectedDocument}
                onSaveSuccess={handleSaveSuccess}
                onCancel={handleBackToList}
            />
        );
    }

    // Render preview mode using external component
    if (viewMode === 'preview' && selectedDocument) {
        if (loadingContent) {
            return (
                <div className="h-full flex items-center justify-center bg-background">
                    <div className="text-center">
                        <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
                        <p className="text-sm text-muted-foreground">Loading document content...</p>
                    </div>
                </div>
            );
        }

        return (
            <DocumentPreview
                document={selectedDocument}
                onEdit={handleEdit}
                onClose={handleBackToList}
                onDelete={handleDelete}
                onDuplicate={handleDuplicate}
                onShare={handleShare}
            />
        );
    }

    // No suite selected
    if (!suiteId) {
        return (
            <div className="h-full flex items-center justify-center bg-background p-4">
                <div className="text-center">
                    <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">No Suite Selected</h3>
                    <p className="text-sm text-muted-foreground">Please select a test suite to manage documents</p>
                </div>
            </div>
        );
    }

    // Render list view
    return (
        <div className="h-full flex flex-col bg-background">
            {/* Header */}
            <div className="bg-card border-b border-border px-4 sm:px-6 py-3 sm:py-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-3 sm:mb-4">
                    <div className="flex-1 min-w-0">
                        <h1 className="text-xl sm:text-2xl font-bold text-foreground truncate">Documents</h1>
                        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                            {loading ? 'Loading...' : `${totalFiltered} document${totalFiltered !== 1 ? 's' : ''}`}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleRefresh}
                            disabled={loading}
                            className="flex items-center justify-center gap-2 px-3 py-2 border border-border rounded hover:bg-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Refresh documents"
                        >
                            <RefreshCw className={`w-4 h-4 sm:w-5 sm:h-5 ${loading ? 'animate-spin' : ''}`} />
                            <span className="hidden sm:inline text-sm">Refresh</span>
                        </button>
                        <button
                            onClick={handleCreateNew}
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors whitespace-nowrap"
                        >
                            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                            <span className="hidden sm:inline">New Document</span>
                            <span className="sm:hidden">New</span>
                        </button>
                    </div>
                </div>

                {/* Search and Filters */}
                <div className="flex flex-col gap-2">
                    <div className="relative sm:hidden">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search documents..."
                            className="w-full pl-9 pr-4 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                        />
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3">
                        <div className="relative hidden sm:block sm:max-w-md">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search documents..."
                                className="w-full pl-10 pr-4 py-2 text-base border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                            />
                        </div>

                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="sm:hidden flex items-center justify-center gap-2 px-4 py-2 border border-border rounded-lg text-sm"
                        >
                            <span>Filters</span>
                            {showFilters ? <X className="w-4 h-4" /> : <SortAsc className="w-4 h-4" />}
                        </button>

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
                                <option value="updated_at">Modified Date</option>
                                <option value="created_at">Created Date</option>
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

                        <div className="flex border border-border rounded-lg ml-auto">
                            <button
                                onClick={() => setDisplayMode('grid')}
                                className={`p-2 ${displayMode === 'grid' ? 'bg-secondary' : 'hover:bg-secondary'}`}
                                title="Grid View"
                            >
                                <Grid className="w-4 h-4 sm:w-5 sm:h-5" />
                            </button>
                            <button
                                onClick={() => setDisplayMode('list')}
                                className={`p-2 ${displayMode === 'list' ? 'bg-secondary' : 'hover:bg-secondary'}`}
                                title="List View"
                            >
                                <ListIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                            </button>
                        </div>
                    </div>
                </div>

                {selectedDocs.length > 0 && (
                    <div className="mt-3 sm:mt-4 p-3 bg-teal-50 dark:bg-teal-900/30 border border-teal-300 dark:border-teal-700 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <span className="text-sm text-teal-800 dark:text-teal-200">
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
                            <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
                            <p className="text-sm text-muted-foreground">Loading documents...</p>
                        </div>
                    </div>
                ) : error ? (
                    <div className="bg-destructive/10 border border-destructive rounded-lg p-4 text-destructive text-sm">
                        {error}
                        <button
                            onClick={handleRefresh}
                            className="ml-4 underline hover:no-underline"
                        >
                            Try again
                        </button>
                    </div>
                ) : paginatedDocuments.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center px-4">
                            <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-foreground mb-2">
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
                                    className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
                                >
                                    Create Document
                                </button>
                            )}
                        </div>
                    </div>
                ) : (
                    <>
                        {displayMode === 'grid' ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                                {paginatedDocuments.map(doc => (
                                    <DocumentCard
                                        key={doc.id}
                                        document={doc}
                                        isSelected={selectedDocs.includes(doc.id)}
                                        onSelect={() => toggleDocSelection(doc.id)}
                                        onView={handleView}
                                        onEdit={handleEdit}
                                        onDelete={handleDelete}
                                        onDuplicate={handleDuplicate}
                                        onShare={handleShare}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="bg-card rounded-lg shadow-theme-sm overflow-hidden">
                                <div className="hidden md:block overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-secondary border-b border-border">
                                            <tr>
                                                <th className="w-12 px-6 py-3">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedDocs.length === paginatedDocuments.length && paginatedDocuments.length > 0}
                                                        onChange={(e) => {
                                                            if (e.target.checked) {
                                                                setSelectedDocs(paginatedDocuments.map(d => d.id));
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
                                            {paginatedDocuments.map(doc => (
                                                <DocumentRow
                                                    key={doc.id}
                                                    document={doc}
                                                    isSelected={selectedDocs.includes(doc.id)}
                                                    onSelect={() => toggleDocSelection(doc.id)}
                                                    onView={handleView}
                                                    onEdit={handleEdit}
                                                    onDelete={handleDelete}
                                                    onDuplicate={handleDuplicate}
                                                    onShare={handleShare}
                                                />
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="md:hidden divide-y divide-border">
                                    {paginatedDocuments.map(doc => (
                                        <DocumentCard
                                            key={doc.id}
                                            document={doc}
                                            isSelected={selectedDocs.includes(doc.id)}
                                            onSelect={() => toggleDocSelection(doc.id)}
                                            onView={handleView}
                                            onEdit={handleEdit}
                                            onDelete={handleDelete}
                                            onDuplicate={handleDuplicate}
                                            onShare={handleShare}
                                            compact
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-center gap-2 mt-6">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="p-2 border border-border rounded hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                                <span className="text-sm text-muted-foreground">
                                    Page {currentPage} of {totalPages}
                                </span>
                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="p-2 border border-border rounded hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

// Document Card Component
function DocumentCard({ document, isSelected, onSelect, onView, onEdit, onDelete, onDuplicate, onShare, compact = false }) {
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
            <div className={`bg-card p-4 ${isSelected ? 'bg-primary/5' : ''} hover:bg-secondary/50 transition-colors cursor-pointer`}>
                <div className="flex items-start gap-3">
                    <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                            e.stopPropagation();
                            onSelect();
                        }}
                        className="mt-1 rounded border-border flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0" onClick={() => onView(document)}>
                        <div className="flex items-start justify-between gap-2 mb-2">
                            <h3 className="font-semibold text-foreground line-clamp-2 text-sm flex-1">
                                {document.title}
                            </h3>
                            <div className="relative flex-shrink-0" onClick={(e) => e.stopPropagation()}>
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
                                                onClick={() => { onView(document); setShowMenu(false); }}
                                                className="w-full px-4 py-2 text-left text-sm hover:bg-secondary flex items-center gap-2 text-foreground"
                                            >
                                                <Eye className="w-4 h-4" /> View
                                            </button>
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
                            <span>{formatDate(document.metadata?.lastModified || document.updated_at || document.created_at)}</span>
                        </div>
                        {document.tags && document.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                                {document.tags.slice(0, 2).map((tag, index) => (
                                    <span
                                        key={index}
                                        className="px-2 py-0.5 bg-teal-50 dark:bg-teal-900/30 text-teal-800 dark:text-teal-200 text-xs rounded-full"
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
        <div
            className={`bg-card rounded-lg border ${isSelected ? 'border-primary ring-2 ring-primary/20' : 'border-border'} hover:shadow-theme-md transition-all cursor-pointer`}
            onClick={() => onView(document)}
        >
            <div className="p-4 sm:p-6">
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
                        <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                                e.stopPropagation();
                                onSelect();
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="mt-1 rounded border-border flex-shrink-0"
                        />
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-teal-50 dark:bg-teal-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                            <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-teal-600 dark:text-teal-400" />
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
                    <div className="relative flex-shrink-0" onClick={(e) => e.stopPropagation()}>
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
                                        onClick={() => { onView(document); setShowMenu(false); }}
                                        className="w-full px-4 py-2 text-left text-sm hover:bg-secondary flex items-center gap-2 text-foreground"
                                    >
                                        <Eye className="w-4 h-4" /> View
                                    </button>
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
                        <span className="text-xs">Modified: {formatDate(document.metadata?.lastModified || document.updated_at || document.created_at)}</span>
                    </div>
                    {document.metadata?.modifiedBy && (
                        <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                            <User className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span className="text-xs">{document.metadata.modifiedBy}</span>
                        </div>
                    )}
                    {document.googleDoc?.url && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <FileText className="w-3 h-3" />
                            <a
                                href={document.googleDoc.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline"
                                onClick={(e) => e.stopPropagation()}
                            >
                                View in Google Docs
                            </a>
                        </div>
                    )}
                </div>

                {document.tags && document.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                        {document.tags.slice(0, 3).map((tag, index) => (
                            <span
                                key={index}
                                className="px-2 py-1 bg-teal-50 dark:bg-teal-900/30 text-teal-800 dark:text-teal-200 text-xs rounded-full flex items-center gap-1"
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
            </div>
        </div>
    );
}

// Document Row Component for List View
function DocumentRow({ document, isSelected, onSelect, onView, onEdit, onDelete, onDuplicate, onShare }) {
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
        <tr className="hover:bg-secondary cursor-pointer" onClick={() => onView(document)}>
            <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={onSelect}
                    className="rounded border-border"
                />
            </td>
            <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                        <span className="font-medium text-foreground truncate block">{document.title}</span>
                        {document.googleDoc?.url && (
                            <a
                                href={document.googleDoc.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-primary hover:underline"
                                onClick={(e) => e.stopPropagation()}
                            >
                                View in Google Docs
                            </a>
                        )}
                    </div>
                </div>
            </td>
            <td className="px-6 py-4">
                <span className="px-2 py-1 bg-secondary text-secondary-foreground text-xs rounded-full capitalize whitespace-nowrap">
                    {document.type?.replace('-', ' ')}
                </span>
            </td>
            <td className="px-6 py-4">
                <div className="flex flex-wrap gap-1">
                    {document.tags?.slice(0, 2).map((tag, idx) => (
                        <span key={idx} className="px-2 py-1 bg-teal-50 dark:bg-teal-900/30 text-teal-800 dark:text-teal-200 text-xs rounded-full">
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
            <td className="px-6 py-4 text-sm text-muted-foreground whitespace-nowrap">
                {formatDate(document.metadata?.lastModified || document.updated_at || document.created_at)}
            </td>
            <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-end gap-2">
                    <button
                        onClick={() => onView(document)}
                        className="p-2 text-primary hover:bg-teal-50 dark:hover:bg-teal-900/30 rounded"
                        title="View"
                    >
                        <Eye className="w-4 h-4" />
                    </button>
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