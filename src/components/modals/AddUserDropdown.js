"use client";

import { useState } from "react";
import { Plus, X, CheckCircle, Loader } from "lucide-react";
import { 
    doc, 
    getDoc,
    setDoc
} from "firebase/firestore";
import { db } from "../../config/firebase";
import { useAlertContext } from "@/components/CustomAlert";
import { getAuth } from "firebase/auth";
import { getFunctions, httpsCallable } from "firebase/functions";

const AddUserDropdown = ({ onClose, organizationId }) => {
    const { showAlert } = useAlertContext();
    const [emails, setEmails] = useState([""]);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const auth = getAuth();
    const functions = getFunctions();

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

    const validateEmails = (emailList) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const invalidEmails = emailList.filter(email => email.trim() && !emailRegex.test(email));
        return invalidEmails.length === 0;
    };

    const handleSubmit = async () => {
        // Filter out empty emails
        const filteredEmails = emails.filter(email => email.trim());
        
        if (filteredEmails.length === 0) {
            showAlert("Please enter at least one email address.", "error");
            return;
        }

        if (!validateEmails(filteredEmails)) {
            showAlert("One or more email addresses are invalid.", "error");
            return;
        }

        setLoading(true);
        try {
            const currentUser = auth.currentUser;

            if (!currentUser) {
                showAlert("User authentication failed. Please refresh the page and try again.", "error");
                return;
            }

            // Get organization name
            let organizationName = "the organization";
            try {
                const orgDoc = await getDoc(doc(db, "organizations", organizationId));
                if (orgDoc.exists()) {
                    organizationName = orgDoc.data().name || "the organization";
                }
            } catch (error) {
                console.error("Error fetching organization:", error);
            }

            // Store invites in Firestore first
            await Promise.all(
                filteredEmails.map(async (email) => {
                    const inviteId = `${email.toLowerCase()}_${Date.now()}`;
                    await setDoc(doc(db, "invites", inviteId), {
                        email: email.toLowerCase(),
                        invitedBy: currentUser.email,
                        inviterName: currentUser.displayName || "A team member",
                        organizationName: organizationName,
                        organizationId: organizationId,
                        status: "pending",
                        createdAt: new Date(),
                        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days expiry
                    });
                    return inviteId;
                })
            );

            // Call the Cloud Function to send emails
            const sendInviteEmails = httpsCallable(functions, 'sendInviteEmails');
            await sendInviteEmails({ 
                emails: filteredEmails,
                inviterEmail: currentUser.email,
                inviterName: currentUser.displayName || "A team member",
                organizationName: organizationName
            });

            setSuccess(true);
            showAlert("Invites sent successfully!", "success");
            
            // Close after a short delay
            setTimeout(() => {
                onClose();
            }, 2000);
        } catch (error) {
            console.error("Error sending invites:", error);
            showAlert("Failed to send invites. Please try again.", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="absolute right-30 w-[400px] bg-white border border-gray-300 shadow-lg rounded-md z-[999] p-8">
            <div className="flex justify-between items-center mb-4">
                <span className="font-semibold text-sm">Add Users</span>
                {!success && (
                    <button onClick={addEmailField} className="p-1 rounded-full bg-gray-200 hover:bg-gray-300">
                        <Plus className="h-4 w-4 text-gray-600" />
                    </button>
                )}
            </div>

            {success ? (
                <div className="text-center py-4">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
                    <p className="text-sm text-gray-700">Invites sent successfully!</p>
                </div>
            ) : (
                <>
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
                        className={`w-full py-2 rounded transition mt-2 ${
                            loading ? "bg-gray-400 cursor-not-allowed" : "bg-[#00897B] text-white hover:bg-[#00695C]"
                        }`}
                    >
                        {loading ? (
                            <span className="flex items-center justify-center">
                                <Loader className="animate-spin h-4 w-4 mr-2" />
                                Sending...
                            </span>
                        ) : (
                            "Send Invites"
                        )}
                    </button>
                </>
            )}
        </div>
    );
};

export default AddUserDropdown;