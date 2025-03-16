"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { collection, addDoc, query, where, getDocs } from "firebase/firestore";
import { db } from "../../config/firebase";
import { useAlertContext } from "@/components/CustomAlert";

const AddUserDropdown = ({ onClose, organizationId }) => {
    const { showAlert } = useAlertContext();
    const [emails, setEmails] = useState([""]);
    const [loading, setLoading] = useState(false);

    const addEmailField = () => {
        setEmails([...emails, ""]);
    };

    const handleEmailChange = (index, value) => {
        const updatedEmails = [...emails];
        updatedEmails[index] = value;
        setEmails(updatedEmails);
    };

    const removeEmailField = (index) => {
        const updatedEmails = emails.filter((_, i) => i !== index);
        setEmails(updatedEmails);
    };

    const handleSubmit = async () => {
        if (emails.some((email) => email.trim() === "")) {
            showAlert("Please enter valid email addresses.", "error");
            return;
        }

        setLoading(true);
        try {
            const usersCollection = collection(db, "users");
            
            for (const email of emails) {
                const trimmedEmail = email.trim();

                // Check if the email is already invited
                const q = query(usersCollection, where("email", "==", trimmedEmail));
                const querySnapshot = await getDocs(q);
                
                if (!querySnapshot.empty) {
                    showAlert(`User with email ${trimmedEmail} is already invited.`, "warning");
                    continue;
                }

                const inviteLink = `${window.location.origin}/register?org=${organizationId}`;

                await addDoc(usersCollection, {
                    email: trimmedEmail,
                    inviteLink,
                    createdAt: new Date(),
                    status: "pending",
                    organizationId,
                });
            }

            showAlert("Users invited successfully!", "success");
            onClose();
        } catch (error) {
            console.error("Error adding users:", error);
            showAlert("Failed to invite users. Please try again.", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="absolute right-30 w-[400px] bg-white border border-gray-300 shadow-lg rounded-md z-[999] p-8">
            <div className="flex justify-between items-center cursor-pointer mb-4">
                <span className="font-semibold text-sm">Add Users</span>
                <button onClick={addEmailField} className="p-1 rounded-full bg-gray-200 hover:bg-gray-300 mb-4">
                    <Plus className="h-4 w-4 text-gray-600" />
                </button>
            </div>

            {emails.map((email, index) => (
                <div key={index} className="flex items-center mb-2">
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => handleEmailChange(index, e.target.value)}
                        className="flex-1 p-2 border rounded text-sm focus:outline-none focus:border-[#00897B]"
                        placeholder="Enter email"
                    />
                    {emails.length > 1 && (
                        <button onClick={() => removeEmailField(index)} className="ml-2 p-1 text-red-500">
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>
            ))}

            <button
                onClick={handleSubmit}
                disabled={loading}
                className={`w-full py-2 rounded transition ${
                    loading ? "bg-gray-400 cursor-not-allowed" : "bg-[#00897B] text-white hover:bg-[#00695C]"
                }`}
            >
                {loading ? "Sending..." : "Send Invites"}
            </button>
        </div>
    );
};

export default AddUserDropdown;