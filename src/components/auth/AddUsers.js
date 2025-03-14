"use client";

import { useState, useEffect } from "react";
import { getAuth } from "firebase/auth";
import { getFirestore, setDoc, doc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { app } from "../../config/firebase";
import { useAlert } from "../../components/CustomAlert";
import "../../app/globals.css";

const auth = getAuth(app);
const db = getFirestore(app);

const AddUsers = () => {
    const [emails, setEmails] = useState([""]);
    const [orgDomain, setOrgDomain] = useState("");
    const router = useRouter();
    const { showAlert, alertComponent } = useAlert();

    useEffect(() => {
        if (auth.currentUser?.email) {
            setOrgDomain(auth.currentUser.email.split("@")[1]);
        }
    }, []);

    const handleAddField = () => setEmails([...emails, ""]);

    const handleChange = (index, value) => {
        const updatedEmails = [...emails];
        updatedEmails[index] = value;
        setEmails(updatedEmails);
    };

    const handleSendInvites = async () => {
        if (!orgDomain) {
            showAlert("User authentication failed. Please log in again.", "error");
            router.push("/login");
            return;
        }

        const externalUsers = emails.filter(email => !email.endsWith(`@${orgDomain}`));

        if (externalUsers.length > 0) {
            const confirmExternal = window.confirm(
                `You are about to add ${externalUsers.length} user(s) outside your organization. Proceed?`
            );
            if (!confirmExternal) return;
        }

        try {
            await Promise.all(
                emails.map(email =>
                    setDoc(doc(db, "invites", email), { email, invitedBy: auth.currentUser.email, status: "pending" })
                )
            );
            showAlert("Invites sent successfully!", "success");
            setTimeout(() => router.push("/dashboard"), 2000);
        } catch (error) {
            showAlert("Error sending invites. Try again.", "error");
            console.error("Error sending invites: ", error);
        }
    };

    return (
        <>
            {/* Alert Component */}
            {alertComponent}

            <div className="min-h-screen bg-[#fff] flex flex-col items-center">
                <header className="w-full h-[70px] bg-white flex items-center px-8 shadow-sm">
                    <span className="font-bold text-2xl text-[#00897B]">LOGO</span>
                </header>

                <div className="w-full max-w-md mt-[10vh] bg-white rounded-lg p-8 flex flex-col gap-6">
                    <h2 className="text-[#2D3142] text-2xl font-bold text-center">Add Users</h2>

                    {emails.map((email, index) => (
                        <input
                            key={index}
                            type="email"
                            placeholder="User Email"
                            value={email}
                            onChange={(e) => handleChange(index, e.target.value)}
                            required
                            className="px-4 py-3 border border-[#E1E2E6] rounded text-[#2D3142] focus:outline-none focus:border-[#00897B]"
                        />
                    ))}

                    <button
                        onClick={handleAddField}
                        className="bg-transparent text-[#00897B] border border-[#00897B] rounded px-4 py-3 text-base cursor-pointer hover:bg-[#00897B] hover:text-white transition-colors"
                    >
                        + Add User
                    </button>

                    <button
                        onClick={handleSendInvites}
                        className="bg-[#00897B] text-white border-none rounded px-4 py-3 text-base cursor-pointer hover:bg-[#00796B] transition-colors"
                    >
                        Send Invites
                    </button>

                    <button
                        onClick={() => router.push("/dashboard")}
                        className="bg-gray-300 text-gray-700 border-none rounded px-4 py-3 text-base cursor-pointer hover:bg-gray-400 transition-colors"
                    >
                        Skip
                    </button>
                </div>
            </div>
        </>
    );
};

export default AddUsers;
