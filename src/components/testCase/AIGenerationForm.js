import React, { useState } from 'react';
import { AlertCircle, Lightbulb, LoaderCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

// Helper function to analyze if test cases can be automated
const analyzeTestCaseForAutomation = (testCase) => {
    // Keywords that suggest automation potential
    const automationKeywords = [
        'api', 'endpoint', 'request', 'response', 'json', 'data validation',
        'database', 'form validation', 'ui element', 'click', 'input',
        'select', 'dropdown', 'checkbox', 'radio', 'button', 'submit'
    ];
    
    // Check various fields for automation keywords
    const textToAnalyze = [
        testCase.title,
        testCase.description,
        testCase.steps,
        testCase.executionSteps,
        testCase.expectedResult,
        testCase.testType
    ].filter(Boolean).join(' ').toLowerCase();
    
    // Check for automation keywords
    return automationKeywords.some(keyword => textToAnalyze.includes(keyword.toLowerCase()));
};

// Function to generate test cases using AI
const generateTestCases = async (prompt, requirementId, numberOfCases) => {
    // This would normally call an API endpoint, but for demo we'll create mock test cases
    // In a real implementation, this would call your AI service
    
    // For demo purposes, we'll generate some test cases based on the prompt
    const baseTestCases = [
        {
            title: "Verify user login with valid credentials",
            description: "Test that users can log in with valid username/password",
            steps: "1. Navigate to login page\n2. Enter valid username\n3. Enter valid password\n4. Click login button",
            expectedResult: "User should be logged in and redirected to dashboard",
            priority: "high",
            testType: "Functional",
            testEnvironment: "Staging",
        },
        {
            title: "Verify form validation for required fields",
            description: "Test that form properly validates required fields",
            steps: "1. Navigate to form page\n2. Leave required fields empty\n3. Submit form",
            expectedResult: "Form should display error messages for empty required fields",
            priority: "medium",
            testType: "Validation",
            testEnvironment: "QA",
        },
        {
            title: "Test API endpoint response codes",
            description: "Verify API returns correct status codes for different scenarios",
            steps: "1. Send GET request to endpoint\n2. Send POST request with valid data\n3. Send POST request with invalid data",
            expectedResult: "Endpoints should return appropriate status codes (200, 201, 400)",
            priority: "high",
            testType: "API",
            testEnvironment: "Development",
        },
        {
            title: "Check password reset functionality",
            description: "Verify that password reset workflow functions correctly",
            steps: "1. Navigate to login page\n2. Click 'Forgot Password'\n3. Enter email address\n4. Submit form\n5. Check email for reset link\n6. Click reset link\n7. Enter new password\n8. Submit form",
            expectedResult: "Password should be reset and user should be able to login with new password",
            priority: "medium",
            testType: "Functional",
            testEnvironment: "Production",
        },
        {
            title: "Verify logout functionality",
            description: "Test that users can successfully log out",
            steps: "1. Login to application\n2. Click logout button\n3. Attempt to access protected page",
            expectedResult: "User should be logged out and redirected to login page when accessing protected page",
            priority: "low",
            testType: "Functional",
            testEnvironment: "Staging",
        }
    ];
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Generate the requested number of test cases
    const generatedTestCases = [];
    for (let i = 0; i < numberOfCases; i++) {
        // Pick a base test case and modify it slightly
        const baseCase = baseTestCases[i % baseTestCases.length];
        const testCase = {
            ...baseCase,
            title: `${baseCase.title} ${i > 4 ? (i + 1) : ''}`,
            requirementId: requirementId || '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            status: 'draft',
            id: `tc-${Date.now()}-${i}`,
            // Determine if the test case can be automated
            isAutomated: analyzeTestCaseForAutomation(baseCase)
        };
        generatedTestCases.push(testCase);
    }
    
    return generatedTestCases;
};

const AIGenerationForm = ({ requirements = [], loading = false, onGenerate, error }) => {
    const [aiPrompt, setAiPrompt] = useState('');
    const [selectedRequirement, setSelectedRequirement] = useState('none');
    const [numberOfCases, setNumberOfCases] = useState(5);
    const [aiError, setAiError] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setAiError('');
        
        if (!aiPrompt.trim()) {
            setAiError('Please provide a description of the feature to generate test cases for');
            return;
        }
        
        setIsGenerating(true);
        
        try {
            // Generate test cases using our mock function
            const testCases = await generateTestCases(
                aiPrompt,
                selectedRequirement === 'none' ? '' : selectedRequirement,
                numberOfCases
            );
            
            // Pass the generated test cases to the parent component
            await onGenerate(testCases);
        } catch (err) {
            setAiError(err.message || 'Failed to generate test cases');
        } finally {
            setIsGenerating(false);
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
                            <AlertDescription>{error || aiError}</AlertDescription>
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
                            disabled={isGenerating || loading || !aiPrompt}
                            className="bg-[#00897B] hover:bg-[#00695C] transition-colors rounded"
                        >
                            {isGenerating || loading ? (
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
                    </ul>
                </div>
            </CardFooter>
        </Card>
    );
};

export default AIGenerationForm;