"use client"; 

import { useState } from "react";
import { db, setDoc, doc, auth } from "firebase/auth";
import { useNavigate } from "react-router-dom";

const AddUsers = () => {
    const [emails, setEmails] = useState("");
    const [orgDomain] = useState(auth.currentUser?.email.split("@")[1]);
    const navigate = useNavigate();

    const handleAddField = () => {
        setEmails([...emails, ""]);
    };

    const handleChange = (index, value) => {
        const updatedEmails = [...emails];
        updatedEmails[index] = value;
        setEmails(updatedEmails)
    };

    const handleSendInvites = async () => {
        const externalUsers = emails.filter(email => !email.endsWith(`@${orgDomain}`));
        if (externalUsers.length > 0) {
            const confirmExternal = window.confirm(`You are about to add ${externalUsers.length} user(s) outside your organisation. proceed?`);
            if (!confirmExternal) return;
        }
        try {
            await Promise.all(
                emails.map(email => setDoc(doc(db, "invites", email), {email, invitedBy: auth.currentUser.email, status: "pending"}))
            );
            alert("Invites sent successfully.");
            navigate("/dashboard");
        } catch (error) {
            alert("Error sending invites: " + error.message);
        }
    };

    return (
        <div>
            <h2>Add Users</h2>
            {emails.map((email, index) => {
                <input type="email" key={index} placeholder="User Email" value={email} onChange={(e) => handleChange(index, e.target.value)} required />
            })}
            <button onClick={handleAddField}>Add User</button>
            <button onClick={handleSendInvites}>Send Invites</button>
            <button onClick={() => navigate("/dashboard")}>Skip</button>
        </div>
    )
};

export default AddUsers;