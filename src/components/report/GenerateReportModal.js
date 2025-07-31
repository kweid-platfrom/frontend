import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useReports } from '../../hooks/useReports';

const GenerateReportModal = ({ open, onOpenChange, reportTypes, suites, sprints }) => {
    const { generateReport, loading } = useReports();
    const [reportType, setReportType] = useState('');
    const [selectedSuite, setSelectedSuite] = useState('');
    const [selectedSprint, setSelectedSprint] = useState('');
    const [dateRange, setDateRange] = useState({ start: '', end: '' });

    const handleGenerate = async () => {
        await generateReport({ reportType, suiteId: selectedSuite, sprintId: selectedSprint, dateRange });
        onOpenChange(false);
        setReportType('');
        setSelectedSuite('');
        setSelectedSprint('');
        setDateRange({ start: '', end: '' });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Generate Report</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    <Select value={reportType} onValueChange={setReportType}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select report type" />
                        </SelectTrigger>
                        <SelectContent>
                            {reportTypes.map((type) => (
                                <SelectItem key={type} value={type}>
                                    {type}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={selectedSuite} onValueChange={setSelectedSuite}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select test suite" />
                        </SelectTrigger>
                        <SelectContent>
                            {suites.map((suite) => (
                                <SelectItem key={suite.id} value={suite.id}>
                                    {suite.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select
                        value={selectedSprint}
                        onValueChange={setSelectedSprint}
                        disabled={reportType !== 'Sprint Report'}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select sprint (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                            {sprints.map((sprint) => (
                                <SelectItem key={sprint.id} value={sprint.id}>
                                    {sprint.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <div className="flex space-x-4">
                        <Input
                            type="date"
                            placeholder="Start date"
                            value={dateRange.start}
                            onChange={(e) =>
                                setDateRange({ ...dateRange, start: e.target.value })
                            }
                        />
                        <Input
                            type="date"
                            placeholder="End date"
                            value={dateRange.end}
                            onChange={(e) =>
                                setDateRange({ ...dateRange, end: e.target.value })
                            }
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleGenerate} disabled={loading}>
                        {loading ? 'Generating...' : 'Generate'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default GenerateReportModal;