import React, { useState, useRef, useCallback, useMemo } from 'react';
import {
    Upload,
    Download,
    FileSpreadsheet,
    AlertCircle,
    CheckCircle,
    X,
    FileText,
    RefreshCw
} from 'lucide-react';
import * as XLSX from 'xlsx';

const BugImportModal = ({ isOpen, onClose, onImport, activeSuite, currentUser }) => {
    const [dragActive, setDragActive] = useState(false);
    const [file, setFile] = useState(null);
    const [parsing, setParsing] = useState(false);
    const [previewData, setPreviewData] = useState(null);
    const [mappings, setMappings] = useState({});
    const [importResults, setImportResults] = useState(null);
    const [importing, setImporting] = useState(false);
    const fileInputRef = useRef(null);

    const requiredFields = useMemo(() => ({
        title: 'Bug Title',
        description: 'Description',
        status: 'Status',
        severity: 'Severity',
        priority: 'Priority'
    }), []);

    const optionalFields = useMemo(() => ({
        assignee: 'Assignee',
        reporter: 'Reporter',
        steps_to_reproduce: 'Steps to Reproduce',
        expected_result: 'Expected Result',
        actual_result: 'Actual Result',
        tags: 'Tags',
        module: 'Module/Component'
    }), []);

    const statusOptions = ['open', 'in-progress', 'resolved', 'closed', 'duplicate'];
    const severityOptions = ['critical', 'high', 'medium', 'low'];
    const priorityOptions = ['urgent', 'high', 'medium', 'low'];

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
            alert('Please upload an Excel (.xlsx, .xls) or CSV file');
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
                rows: rows.slice(0, 5), // Show first 5 rows for preview
                totalRows: rows.length
            });

            // Auto-map common column names
            const autoMappings = {};
            headers.forEach((header, index) => {
                const headerLower = header.toString().toLowerCase();

                // Check required fields
                Object.entries(requiredFields).forEach(([key, label]) => {
                    if (headerLower.includes(key) || headerLower.includes(label.toLowerCase()) ||
                        headerLower.includes(key.replace('_', ' ')) || headerLower.includes(key.replace('_', ''))) {
                        autoMappings[key] = index;
                    }
                });

                // Check optional fields
                Object.entries(optionalFields).forEach(([key, label]) => {
                    if (headerLower.includes(key) || headerLower.includes(label.toLowerCase()) ||
                        headerLower.includes(key.replace('_', ' ')) || headerLower.includes(key.replace('_', ''))) {
                        autoMappings[key] = index;
                    }
                });

                // Special cases
                if (headerLower.includes('summary') || headerLower.includes('subject')) {
                    autoMappings.title = index;
                }
                if (headerLower.includes('component') || headerLower.includes('area')) {
                    autoMappings.module = index;
                }
            });

            setMappings(autoMappings);
        } catch (error) {
            console.error('Error parsing file:', error);
            alert('Error parsing file: ' + error.message);
        } finally {
            setParsing(false);
        }
    }, [requiredFields, optionalFields]);

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

    const handleImport = async () => {
        if (!previewData || importing) return;

        // Validate required mappings
        const missingRequired = Object.keys(requiredFields).filter(field => mappings[field] === undefined);
        if (missingRequired.length > 0) {
            alert(`Please map the following required fields: ${missingRequired.map(field => requiredFields[field]).join(', ')}`);
            return;
        }

        setImporting(true);

        try {
            // Re-read the full file
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

            const timestamp = new Date();

            for (let i = 0; i < rows.length; i++) {
                const row = rows[i];
                try {
                    const bugData = {};

                    // Map required fields
                    Object.keys(requiredFields).forEach(field => {
                        const columnIndex = mappings[field];
                        if (columnIndex !== undefined && row[columnIndex] !== undefined) {
                            let value = row[columnIndex].toString().trim();

                            // Normalize status, severity, priority
                            if (field === 'status') {
                                value = statusOptions.find(opt => opt.toLowerCase() === value.toLowerCase()) || 'open';
                            } else if (field === 'severity') {
                                value = severityOptions.find(opt => opt.toLowerCase() === value.toLowerCase()) || 'medium';
                            } else if (field === 'priority') {
                                value = priorityOptions.find(opt => opt.toLowerCase() === value.toLowerCase()) || 'medium';
                            }

                            bugData[field] = value;
                        }
                    });

                    // Validate required fields have values
                    const missingValues = Object.keys(requiredFields).filter(field => !bugData[field]);
                    if (missingValues.length > 0) {
                        throw new Error(`Missing required values: ${missingValues.map(field => requiredFields[field]).join(', ')}`);
                    }

                    // Map optional fields
                    Object.keys(optionalFields).forEach(field => {
                        const columnIndex = mappings[field];
                        if (columnIndex !== undefined && row[columnIndex] !== undefined) {
                            let value = row[columnIndex].toString().trim();

                            // Handle tags - split by comma
                            if (field === 'tags' && value) {
                                bugData[field] = value.split(',').map(tag => tag.trim()).filter(tag => tag);
                            } else if (value) {
                                bugData[field] = value;
                            }
                        }
                    });

                    // Add metadata
                    bugData.created_at = timestamp;
                    bugData.updated_at = timestamp;
                    bugData.suite_id = activeSuite?.id;
                    if (!bugData.reporter) {
                        bugData.reporter = currentUser?.email || 'Unknown';
                    }

                    await onImport(bugData);
                    results.success++;
                } catch (error) {
                    results.errors.push(`Row ${i + 2}: ${error.message}`);
                }
            }

            setImportResults(results);
        } catch (error) {
            console.error('Import error:', error);
            alert('Import failed: ' + error.message);
        } finally {
            setImporting(false);
        }
    };

    const handleClose = () => {
        resetState();
        onClose();
    };

    const downloadTemplate = () => {
        const headers = [
            ...Object.values(requiredFields),
            ...Object.values(optionalFields)
        ];

        const sampleData = [
            [
                'Login button not working',
                'Users cannot log in when clicking the login button',
                'open',
                'high',
                'urgent',
                'john@example.com',
                'jane@example.com',
                '1. Go to login page\n2. Enter valid credentials\n3. Click login button',
                'User should be logged in successfully',
                'Nothing happens when clicking login',
                'login,authentication,ui',
                'Authentication Module'
            ]
        ];

        const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleData]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Bug Report Template');
        XLSX.writeFile(wb, 'bug_report_template.xlsx');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center">
                        <Upload className="w-6 h-6 text-teal-600 mr-2" />
                        <h3 className="text-lg font-medium text-gray-900">Import Bug Reports</h3>
                    </div>
                    <button
                        onClick={handleClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {!importResults ? (
                    <>
                        {!previewData ? (
                            <div className="space-y-6">
                                {/* File Upload Area */}
                                <div
                                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${dragActive ? 'border-teal-400 bg-teal-50' : 'border-gray-300'
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
                                    <FileSpreadsheet className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                    <p className="text-lg font-medium text-gray-900 mb-2">
                                        Drop your file here or click to browse
                                    </p>
                                    <p className="text-sm text-gray-500 mb-4">
                                        Supports Excel (.xlsx, .xls) and CSV files
                                    </p>
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="bg-teal-600 text-white px-4 py-2 rounded-md hover:bg-teal-700 transition-colors"
                                    >
                                        Choose File
                                    </button>
                                    {parsing && (
                                        <div className="mt-4 flex items-center justify-center">
                                            <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                                            <span className="text-sm text-gray-600">Parsing file...</span>
                                        </div>
                                    )}
                                </div>

                                {/* Template Download */}
                                <div className="bg-blue-50 rounded-lg p-4">
                                    <div className="flex items-start">
                                        <FileText className="w-5 h-5 text-blue-600 mr-3 mt-0.5" />
                                        <div className="flex-1">
                                            <h4 className="text-sm font-medium text-blue-900">Need a template?</h4>
                                            <p className="text-sm text-blue-700 mt-1">
                                                Download our Excel template with the required columns and sample data.
                                            </p>
                                            <button
                                                onClick={downloadTemplate}
                                                className="mt-2 text-sm text-blue-600 hover:text-blue-800 font-medium inline-flex items-center"
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
                                {/* File Info */}
                                <div className="bg-green-50 rounded-lg p-4">
                                    <div className="flex items-center">
                                        <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
                                        <div>
                                            <h4 className="text-sm font-medium text-green-900">
                                                File parsed successfully
                                            </h4>
                                            <p className="text-sm text-green-700">
                                                Found {previewData.totalRows} bug reports in {file.name}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Column Mapping */}
                                <div>
                                    <h4 className="text-lg font-medium text-gray-900 mb-4">Map Columns</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Required Fields */}
                                        <div>
                                            <h5 className="text-sm font-medium text-red-700 mb-2">Required Fields</h5>
                                            <div className="space-y-3">
                                                {Object.entries(requiredFields).map(([field, label]) => (
                                                    <div key={field}>
                                                        <label className="block text-xs font-medium text-gray-700 mb-1">
                                                            {label} *
                                                        </label>
                                                        <select
                                                            value={mappings[field] || ''}
                                                            onChange={(e) => setMappings(prev => ({
                                                                ...prev,
                                                                [field]: e.target.value === '' ? undefined : parseInt(e.target.value)
                                                            }))}
                                                            className={`w-full text-sm border rounded px-2 py-1 ${mappings[field] !== undefined ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'
                                                                }`}
                                                        >
                                                            <option value="">Select column...</option>
                                                            {previewData.headers.map((header, index) => (
                                                                <option key={index} value={index}>
                                                                    {header}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Optional Fields */}
                                        <div>
                                            <h5 className="text-sm font-medium text-blue-700 mb-2">Optional Fields</h5>
                                            <div className="space-y-3">
                                                {Object.entries(optionalFields).map(([field, label]) => (
                                                    <div key={field}>
                                                        <label className="block text-xs font-medium text-gray-700 mb-1">
                                                            {label}
                                                        </label>
                                                        <select
                                                            value={mappings[field] || ''}
                                                            onChange={(e) => setMappings(prev => ({
                                                                ...prev,
                                                                [field]: e.target.value === '' ? undefined : parseInt(e.target.value)
                                                            }))}
                                                            className="w-full text-sm border border-gray-300 rounded px-2 py-1"
                                                        >
                                                            <option value="">Select column...</option>
                                                            {previewData.headers.map((header, index) => (
                                                                <option key={index} value={index}>
                                                                    {header}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Preview */}
                                <div>
                                    <h4 className="text-lg font-medium text-gray-900 mb-4">Preview (First 5 rows)</h4>
                                    <div className="overflow-x-auto border rounded-lg">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    {previewData.headers.map((header, index) => (
                                                        <th key={index} className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            {header}
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {previewData.rows.map((row, rowIndex) => (
                                                    <tr key={rowIndex}>
                                                        {previewData.headers.map((_, cellIndex) => (
                                                            <td key={cellIndex} className="px-3 py-2 text-xs text-gray-900">
                                                                {row[cellIndex] || ''}
                                                            </td>
                                                        ))}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex justify-between">
                                    <button
                                        onClick={() => setPreviewData(null)}
                                        className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                                    >
                                        Choose Different File
                                    </button>
                                    <div className="space-x-2">
                                        <button
                                            onClick={handleClose}
                                            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleImport}
                                            disabled={importing || Object.keys(requiredFields).some(field => mappings[field] === undefined)}
                                            className="px-4 py-2 bg-teal-600 text-white rounded-md text-sm font-medium hover:bg-teal-700 disabled:bg-gray-300 disabled:cursor-not-allowed inline-flex items-center"
                                        >
                                            {importing && <RefreshCw className="w-4 h-4 animate-spin mr-2" />}
                                            Import {previewData.totalRows} Bug Reports
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="space-y-6">
                        {/* Import Results */}
                        <div className="text-center">
                            <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">Import Complete</h3>
                            <p className="text-sm text-gray-600">
                                Successfully imported {importResults.success} out of {importResults.total} bug reports
                            </p>
                        </div>

                        {/* Errors */}
                        {importResults.errors.length > 0 && (
                            <div className="bg-red-50 rounded-lg p-4">
                                <div className="flex items-start">
                                    <AlertCircle className="w-5 h-5 text-red-600 mr-3 mt-0.5" />
                                    <div className="flex-1">
                                        <h4 className="text-sm font-medium text-red-900">
                                            {importResults.errors.length} errors occurred
                                        </h4>
                                        <div className="mt-2 text-sm text-red-700 max-h-40 overflow-y-auto">
                                            {importResults.errors.map((error, index) => (
                                                <p key={index} className="mb-1">{error}</p>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end">
                            <button
                                onClick={handleClose}
                                className="px-4 py-2 bg-teal-600 text-white rounded-md text-sm font-medium hover:bg-teal-700"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BugImportModal;