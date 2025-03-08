import { useState } from "react";
import { getAuth } from "firebase/auth";
import { getFirestore, setDoc, doc } from "firebase/firestore";
import { useRouter } from "next/router";
import { app } from "../../config/firebase";

const auth = getAuth(app);
const db = getFirestore(app);

const AddUsers = () => {
    const [emails, setEmails] = useState([""]);
    const [orgDomain] = useState(auth.currentUser?.email.split("@")[1]);
    const router = useRouter();

    const handleAddField = () => {
        setEmails([...emails, ""]);
    };

    const handleChange = (index, value) => {
        const updatedEmails = [...emails];
        updatedEmails[index] = value;
        setEmails(updatedEmails);
    };

    const handleSendInvites = async () => {
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
            alert("Invites sent successfully");
            router.push("/dashboard");
        } catch (error) {
            console.error("Error sending invites: ", error);
        }
    };

    return (
        <div>
            <h2>Add Users</h2>
            {emails.map((email, index) => (
                <input
                    key={index}
                    type="email"
                    placeholder="User Email"
                    value={email}
                    onChange={(e) => handleChange(index, e.target.value)}
                    required
                />
            ))}
            <button onClick={handleAddField}>Add User</button>
            <button onClick={handleSendInvites}>Send Invites</button>
            <button onClick={() => router.push("/dashboard")}>Skip</button>
        </div>
    );
};

export default AddUsers;
