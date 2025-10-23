// components/report/GenerateReportModal.jsx - ENHANCED for Priority Reports
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
import { FileText, Loader2, Info, AlertCircle } from 'lucide-react';

const GenerateReportModal = ({ 
    open, 
    onOpenChange, 
    reportTypes, 
    suites, 
    sprints,
    testRuns,
    builds,
    releases,
    modules,
    onGenerate 
}) => {
    const [isGenerating, setIsGenerating] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        type: reportTypes[0] || 'Test Summary Report',
        description: '',
        suiteId: '',
        sprintId: '',
        runId: '',
        buildId: '',
        releaseId: '',
        moduleFilter: '',
        format: 'pdf'
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.name.trim()) {
            alert('Please enter a report name');
            return;
        }

        // Validate required fields based on report type
        if (requiresRun && !formData.runId) {
            alert('Please select a test run');
            return;
        }
        if (requiresSprint && !formData.sprintId) {
            alert('Please select a sprint');
            return;
        }
        if (requiresBuild && !formData.buildId) {
            alert('Please select a build');
            return;
        }

        setIsGenerating(true);
        try {
            await onGenerate(formData);
            // Reset form
            setFormData({
                name: '',
                type: reportTypes[0] || 'Test Summary Report',
                description: '',
                suiteId: '',
                sprintId: '',
                runId: '',
                buildId: '',
                releaseId: '',
                moduleFilter: '',
                format: 'pdf'
            });
            onOpenChange(false);
        } catch (err) {
            console.error('Error generating report:', err);
        } finally {
            setIsGenerating(false);
        }
    };

    // Determine which fields are required based on report type
    const requiresSuite = ['Coverage Report', 'Bug Analysis'].includes(formData.type);
    const requiresSprint = ['Sprint Summary'].includes(formData.type);
    const requiresRun = ['Test Run Summary'].includes(formData.type);
    const requiresBuild = false; // Optional for Test Summary Report
    const requiresRelease = false; // Optional for Release Readiness Report
    
    // Fields that can be used with certain reports
    const supportsBuild = ['Test Summary Report', 'Release Readiness Report'].includes(formData.type);
    const supportsRelease = ['Release Readiness Report'].includes(formData.type);
    const supportsModule = ['Defect Report'].includes(formData.type);
    const supportsSprint = ['Test Summary Report'].includes(formData.type);
    const supportsRun = ['Test Summary Report'].includes(formData.type);

    const getReportDescription = (type) => {
        const descriptions = {
            // PRIORITY REPORTS
            'Test Summary Report': 'Comprehensive test execution summary per build, sprint, or release with pass/fail metrics and progress tracking',
            'Defect Report': 'Detailed defect analysis with severity distribution, aging metrics, and module hotspots',
            'Release Readiness Report': 'Quality gate evaluation with GO/NO-GO recommendation based on pass rate, critical defects, and coverage',
            'Requirement Coverage Report': 'Traceability matrix showing requirement coverage, test mapping, and execution status',
            
            // SECONDARY REPORTS
            'Test Run Summary': 'Detailed summary of a specific test run execution',
            'Bug Analysis': 'Analysis of bugs in your test suite',
            'Sprint Summary': 'Overview of testing activities in a sprint',
            'Coverage Report': 'Test coverage analysis for your suite',
            'Weekly QA Summary': 'Summary of QA activities from the past week',
            'Monthly QA Summary': 'Summary of QA activities from the past month'
        };
        return descriptions[type] || '';
    };

    const isPriorityReport = ['Test Summary Report', 'Defect Report', 'Release Readiness Report', 'Requirement Coverage Report'].includes(formData.type);

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
                                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                                        PRIORITY REPORTS
                                    </div>
                                    {reportTypes.slice(0, 4).map((type) => (
                                        <SelectItem key={type} value={type}>
                                            {type}
                                        </SelectItem>
                                    ))}
                                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground border-t mt-1">
                                        OTHER REPORTS
                                    </div>
                                    {reportTypes.slice(4).map((type) => (
                                        <SelectItem key={type} value={type}>
                                            {type}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {getReportDescription(formData.type) && (
                                <div className={`text-xs flex items-start gap-1.5 p-3 rounded-md ${
                                    isPriorityReport ? 'bg-blue-50 border border-blue-200 text-blue-900' : 'bg-muted'
                                }`}>
                                    {isPriorityReport ? (
                                        <AlertCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-blue-600" />
                                    ) : (
                                        <Info className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                                    )}
                                    <span>{getReportDescription(formData.type)}</span>
                                </div>
                            )}
                        </div>

                        {/* Conditional Fields Based on Report Type */}
                        
                        {/* Test Run - Required for Test Run Summary, Optional for Test Summary Report */}
                        {(requiresRun || supportsRun) && (
                            <div className="space-y-2">
                                <Label htmlFor="report-run" className="text-sm font-medium">
                                    Test Run {requiresRun && <span className="text-destructive">*</span>}
                                </Label>
                                <Select
                                    value={formData.runId}
                                    onValueChange={(value) => setFormData({ ...formData, runId: value })}
                                >
                                    <SelectTrigger id="report-run" className="h-11">
                                        <SelectValue placeholder="Select a test run (optional)" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="no-runs">None - All runs</SelectItem>
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

                        {/* Build Version - For Test Summary and Release Readiness */}
                        {supportsBuild && (
                            <div className="space-y-2">
                                <Label htmlFor="report-build" className="text-sm font-medium">
                                    Build Version {requiresBuild && <span className="text-destructive">*</span>}
                                </Label>
                                <Select
                                    value={formData.buildId}
                                    onValueChange={(value) => setFormData({ ...formData, buildId: value })}
                                >
                                    <SelectTrigger id="report-build" className="h-11">
                                        <SelectValue placeholder="Select a build (optional)" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="no-runs">None - All builds</SelectItem>
                                        {builds && builds.length > 0 ? (
                                            builds.map((build) => (
                                                <SelectItem key={build.id} value={build.id}>
                                                    {build.version} - {build.name}
                                                </SelectItem>
                                            ))
                                        ) : (
                                            <SelectItem value="none" disabled>
                                                No builds available
                                            </SelectItem>
                                        )}
                                    </SelectContent>
                                </Select>
                                <p className="text-xs text-muted-foreground">
                                    Filter report by specific build version
                                </p>
                            </div>
                        )}

                        {/* Release - For Release Readiness Report */}
                        {supportsRelease && (
                            <div className="space-y-2">
                                <Label htmlFor="report-release" className="text-sm font-medium">
                                    Release {requiresRelease && <span className="text-destructive">*</span>}
                                </Label>
                                <Select
                                    value={formData.releaseId}
                                    onValueChange={(value) => setFormData({ ...formData, releaseId: value })}
                                >
                                    <SelectTrigger id="report-release" className="h-11">
                                        <SelectValue placeholder="Select a release (optional)" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="no-runs">Current Release</SelectItem>
                                        {releases && releases.length > 0 ? (
                                            releases.map((release) => (
                                                <SelectItem key={release.id} value={release.id}>
                                                    {release.name} - {release.version}
                                                </SelectItem>
                                            ))
                                        ) : (
                                            <SelectItem value="none" disabled>
                                                No releases defined
                                            </SelectItem>
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        {/* Sprint - Required for Sprint Summary, Optional for Test Summary Report */}
                        {(requiresSprint || supportsSprint) && (
                            <div className="space-y-2">
                                <Label htmlFor="report-sprint" className="text-sm font-medium">
                                    Sprint {requiresSprint && <span className="text-destructive">*</span>}
                                </Label>
                                <Select
                                    value={formData.sprintId}
                                    onValueChange={(value) => setFormData({ ...formData, sprintId: value })}
                                >
                                    <SelectTrigger id="report-sprint" className="h-11">
                                        <SelectValue placeholder="Select a sprint (optional)" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="no-runs">None - All sprints</SelectItem>
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

                        {/* Module Filter - For Defect Report */}
                        {supportsModule && (
                            <div className="space-y-2">
                                <Label htmlFor="report-module" className="text-sm font-medium">
                                    Module Filter
                                </Label>
                                <Select
                                    value={formData.moduleFilter}
                                    onValueChange={(value) => setFormData({ ...formData, moduleFilter: value })}
                                >
                                    <SelectTrigger id="report-module" className="h-11">
                                        <SelectValue placeholder="All modules" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="no-runs">All Modules</SelectItem>
                                        {modules && modules.length > 0 ? (
                                            modules.map((module) => (
                                                <SelectItem key={module} value={module}>
                                                    {module}
                                                </SelectItem>
                                            ))
                                        ) : (
                                            <SelectItem value="none" disabled>
                                                No modules defined
                                            </SelectItem>
                                        )}
                                    </SelectContent>
                                </Select>
                                <p className="text-xs text-muted-foreground">
                                    Optional - Filter defects by specific module
                                </p>
                            </div>
                        )}

                        {/* Suite Filter - For Coverage and Bug Analysis Reports */}
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