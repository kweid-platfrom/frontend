import React, { useState } from 'react';

const ImportDocument = ({ onImport, onCancel }) => {
    const [file, setFile] = useState(null);
    const [documentType, setDocumentType] = useState('requirements');
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            // Check file type (could be expanded based on requirements)
            const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
            if (validTypes.includes(selectedFile.type)) {
                setFile(selectedFile);
                setError('');
            } else {
                setFile(null);
                setError('Invalid file format. Please upload PDF, DOC, DOCX, or TXT files.');
            }
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!file) {
            setError('Please select a file to upload');
            return;
        }

        setUploading(true);
        // Simulate file upload delay
        setTimeout(() => {
            // In a real app, this would be an API call to upload the file
            onImport({
                name: file.name,
                type: documentType,
                size: file.size,
                lastModified: file.lastModified
            });
            setUploading(false);
        }, 1500);
    };

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
            <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full">
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-900">Import Document</h2>
                    <button
                        onClick={onCancel}
                        className="text-gray-400 hover:text-gray-500"
                    >
                        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Document Type</label>
                            <select
                                value={documentType}
                                onChange={(e) => setDocumentType(e.target.value)}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-[#00897B] focus:border-[#00897B]"
                            >
                                <option value="requirements">Requirements Document</option>
                                <option value="userStories">User Stories</option>
                                <option value="specifications">Technical Specifications</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Upload Document</label>
                            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                                <div className="space-y-1 text-center">
                                    <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                    <div className="flex text-sm text-gray-600">
                                        <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500">
                                            <span>Upload a file</span>
                                            <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} />
                                        </label>
                                        <p className="pl-1">or drag and drop</p>
                                    </div>
                                    <p className="text-xs text-gray-500">
                                        PDF, DOC, DOCX or TXT up to 10MB
                                    </p>
                                </div>
                            </div>
                            {file && (
                                <div className="mt-2 text-sm text-gray-700">
                                    Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                                </div>
                            )}
                            {error && (
                                <div className="mt-2 text-sm text-red-600">
                                    {error}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="px-4 py-2 mr-4 border border-gray-300 rounded shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                            disabled={uploading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 border border-transparent rounded shadow-sm text-sm font-medium text-white bg-[#00897B] hover:bg-[#357771]"
                            disabled={uploading || !file}
                        >
                            {uploading ? 'Uploading...' : 'Import'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ImportDocument;