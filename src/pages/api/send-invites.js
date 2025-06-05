/* eslint-disable @typescript-eslint/no-unused-vars */
// pages/api/send-invites.js or app/api/send-invites/route.js (depending on your Next.js version)

import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

// Configure your email service (example using Gmail)
const transporter = nodemailer.createTransporter({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER, // Your email
        pass: process.env.EMAIL_PASS, // Your app password
    },
});

// Alternative configuration for other email services
// const transporter = nodemailer.createTransporter({
//     host: process.env.SMTP_HOST,
//     port: process.env.SMTP_PORT,
//     secure: true,
//     auth: {
//         user: process.env.SMTP_USER,
//         pass: process.env.SMTP_PASS,
//     },
// });

export async function POST(request) {
    try {
        const { emails, inviterName, inviterEmail, organizationName } = await request.json();

        if (!emails || !Array.isArray(emails) || emails.length === 0) {
            return NextResponse.json({ error: 'No emails provided' }, { status: 400 });
        }

        const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
        const inviteResults = [];

        for (const email of emails) {
            try {
                // Generate a unique invite token (you might want to store this in your database)
                const inviteToken = generateInviteToken();
                const inviteUrl = `${baseUrl}/register?invite=${inviteToken}&email=${encodeURIComponent(email)}`;

                // Store invite in database (you'll need to implement this)
                // await storeInvite(email, inviteToken, inviterEmail, organizationName);

                const mailOptions = {
                    from: `"${inviterName}" <${process.env.EMAIL_USER}>`,
                    to: email,
                    subject: `You've been invited to join ${organizationName || 'our team'} on QAID`,
                    html: generateInviteEmailHTML(inviterName, organizationName, inviteUrl, email),
                    text: generateInviteEmailText(inviterName, organizationName, inviteUrl),
                };

                await transporter.sendMail(mailOptions);
                inviteResults.push({ email, status: 'sent' });
            } catch (error) {
                console.error(`Failed to send invite to ${email}:`, error);
                inviteResults.push({ email, status: 'failed', error: error.message });
            }
        }

        const sentCount = inviteResults.filter(result => result.status === 'sent').length;
        const failedCount = inviteResults.filter(result => result.status === 'failed').length;

        return NextResponse.json({
            success: true,
            sentCount,
            failedCount,
            results: inviteResults,
        });

    } catch (error) {
        console.error('Error sending invites:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

function generateInviteToken() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

function generateInviteEmailHTML(inviterName, organizationName, inviteUrl, recipientEmail) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>You're Invited to Join QAID</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #00897B, #00ACC1); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .logo { font-size: 32px; font-weight: bold; margin-bottom: 10px; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .invite-button { display: inline-block; background: #00897B; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
        .invite-button:hover { background: #00796B; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        .divider { border-top: 2px solid #00897B; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo">QAID</div>
        <h1>You're Invited!</h1>
    </div>
    
    <div class="content">
        <h2>Hello!</h2>
        
        <p><strong>${inviterName}</strong> has invited you to join ${organizationName ? `<strong>${organizationName}</strong> on` : ''} <strong>QAID</strong> - the intelligent platform for streamlined collaboration and productivity.</p>
        
        <p>QAID helps teams work smarter with AI-powered insights, seamless collaboration tools, and intuitive project management features.</p>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="${inviteUrl}" class="invite-button">Accept Invitation</a>
        </div>
        
        <div class="divider"></div>
        
        <h3>What you'll get with QAID:</h3>
        <ul>
            <li>🤖 AI-powered assistance for better decision making</li>
            <li>📊 Real-time collaboration and project tracking</li>
            <li>🔒 Enterprise-grade security and privacy</li>
            <li>📱 Access across all your devices</li>
        </ul>
        
        <p>If the button above doesn't work, you can copy and paste this link into your browser:</p>
        <p style="background: #e9e9e9; padding: 10px; border-radius: 4px; word-break: break-all; font-family: monospace;">
            ${inviteUrl}
        </p>
        
        <p><em>This invitation was sent to ${recipientEmail}. If you weren't expecting this invitation, you can safely ignore this email.</em></p>
    </div>
    
    <div class="footer">
        <p>© 2025 QAID. All rights reserved.</p>
        <p>This invitation will expire in 7 days.</p>
    </div>
</body>
</html>
    `;
}

function generateInviteEmailText(inviterName, organizationName, inviteUrl) {
    return `
You're Invited to Join QAID!

Hello!

${inviterName} has invited you to join ${organizationName || 'their team'} on QAID - the intelligent platform for streamlined collaboration and productivity.

QAID helps teams work smarter with AI-powered insights, seamless collaboration tools, and intuitive project management features.

To accept this invitation, please visit:
${inviteUrl}

What you'll get with QAID:
• AI-powered assistance for better decision making
• Real-time collaboration and project tracking  
• Enterprise-grade security and privacy
• Access across all your devices

If you weren't expecting this invitation, you can safely ignore this email.

This invitation will expire in 7 days.

© 2025 QAID. All rights reserved.
    `;
}

// You'll also need to implement these database functions:

// async function storeInvite(email, token, inviterEmail, organizationName) {
//     // Store the invitation in your database
//     // This should include: email, token, inviter, organization, expiry date, status
// }

// async function getInviteByToken(token) {
//     // Retrieve invitation details by token
// }

// async function markInviteAsUsed(token) {
//     // Mark invitation as used when someone registers
// }