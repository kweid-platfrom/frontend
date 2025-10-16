import React, { useState, useRef, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle, X, FileText, RefreshCw } from 'lucide-react';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';
import { useApp } from '../../context/AppProvider';
import { Timestamp } from 'firebase/firestore';

const BugImportModal = ({ isOpen, onClose }) => {
    // Use the same context as BugReportButton
    const { currentUser, activeSuite, actions } = useApp();
    const [dragActive, setDragActive] = useState(false);
    const [file, setFile] = useState(null);
    const [parsing, setParsing] = useState(false);
    const [previewData, setPreviewData] = useState(null);
    const [mappings, setMappings] = useState({});
    const [importResults, setImportResults] = useState(null);
    const [importing, setImporting] = useState(false);
    const fileInputRef = useRef(null);

    const importableFields = {
        title: 'Bug Title',
        description: 'Description',
        status: 'Status',
        severity: 'Severity',
        priority: 'Priority',
        assignee: 'Assigned To',
        environment: 'Environment',
        frequency: 'Frequency',
        reporter: 'Reporter',
        stepsToReproduce: 'Steps to Reproduce',
        expectedBehavior: 'Expected Result',
        actualBehavior: 'Actual Result',
        tags: 'Tags',
        category: 'Category'
    };
    
    const severityOptions = ['critical', 'high', 'medium', 'low'];

    const resetState = () => {
        setFile(null);
        setPreviewData(null);
        setMappings({});
        setImportResults(null);
        setImporting(false);
    };

    const handleFile = useCallback(async (selectedFile) => {
        if (!selectedFile) return;

        const fileType = selectedFile.name.split('.').pop().toLowerCase();
        if (!['xlsx', 'xls', 'csv'].includes(fileType)) {
            toast.error('Please upload an Excel (.xlsx, .xls) or CSV file');
            return;
        }

        setFile(selectedFile);
        setParsing(true);

        try {
            const fileBuffer = await selectedFile.arrayBuffer();
            const workbook = XLSX.read(fileBuffer, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

            if (jsonData.length < 2) {
                throw new Error('File must contain at least a header row and one data row');
            }

            const headers = jsonData[0];
            const rows = jsonData.slice(1).filter(row => row.some(cell => cell !== undefined && cell !== ''));

            setPreviewData({
                headers,
                rows: rows.slice(0, 5),
                totalRows: rows.length
            });

            // Auto-map columns
            const autoMappings = {};
            headers.forEach((header, index) => {
                const headerLower = header.toString().toLowerCase().trim();

                if (headerLower.includes('title') || headerLower.includes('summary') || headerLower.includes('subject')) {
                    autoMappings.title = index;
                }
                if (headerLower.includes('description') || headerLower.includes('details')) {
                    autoMappings.description = index;
                }
                if (headerLower.includes('status')) {
                    autoMappings.status = index;
                }
                if (headerLower.includes('severity')) {
                    autoMappings.severity = index;
                }
                if (headerLower.includes('priority')) {
                    autoMappings.priority = index;
                }
                if (headerLower.includes('assign') && !headerLower.includes('unassign')) {
                    autoMappings.assignee = index;
                }
                if (headerLower.includes('environment')) {
                    autoMappings.environment = index;
                }
                if (headerLower.includes('frequency')) {
                    autoMappings.frequency = index;
                }
                if (headerLower.includes('report') && !headerLower.includes('steps')) {
                    autoMappings.reporter = index;
                }
                if (headerLower.includes('steps') || headerLower.includes('reproduce')) {
                    autoMappings.stepsToReproduce = index;
                }
                if (headerLower.includes('expected')) {
                    autoMappings.expectedBehavior = index;
                }
                if (headerLower.includes('actual')) {
                    autoMappings.actualBehavior = index;
                }
                if (headerLower.includes('tag')) {
                    autoMappings.tags = index;
                }
                if (headerLower.includes('category') || headerLower.includes('type')) {
                    autoMappings.category = index;
                }
            });

            setMappings(autoMappings);
            toast.success(`File parsed successfully - found ${rows.length} rows`);
        } catch (error) {
            console.error('Error parsing file:', error);
            toast.error(`Error parsing file: ${error.message}`);
        } finally {
            setParsing(false);
        }
    }, []);

    const handleDrag = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    }, []);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    }, [handleFile]);

    const handleFileSelect = (e) => {
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
        }
    };

    const getPriorityFromSeverity = (severity) => {
        const severityLower = severity?.toLowerCase();
        if (severityLower === 'critical') return 'urgent';
        if (severityLower === 'high') return 'high';
        if (severityLower === 'medium') return 'medium';
        return 'low';
    };

    const safeToLowerCase = (value) => {
        if (!value) return '';
        return String(value).toLowerCase();
    };

    const handleImport = async () => {
        if (!previewData || importing) return;

        // Validate title mapping
        if (mappings.title === undefined) {
            toast.error('Please map the Bug Title field - it is required');
            return;
        }

        // Validate context
        if (!activeSuite?.id) {
            toast.error('No active test suite found. Please select a test suite first.');
            return;
        }

        if (!currentUser?.uid) {
            toast.error('User session not found. Please refresh the page and try again.');
            return;
        }

        setImporting(true);
        const loadingToast = toast.loading('Importing bug reports...');

        try {
            const fileBuffer = await file.arrayBuffer();
            const workbook = XLSX.read(fileBuffer, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            const rows = jsonData.slice(1).filter(row => row.some(cell => cell !== undefined && cell !== ''));

            const results = {
                total: rows.length,
                success: 0,
                errors: []
            };

            const currentTimestamp = Timestamp.fromDate(new Date());
            const userDisplayName = currentUser.displayName || currentUser.email || 'Unknown';

            for (let i = 0; i < rows.length; i++) {
                const row = rows[i];
                
                try {
                    // Extract values from row based on mappings
                    const getValue = (field) => {
                        const columnIndex = mappings[field];
                        if (columnIndex === undefined) return null;
                        const value = row[columnIndex];
                        return value ? String(value).trim() : null;
                    };

                    const title = getValue('title');
                    if (!title) {
                        throw new Error('Missing required field: Bug Title');
                    }

                    const description = getValue('description') || title;
                    const status = getValue('status') || 'New';
                    const severityRaw = getValue('severity') || 'medium';
                    const severity = severityOptions.find(opt => opt.toLowerCase() === severityRaw.toLowerCase()) || 'medium';
                    const priority = getValue('priority') || getPriorityFromSeverity(severity);
                    const environment = getValue('environment') || 'Production';
                    const frequency = getValue('frequency') || 'Once';
                    const category = getValue('category') || 'General';
                    const stepsToReproduce = getValue('stepsToReproduce') || '';
                    const expectedBehavior = getValue('expectedBehavior') || '';
                    const actualBehavior = getValue('actualBehavior') || '';
                    const assignedTo = getValue('assignee') || null;

                    // Handle tags
                    let tags = [];
                    const tagsValue = getValue('tags');
                    if (tagsValue) {
                        tags = tagsValue.split(',').map(tag => tag.trim().toLowerCase()).filter(tag => tag);
                    }
                    if (!tags.includes(category.toLowerCase().replace(/\s+/g, '_'))) {
                        tags.push(category.toLowerCase().replace(/\s+/g, '_'));
                    }

                    // Build the bug data object - EXACTLY like BugReportButton does it
                    const bugData = {
                        title: title.trim(),
                        description: description.trim(),
                        actualBehavior: actualBehavior.trim(),
                        stepsToReproduce: stepsToReproduce.trim() || "",
                        expectedBehavior: expectedBehavior.trim() || "",
                        workaround: '',
                        assignedTo: assignedTo,
                        assigned_to: assignedTo,
                        status: status,
                        priority: priority,
                        severity: severity,
                        category: category,
                        tags: tags,
                        source: 'Import',
                        creationType: 'manual',
                        environment: environment,
                        frequency: frequency,
                        browserInfo: 'N/A',
                        deviceInfo: 'N/A',
                        userAgent: 'Import',
                        hasConsoleLogs: false,
                        hasNetworkLogs: false,
                        hasAttachments: false,
                        attachments: [],
                        resolution: '',
                        resolvedAt: null,
                        resolvedBy: null,
                        resolvedByName: null,
                        comments: [],
                        resolutionHistory: [],
                        commentCount: 0,
                        viewCount: 0,
                        suiteId: activeSuite.id,
                        created_by: currentUser.uid,
                        created_at: currentTimestamp,
                        updated_at: currentTimestamp,
                        lastActivity: currentTimestamp,
                        lastActivityBy: currentUser.uid,
                        reportedBy: userDisplayName,
                        reportedByEmail: currentUser.email || '',
                        updated_by: currentUser.uid,
                        updatedByName: userDisplayName,
                        version: 1,
                        searchTerms: [
                            safeToLowerCase(title),
                            safeToLowerCase(description),
                            safeToLowerCase(category),
                            safeToLowerCase(severity),
                            safeToLowerCase(status),
                            'import',
                            safeToLowerCase(environment)
                        ].filter(Boolean)
                    };

                    // Call actions.bugs.createBug - same as BugReportButton
                    await actions.bugs.createBug(bugData);
                    
                    results.success++;
                } catch (error) {
                    console.error(`Error importing row ${i + 2}:`, error);
                    results.errors.push(`Row ${i + 2}: ${error.message}`);
                }
            }

            toast.dismiss(loadingToast);
            setImportResults(results);
        } catch (error) {
            console.error('Import error:', error);
            toast.dismiss(loadingToast);
            toast.error(`Import failed: ${error.message}`);
        } finally {
            setImporting(false);
        }
    };

    const handleClose = () => {
        resetState();
        onClose();
    };

    const downloadTemplate = () => {
        const headers = ['Bug Title*', 'Description', 'Status', 'Severity', 'Priority', 'Assigned To', 'Environment', 'Frequency', 'Reporter', 'Steps to Reproduce', 'Expected Result', 'Actual Result', 'Tags', 'Category'];
        const sampleData = [
            [
                'Login button not working',
                'Users cannot log in when clicking the login button',
                'New',
                'high',
                'urgent',
                'john@example.com',
                'Production',
                'Often',
                'jane@example.com',
                '1. Go to login page\n2. Enter valid credentials\n3. Click login button',
                'User should be logged in successfully',
                'Nothing happens when clicking login',
                'login,authentication,ui',
                'Authentication'
            ]
        ];

        const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleData]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Bug Report Template');
        XLSX.writeFile(wb, 'bug_import_template.xlsx');
        toast.success('Template downloaded successfully');
    };

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const modalContent = (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
                <div className="fixed inset-0 bg-black/50 transition-opacity" onClick={handleClose} />
                
                <div className="relative w-full max-w-4xl bg-card rounded-lg shadow-theme-xl">
                    <div className="p-6">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center">
                                <Upload className="w-6 h-6 text-primary mr-2" />
                                <h3 className="text-lg font-medium text-foreground">Import Bug Reports</h3>
                            </div>
                            <button onClick={handleClose} className="text-muted-foreground hover:text-foreground">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {!importResults ? (
                            <>
                                {!previewData ? (
                                    <div className="space-y-6">
                                        <div
                                            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                                                dragActive ? 'border-primary bg-primary/10' : 'border-border'
                                            }`}
                                            onDragEnter={handleDrag}
                                            onDragLeave={handleDrag}
                                            onDragOver={handleDrag}
                                            onDrop={handleDrop}
                                        >
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept=".xlsx,.xls,.csv"
                                                onChange={handleFileSelect}
                                                className="hidden"
                                            />
                                            <FileSpreadsheet className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                                            <p className="text-lg font-medium text-foreground mb-2">
                                                Drop your file here or click to browse
                                            </p>
                                            <p className="text-sm text-muted-foreground mb-4">
                                                Supports Excel (.xlsx, .xls) and CSV files
                                            </p>
                                            <button
                                                onClick={() => fileInputRef.current?.click()}
                                                className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/80 transition-colors"
                                            >
                                                Choose File
                                            </button>
                                            {parsing && (
                                                <div className="mt-4 flex items-center justify-center">
                                                    <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                                                    <span className="text-sm text-muted-foreground">Parsing file...</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="bg-info/10 rounded-lg p-4 border border-info/20">
                                            <div className="flex items-start">
                                                <FileText className="w-5 h-5 text-info mr-3 mt-0.5" />
                                                <div className="flex-1">
                                                    <h4 className="text-sm font-medium text-info">Need a template?</h4>
                                                    <p className="text-sm text-info mt-1">
                                                        Download our Excel template with sample data. Only Bug Title is required.
                                                    </p>
                                                    <button
                                                        onClick={downloadTemplate}
                                                        className="mt-2 text-sm text-info hover:text-info/80 font-medium inline-flex items-center"
                                                    >
                                                        <Download className="w-4 h-4 mr-1" />
                                                        Download Template
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        <div className="bg-success/10 rounded-lg p-4 border border-success/20">
                                            <div className="flex items-center">
                                                <CheckCircle className="w-5 h-5 text-success mr-3" />
                                                <div>
                                                    <h4 className="text-sm font-medium text-success">File parsed successfully</h4>
                                                    <p className="text-sm text-success">
                                                        Found {previewData.totalRows} bug reports in {file.name}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <h4 className="text-lg font-medium text-foreground mb-2">Map Columns</h4>
                                            <p className="text-sm text-muted-foreground mb-4">
                                                Only <span className="font-medium text-destructive">Bug Title</span> is required.
                                            </p>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto pr-2">
                                                {Object.entries(importableFields).map(([field, label]) => {
                                                    const isRequired = field === 'title';
                                                    return (
                                                        <div key={field}>
                                                            <label className="block text-xs font-medium text-foreground mb-1">
                                                                {label} {isRequired && <span className="text-destructive">*</span>}
                                                            </label>
                                                            <select
                                                                value={mappings[field] !== undefined ? mappings[field] : ''}
                                                                onChange={(e) => setMappings(prev => ({
                                                                    ...prev,
                                                                    [field]: e.target.value === '' ? undefined : parseInt(e.target.value)
                                                                }))}
                                                                className={`w-full text-sm border rounded px-2 py-1 bg-background text-foreground ${
                                                                    mappings[field] !== undefined 
                                                                        ? 'border-success/50 bg-success/10' 
                                                                        : isRequired 
                                                                            ? 'border-destructive/50 bg-destructive/10' 
                                                                            : 'border-border'
                                                                }`}
                                                            >
                                                                <option value="">
                                                                    {isRequired ? 'Select column...' : 'Skip (use default)'}
                                                                </option>
                                                                {previewData.headers.map((header, index) => (
                                                                    <option key={index} value={index}>
                                                                        {header}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        <div>
                                            <h4 className="text-lg font-medium text-foreground mb-4">Preview (First 5 rows)</h4>
                                            <div className="overflow-x-auto border border-border rounded-lg max-h-64 overflow-y-auto">
                                                <table className="min-w-full divide-y divide-border">
                                                    <thead className="bg-secondary sticky top-0">
                                                        <tr>
                                                            {previewData.headers.map((header, index) => (
                                                                <th key={index} className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                                                    {header}
                                                                </th>
                                                            ))}
                                                        </tr>
                                                    </thead>
                                                    <tbody className="bg-card divide-y divide-border">
                                                        {previewData.rows.map((row, rowIndex) => (
                                                            <tr key={rowIndex}>
                                                                {previewData.headers.map((_, cellIndex) => (
                                                                    <td key={cellIndex} className="px-3 py-2 text-xs text-foreground">
                                                                        {row[cellIndex] || ''}
                                                                    </td>
                                                                ))}
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>

                                        <div className="flex justify-between">
                                            <button
                                                onClick={() => setPreviewData(null)}
                                                className="px-4 py-2 border border-border rounded-md text-sm font-medium text-foreground hover:bg-secondary"
                                            >
                                                Choose Different File
                                            </button>
                                            <div className="space-x-2">
                                                <button
                                                    onClick={handleClose}
                                                    disabled={importing}
                                                    className="px-4 py-2 border border-border rounded-md text-sm font-medium text-foreground hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    onClick={handleImport}
                                                    disabled={importing || mappings.title === undefined}
                                                    className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/80 disabled:bg-muted disabled:cursor-not-allowed inline-flex items-center"
                                                >
                                                    {importing && <RefreshCw className="w-4 h-4 animate-spin mr-2" />}
                                                    {importing ? 'Importing...' : `Import ${previewData.totalRows} Bug Reports`}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="space-y-6">
                                <div className="text-center py-4">
                                    {importResults.success === importResults.total ? (
                                        <CheckCircle className="w-16 h-16 text-success mx-auto mb-4" />
                                    ) : importResults.success > 0 ? (
                                        <AlertCircle className="w-16 h-16 text-warning mx-auto mb-4" />
                                    ) : (
                                        <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
                                    )}
                                    
                                    <h3 className="text-xl font-semibold text-foreground mb-2">Import Complete</h3>
                                    <div className="text-lg text-foreground">
                                        <p className="mb-1">
                                            Successfully imported <span className="font-bold text-success">{importResults.success}</span> of <span className="font-bold">{importResults.total}</span> bug reports
                                        </p>
                                        {importResults.errors.length > 0 && (
                                            <p className="text-destructive">
                                                {importResults.errors.length} {importResults.errors.length === 1 ? 'error' : 'errors'} occurred
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {importResults.errors.length > 0 && (
                                    <div className="bg-destructive/10 rounded-lg p-4 border border-destructive/20">
                                        <div className="flex items-start">
                                            <AlertCircle className="w-5 h-5 text-destructive mr-3 mt-0.5 flex-shrink-0" />
                                            <div className="flex-1">
                                                <h4 className="text-sm font-semibold text-destructive mb-2">
                                                    Import Errors
                                                </h4>
                                                <div className="mt-2 text-sm text-destructive max-h-60 overflow-y-auto space-y-1">
                                                    {importResults.errors.map((error, index) => (
                                                        <div key={index} className="py-1 border-b border-destructive/20 last:border-0">
                                                            {error}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="flex justify-end pt-4 border-t border-border">
                                    <button
                                        onClick={handleClose}
                                        className="px-6 py-2.5 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/80 transition-colors"
                                    >
                                        Done
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
};

export default BugImportModal;