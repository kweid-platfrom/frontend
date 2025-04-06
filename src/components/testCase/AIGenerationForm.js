import React, { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

const AIGenerationForm = ({ requirements, loading, onGenerate, error }) => {
    const [aiPrompt, setAiPrompt] = useState('');
    const [selectedRequirement, setSelectedRequirement] = useState('');
    const [numberOfCases, setNumberOfCases] = useState(5);

    const handleSubmit = (e) => {
        e.preventDefault();
        onGenerate({
            aiPrompt,
            requirementId: selectedRequirement,
            numberOfCases
        });
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
            <CardHeader>
                <CardTitle>Generate Test Cases with AI</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit}>
                    {error && (
                        <Alert variant="destructive" className="mb-4">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
                    
                    <div className="mb-4">
                        <Label htmlFor="aiPrompt">
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
                        <Label htmlFor="requirement">Link to Requirement (Optional):</Label>
                        <Select
                            value={selectedRequirement}
                            onValueChange={setSelectedRequirement}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select a requirement" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="">None</SelectItem>
                                {requirements.map((req) => (
                                    <SelectItem key={req.id} value={req.id}>
                                        {req.title}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="mb-4">
                        <Label htmlFor="numberOfCases">Number of Test Cases to Generate:</Label>
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
                        <Button type="submit" disabled={loading || !aiPrompt}>
                            {loading ? "Generating..." : "Generate Test Cases"}
                        </Button>
                    </div>
                </form>
            </CardContent>
            <CardFooter className="flex-col items-start">
                <div className="text-sm text-gray-500">
                    <p className="font-medium mb-1">Tips for better results:</p>
                    <ul className="list-disc list-inside">
                        <li>Be specific about functionality requirements</li>
                        <li>Mention edge cases you want to test</li>
                        <li>Include any specific validation rules or business logic</li>
                        <li>Specify if you need positive or negative test cases</li>
                    </ul>
                </div>
            </CardFooter>
        </Card>
    );
};

export default AIGenerationForm;