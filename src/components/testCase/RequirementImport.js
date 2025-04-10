import React, { useState } from 'react';
import { Upload, FileText, LoaderCircle, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useRouter } from 'next/navigation';

const DocumentUploader = () => {
    const router = useRouter();
    const [file, setFile] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState(null);
    const [extractedData, setExtractedData] = useState(null);
    const [savedSuccess, setSavedSuccess] = useState(false);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            setError(null);
            setSavedSuccess(false);
        }
    };

    const handleUpload = async () => {
        if (!file) {
            setError("Please select a file to upload");
            return;
        }

        setIsLoading(true);
        setError(null);
        setSavedSuccess(false);

        try {
            const fileReader = new FileReader();
            
            fileReader.onload = async (e) => {
                try {
                    const fileContent = e.target.result;
                    const fileType = file.name.split('.').pop().toLowerCase();
                    
                    // Call the API to extract requirements
                    const response = await fetch('/api/extract-requirements', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ 
                            fileContent,
                            fileName: file.name,
                            fileType
                        }),
                    });

                    if (!response.ok) {
                        const errorText = await response.text();
                        throw new Error(`Failed to extract requirements: ${response.status} ${response.statusText} - ${errorText}`);
                    }

                    const data = await response.json();
                    setExtractedData(data);
                } catch (err) {
                    setError(`Error processing file: ${err.message}`);
                } finally {
                    setIsLoading(false);
                }
            };

            fileReader.onerror = () => {
                setError("Failed to read the file");
                setIsLoading(false);
            };

            // Choose the appropriate reading method based on file type
            const fileType = file.name.split('.').pop().toLowerCase();
            if (fileType === 'pdf' || fileType === 'doc' || fileType === 'docx') {
                fileReader.readAsArrayBuffer(file);
            } else {
                fileReader.readAsText(file);
            }
        } catch (err) {
            setError(`Error uploading file: ${err.message}`);
            setIsLoading(false);
        }
    };

    const handleSaveTestCases = async () => {
        if (!extractedData || !extractedData.testCases || extractedData.testCases.length === 0) {
            setError("No test cases to save");
            return;
        }

        setIsSaving(true);
        setError(null);

        try {
            const response = await fetch('/api/test-cases', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ testCases: extractedData.testCases }),
            });

            if (!response.ok) {
                throw new Error(`Failed to save test cases: ${response.statusText}`);
            }

            setSavedSuccess(true);

            // Navigate to test case management page after a brief delay
            setTimeout(() => {
                router.push('/test-cases');
            }, 1500);
        } catch (err) {
            setError(`Error saving test cases: ${err.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    const resetUpload = () => {
        setFile(null);
        setExtractedData(null);
        setError(null);
        setSavedSuccess(false);
    };

    // Get accepted file types
    const acceptedFileTypes = ".txt,.doc,.docx,.pdf";

    return (
        <div className="w-full max-w-4xl mx-auto">
            <Card className="w-full">
                <CardHeader>
                    <CardTitle>Upload Requirements Document</CardTitle>
                    <CardDescription>
                        Upload a requirements document to extract requirements and generate test cases
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {!extractedData ? (
                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <input
                                    type="file"
                                    id="file-upload"
                                    className="hidden"
                                    onChange={handleFileChange}
                                    accept={acceptedFileTypes}
                                />
                                <label
                                    htmlFor="file-upload"
                                    className="flex items-center gap-2 cursor-pointer px-4 py-2 border-2 border-dashed rounded-md hover:bg-gray-50 transition-colors"
                                >
                                    <Upload size={20} />
                                    {file ? file.name : "Select document"}
                                </label>
                                <Button
                                    onClick={handleUpload}
                                    disabled={!file || isLoading}
                                >
                                    {isLoading ? <LoaderCircle className="animate-spin mr-2" size={16} /> : <FileText className="mr-2" size={16} />}
                                    {isLoading ? "Processing..." : "Process Document"}
                                </Button>
                            </div>
                            {file && (
                                <div className="text-sm text-gray-500">
                                    File type: {file.name.split('.').pop().toUpperCase()}
                                </div>
                            )}
                            {error && (
                                <Alert variant="destructive">
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}
                            <div className="text-sm text-gray-500 mt-2">
                                Supported file types: TXT, DOC, DOCX, PDF
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            <div>
                                <h3 className="text-lg font-medium">Extracted Requirements</h3>
                                <div className="mt-2 space-y-4">
                                    {extractedData.requirements.map((req) => (
                                        <div key={req.id} className="p-4 border rounded-md">
                                            <div className="flex justify-between">
                                                <h4 className="font-medium">{req.title}</h4>
                                                <span className="text-sm px-2 py-1 bg-blue-100 rounded-full">
                                                    {req.priority}
                                                </span>
                                            </div>
                                            <p className="text-sm mt-1">{req.description}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <h3 className="text-lg font-medium">Generated Test Cases</h3>
                                <div className="mt-2 space-y-4">
                                    {extractedData.testCases.map((test, index) => (
                                        <div key={index} className="p-4 border rounded-md">
                                            <div className="flex justify-between">
                                                <h4 className="font-medium">{test.title}</h4>
                                                <span className="text-sm px-2 py-1 bg-green-100 rounded-full">
                                                    {test.priority}
                                                </span>
                                            </div>
                                            <p className="text-sm mt-1">{test.description}</p>
                                            <div className="mt-2 text-sm">
                                                <div className="font-medium">Steps:</div>
                                                <p className="whitespace-pre-line">{test.steps}</p>
                                            </div>
                                            <div className="mt-2 text-sm">
                                                <div className="font-medium">Expected Result:</div>
                                                <p>{test.expectedResult}</p>
                                            </div>
                                            <div className="mt-2 text-sm">
                                                <div className="font-medium">Automation Recommendation:</div>
                                                <p>{test.automationRecommendation}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
                <CardFooter className="flex justify-between">
                    {extractedData && (
                        <>
                            <Button variant="outline" onClick={resetUpload}>
                                Upload Another Document
                            </Button>
                            <Button
                                onClick={handleSaveTestCases}
                                disabled={isSaving || savedSuccess}
                                className="ml-2"
                            >
                                {isSaving ? (
                                    <>
                                        <LoaderCircle className="animate-spin mr-2" size={16} />
                                        Saving...
                                    </>
                                ) : savedSuccess ? (
                                    <>
                                        <Save className="mr-2" size={16} />
                                        Saved! Redirecting...
                                    </>
                                ) : (
                                    <>
                                        <Save className="mr-2" size={16} />
                                        Save to Test Cases
                                    </>
                                )}
                            </Button>
                        </>
                    )}
                </CardFooter>
            </Card>
        </div>
    );
};

export default DocumentUploader;