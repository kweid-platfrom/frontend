/* eslint-disable @typescript-eslint/no-unused-vars */
// services/accountService.js
import { getAuth, updatePassword } from "firebase/auth";
import { getFirestore, setDoc, doc } from "firebase/firestore";
import { app } from "../config/firebase";

const auth = getAuth(app);
const db = getFirestore(app);

export const accountService = {
    // Common public email domains
    publicDomains: [
        'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com',
        'icloud.com', 'me.com', 'mac.com', 'live.com', 'msn.com',
        'googlemail.com', 'ymail.com', 'rocketmail.com', 'att.net',
        'verizon.net', 'sbcglobal.net', 'comcast.net', 'cox.net',
        'charter.net', 'earthlink.net', 'juno.com', 'netzero.net',
        'protonmail.com', 'tutanota.com', 'zoho.com', 'fastmail.com'
    ],

    /**
     * Determines if an email is from a public domain
     * @param {string} email - The email address to check
     * @returns {boolean} - True if it's a public domain, false if custom domain
     */
    isPublicDomain(email) {
        if (!email) return true; // Default to public if no email
        
        const domain = email.split('@')[1]?.toLowerCase();
        if (!domain) return true;
        
        return this.publicDomains.includes(domain);
    },

    /**
     * Determines account type based on email domain
     * @param {string} email - The email address to check
     * @returns {string} - 'personal' or 'business'
     */
    getAccountType(email) {
        return this.isPublicDomain(email) ? 'personal' : 'business';
    },

    async setupAccount({ name, email, company, industry, companySize, password, isGoogleAuth, inviteEmails = [] }) {
        const user = auth.currentUser;
        if (!user) {
            throw new Error("User authentication failed. Please log in again.");
        }

        const accountType = this.getAccountType(email);
        const orgId = user.uid;

        // Create organization only for business accounts
        if (accountType === 'business' && company && industry && companySize) {
            await setDoc(doc(db, "organizations", orgId), {
                name: company,
                industry: industry,
                size: companySize,
                createdAt: new Date(),
                createdBy: user.uid,
                admin: [user.uid],
                members: [user.uid]
            });
        }

        // Set password for non-Google auth users
        if (!isGoogleAuth && password) {
            try {
                // Import the password setting function
                const { setUserPassword } = await import('../services/authService');
                await setUserPassword(password);
                console.log('Password set successfully');
            } catch (error) {
                console.log("Password setting failed, continuing without password:", error.message);
                // Continue setup even if password setting fails
                // User can set password later through profile settings
            }
        }

        // Create user document
        const userDoc = {
            name,
            email: user.email,
            accountType: accountType,
            role: accountType === 'business' ? "admin" : "user",
            createdAt: new Date()
        };

        // Add organization info only for business accounts
        if (accountType === 'business' && company) {
            userDoc.company = company;
            userDoc.organisationId = orgId;
        }

        await setDoc(doc(db, "users", user.uid), userDoc);

        // Handle invites only for business accounts
        if (accountType === 'business' && inviteEmails.length > 0) {
            console.log("Sending invites to:", inviteEmails);
            // The TeamInvite component handles the actual email sending
        }

        // Cleanup localStorage
        this.cleanupLocalStorage();

        return { success: true, accountType };
    },

    cleanupLocalStorage() {
        const keysToRemove = [
            "needsAccountSetup",
            "googleUserName",
            "googleUserEmail",
            "googleUserPhoto",
            "userFullName",
            "registeredUserName"
        ];

        keysToRemove.forEach(key => localStorage.removeItem(key));
    }
};