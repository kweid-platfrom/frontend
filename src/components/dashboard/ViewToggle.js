import React from 'react';
import "../../app/globals.css"
import { Switch } from '@/components/ui/switch';

const ViewToggle = ({ viewMode, setViewMode }) => {
    return (
        <div className="flex justify-end mb-4">
            <div className="flex items-center space-x-2 bg-white p-1 rounded-md border">
                <span className="text-xs text-gray-500">Table</span>
                <Switch
                    checked={viewMode === 'chart'}
                    onCheckedChange={() => setViewMode(viewMode === 'chart' ? 'table' : 'chart')}
                />
                <span className="text-xs text-gray-500">Chart</span>
            </div>
        </div>
    );
};

export default ViewToggle;