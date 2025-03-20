"use client";
import React, { useState } from "react";
import {  CheckCircle, XCircle, Loader2, Upload } from "lucide-react";
import OpenAI from "openai";

const TestScriptPage = () => {
    const [testCases, setTestCases] = useState([]);
    const [loading, setLoading] = useState(false);
    const [ setFile] = useState(null);

    // OpenAI API key (store securely in environment variables)
    const OPENAI_API_KEY = process.env.NEXT_PUBLIC_OPENAI_API_KEY;

    // Function to handle file upload and AI processing
    const handleFileUpload = async (event) => {
        const uploadedFile = event.target.files[0];
        setFile(uploadedFile);
        setLoading(true);

        const reader = new FileReader();
        reader.readAsText(uploadedFile);
        reader.onload = async () => {
            const fileText = reader.result;
            const generatedTestCases = await generateTestCases(fileText);
            setTestCases(generatedTestCases);
            setLoading(false);
        };
    };

    // Function to generate test cases using OpenAI
    const generateTestCases = async (text) => {
        try {
            const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
            const response = await openai.chat.completions.create({
                model: "gpt-4",
                messages: [{ role: "system", content: "Extract structured test cases from the following requirements:" },
                { role: "user", content: text }],
                temperature: 0.3,
            });

            const parsedResponse = JSON.parse(response.choices[0].message.content);
            return parsedResponse.testCases || [];
        } catch (error) {
            console.error("Error generating test cases:", error);
            return [];
        }
    };

    return (
        <div className="p-6 bg-white shadow-lg rounded-lg">
            <h2 className="text-xl font-bold mb-4">Test Case Management</h2>

            {/* File Upload */}
            <label className="flex items-center gap-2 cursor-pointer text-blue-500 hover:underline">
                <Upload className="h-5 w-5" />
                <input type="file" accept=".txt,.docx,.pdf" className="hidden" onChange={handleFileUpload} />
                Import Requirement Document
            </label>

            {loading && <Loader2 className="animate-spin mt-4" />}

            {/* Test Case List */}
            <div className="mt-6 space-y-4">
                {testCases.length > 0 ? (
                    testCases.map((testCase, index) => (
                        <div key={index} className="p-4 border rounded-lg">
                            <h3 className="font-semibold">{testCase.title}</h3>
                            <p><strong>Steps:</strong> {testCase.steps}</p>
                            <p><strong>Expected Outcome:</strong> {testCase.expectedOutcome}</p>
                            <div className="flex gap-2 mt-2">
                                <button className="flex items-center gap-1 text-green-500">
                                    <CheckCircle className="h-4 w-4" /> Pass
                                </button>
                                <button className="flex items-center gap-1 text-red-500">
                                    <XCircle className="h-4 w-4" /> Fail
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="text-gray-500">No test cases available.</p>
                )}
            </div>
        </div>
    );
};

export default TestScriptPage;
