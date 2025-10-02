'use client';
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Archive, Trash2, Calendar, Grid3x3, List, CheckSquare, Square, RotateCcw, Clock } from 'lucide-react';
import { useApp } from '../../context/AppProvider';
import { FilterControls } from '../../components/archiveTrash/FilterControls';
import { EmptyState } from '../../components/archiveTrash/EmptyState';
import EnhancedBulkActionsBar from '../../components/common/EnhancedBulkActionsBar';

// List View Item Component
const ListViewItem = ({ item, isSelected, onSelect, onRestore, onPermanentDelete, isTrash }) => {
  const getItemName = () => item.name || item.title || `${item.type} #${item.id}`;
  const getRetentionDate = () => {
    const retentionDate = isTrash ? item.delete_retention_until : item.archive_retention_until;
    if (!retentionDate) return null;
    try {
      return retentionDate?.toDate ? retentionDate.toDate() : new Date(retentionDate);
    } catch {
      return null;
    }
  };

  const retentionDate = getRetentionDate();
  const isExpired = retentionDate && new Date() > retentionDate;

  return (
    <div className={`flex items-center px-4 py-4 border-b border-border hover:bg-muted/30 transition-colors ${isSelected ? 'bg-accent/10' : 'bg-card'}`}>
      <button
        onClick={() => onSelect(item.id)}
        className="mr-4 text-muted-foreground hover:text-foreground transition-colors"
      >
        {isSelected ? <CheckSquare className="w-5 h-5 text-primary" /> : <Square className="w-5 h-5" />}
      </button>

      <div className="flex-1 grid grid-cols-12 gap-4 items-center">
        <div className="col-span-4">
          <h3 className="font-medium text-foreground">{getItemName()}</h3>
          <span className="text-xs text-muted-foreground capitalize">{item.type}</span>
        </div>

        <div className="col-span-3 text-sm text-muted-foreground truncate">
          {item.description || 'No description'}
        </div>

        <div className="col-span-2 text-sm">
          {retentionDate ? (
            <div className={`flex items-center space-x-1 ${isExpired ? 'text-error' : 'text-muted-foreground'}`}>
              <Clock className="w-4 h-4" />
              <span>{retentionDate.toLocaleDateString()}</span>
            </div>
          ) : (
            <span className="text-muted-foreground/50">No date</span>
          )}
        </div>

        <div className="col-span-3 flex justify-end space-x-2">
          <button
            onClick={() => onRestore(item)}
            className="p-2 text-success hover:bg-success/10 rounded-lg transition-colors"
            title="Restore"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={() => onPermanentDelete(item)}
            className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
            title="Delete Forever"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

// Grid View Item Component
const GridViewItem = ({ item, isSelected, onSelect, onRestore, onPermanentDelete, isTrash }) => {
  const getItemName = () => item.name || item.title || `${item.type} #${item.id}`;
  const getRetentionDate = () => {
    const retentionDate = isTrash ? item.delete_retention_until : item.archive_retention_until;
    if (!retentionDate) return null;
    try {
      return retentionDate?.toDate ? retentionDate.toDate() : new Date(retentionDate);
    } catch {
      return null;
    }
  };

  const retentionDate = getRetentionDate();
  const isExpired = retentionDate && new Date() > retentionDate;

  return (
    <div className={`relative p-4 bg-card border border-border rounded-lg hover:shadow-theme-md transition-all ${isSelected ? 'ring-2 ring-primary' : ''}`}>
      <button
        onClick={() => onSelect(item.id)}
        className="absolute top-3 left-3 text-muted-foreground hover:text-foreground transition-colors"
      >
        {isSelected ? <CheckSquare className="w-5 h-5 text-primary" /> : <Square className="w-5 h-5" />}
      </button>

      <div className="pl-8 mb-3">
        <h3 className="font-medium text-foreground mb-1 truncate">{getItemName()}</h3>
        <span className="text-xs text-muted-foreground capitalize">{item.type}</span>
      </div>

      {retentionDate && (
        <div className={`flex items-center space-x-1 text-sm mb-3 ${isExpired ? 'text-error' : 'text-muted-foreground'}`}>
          <Clock className="w-4 h-4" />
          <span>{retentionDate.toLocaleDateString()}</span>
        </div>
      )}

      <div className="flex justify-end space-x-2 pt-2 border-t border-border">
        <button
          onClick={() => onRestore(item)}
          className="p-2 text-success hover:bg-success/10 rounded-lg transition-colors"
          title="Restore"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
        <button
          onClick={() => onPermanentDelete(item)}
          className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
          title="Delete Forever"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

const ArchiveTrashPage = () => {
  const { actions, activeSuite, isAuthenticated } = useApp();

  const [activeTab, setActiveTab] = useState('archived');
  const [viewMode, setViewMode] = useState('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItems, setSelectedItems] = useState([]);
  const [filterType, setFilterType] = useState('all');
  const [showExpiredOnly, setShowExpiredOnly] = useState(false);
  const [localArchivedItems, setLocalArchivedItems] = useState([]);
  const [localTrashedItems, setLocalTrashedItems] = useState([]);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const actionsRef = useRef(actions);
  actionsRef.current = actions;

  const suiteId = activeSuite?.id;
  const suiteIdRef = useRef(suiteId);
  suiteIdRef.current = suiteId;

  const loadData = useCallback(async () => {
    const currentSuiteId = suiteIdRef.current;
    const currentActions = actionsRef.current;

    if (!isAuthenticated || !currentSuiteId) {
      setLocalArchivedItems([]);
      setLocalTrashedItems([]);
      setDataLoaded(true);
      return;
    }

    setIsLoading(true);
    setError(null);
    setDataLoaded(false);

    try {
      const assetTypes = ['testCases', 'bugs', 'recordings', 'sprints'];
      const results = { archived: [], trashed: [] };

      for (const assetType of assetTypes) {
        try {
          const archivedResult = await currentActions.archive.loadArchivedItems(currentSuiteId, assetType);
          if (archivedResult?.success && Array.isArray(archivedResult.data)) {
            const items = archivedResult.data.map(item => ({
              ...item,
              type: assetType,
              id: item.id || `${assetType}_${Date.now()}_${Math.random()}`
            }));
            results.archived.push(...items);
          }

          const trashedResult = await currentActions.archive.loadTrashedItems(currentSuiteId, assetType);
          if (trashedResult?.success && Array.isArray(trashedResult.data)) {
            const items = trashedResult.data.map(item => ({
              ...item,
              type: assetType,
              id: item.id || `${assetType}_${Date.now()}_${Math.random()}`
            }));
            results.trashed.push(...items);
          }
        } catch (assetError) {
          console.error(`Error loading ${assetType}:`, assetError);
        }
      }

      const validArchived = results.archived.filter(item => item && item.id);
      const validTrashed = results.trashed.filter(item => item && item.id);

      setLocalArchivedItems(validArchived);
      setLocalTrashedItems(validTrashed);
      setDataLoaded(true);
    } catch (error) {
      console.error('Failed to load archive/trash data:', error);
      setError(error.message || 'Failed to load data');
      setLocalArchivedItems([]);
      setLocalTrashedItems([]);
      setDataLoaded(true);

      if (!error.message?.includes('permission') && !error.message?.includes('access')) {
        currentActions.ui?.showNotification?.({
          id: 'load-archive-error',
          type: 'error',
          message: 'Failed to load archived and deleted items',
          duration: 5000,
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated && suiteId) {
      loadData();
    } else if (!isAuthenticated || !suiteId) {
      setLocalArchivedItems([]);
      setLocalTrashedItems([]);
      setDataLoaded(true);
      setError(null);
    }
  }, [loadData, isAuthenticated, suiteId]);

  useEffect(() => {
    setSelectedItems([]);
  }, [activeTab]);

  const currentItems = useMemo(() =>
    activeTab === 'archived' ? localArchivedItems : localTrashedItems,
    [activeTab, localArchivedItems, localTrashedItems]
  );

  const filteredItems = useMemo(() => {
    if (!Array.isArray(currentItems)) return [];

    let items = currentItems.filter(item => {
      if (!item) return false;
      const name = item.name || item.title || `${item.type} #${item.id}`;
      return name.toLowerCase().includes(searchTerm.toLowerCase());
    });

    if (filterType !== 'all') {
      items = items.filter(item => item?.type === filterType);
    }

    if (showExpiredOnly) {
      items = items.filter(item => {
        try {
          const retentionDate = activeTab === 'archived'
            ? item.archive_retention_until
            : item.delete_retention_until;
          if (!retentionDate) return false;
          const retentionDateObj = retentionDate?.toDate ? retentionDate.toDate() : new Date(retentionDate);
          return new Date() > retentionDateObj;
        } catch {
          return false;
        }
      });
    }

    return items;
  }, [currentItems, searchTerm, filterType, showExpiredOnly, activeTab]);

  const expiredCount = useMemo(() => {
    if (!Array.isArray(filteredItems)) return 0;

    return filteredItems.filter(item => {
      try {
        const retentionDate = activeTab === 'archived'
          ? item.archive_retention_until
          : item.delete_retention_until;
        if (!retentionDate) return false;
        const retentionDateObj = retentionDate?.toDate ? retentionDate.toDate() : new Date(retentionDate);
        return new Date() > retentionDateObj;
      } catch {
        return false;
      }
    }).length;
  }, [filteredItems, activeTab]);

  const handleSelectItem = useCallback((itemId) => {
    setSelectedItems(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  }, []);

  const handleSelectAll = useCallback(() => {
    setSelectedItems(prev =>
      prev.length === filteredItems.length
        ? []
        : filteredItems.map(item => item.id)
    );
  }, [filteredItems]);

  const removeFromLocalState = useCallback((itemIds) => {
    const idsArray = Array.isArray(itemIds) ? itemIds : [itemIds];
    if (activeTab === 'archived') {
      setLocalArchivedItems(prev => prev.filter(i => !idsArray.includes(i.id)));
    } else {
      setLocalTrashedItems(prev => prev.filter(i => !idsArray.includes(i.id)));
    }
    setSelectedItems(prev => prev.filter(id => !idsArray.includes(id)));
  }, [activeTab]);

  const handleRestore = useCallback(async (item) => {
    const currentSuiteId = suiteIdRef.current;
    const currentActions = actionsRef.current;

    if (!currentSuiteId || !item?.id) return;

    try {
      const result = activeTab === 'archived'
        ? await currentActions.archive.unarchiveItem(currentSuiteId, item.type, item.id, item.sprint_id)
        : await currentActions.archive.restoreFromTrash(currentSuiteId, item.type, item.id, item.sprint_id);

      if (result?.success) {
        removeFromLocalState(item.id);
        currentActions.ui?.showNotification?.({
          id: `restore-${item.id}`,
          type: 'success',
          message: `${item.type.slice(0, -1)} restored successfully`,
          duration: 3000,
        });
      } else {
        throw new Error(result?.error?.message || 'Restore operation failed');
      }
    } catch (error) {
      console.error('Failed to restore item:', error);
      actionsRef.current.ui?.showNotification?.({
        id: 'restore-error',
        type: 'error',
        message: `Failed to restore item: ${error.message}`,
        duration: 5000,
      });
    }
  }, [activeTab, removeFromLocalState]);

  const handlePermanentDelete = useCallback(async (item) => {
    const currentSuiteId = suiteIdRef.current;
    const currentActions = actionsRef.current;

    if (!currentSuiteId || !item?.id) return;

    const itemName = item.name || item.title || `${item.type.slice(0, -1)} #${item.id}`;
    if (!window.confirm(`Permanently delete "${itemName}"? This cannot be undone.`)) return;

    try {
      const result = await currentActions.archive.permanentlyDelete(currentSuiteId, item.type, item.id, item.sprint_id);
      if (result?.success) {
        removeFromLocalState(item.id);
        currentActions.ui?.showNotification?.({
          id: `delete-${item.id}`,
          type: 'success',
          message: `${item.type.slice(0, -1)} permanently deleted`,
          duration: 3000,
        });
      } else {
        throw new Error(result?.error?.message || 'Delete operation failed');
      }
    } catch (error) {
      console.error('Failed to delete item:', error);
      actionsRef.current.ui?.showNotification?.({
        id: 'delete-error',
        type: 'error',
        message: `Failed to permanently delete item: ${error.message}`,
        duration: 5000,
      });
    }
  }, [removeFromLocalState]);

  const handleBulkAction = useCallback(async (actionId, itemIds) => {
    const currentSuiteId = suiteIdRef.current;
    const currentActions = actionsRef.current;

    if (!currentSuiteId || !itemIds || itemIds.length === 0) return;

    const items = filteredItems.filter(item => itemIds.includes(item.id));

    if (actionId === 'restore') {
      const confirmMessage = `Restore ${items.length} item${items.length !== 1 ? 's' : ''}?`;
      if (!window.confirm(confirmMessage)) return;

      let successCount = 0;
      for (const item of items) {
        try {
          const result = activeTab === 'archived'
            ? await currentActions.archive.unarchiveItem(currentSuiteId, item.type, item.id, item.sprint_id)
            : await currentActions.archive.restoreFromTrash(currentSuiteId, item.type, item.id, item.sprint_id);

          if (result?.success) {
            successCount++;
          }
        } catch (error) {
          console.error(`Failed to restore item ${item.id}:`, error);
        }
      }

      removeFromLocalState(itemIds);
      currentActions.ui?.showNotification?.({
        id: 'bulk-restore',
        type: 'success',
        message: `${successCount} item${successCount !== 1 ? 's' : ''} restored successfully`,
        duration: 3000,
      });
    } else if (actionId === 'permanent-delete') {
      const confirmMessage = `Permanently delete ${items.length} item${items.length !== 1 ? 's' : ''}? This cannot be undone.`;
      if (!window.confirm(confirmMessage)) return;

      let successCount = 0;
      for (const item of items) {
        try {
          const result = await currentActions.archive.permanentlyDelete(currentSuiteId, item.type, item.id, item.sprint_id);
          if (result?.success) {
            successCount++;
          }
        } catch (error) {
          console.error(`Failed to delete item ${item.id}:`, error);
        }
      }

      removeFromLocalState(itemIds);
      currentActions.ui?.showNotification?.({
        id: 'bulk-delete',
        type: 'success',
        message: `${successCount} item${successCount !== 1 ? 's' : ''} permanently deleted`,
        duration: 3000,
      });
    }
  }, [filteredItems, activeTab, removeFromLocalState]);

  if (!isAuthenticated) {
    return <EmptyState type="auth" />;
  }

  if (!activeSuite) {
    return <EmptyState type="suite" />;
  }

  return (
    <div className="max-w-8xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Archive & Trash - {activeSuite.name}
        </h1>
        <p className="text-muted-foreground">
          Manage archived and deleted items. Items are automatically deleted after their retention period expires.
        </p>
      </div>

      {/* Error State */}
      {error && (
        <div className="mb-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
          <p className="text-destructive text-sm">Error loading data: {error}</p>
          <button
            onClick={loadData}
            className="mt-2 px-3 py-1 bg-destructive text-destructive-foreground text-sm rounded hover:bg-destructive/90"
          >
            Retry
          </button>
        </div>
      )}

      {/* Tabs and View Toggle */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex space-x-1 border-b border-border">
          {[
            { key: 'archived', label: 'Archived', icon: Archive, count: localArchivedItems.length },
            { key: 'trash', label: 'Trash', icon: Trash2, count: localTrashedItems.length }
          ].map(({ key, label, icon: Icon, count }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                activeTab === key
                  ? 'bg-accent text-accent-foreground border-b-2 border-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Icon className="w-4 h-4" />
                <span>{label} ({count})</span>
              </div>
            </button>
          ))}
        </div>

        <div className="flex space-x-2">
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground hover:bg-accent/50'}`}
          >
            <List className="w-5 h-5" />
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground hover:bg-accent/50'}`}
          >
            <Grid3x3 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Controls */}
      <FilterControls
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filterType={filterType}
        setFilterType={setFilterType}
        showExpiredOnly={showExpiredOnly}
        setShowExpiredOnly={setShowExpiredOnly}
        expiredCount={expiredCount}
        filteredItems={filteredItems}
        selectedItems={selectedItems}
        onSelectAll={handleSelectAll}
      />

      {/* Content */}
      {(isLoading || !dataLoaded) && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-2 text-muted-foreground">Loading {activeTab} items...</p>
        </div>
      )}

      {!isLoading && dataLoaded && filteredItems.length === 0 && !error && (
        <EmptyState
          type="items"
          activeTab={activeTab}
          hasFilters={searchTerm || filterType !== 'all' || showExpiredOnly}
        />
      )}

      {!isLoading && dataLoaded && filteredItems.length > 0 && (
        <>
          {viewMode === 'list' ? (
            <div className="bg-card rounded-lg border border-border overflow-hidden">
              {filteredItems.map((item) => (
                <ListViewItem
                  key={`${item.type}_${item.id}`}
                  item={item}
                  isSelected={selectedItems.includes(item.id)}
                  onSelect={handleSelectItem}
                  onRestore={handleRestore}
                  onPermanentDelete={handlePermanentDelete}
                  isTrash={activeTab === 'trash'}
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredItems.map((item) => (
                <GridViewItem
                  key={`${item.type}_${item.id}`}
                  item={item}
                  isSelected={selectedItems.includes(item.id)}
                  onSelect={handleSelectItem}
                  onRestore={handleRestore}
                  onPermanentDelete={handlePermanentDelete}
                  isTrash={activeTab === 'trash'}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Bulk Actions Bar */}
      <EnhancedBulkActionsBar
        selectedItems={selectedItems}
        onClearSelection={() => setSelectedItems([])}
        assetType={activeTab === 'archived' ? 'archive' : 'trash'}
        onAction={handleBulkAction}
        portalId="archive-trash-bulk-actions"
      />

      {/* Footer Info */}
      <div className="mt-8 p-4 bg-muted rounded-lg">
        <div className="flex items-start space-x-3">
          <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
          <div className="text-sm text-muted-foreground">
            <p className="font-medium mb-1">Retention Policy</p>
            <p>
              Archived items are kept for 1 year, deleted items are kept for 30 days.
              After the retention period expires, items will be permanently deleted and cannot be recovered.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArchiveTrashPage;