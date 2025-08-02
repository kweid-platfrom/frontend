'use client';

import React, { useState } from 'react';
import { useApp } from '../../context/AppProvider';
import { useUI } from '../../hooks/useUI';
import { useReports } from '../../hooks/useReports';
import ReportTable from '../../components/report/ReportTable';
import GenerateReportModal from '../../components/report/GenerateReportModal';
import ReportViewerModal from '../../components/report/ReportViewerModal';
import ScheduleToggle from '../../components/report/ScheduleToggle';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Calendar } from 'lucide-react';

const Reports = () => {
    const { state } = useApp();
    const { toggleSidebar, sidebarOpen } = useUI();
    const { reports, loading, filters, setFilters, reportTypes, hasPermission } = useReports();
    const { suites } = state;
    const [generateModalOpen, setGenerateModalOpen] = useState(false);
    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [selectedReport, setSelectedReport] = useState(null);

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
                    <div className="flex space-x-4">
                        {hasPermission() && (
                            <Button onClick={() => setGenerateModalOpen(true)}>
                                <Calendar className="mr-2 h-4 w-4" /> Generate Report
                            </Button>
                        )}
                        <ScheduleToggle />
                        <Button
                            onClick={toggleSidebar}
                            className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
                        >
                            {sidebarOpen ? 'Close' : 'Open'} Sidebar
                        </Button>
                    </div>
                </div>

                <div className="bg-white shadow rounded-lg p-4 mb-6">
                    <div className="flex flex-wrap gap-4">
                        <Select
                            value={filters.type}
                            onValueChange={(value) => setFilters({ ...filters, type: value })}
                        >
                            <SelectTrigger className="w-48">
                                <SelectValue placeholder="Filter by type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Types</SelectItem>
                                {reportTypes.map((type) => (
                                    <SelectItem key={type} value={type}>
                                        {type}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select
                            value={filters.status}
                            onValueChange={(value) => setFilters({ ...filters, status: value })}
                        >
                            <SelectTrigger className="w-48">
                                <SelectValue placeholder="Filter by status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Statuses</SelectItem>
                                <SelectItem value="Generated">Generated</SelectItem>
                                <SelectItem value="Reviewed">Reviewed</SelectItem>
                                <SelectItem value="Published">Published</SelectItem>
                            </SelectContent>
                        </Select>
                        <Input
                            type="date"
                            value={filters.date}
                            onChange={(e) => setFilters({ ...filters, date: e.target.value })}
                            placeholder="Filter by date"
                            className="w-48"
                        />
                        <Input
                            value={filters.author}
                            onChange={(e) => setFilters({ ...filters, author: e.target.value })}
                            placeholder="Filter by author"
                            className="w-48"
                        />
                        <Select
                            value={filters.suite}
                            onValueChange={(value) => setFilters({ ...filters, suite: value })}
                        >
                            <SelectTrigger className="w-48">
                                <SelectValue placeholder="Filter by suite" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Suites</SelectItem>
                                {suites.testSuites.map((suite) => (
                                    <SelectItem key={suite.id} value={suite.id}>
                                        {suite.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <ReportTable
                    reports={reports}
                    loading={loading}
                    onView={(report) => {
                        setSelectedReport(report);
                        setViewModalOpen(true);
                    }}
                    onDelete={(reportId) => state.reports.actions.deleteReport(state)(reportId)}
                />

                <GenerateReportModal
                    open={generateModalOpen}
                    onOpenChange={setGenerateModalOpen}
                    reportTypes={reportTypes}
                    suites={suites.testSuites}
                    sprints={state.sprints.sprints}
                />

                <ReportViewerModal
                    open={viewModalOpen}
                    onOpenChange={setViewModalOpen}
                    report={selectedReport}
                />
            </div>
        </div>
    );
};

export default Reports;