import React from 'react';
import { Button } from '@/components/ui/button';
import { useReports } from '../../hooks/useReports';

const ScheduleToggle = () => {
    const { toggleScheduledReports, reports, hasPermission } = useReports();

    return (
        <Button
            variant="outline"
            onClick={toggleScheduledReports}
            disabled={!hasPermission()}
        >
            {reports.scheduledReportsEnabled ? 'Disable' : 'Enable'} Scheduled Reports
        </Button>
    );
};

export default ScheduleToggle;