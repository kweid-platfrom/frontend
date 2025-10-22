// components/report/GenerateReportModal.jsx
'use client';

import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { FileText, Loader2, Info } from 'lucide-react';

const GenerateReportModal = ({ 
    open, 
    onOpenChange, 
    reportTypes, 
    suites, 
    sprints,
    testRuns,
    onGenerate 
}) => {
    const [isGenerating, setIsGenerating] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        type: reportTypes[0] || 'Test Run Summary',
        description: '',
        suiteId: '',
        sprintId: '',
        runId: '',
        format: 'pdf'
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.name.trim()) {
            alert('Please enter a report name');
            return;
        }

        setIsGenerating(true);
        try {
            await onGenerate(formData);
            // Reset form
            setFormData({
                name: '',
                type: reportTypes[0] || 'Test Run Summary',
                description: '',
                suiteId: '',
                sprintId: '',
                runId: '',
                format: 'pdf'
            });
            onOpenChange(false);
        } catch (err) {
            console.error('Error generating report:', err);
        } finally {
            setIsGenerating(false);
        }
    };

    const requiresSuite = ['Coverage Report', 'Bug Analysis'].includes(formData.type);
    const requiresSprint = ['Sprint Summary'].includes(formData.type);
    const requiresRun = ['Test Run Summary'].includes(formData.type);

    const getReportDescription = (type) => {
        const descriptions = {
            'Test Run Summary': 'Detailed summary of a specific test run',
            'Bug Analysis': 'Analysis of bugs in your test suite',
            'Sprint Summary': 'Overview of testing activities in a sprint',
            'Coverage Report': 'Test coverage analysis for your suite',
            'Weekly QA Summary': 'Summary of QA activities from the past week',
            'Monthly QA Summary': 'Summary of QA activities from the past month'
        };
        return descriptions[type] || '';
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader className="pb-4">
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <FileText className="h-5 w-5" />
                        Generate Report
                    </DialogTitle>
                    <DialogDescription className="text-base">
                        Create a new report based on your testing data
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-1 -mx-1">
                    <div className="space-y-6 py-2">
                        {/* Report Name */}
                        <div className="space-y-2">
                            <Label htmlFor="report-name" className="text-sm font-medium">
                                Report Name <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="report-name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="e.g., Sprint 1 QA Summary"
                                className="h-11"
                                required
                            />
                        </div>

                        {/* Report Type */}
                        <div className="space-y-2">
                            <Label htmlFor="report-type" className="text-sm font-medium">
                                Report Type <span className="text-destructive">*</span>
                            </Label>
                            <Select
                                value={formData.type}
                                onValueChange={(value) => setFormData({ ...formData, type: value })}
                            >
                                <SelectTrigger id="report-type" className="h-11">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {reportTypes.map((type) => (
                                        <SelectItem key={type} value={type}>
                                            {type}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {getReportDescription(formData.type) && (
                                <p className="text-xs text-muted-foreground flex items-start gap-1.5">
                                    <Info className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                                    {getReportDescription(formData.type)}
                                </p>
                            )}
                        </div>

                        {/* Conditional Fields */}
                        {requiresRun && (
                            <div className="space-y-2">
                                <Label htmlFor="report-run" className="text-sm font-medium">
                                    Test Run <span className="text-destructive">*</span>
                                </Label>
                                <Select
                                    value={formData.runId}
                                    onValueChange={(value) => setFormData({ ...formData, runId: value })}
                                >
                                    <SelectTrigger id="report-run" className="h-11">
                                        <SelectValue placeholder="Select a test run" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {testRuns && testRuns.length > 0 ? (
                                            testRuns.map((run) => (
                                                <SelectItem key={run.id} value={run.id}>
                                                    {run.name} • {new Date(run.created_at).toLocaleDateString()}
                                                </SelectItem>
                                            ))
                                        ) : (
                                            <SelectItem value="none" disabled>
                                                No test runs available
                                            </SelectItem>
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        {requiresSprint && (
                            <div className="space-y-2">
                                <Label htmlFor="report-sprint" className="text-sm font-medium">
                                    Sprint <span className="text-destructive">*</span>
                                </Label>
                                <Select
                                    value={formData.sprintId}
                                    onValueChange={(value) => setFormData({ ...formData, sprintId: value })}
                                >
                                    <SelectTrigger id="report-sprint" className="h-11">
                                        <SelectValue placeholder="Select a sprint" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {sprints && sprints.length > 0 ? (
                                            sprints.map((sprint) => (
                                                <SelectItem key={sprint.id} value={sprint.id}>
                                                    {sprint.name}
                                                </SelectItem>
                                            ))
                                        ) : (
                                            <SelectItem value="none" disabled>
                                                No sprints available
                                            </SelectItem>
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        {requiresSuite && (
                            <div className="space-y-2">
                                <Label htmlFor="report-suite" className="text-sm font-medium">
                                    Test Suite
                                </Label>
                                <Select
                                    value={formData.suiteId || "all"}
                                    onValueChange={(value) => setFormData({ ...formData, suiteId: value === "all" ? "" : value })}
                                >
                                    <SelectTrigger id="report-suite" className="h-11">
                                        <SelectValue placeholder="All suites" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Suites</SelectItem>
                                        {suites.map((suite) => (
                                            <SelectItem key={suite.id} value={suite.id}>
                                                {suite.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <p className="text-xs text-muted-foreground">
                                    Optional - Leave empty to include all suites
                                </p>
                            </div>
                        )}

                        {/* Description */}
                        <div className="space-y-2">
                            <Label htmlFor="report-description" className="text-sm font-medium">
                                Description
                            </Label>
                            <Textarea
                                id="report-description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Add any notes or context for this report..."
                                rows={3}
                                className="resize-none"
                            />
                            <p className="text-xs text-muted-foreground">
                                Optional - Add context or notes about this report
                            </p>
                        </div>

                        {/* Format */}
                        <div className="space-y-2">
                            <Label htmlFor="report-format" className="text-sm font-medium">
                                Export Format
                            </Label>
                            <Select
                                value={formData.format}
                                onValueChange={(value) => setFormData({ ...formData, format: value })}
                            >
                                <SelectTrigger id="report-format" className="h-11">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="pdf">PDF Document</SelectItem>
                                    <SelectItem value="csv">CSV Spreadsheet</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-3 pt-6 border-t border-border mt-6">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isGenerating}
                            className="min-w-24"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isGenerating || (requiresRun && !formData.runId) || (requiresSprint && !formData.sprintId)}
                            className="min-w-36"
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Generating...
                                </>
                            ) : (
                                'Generate Report'
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default GenerateReportModal;