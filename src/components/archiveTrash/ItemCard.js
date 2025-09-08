'use client';
import React, { useState } from 'react';
import { 
  RefreshCcw, 
  Trash, 
  AlertTriangle,
  CheckSquare,
  Square,
  MoreVertical,
  FileText,
  Bug,
  PlayCircle,
  FolderOpen
} from 'lucide-react';

const AssetIcon = ({ type, className = "w-4 h-4" }) => {
  const iconMap = {
    testCases: FileText,
    bugs: Bug,
    recordings: PlayCircle,
    sprints: FolderOpen,
    default: FileText
  };
  
  const IconComponent = iconMap[type] || iconMap.default;
  return <IconComponent className={className} />;
};

export const ItemCard = ({ 
  item, 
  isSelected, 
  onSelect, 
  onRestore, 
  onPermanentDelete, 
  isTrash = false 
}) => {
  const [showActions, setShowActions] = useState(false);

  const formatDate = (date) => {
    if (!date) return 'Unknown';
    try {
      const dateObj = date?.toDate ? date.toDate() : new Date(date);
      return dateObj.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Date formatting error:', error);
      return 'Invalid Date';
    }
  };

  const isExpired = () => {
    try {
      const retentionDate = isTrash ? item.delete_retention_until : item.archive_retention_until;
      if (!retentionDate) return false;
      const retentionDateObj = retentionDate?.toDate ? retentionDate.toDate() : new Date(retentionDate);
      return new Date() > retentionDateObj;
    } catch (error) {
      console.error('Date comparison error:', error);
      return false;
    }
  };

  const getDaysUntilExpiry = () => {
    try {
      const retentionDate = isTrash ? item.delete_retention_until : item.archive_retention_until;
      if (!retentionDate) return 0;
      const retentionDateObj = retentionDate?.toDate ? retentionDate.toDate() : new Date(retentionDate);
      const days = Math.ceil((retentionDateObj - new Date()) / (1000 * 60 * 60 * 24));
      return Math.max(0, days);
    } catch (error) {
      console.error('Days calculation error:', error);
      return 0;
    }
  };

  if (!item?.id) {
    return null;
  }

  const handleActionClick = (action) => {
    setShowActions(false);
    action();
  };

  return (
    <div className={`border rounded-lg p-4 transition-all ${
      isSelected ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-700'
    } ${isExpired() ? 'border-red-300 bg-red-50 dark:bg-red-900/20' : ''}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          <button
            onClick={() => onSelect(item.id)}
            className="mt-1"
            type="button"
          >
            {isSelected ? (
              <CheckSquare className="w-4 h-4 text-blue-600" />
            ) : (
              <Square className="w-4 h-4 text-gray-400" />
            )}
          </button>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-2">
              <AssetIcon type={item.type} className="text-gray-500" />
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                {item.name || item.title || `${item.type} #${item.id}`}
              </h3>
              {isExpired() && (
                <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
              )}
            </div>
            
            <div className="space-y-1 text-xs text-gray-500 dark:text-gray-400">
              <div>
                {isTrash ? 'Deleted' : 'Archived'} on {formatDate(isTrash ? item.deleted_at : item.archived_at)}
              </div>
              <div>
                By: {isTrash ? item.deleted_by : item.archived_by}
              </div>
              {(item.delete_reason || item.archive_reason) && (
                <div>
                  Reason: {isTrash ? item.delete_reason : item.archive_reason}
                </div>
              )}
              <div className={`${isExpired() ? 'text-red-600 font-medium' : ''}`}>
                {isExpired() 
                  ? 'Expired - will be permanently deleted'
                  : `Expires in ${getDaysUntilExpiry()} days`
                }
              </div>
            </div>
          </div>
        </div>
        
        <div className="relative">
          <button
            onClick={() => setShowActions(!showActions)}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
            type="button"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
          
          {showActions && (
            <div className="absolute right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10 min-w-32">
              <button
                onClick={() => handleActionClick(() => onRestore(item))}
                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
                type="button"
              >
                <RefreshCcw className="w-4 h-4" />
                <span>Restore</span>
              </button>
              <button
                onClick={() => handleActionClick(() => onPermanentDelete(item))}
                className="w-full px-3 py-2 text-left text-sm hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600 flex items-center space-x-2"
                type="button"
              >
                <Trash className="w-4 h-4" />
                <span>Delete Forever</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};