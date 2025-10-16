'use client';

import React from 'react';
import { useDashboard } from '@/hooks/useDashboard';
import { useMetricsProcessor } from '@/hooks/useMetricsProcessor';
import ActivitiesPage from '@/components/pages/ActivitiesPage';

export default function Activities() {
    const { metrics: rawMetrics, loading, error, refresh } = useDashboard();
    const enhancedMetrics = useMetricsProcessor(rawMetrics);

    return (
        <div className="min-h-screen bg-background">
            <ActivitiesPage 
                metrics={enhancedMetrics} 
                loading={loading}
                error={error}
                onRefresh={refresh}
            />
        </div>
    );
}