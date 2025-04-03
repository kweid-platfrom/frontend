"use client";

import { useState, useEffect } from "react";
import { getAuth, onAuthStateChanged, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore, setDoc, doc, getDoc } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import { useRouter } from "next/navigation";
import { app } from "../../config/firebase";
import { useAlert } from "../../components/CustomAlert";
import { X, Loader } from "lucide-react";
import "../../app/globals.css";

const auth = getAuth(app);
const db = getFirestore(app);
const functions = getFunctions(app);

const AddUsers = () => {
    const [emails, setEmails] = useState([""]);
    const [orgDomain, setOrgDomain] = useState("");
    const [orgName, setOrgName] = useState("");
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [user, setUser] = useState(null);
    const router = useRouter();
    const { showAlert, alertComponent } = useAlert();

    useEffect(() => {
        setPersistence(auth, browserLocalPersistence)
            .then(() => {
                const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
                    if (currentUser) {
                        setUser(currentUser);
                        setOrgDomain(currentUser.email.split("@")[1]);
                        
                        // Fetch organization name
                        try {
                            const userDoc = await getDoc(doc(db, "users", currentUser.uid));
                            if (userDoc.exists()) {
                                const userData = userDoc.data();
                                if (userData.organisationId) {
                                    const orgDoc = await getDoc(doc(db, "organisations", userData.organisationId));
                                    if (orgDoc.exists()) {
                                        setOrgName(orgDoc.data().name);
                                    }
                                }
                            }
                        } catch (error) {
                            console.error("Error fetching organization data:", error);
                        }
                    } else {
                        setUser(null);
                        router.push("/login");
                    }
                    setLoading(false);
                });
                return () => unsubscribe();
            })
            .catch((error) => {
                console.error("Auth persistence error:", error);
                setLoading(false);
            });
    }, [router]);

    const handleAddField = () => setEmails([...emails, ""]);

    const handleRemoveField = (index) => {
        setEmails(emails.filter((_, i) => i !== index));
    };

    const handleChange = (index, value) => {
        const updatedEmails = [...emails];
        updatedEmails[index] = value;
        setEmails(updatedEmails);
    };

    const validateEmails = (emailList) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const invalidEmails = emailList.filter(email => email.trim() && !emailRegex.test(email));
        return invalidEmails.length === 0;
    };

    const handleSendInvites = async () => {
        if (!user) {
            showAlert("User authentication failed. Please refresh the page and try again.", "error");
            return;
        }

        const filteredEmails = emails.filter(email => email.trim());
        
        if (filteredEmails.length === 0) {
            showAlert("Please enter at least one email address.", "error");
            return;
        }

        if (!validateEmails(filteredEmails)) {
            showAlert("One or more email addresses are invalid.", "error");
            return;
        }

        const externalUsers = filteredEmails.filter(email => !email.endsWith(`@${orgDomain}`));

        if (externalUsers.length > 0) {
            const confirmExternal = window.confirm(
                `You are about to add ${externalUsers.length} user(s) outside your organization. Proceed?`
            );
            if (!confirmExternal) return;
        }

        setSending(true);

        try {
            // Firebase Cloud Function to send email invites
            const sendInviteEmails = httpsCallable(functions, 'sendInviteEmails');
            
            // Store invites in Firestore first
            await Promise.all(
                filteredEmails.map(async (email) => {
                    const inviteId = `${email.toLowerCase()}_${Date.now()}`;
                    await setDoc(doc(db, "invites", inviteId), {
                        email: email.toLowerCase(),
                        invitedBy: user.email,
                        inviterName: user.displayName || "A team member",
                        organizationName: orgName || "the organization",
                        status: "pending",
                        createdAt: new Date(),
                        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days expiry
                    });
                    return inviteId;
                })
            );

            // Call the Cloud Function to send emails
            await sendInviteEmails({ 
                emails: filteredEmails,
                inviterEmail: user.email,
                inviterName: user.displayName || "A team member",
                organizationName: orgName || "the organization"
            });

            showAlert("Invites sent successfully!", "success");
            setTimeout(() => router.push("/dashboard"), 2000);
        } catch (error) {
            console.error("Error sending invites: ", error);
            showAlert("Error sending invites. Please try again.", "error");
        } finally {
            setSending(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader className="animate-spin h-6 w-6 mr-2" />
                <span>Loading...</span>
            </div>
        );
    }

    return (
        <>
            {alertComponent}

            <div className="min-h-screen bg-[#fff] flex flex-col items-center">
                <header className="w-full h-[70px] bg-white flex items-center px-8 shadow-sm sticky top-0 z-10">
                    <span className="font-bold text-2xl text-[#00897B]">LOGO</span>
                </header>
                
                <div className="justify-center text-center p-10">
                    <h2 className="text-[#2D3142] text-2xl font-bold text-center mb-3">Invite Team Members</h2>
                    <p>– Collaborate seamlessly. You can skip and invite later. – </p>
                </div>

                <div className="w-full max-w-sm bg-white rounded-lg p-8 flex flex-col gap-6">
                    <div className="w-full flex justify-end">
                        <button
                            onClick={handleAddField}
                            className="bg-transparent text-[#00897B] border border-[#00897B] rounded px-4 py-2 text-base cursor-pointer hover:bg-[#00897B] hover:text-white transition-colors"
                        >
                            + Add
                        </button>
                    </div>

                    {emails.map((email, index) => (
                        <div key={index} className="flex items-center gap-2">
                            <input
                                type="email"
                                placeholder="User Email"
                                value={email}
                                onChange={(e) => handleChange(index, e.target.value)}
                                required
                                className="flex-1 px-4 py-3 border border-[#E1E2E6] rounded text-[#2D3142] focus:outline-none focus:border-[#00897B]"
                            />
                            {emails.length > 1 && (
                                <button 
                                    onClick={() => handleRemoveField(index)} 
                                    className="text-red-500"
                                    aria-label="Remove email"
                                >
                                    <X size={18} />
                                </button>
                            )}
                        </div>
                    ))}

                    <button
                        onClick={handleSendInvites}
                        className={`px-4 py-3 text-base rounded cursor-pointer transition-colors w-full flex items-center justify-center ${
                            sending ? "bg-gray-400 cursor-not-allowed" : "bg-[#00897B] hover:bg-[#00796B] text-white"
                        }`}
                        disabled={sending}
                    >
                        {sending ? (
                            <>
                                <Loader className="animate-spin h-5 w-5 mr-2" />
                                Sending...
                            </>
                        ) : (
                            "Send Invite"
                        )}
                    </button>

                    <button
                        onClick={() => router.push("/dashboard")}
                        className="self-end text-[#00897b] hover:text-[#00796b] transition-colors"
                    >
                        Skip →
                    </button>
                </div>
            </div>
        </>
    );
};

export default AddUsers;