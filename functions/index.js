// functions/index.js
import { https } from 'firebase-functions';
import { initializeApp, firestore } from 'firebase-admin';
import { createTransport } from 'nodemailer';
import { onRequest } from "firebase-functions/v2/https";
import { logger } from "firebase-functions/logger";
import cors from 'cors';

// Initialize Firebase admin once
initializeApp();

// Create a CORS middleware instance
const corsHandler = cors({ origin: true });

// Configure nodemailer with your email service provider
const transporter = createTransport({
    service: 'gmail',  // Replace with your email service
    auth: {
        user: process.env.EMAIL_USER,  // Set environment variables in Firebase
        pass: process.env.EMAIL_PASSWORD
    }
});

export const helloWorld = onRequest((request, response) => {
    logger.info("Hello logs!", { structuredData: true });
    response.send("Hello from Firebase!");
});

// For callable function (what you're using in your React app)
export const sendInviteEmails = https.onCall(async (data, context) => {
    // Ensure user is authenticated
    if (!context.auth) {
        throw new https.HttpsError(
            'unauthenticated',
            'User must be authenticated to send invites.'
        );
    }

    const { emails, inviterEmail, inviterName, organizationName } = data;
    if (!emails || !Array.isArray(emails) || emails.length === 0) {
        throw new https.HttpsError(
            'invalid-argument',
            'Email list is required and must be a non-empty array.'
        );
    }

    try {
        // Create a unique signup link that includes an invite token
        const results = await Promise.all(
            emails.map(async (email) => {
                // Generate a signup URL with the invite token
                const inviteToken = await firestore().collection('invites')
                    .where('email', '==', email.toLowerCase())
                    .where('status', '==', 'pending')
                    .get()
                    .then(snapshot => {
                        if (snapshot.empty) return null;
                        return snapshot.docs[0].id;
                    });
                if (!inviteToken) {
                    throw new Error(`No pending invite found for ${email}`);
                }
                const signupUrl = `https://yourdomain.com/register?invite=${inviteToken}`;
                // Email content
                const mailOptions = {
                    from: `"${organizationName}" <${process.env.EMAIL_USER}>`,
                    to: email,
                    subject: `You've been invited to join ${organizationName}`,
                    html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #00897B;">Join ${organizationName}</h2>
                <p>Hello,</p>
                <p>${inviterName} (${inviterEmail}) has invited you to join ${organizationName}.</p>
                <p>Click the button below to accept the invitation and set up your account:</p>
                <div style="text-align: center; margin: 25px 0;">
                    <a href="${signupUrl}" style="background-color: #00897B; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Accept Invitation</a>
                </div>
                <p>If you have any questions, please contact ${inviterEmail}.</p>
                <p>This invitation will expire in 7 days.</p>
                <hr style="border: 1px solid #eee; margin: 20px 0;" />
                <p style="color: #888; font-size: 12px;">If you received this invitation by mistake, you can safely ignore this email.</p>
                </div>
            `
                };
                // Send the email
                return transporter.sendMail(mailOptions);
            })
        );
        return { success: true, count: results.length };
    } catch (error) {
        console.error('Error sending invite emails:', error);
        throw new https.HttpsError('internal', 'Error sending invite emails');
    }
});

// Also create an HTTP version of the function with CORS handling
// This is useful if you're making direct fetch requests instead of using httpsCallable
export const sendInviteEmailsHttp = https.onRequest((request, response) => {
    return corsHandler(request, response, async () => {
        try {
            // Check if the user is authenticated using Firebase Auth token
            // You'd need to verify the ID token that's sent in the Authorization header
            
            const { emails, inviterEmail, inviterName, organizationName } = request.body;
            if (!emails || !Array.isArray(emails) || emails.length === 0) {
                return response.status(400).json({
                    error: 'Email list is required and must be a non-empty array.'
                });
            }

            // Same logic as the callable function
            const results = await Promise.all(
                emails.map(async (email) => {
                    const inviteToken = await firestore().collection('invites')
                        .where('email', '==', email.toLowerCase())
                        .where('status', '==', 'pending')
                        .get()
                        .then(snapshot => {
                            if (snapshot.empty) return null;
                            return snapshot.docs[0].id;
                        });
                    if (!inviteToken) {
                        throw new Error(`No pending invite found for ${email}`);
                    }
                    const signupUrl = `https://yourdomain.com/register?invite=${inviteToken}`;
                    const mailOptions = {
                        from: `"${organizationName}" <${process.env.EMAIL_USER}>`,
                        to: email,
                        subject: `You've been invited to join ${organizationName}`,
                        html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #00897B;">Join ${organizationName}</h2>
                    <p>Hello,</p>
                    <p>${inviterName} (${inviterEmail}) has invited you to join ${organizationName}.</p>
                    <p>Click the button below to accept the invitation and set up your account:</p>
                    <div style="text-align: center; margin: 25px 0;">
                        <a href="${signupUrl}" style="background-color: #00897B; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Accept Invitation</a>
                    </div>
                    <p>If you have any questions, please contact ${inviterEmail}.</p>
                    <p>This invitation will expire in 7 days.</p>
                    <hr style="border: 1px solid #eee; margin: 20px 0;" />
                    <p style="color: #888; font-size: 12px;">If you received this invitation by mistake, you can safely ignore this email.</p>
                    </div>
                `
                    };
                    return transporter.sendMail(mailOptions);
                })
            );
            
            response.status(200).json({ success: true, count: results.length });
        } catch (error) {
            console.error('Error sending invite emails:', error);
            response.status(500).json({ error: 'Internal server error' });
        }
    });
});