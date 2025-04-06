import React, { useState } from 'react';
import { Upload, FileText, LoaderCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

const RequirementImportForm = ({ loading, onImport }) => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [fileContent, setFileContent] = useState('');
    const [error, setError] = useState('');

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Check file type
        const acceptedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'text/markdown'];
        if (!acceptedTypes.includes(file.type)) {
            setError('Please upload a PDF, Word, TXT, or Markdown file');
            setSelectedFile(null);
            return;
        }

        setSelectedFile(file);
        setError('');

        // For text files, preview content
        if (file.type === 'text/plain' || file.type === 'text/markdown') {
            const reader = new FileReader();
            reader.onload = (e) => {
                setFileContent(e.target.result);
            };
            reader.readAsText(file);
        } else {
            setFileContent('');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedFile) {
            setError('Please select a file to import');
            return;
        }

        const formData = new FormData();
        formData.append('requirementDocument', selectedFile);
        
        await onImport(formData);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Import Requirements Document</CardTitle>
                <CardDescription>
                    Upload a document containing your requirements to automatically extract requirements 
                    and generate test cases.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit}>
                    {error && (
                        <Alert variant="destructive" className="mb-4">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    <div className="mb-4">
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                            <div className="flex flex-col items-center">
                                <FileText className="h-10 w-10 text-gray-400 mb-2" />
                                <p className="text-sm font-medium mb-1">
                                    {selectedFile ? selectedFile.name : 'Drag and drop your document here'}
                                </p>
                                <p className="text-xs text-gray-500 mb-3">
                                    Supports: PDF, Word, TXT, Markdown
                                </p>
                                <input
                                    type="file"
                                    id="requirement-doc"
                                    onChange={handleFileChange}
                                    className="hidden"
                                    accept=".pdf,.docx,.txt,.md"
                                />
                                <label htmlFor="requirement-doc">
                                    <Button type="button" variant="outline" size="sm" asChild>
                                        <span>Browse Files</span>
                                    </Button>
                                </label>
                            </div>
                        </div>
                    </div>

                    {fileContent && (
                        <div className="mb-4">
                            <h4 className="text-sm font-medium mb-2">Document Preview:</h4>
                            <div className="border rounded-md p-4 h-40 overflow-y-auto bg-gray-50 text-sm">
                                <pre className="whitespace-pre-wrap">{fileContent}</pre>
                            </div>
                        </div>
                    )}

                    <div className="mt-4">
                        <Button 
                            type="submit" 
                            disabled={loading || !selectedFile}
                            className="w-full"
                        >
                            {loading ? (
                                <>
                                    <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <Upload className="mr-2 h-4 w-4" />
                                    Import Document & Generate Test Cases
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </CardContent>
            <CardFooter className="flex-col items-start">
                <div className="text-sm text-gray-500">
                    <p className="font-medium mb-1">What happens after import:</p>
                    <ol className="list-decimal list-inside">
                        <li>The system will extract requirements from your document</li>
                        <li>Requirements will be stored in your requirements database</li>
                        <li>AI will analyze the requirements to generate relevant test cases</li>
                        <li>You&apos;ll see the results in the &quot;All Test Cases&quot; tab</li>
                    </ol>
                </div>
            </CardFooter>
        </Card>
    );
};

export default RequirementImportForm;