"use client";
import React, { useState } from "react";
import { Plus, X } from "lucide-react";

const AddUserDropdown = ({ onClose }) => {
    const [emails, setEmails] = useState([""]);

    // Add new email field
    const addEmailField = () => {
        setEmails([...emails, ""]);
    };

    // Remove an email field
    const removeEmailField = (index) => {
        setEmails(emails.filter((_, i) => i !== index));
    };

    // Handle email input change
    const handleEmailChange = (index, value) => {
        const updatedEmails = [...emails];
        updatedEmails[index] = value;
        setEmails(updatedEmails);
    };

    // Handle submission of emails
    const handleSubmit = () => {
        console.log("Adding users:", emails);
        onClose(); // Close the dropdown after submission
    };

    return (
        <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-300 shadow-lg rounded-md p-3 z-[9999]">
            <div className="flex justify-between items-center cursor-pointer mb-2">
                <span className="font-semibold text-sm">Add Users</span>
                <button onClick={addEmailField} className="p-1 rounded-full bg-gray-200 hover:bg-gray-300">
                    <Plus className="h-4 w-4 text-gray-600" />
                </button>
            </div>

            {emails.map((email, index) => (
                <div key={index} className="flex items-center mb-2">
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => handleEmailChange(index, e.target.value)}
                        className="flex-1 p-2 border rounded-md text-sm"
                        placeholder="Enter email"
                    />
                    {emails.length > 1 && (
                        <button
                            onClick={() => removeEmailField(index)}
                            className="ml-2 p-1 rounded-full bg-red-500 hover:bg-red-600 text-white"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>
            ))}

            <button
                onClick={handleSubmit}
                className="w-full bg-[#00897B] text-white py-2 rounded-md hover:bg-[#00695C] transition"
            >
                Add
            </button>
        </div>
    );
};

export default AddUserDropdown;
