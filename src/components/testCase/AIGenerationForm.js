import React, { useState } from 'react';
import { AlertCircle, Lightbulb, LoaderCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

const AIGenerationForm = ({ requirements = [], loading = false, onGenerate, error }) => {
    const [aiPrompt, setAiPrompt] = useState('');
    const [selectedRequirement, setSelectedRequirement] = useState('none');
    const [numberOfCases, setNumberOfCases] = useState(5);
    const [aiError, setAiError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setAiError('');
        
        if (!aiPrompt.trim()) {
            setAiError('Please provide a description of the feature to generate test cases for');
            return;
        }
        
        try {
            // Call the parent's onGenerate function with the proper format
            await onGenerate({
                aiPrompt: aiPrompt,
                requirementId: selectedRequirement === 'none' ? '' : selectedRequirement,
                numberOfCases: numberOfCases
            });
        } catch (err) {
            console.error("Error in AIGenerationForm:", err);
            
            // Check if the error is related to rate limiting
            if (err.message?.includes('rate limit') || err.status === 429) {
                setAiError('Rate limit exceeded. Please try again later or reduce the number of test cases requested.');
            } else {
                setAiError(err.message || 'Failed to generate test cases');
            }
        }
    };

    // Sample prompts to help users get started
    const samplePrompts = [
        "Generate comprehensive test cases for a login functionality",
        "Create test cases for API endpoints that handle user registration",
        "Generate test cases for a payment processing workflow",
        "Create test cases for validating form inputs",
    ];

    const handleUseSamplePrompt = (prompt) => {
        setAiPrompt(prompt);
    };

    return (
        <Card>
            <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50">
                <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5" />
                    Generate Test Cases with AI
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
                <form onSubmit={handleSubmit}>
                    {(error || aiError) && (
                        <Alert variant="destructive" className="mb-4">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                                {error || aiError}
                                {(error?.includes('rate limit') || aiError?.includes('rate limit')) && (
                                    <span className="block mt-2">
                                        Try reducing the number of test cases or waiting a few moments before trying again.
                                    </span>
                                )}
                            </AlertDescription>
                        </Alert>
                    )}
                    
                    <div className="mb-4">
                        <Label htmlFor="aiPrompt" className="block text-sm font-medium text-gray-700">
                            Describe the feature or functionality you want test cases for:
                        </Label>
                        <Textarea
                            id="aiPrompt"
                            rows={5}
                            placeholder="E.g., Generate test cases for a user authentication system with login, registration, and password reset functionalities."
                            value={aiPrompt}
                            onChange={(e) => setAiPrompt(e.target.value)}
                            className="mt-1"
                            required
                        />
                    </div>

                    <div className="mb-4">
                        <Label htmlFor="requirement" className="block text-sm font-medium text-gray-700">
                            Link to Requirement (Optional):
                        </Label>
                        <Select
                            value={selectedRequirement}
                            onValueChange={setSelectedRequirement}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select a requirement" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">None</SelectItem>
                                {requirements.map((req) => (
                                    <SelectItem key={req.id} value={req.id}>
                                        {req.title}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="mb-4">
                        <Label htmlFor="numberOfCases" className="block text-sm font-medium text-gray-700">
                            Number of Test Cases to Generate:
                        </Label>
                        <Select
                            value={numberOfCases.toString()}
                            onValueChange={(value) => setNumberOfCases(parseInt(value))}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {[3, 5, 10, 15, 20].map((num) => (
                                    <SelectItem key={num} value={num.toString()}>
                                        {num}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {numberOfCases > 5 && (
                            <p className="text-amber-600 text-xs mt-1">
                                Requesting more than 5 test cases may increase the chance of hitting rate limits.
                            </p>
                        )}
                    </div>

                    <div className="mb-4">
                        <h4 className="text-sm font-medium mb-2">Sample Prompts:</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {samplePrompts.map((prompt, index) => (
                                <Button
                                    key={index}
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleUseSamplePrompt(prompt)}
                                    className="text-left h-auto py-2"
                                >
                                    {prompt}
                                </Button>
                            ))}
                        </div>
                    </div>

                    <div className="mt-6">
                        <Button 
                            type="submit" 
                            disabled={loading || !aiPrompt}
                            className="bg-[#00897B] hover:bg-[#00695C] transition-colors rounded"
                        >
                            {loading ? (
                                <>
                                    <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                                    Generating...
                                </>
                            ) : (
                                "Generate Test Cases"
                            )}
                        </Button>
                    </div>
                </form>
            </CardContent>
            <CardFooter className="flex-col items-start bg-gray-50">
                <div className="text-sm text-gray-500">
                    <p className="font-medium mb-1">Tips for better results:</p>
                    <ul className="list-disc list-inside">
                        <li>Be specific about functionality requirements</li>
                        <li>Mention edge cases you want to test</li>
                        <li>Include any specific validation rules or business logic</li>
                        <li>Specify if you need positive or negative test cases</li>
                        <li>For better performance, start with fewer test cases (3-5)</li>
                    </ul>
                </div>
            </CardFooter>
        </Card>
    );
};

export default AIGenerationForm;