// components/TestCases/ImportModal.js
'use client'

import { useState, useRef } from 'react';
import { X, Upload, FileText, AlertCircle, CheckCircle } from 'lucide-react';

export default function ImportModal({ onClose, onImportComplete }) {
    const [dragActive, setDragActive] = useState(false);
    const [file, setFile] = useState(null);
    const [importing, setImporting] = useState(false);
    const [importResults, setImportResults] = useState(null);
    const [mappingConfig, setMappingConfig] = useState({
        title: 'title',
        description: 'description',
        priority: 'priority',
        status: 'status',
        assignee: 'assignee',
        tags: 'tags',
        preconditions: 'preconditions',
        steps: 'steps',
        expectedResult: 'expectedResult'
    });
    const [previewData, setPreviewData] = useState([]);
    const fileInputRef = useRef(null);

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileSelect(e.dataTransfer.files[0]);
        }
    };

    const handleFileSelect = (selectedFile) => {
        if (selectedFile) {
            const validTypes = [
                'text/csv',
                'application/vnd.ms-excel',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'application/json'
            ];
            
            if (validTypes.includes(selectedFile.type) || selectedFile.name.endsWith('.csv')) {
                setFile(selectedFile);
                parseFilePreview(selectedFile);
            } else {
                alert('Please select a valid file (CSV, Excel, or JSON)');
            }
        }
    };

    const parseFilePreview = async (file) => {
        try {
            const text = await file.text();
            let data = [];

            if (file.type === 'application/json' || file.name.endsWith('.json')) {
                data = JSON.parse(text);
            } else if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
                const lines = text.split('\n').filter(line => line.trim());
                const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
                
                data = lines.slice(1, 6).map(line => {
                    const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
                    const obj = {};
                    headers.forEach((header, index) => {
                        obj[header] = values[index] || '';
                    });
                    return obj;
                });
            }

            setPreviewData(data.slice(0, 5)); // Show first 5 rows for preview
        } catch (error) {
            console.error('Error parsing file:', error);
            alert('Error parsing file. Please check the format.');
        }
    };

    const handleImport = async () => {
        if (!file) return;

        setImporting(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('mapping', JSON.stringify(mappingConfig));

            // Simulate import process
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Mock results
            const results = {
                total: 150,
                successful: 142,
                failed: 8,
                errors: [
                    'Row 23: Missing required field "title"',
                    'Row 45: Invalid priority value',
                    'Row 67: Duplicate test case ID'
                ]
            };

            setImportResults(results);
            
            if (results.successful > 0) {
                setTimeout(() => {
                    onImportComplete();
                }, 2000);
            }
        } catch (error) {
            console.error('Import failed:', error);
            alert('Import failed. Please try again.');
        } finally {
            setImporting(false);
        }
    };

    const resetModal = () => {
        setFile(null);
        setPreviewData([]);
        setImportResults(null);
        setImporting(false);
    };

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div 
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-background/80"
            onClick={handleBackdropClick}
        >
            <div className="relative bg-card rounded-lg shadow-theme-xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-border">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-border">
                    <h2 className="text-xl font-semibold text-foreground">Import Test Cases</h2>
                    <button
                        onClick={onClose}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                    {!file && !importResults && (
                        <>
                            {/* File Upload */}
                            <div
                                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                                    dragActive 
                                        ? 'border-primary bg-primary/10' 
                                        : 'border-border hover:border-primary/50'
                                }`}
                                onDragEnter={handleDrag}
                                onDragLeave={handleDrag}
                                onDragOver={handleDrag}
                                onDrop={handleDrop}
                            >
                                <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                                <p className="text-lg mb-2 text-foreground">
                                    Drag and drop your file here, or{' '}
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="text-primary hover:text-primary/80 underline"
                                    >
                                        browse
                                    </button>
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    Supports CSV, Excel (.xlsx, .xls), and JSON files
                                </p>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    className="hidden"
                                    accept=".csv,.xlsx,.xls,.json"
                                    onChange={(e) => handleFileSelect(e.target.files[0])}
                                />
                            </div>

                            {/* Format Examples */}
                            <div className="mt-6">
                                <h3 className="text-lg font-medium mb-3 text-foreground">Expected Format</h3>
                                <div className="bg-muted rounded-lg p-4">
                                    <p className="text-sm text-muted-foreground mb-2">
                                        Your file should contain the following columns:
                                    </p>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <strong className="text-foreground">Required:</strong>
                                            <ul className="list-disc list-inside ml-2 text-muted-foreground">
                                                <li>title</li>
                                                <li>description</li>
                                                <li>steps</li>
                                                <li>expectedResult</li>
                                            </ul>
                                        </div>
                                        <div>
                                            <strong className="text-foreground">Optional:</strong>
                                            <ul className="list-disc list-inside ml-2 text-muted-foreground">
                                                <li>priority (High, Medium, Low)</li>
                                                <li>status (Active, Draft, Archived)</li>
                                                <li>assignee</li>
                                                <li>tags (comma-separated)</li>
                                                <li>preconditions</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {file && !importResults && (
                        <>
                            {/* File Info */}
                            <div className="flex items-center gap-3 mb-6 p-4 bg-info/10 rounded-lg border border-info/20">
                                <FileText className="h-8 w-8 text-info" />
                                <div>
                                    <p className="font-medium text-foreground">{file.name}</p>
                                    <p className="text-sm text-muted-foreground">
                                        {(file.size / 1024).toFixed(1)} KB
                                    </p>
                                </div>
                                <button
                                    onClick={resetModal}
                                    className="ml-auto text-muted-foreground hover:text-foreground"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Preview */}
                            {previewData.length > 0 && (
                                <div className="mb-6">
                                    <h3 className="text-lg font-medium mb-3 text-foreground">Preview (First 5 rows)</h3>
                                    <div className="overflow-x-auto border border-border rounded-lg">
                                        <table className="min-w-full">
                                            <thead className="bg-muted">
                                                <tr>
                                                    {Object.keys(previewData[0]).map(key => (
                                                        <th key={key} className="px-4 py-2 text-left text-sm font-medium text-muted-foreground border-b border-border">
                                                            {key}
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody className="bg-card">
                                                {previewData.map((row, index) => (
                                                    <tr key={index} className="border-b border-border">
                                                        {Object.values(row).map((value, cellIndex) => (
                                                            <td key={cellIndex} className="px-4 py-2 text-sm text-muted-foreground">
                                                                {String(value).substring(0, 50)}
                                                                {String(value).length > 50 ? '...' : ''}
                                                            </td>
                                                        ))}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* Column Mapping */}
                            <div className="mb-6">
                                <h3 className="text-lg font-medium mb-3 text-foreground">Column Mapping</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    {Object.entries(mappingConfig).map(([field, mapping]) => (
                                        <div key={field}>
                                            <label className="block text-sm font-medium text-foreground mb-1">
                                                {field.charAt(0).toUpperCase() + field.slice(1)}
                                                {['title', 'description', 'steps', 'expectedResult'].includes(field) && (
                                                    <span className="text-destructive ml-1">*</span>
                                                )}
                                            </label>
                                            <select
                                                value={mapping}
                                                onChange={(e) => setMappingConfig(prev => ({
                                                    ...prev,
                                                    [field]: e.target.value
                                                }))}
                                                className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background text-foreground focus:ring-2 focus:ring-ring"
                                            >
                                                <option value="">-- Skip --</option>
                                                {previewData.length > 0 && Object.keys(previewData[0]).map(column => (
                                                    <option key={column} value={column}>
                                                        {column}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}

                    {importResults && (
                        <div className="space-y-6">
                            {/* Import Results */}
                            <div className="text-center">
                                <CheckCircle className="mx-auto h-16 w-16 text-success mb-4" />
                                <h3 className="text-xl font-semibold mb-2 text-foreground">Import Complete</h3>
                                <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-info">{importResults.total}</div>
                                        <div className="text-sm text-muted-foreground">Total</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-success">{importResults.successful}</div>
                                        <div className="text-sm text-muted-foreground">Successful</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-destructive">{importResults.failed}</div>
                                        <div className="text-sm text-muted-foreground">Failed</div>
                                    </div>
                                </div>
                            </div>

                            {/* Errors */}
                            {importResults.errors.length > 0 && (
                                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                                    <div className="flex items-center gap-2 mb-3">
                                        <AlertCircle className="h-5 w-5 text-destructive" />
                                        <h4 className="font-medium text-destructive">Import Errors</h4>
                                    </div>
                                    <ul className="text-sm text-destructive space-y-1">
                                        {importResults.errors.map((error, index) => (
                                            <li key={index}>• {error}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 p-6 border-t border-border bg-muted">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-foreground bg-background border border-border rounded-lg hover:bg-secondary transition-colors"
                        disabled={importing}
                    >
                        {importResults ? 'Close' : 'Cancel'}
                    </button>
                    {file && !importResults && (
                        <button
                            onClick={handleImport}
                            disabled={importing}
                            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                        >
                            {importing ? 'Importing...' : 'Import Test Cases'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}