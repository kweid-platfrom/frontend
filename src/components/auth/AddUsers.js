"use client";

import { useState, useEffect } from "react";
import { getAuth, onAuthStateChanged, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore, setDoc, doc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { app } from "../../config/firebase";
import { useAlert } from "../../components/CustomAlert";
import { X } from "lucide-react";
import "../../app/globals.css";

const auth = getAuth(app);
const db = getFirestore(app);

const AddUsers = () => {
    const [emails, setEmails] = useState([""]);
    const [orgDomain, setOrgDomain] = useState("");
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const router = useRouter();
    const { showAlert, alertComponent } = useAlert();

    useEffect(() => {
        setPersistence(auth, browserLocalPersistence)
            .then(() => {
                const unsubscribe = onAuthStateChanged(auth, (user) => {
                    if (user) {
                        setUser(user);
                        setOrgDomain(user.email.split("@")[1]);
                    } else {
                        setUser(null);
                    }
                    setLoading(false);
                });
                return () => unsubscribe();
            })
            .catch((error) => {
                console.error("Auth persistence error:", error);
                setLoading(false);
            });
    }, []);

    const handleAddField = () => setEmails([...emails, ""]);

    const handleRemoveField = (index) => {
        setEmails(emails.filter((_, i) => i !== index));
    };

    const handleChange = (index, value) => {
        const updatedEmails = [...emails];
        updatedEmails[index] = value;
        setEmails(updatedEmails);
    };

    const handleSendInvites = async () => {
        if (!user) {
            showAlert("User authentication failed. Please refresh the page and try again.", "error");
            return;
        }

        if (!orgDomain) {
            showAlert("Unable to retrieve organization domain. Please try again.", "error");
            return;
        }

        if (emails.some(email => !email.trim())) {
            showAlert("All email fields are required.", "error");
            return;
        }

        const externalUsers = emails.filter(email => !email.endsWith(`@${orgDomain}`));

        if (externalUsers.length > 0) {
            const confirmExternal = window.confirm(
                `You are about to add ${externalUsers.length} user(s) outside your organization. Proceed?`
            );
            if (!confirmExternal) return;
        }

        setLoading(true);

        try {
            await Promise.all(
                emails.map(email =>
                    setDoc(doc(db, "invites", email), {
                        email,
                        invitedBy: user.email,
                        status: "pending"
                    })
                )
            );

            showAlert("Invites sent successfully!", "success");
            setTimeout(() => router.push("/dashboard"), 2000);
        } catch (error) {
            console.error("Error sending invites: ", error);
            showAlert("Error sending invites. Please try again.", "error");
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    }

    return (
        <>
            {alertComponent}

            <div className="min-h-screen bg-[#fff] flex flex-col items-center">
                <header className="w-full h-[70px] bg-white flex items-center px-8 shadow-sm">
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
                                <button onClick={() => handleRemoveField(index)} className="text-red-500">
                                    <X size={18} />
                                </button>
                            )}
                        </div>
                    ))}

                    <button
                        onClick={handleSendInvites}
                        className={`px-4 py-3 text-base rounded cursor-pointer transition-colors w-full ${
                            loading ? "bg-gray-400 cursor-not-allowed" : "bg-[#00897B] hover:bg-[#00796B] text-white"
                        }`}
                        disabled={loading}
                    >
                        {loading ? "Sending..." : "Send Invite"}
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
