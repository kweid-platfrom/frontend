import { ChevronUp, ChevronDown, CheckSquare, Square } from 'lucide-react';

// Component: BugTableHeader
const BugTableHeader = ({ sortConfig, handleSort, handleSelectAll, selectedIds, bugs }) => {
    const getSortIcon = (columnKey) => {
        if (sortConfig.key !== columnKey) return <ChevronUp className="w-3 h-3 text-gray-400" />;
        return sortConfig.direction === 'asc' ? (
            <ChevronUp className="w-3 h-3 text-gray-600" />
        ) : (
            <ChevronDown className="w-3 h-3 text-gray-600" />
        );
    };

    const columns = [
        { key: 'title', label: 'Bug Title', width: 'w-[300px] min-w-[300px]', sticky: 'left-10' },
        { key: 'id', label: 'Bug ID', width: 'w-20 min-w-[80px]' },
        { key: 'tags', label: 'Tags', width: 'w-32 min-w-[128px]' },
        { key: 'status', label: 'Status', width: 'w-24 min-w-[96px]' },
        { key: 'assigned_to', label: 'Assignee', width: 'w-32 min-w-[128px]' },
        { key: 'priority', label: 'Priority', width: 'w-20 min-w-[80px]' },
        { key: 'severity', label: 'Severity', width: 'w-24 min-w-[96px]' },
        { key: null, label: 'Evidence', width: 'w-24 min-w-[96px]' },
        { key: 'created_by', label: 'Reporter', width: 'w-24 min-w-[96px]' },
        { key: 'source', label: 'Source', width: 'w-24 min-w-[96px]' },
        { key: 'environment', label: 'Environment', width: 'w-28 min-w-[112px]' },
        { key: 'browserInfo', label: 'Browser/Device', width: 'w-28 min-w-[112px]' },
        { key: 'due_date', label: 'Due Date', width: 'w-28 min-w-[112px]' },
        { key: 'created_at', label: 'Created At', width: 'w-24 min-w-[96px]' },
        { key: 'frequency', label: 'Frequency', width: 'w-24 min-w-[96px]' },
        { key: null, label: 'Linked Test Cases', width: 'w-28 min-w-[112px]' },
    ];

    return (
        <thead className="bg-gray-50 sticky top-0 z-10">
            <tr>
                <th className="w-10 px-2 py-3 border-r border-gray-200 sticky left-0 bg-gray-50 z-20 whitespace-nowrap">
                    <div className="flex items-center justify-center">
                        {selectedIds.length === bugs.length && bugs.length > 0 ? (
                            <CheckSquare
                                className="w-4 h-4 text-teal-600 cursor-pointer"
                                onClick={() => handleSelectAll(false)}
                            />
                        ) : (
                            <Square
                                className="w-4 h-4 text-gray-400 cursor-pointer hover:text-teal-600"
                                onClick={() => handleSelectAll(true)}
                            />
                        )}
                    </div>
                </th>
                {columns.map((col) => (
                    <th
                        key={col.key || col.label}
                        className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap ${
                            col.key ? 'cursor-pointer hover:bg-gray-100' : ''
                        } border-r border-gray-200 ${col.width} ${col.sticky ? `sticky ${col.sticky} bg-gray-50 z-20` : ''}`}
                        onClick={() => col.key && handleSort(col.key)}
                    >
                        <div className="flex items-center gap-1">
                            {col.label}
                            {col.key && getSortIcon(col.key)}
                        </div>
                    </th>
                ))}
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap w-8 min-w-[32px]">
                    Drag
                </th>
            </tr>
        </thead>
    );
};

export default BugTableHeader;