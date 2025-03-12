"use client"
import React, { useState } from "react";

const TestScriptPage = () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [testScripts, setTestScripts] = useState([
        { id: 1, title: "Login Test", description: "Verify user login with valid credentials", steps: [
            "Navigate to the login page",
            "Enter valid email and password",
            "Click on the login button",
            "Verify user is redirected to the dashboard"
        ], expectedResult: "User should successfully log in and access the dashboard." },
        { id: 2, title: "Invalid Login Test", description: "Verify user login with incorrect credentials", steps: [
            "Navigate to the login page",
            "Enter invalid email and password",
            "Click on the login button",
            "Verify error message is displayed"
        ], expectedResult: "User should see an error message indicating incorrect credentials." }
    ]);

    return (
        <div className="p-6 bg-white shadow-md rounded-lg">
            <h2 className="text-2xl font-bold mb-4">Test Scripts</h2>
            <div className="space-y-4">
                {testScripts.map(script => (
                    <div key={script.id} className="border p-4 rounded-md">
                        <h3 className="text-lg font-semibold">{script.title}</h3>
                        <p className="text-gray-600">{script.description}</p>
                        <h4 className="mt-2 font-medium">Steps:</h4>
                        <ol className="list-decimal list-inside text-gray-700">
                            {script.steps.map((step, index) => (
                                <li key={index}>{step}</li>
                            ))}
                        </ol>
                        <h4 className="mt-2 font-medium">Expected Result:</h4>
                        <p className="text-gray-700">{script.expectedResult}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TestScriptPage;