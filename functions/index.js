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
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS // Note: Use an app password if using Gmail with 2FA
    }
});

// Test function to verify email configuration
export const testEmail = https.onCall(async (data, context) => {
    try {
        const result = await transporter.sendMail({
            from: `"Test" <${process.env.EMAIL_USER}>`,
            to: data.testEmail,
            subject: "Email Configuration Test",
            html: "<p>This is a test email to verify your email configuration is working.</p>"
        });
        
        logger.info("Test email sent", result);
        return { success: true, messageId: result.messageId };
    } catch (error) {
        logger.error("Error sending test email:", error);
        throw new https.HttpsError('internal', `Error sending test email: ${error.message}`);
    }
});

export const helloWorld = onRequest((request, response) => {
    logger.info("Hello logs!", { structuredData: true });
    response.send("Hello from Firebase!");
});

// HTTP version with CORS for direct fetch calls
export const sendInviteEmailsHttp = https.onRequest((request, response) => {
    return corsHandler(request, response, async () => {
        logger.info("Received HTTP invite request");
        
        // Only accept POST requests
        if (request.method !== 'POST') {
            response.status(405).send('Method Not Allowed');
            return;
        }
        
        const { emails, inviterEmail, inviterName, organizationName } = request.body;
        
        if (!emails || !Array.isArray(emails) || emails.length === 0) {
            logger.error("Invalid email array in HTTP request");
            return response.status(400).json({
                error: 'Email list is required and must be a non-empty array.'
            });
        }

        // Process similar to the callable function
        const db = firestore();
        try {
            const results = await Promise.all(
                emails.map(async (email) => {
                    // Look up the invitation in Firestore
                    const invitesRef = db.collection('invites');
                    const snapshot = await invitesRef
                        .where('email', '==', email.toLowerCase())
                        .where('status', '==', 'pending')
                        .get();

                    if (snapshot.empty) {
                        throw new Error(`No pending invite found for ${email}`);
                    }

                    const inviteDoc = snapshot.docs[0];
                    const inviteData = inviteDoc.data();
                    const inviteId = inviteDoc.id;

                    // Generate signup URL
                    const signupUrl = `${process.env.APP_URL || 'https://your-app-domain.com'}/register?invite=${inviteId}`;
                    const orgName = organizationName || inviteData.organizationName || "the organization";

                    const mailOptions = {
                        from: `"${orgName}" <${process.env.EMAIL_USER}>`,
                        to: email,
                        subject: `You've been invited to join ${orgName}`,
                        html: `
                            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                                <h2 style="color: #00897B;">Join ${orgName}</h2>
                                <p>Hello,</p>
                                <p>${inviterName || inviteData.inviterName || "A team member"} (${inviterEmail || inviteData.invitedBy}) has invited you to join ${orgName}.</p>
                                <p>Click the button below to accept the invitation and set up your account:</p>
                                <div style="text-align: center; margin: 25px 0;">
                                    <a href="${signupUrl}" style="background-color: #00897B; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Accept Invitation</a>
                                </div>
                                <p>If you have any questions, please contact ${inviterEmail || inviteData.invitedBy}.</p>
                                <p>This invitation will expire in 7 days.</p>
                                <hr style="border: 1px solid #eee; margin: 20px 0;" />
                                <p style="color: #888; font-size: 12px;">If you received this invitation by mistake, you can safely ignore this email.</p>
                            </div>
                        `
                    };

                    const info = await transporter.sendMail(mailOptions);

                    // Update the invite document to record that email was sent
                    await invitesRef.doc(inviteId).update({
                        emailSent: true,
                        emailSentAt: firestore.FieldValue.serverTimestamp()
                    });

                    return { email, success: true, messageId: info.messageId };
                })
            );

            response.status(200).json({ success: true, count: results.length, results });
        } catch (error) {
            logger.error('Error in HTTP invite emails:', error);
            response.status(500).json({ error: error.message });
        }
    });
});
