'use client';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Archive, Trash2, Search, CheckSquare, Calendar } from 'lucide-react';
import { useApp } from '../../context/AppProvider';
import { ItemCard } from '../../components/archiveTrash/ItemCard';
import { BulkActions } from '../../components/archiveTrash/BulkActions';
import { FilterControls } from '../../components/archiveTrash/FilterControls';
import { EmptyState } from '../../components/archiveTrash/EmptyState';

const ArchiveTrashPage = () => {
  const { 
    actions, 
    activeSuite, 
    isAuthenticated, 
    archiveLoading
  } = useApp();

  const [activeTab, setActiveTab] = useState('archived');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItems, setSelectedItems] = useState([]);
  const [filterType, setFilterType] = useState('all');
  const [showExpiredOnly, setShowExpiredOnly] = useState(false);
  const [localArchivedItems, setLocalArchivedItems] = useState([]);
  const [localTrashedItems, setLocalTrashedItems] = useState([]);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Stable reference to suite ID to prevent infinite loops
  const suiteId = activeSuite?.id;

  // Load data function with proper error handling
  const loadData = useCallback(async () => {
    if (!isAuthenticated || !suiteId) {
      setLocalArchivedItems([]);
      setLocalTrashedItems([]);
      setDataLoaded(true);
      return;
    }

    setIsLoading(true);
    setError(null);
    setDataLoaded(false);
    
    try {
      console.log('Loading archive/trash data for suite:', suiteId);
      
      const assetTypes = ['testCases', 'bugs', 'recordings', 'sprints'];
      const results = { archived: [], trashed: [] };
      
      // Load each asset type individually with better error handling
      for (const assetType of assetTypes) {
        try {
          console.log(`Loading archived ${assetType}...`);
          const archivedResult = await actions.archive.loadArchivedItems(suiteId, assetType);
          
          if (archivedResult?.success && Array.isArray(archivedResult.data)) {
            const items = archivedResult.data.map(item => ({
              ...item,
              type: assetType,
              id: item.id || `${assetType}_${Date.now()}_${Math.random()}`
            }));
            results.archived.push(...items);
            console.log(`Loaded ${items.length} archived ${assetType}`);
          } else {
            console.warn(`Failed to load archived ${assetType}:`, archivedResult?.error);
          }

          console.log(`Loading trashed ${assetType}...`);
          const trashedResult = await actions.archive.loadTrashedItems(suiteId, assetType);
          
          if (trashedResult?.success && Array.isArray(trashedResult.data)) {
            const items = trashedResult.data.map(item => ({
              ...item,
              type: assetType,
              id: item.id || `${assetType}_${Date.now()}_${Math.random()}`
            }));
            results.trashed.push(...items);
            console.log(`Loaded ${items.length} trashed ${assetType}`);
          } else {
            console.warn(`Failed to load trashed ${assetType}:`, trashedResult?.error);
          }
        } catch (assetError) {
          console.error(`Error loading ${assetType}:`, assetError);
          // Continue with other asset types even if one fails
        }
      }

      // Filter out items without proper IDs
      const validArchived = results.archived.filter(item => item && item.id);
      const validTrashed = results.trashed.filter(item => item && item.id);

      console.log('Archive/trash data loaded:', {
        archived: validArchived.length,
        trashed: validTrashed.length
      });

      setLocalArchivedItems(validArchived);
      setLocalTrashedItems(validTrashed);
      setDataLoaded(true);

    } catch (error) {
      console.error('Failed to load archive/trash data:', error);
      setError(error.message || 'Failed to load data');
      setLocalArchivedItems([]);
      setLocalTrashedItems([]);
      setDataLoaded(true);
      
      // Only show notification if it's not a permission error
      if (!error.message?.includes('permission') && !error.message?.includes('access')) {
        actions.ui?.showNotification?.({
          id: 'load-archive-error',
          type: 'error',
          message: 'Failed to load archived and deleted items',
          duration: 5000,
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, suiteId, actions.archive, actions.ui]);

  // Load data effect with stable dependencies
  useEffect(() => {
    let mounted = true;
    
    const loadDataAsync = async () => {
      if (mounted) {
        await loadData();
      }
    };
    
    loadDataAsync();
    
    return () => {
      mounted = false;
    };
  }, [loadData]);

  // Reset selected items when tab changes
  useEffect(() => {
    setSelectedItems([]);
  }, [activeTab]);

  const currentItems = useMemo(() => 
    activeTab === 'archived' ? localArchivedItems : localTrashedItems
  , [activeTab, localArchivedItems, localTrashedItems]);

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

  const removeFromLocalState = useCallback((itemId) => {
    if (activeTab === 'archived') {
      setLocalArchivedItems(prev => prev.filter(i => i.id !== itemId));
    } else {
      setLocalTrashedItems(prev => prev.filter(i => i.id !== itemId));
    }
    setSelectedItems(prev => prev.filter(id => id !== itemId));
  }, [activeTab]);

  const removeMultipleFromLocalState = useCallback((itemIds) => {
    if (activeTab === 'archived') {
      setLocalArchivedItems(prev => prev.filter(i => !itemIds.includes(i.id)));
    } else {
      setLocalTrashedItems(prev => prev.filter(i => !itemIds.includes(i.id)));
    }
    setSelectedItems([]);
  }, [activeTab]);

  const handleRestore = useCallback(async (item) => {
    if (!suiteId || !item?.id) return;

    try {
      const result = activeTab === 'archived'
        ? await actions.archive.unarchiveItem(suiteId, item.type, item.id)
        : await actions.archive.restoreFromTrash(suiteId, item.type, item.id);
      
      if (result?.success) {
        removeFromLocalState(item.id);
        actions.ui?.showNotification?.({
          id: `restore-${item.id}`,
          type: 'success',
          message: `Item restored successfully`,
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('Failed to restore item:', error);
      actions.ui?.showNotification?.({
        id: 'restore-error',
        type: 'error',
        message: 'Failed to restore item',
        duration: 5000,
      });
    }
  }, [suiteId, activeTab, actions.archive, actions.ui, removeFromLocalState]);

  const handlePermanentDelete = useCallback(async (item) => {
    if (!suiteId || !item?.id) return;

    const itemName = item.name || item.title || `${item.type} #${item.id}`;
    if (!window.confirm(`Permanently delete "${itemName}"? This cannot be undone.`)) return;

    try {
      const result = await actions.archive.permanentlyDelete(suiteId, item.type, item.id);
      if (result?.success) {
        removeFromLocalState(item.id);
        actions.ui?.showNotification?.({
          id: `delete-${item.id}`,
          type: 'success',
          message: `Item permanently deleted`,
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('Failed to delete item:', error);
      actions.ui?.showNotification?.({
        id: 'delete-error',
        type: 'error',
        message: 'Failed to permanently delete item',
        duration: 5000,
      });
    }
  }, [suiteId, actions.archive, actions.ui, removeFromLocalState]);

  const handleBulkRestore = useCallback(async () => {
    if (!suiteId || selectedItems.length === 0) return;

    try {
      const selectedValidItems = filteredItems.filter(item => selectedItems.includes(item.id));
      const itemsByType = selectedValidItems.reduce((acc, item) => {
        if (!acc[item.type]) acc[item.type] = [];
        acc[item.type].push(item.id);
        return acc;
      }, {});

      for (const [assetType, assetIds] of Object.entries(itemsByType)) {
        await actions.archive.bulkRestore(
          suiteId, 
          assetType, 
          assetIds, 
          null, 
          activeTab === 'trash'
        );
      }
      
      removeMultipleFromLocalState(selectedItems);
      actions.ui?.showNotification?.({
        id: 'bulk-restore',
        type: 'success',
        message: `Restored ${selectedItems.length} items`,
        duration: 3000,
      });
    } catch (error) {
      console.error('Failed to bulk restore:', error);
      actions.ui?.showNotification?.({
        id: 'bulk-restore-error',
        type: 'error',
        message: 'Failed to restore selected items',
        duration: 5000,
      });
    }
  }, [suiteId, selectedItems, filteredItems, activeTab, actions.archive, actions.ui, removeMultipleFromLocalState]);

  const handleBulkDelete = useCallback(async () => {
    if (!suiteId || selectedItems.length === 0) return;

    if (!window.confirm(`Permanently delete ${selectedItems.length} items? This cannot be undone.`)) return;

    try {
      const itemsToDelete = filteredItems.filter(item => selectedItems.includes(item.id));
      const itemsByType = itemsToDelete.reduce((acc, item) => {
        if (!acc[item.type]) acc[item.type] = [];
        acc[item.type].push(item.id);
        return acc;
      }, {});

      for (const [assetType, assetIds] of Object.entries(itemsByType)) {
        await actions.archive.bulkPermanentDelete(suiteId, assetType, assetIds);
      }
      
      removeMultipleFromLocalState(selectedItems);
      actions.ui?.showNotification?.({
        id: 'bulk-delete',
        type: 'success',
        message: `Permanently deleted ${selectedItems.length} items`,
        duration: 3000,
      });
    } catch (error) {
      console.error('Failed to bulk delete:', error);
      actions.ui?.showNotification?.({
        id: 'bulk-delete-error',
        type: 'error',
        message: 'Failed to delete selected items',
        duration: 5000,
      });
    }
  }, [suiteId, selectedItems, filteredItems, actions.archive, actions.ui, removeMultipleFromLocalState]);

  // Show loading state
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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Archive & Trash - {activeSuite.name}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage archived and deleted items. Items are automatically deleted after their retention period expires.
        </p>
      </div>

      {/* Error State */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm">
            Error loading data: {error}
          </p>
          <button 
            onClick={loadData}
            className="mt-2 px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex space-x-1 mb-6 border-b border-gray-200 dark:border-gray-700">
        {[
          { key: 'archived', label: 'Archived', icon: Archive, count: localArchivedItems.length, color: 'blue' },
          { key: 'trash', label: 'Trash', icon: Trash2, count: localTrashedItems.length, color: 'red' }
        ].map(({ key, label, icon: Icon, count, color }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === key
                ? `bg-${color}-50 text-${color}-700 border-b-2 border-${color}-700 dark:bg-${color}-900/20 dark:text-${color}-300`
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
            type="button"
          >
            <div className="flex items-center space-x-2">
              <Icon className="w-4 h-4" />
              <span>{label} ({count})</span>
            </div>
          </button>
        ))}
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

      {/* Bulk Actions */}
      <BulkActions
        selectedItems={selectedItems}
        onBulkRestore={handleBulkRestore}
        onBulkDelete={handleBulkDelete}
        onDeselectAll={() => setSelectedItems([])}
        isTrash={activeTab === 'trash'}
      />

      {/* Content */}
      {(isLoading || !dataLoaded) && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Loading {activeTab} items...</p>
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
        <div className="space-y-3">
          {filteredItems.map((item) => (
            <ItemCard
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

      {/* Footer Info */}
      <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="flex items-start space-x-3">
          <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
          <div className="text-sm text-gray-600 dark:text-gray-400">
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