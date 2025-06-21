// lib/email-service.js
import nodemailer from 'nodemailer';

// Configure your email transporter
const transporter = nodemailer.createTransport({
    // Option 1: Gmail
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS // Use App Password for Gmail
    }
    
    // Option 2: SMTP (Alternative configuration)
    /*
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT || 587,
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
    */
});

// Verify transporter configuration on startup
transporter.verify((error) => {
    if (error) {
        console.error('Email transporter configuration error:', error);
    } else {
        console.log('Email transporter is ready to send emails');
    }
});

// 🔧 FIXED: Helper function to generate proper invite URL
function generateInviteUrl(token, organizationId, email) {
    const baseUrl = process.env.APP_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    
    // 🔧 FIXED: Ensure baseUrl doesn't have trailing slash
    const cleanBaseUrl = baseUrl.replace(/\/$/, '');
    
    // 🔧 FIXED: Create URL manually to ensure proper encoding
    const params = new URLSearchParams({
        token: token,
        orgId: organizationId,
        email: email
    });
    
    // 🔧 FIXED: Point to /onboarding instead of /dashboard to match OnboardingRouter expectations
    const inviteUrl = `${cleanBaseUrl}/onboarding?${params.toString()}`;
    
    return inviteUrl;
}

export async function sendInviteEmail({ 
    to, 
    subject, 
    organizationName, 
    inviterName,
    inviterEmail,
    role, 
    inviteToken,
    organizationId,
    expiresIn,
    projectIds = []
}) {
    try {
        // 🔧 FIXED: More detailed parameter validation with specific error messages
        console.log('🔍 Email parameters validation:', {
            to: to || 'MISSING',
            subject: subject || 'MISSING',
            organizationName: organizationName || 'MISSING',
            inviterName: inviterName || 'MISSING',
            inviteToken: inviteToken || 'MISSING',
            organizationId: organizationId || 'MISSING',
            inviterEmail: inviterEmail || 'MISSING',
            role: role || 'MISSING',
            expiresIn: expiresIn || 'MISSING',
            projectIds: Array.isArray(projectIds) ? projectIds : 'NOT_ARRAY'
        });

        // 🔧 FIXED: Check each parameter individually and provide specific error messages
        const missingParams = [];
        if (!to) missingParams.push('to');
        if (!subject) missingParams.push('subject');
        if (!organizationName) missingParams.push('organizationName');
        if (!inviterName) missingParams.push('inviterName');
        if (!inviteToken) missingParams.push('inviteToken');
        if (!organizationId) missingParams.push('organizationId');
        if (!inviterEmail) missingParams.push('inviterEmail');
        if (!role) missingParams.push('role');
        if (!expiresIn) missingParams.push('expiresIn');

        if (missingParams.length > 0) {
            const errorMessage = `Missing required email parameters: ${missingParams.join(', ')}`;
            console.error('❌ Parameter validation failed:', errorMessage);
            throw new Error(errorMessage);
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(to)) {
            throw new Error('Invalid recipient email format');
        }

        // 🔧 FIXED: Generate proper invite URL
        const inviteUrl = generateInviteUrl(inviteToken, organizationId, to);
        
        console.log('Generated invite URL:', inviteUrl); // Debug log

        const mailOptions = {
            from: process.env.EMAIL_FROM || '"QaidSupport Team" <noreply@qaidsupport.com>',
            to: to,
            subject: subject,
            html: generateInviteEmailHTML({
                organizationName,
                inviterName,
                inviterEmail,
                role,
                inviteUrl,
                expiresIn,
                projectIds
            }),
            text: generateInviteEmailText({
                organizationName,
                inviterName,
                inviterEmail,
                role,
                inviteUrl,
                expiresIn,
                projectIds
            })
        };

        console.log('📧 Attempting to send email with options:', {
            from: mailOptions.from,
            to: mailOptions.to,
            subject: mailOptions.subject,
            inviteUrl: inviteUrl
        });

        const result = await transporter.sendMail(mailOptions);
        console.log('✅ Email sent successfully:', {
            messageId: result.messageId,
            to: to,
            subject: subject,
            inviteUrl: inviteUrl,
            accepted: result.accepted,
            rejected: result.rejected
        });
        
        return {
            success: true,
            messageId: result.messageId,
            accepted: result.accepted,
            rejected: result.rejected,
            inviteUrl: inviteUrl
        };

    } catch (error) {
        console.error('❌ Error sending email:', {
            error: error.message,
            code: error.code,
            command: error.command,
            to: to,
            subject: subject
        });
        
        // 🔧 ADDED: More detailed error logging for Gmail issues
        if (error.code === 'EAUTH') {
            console.error('🔐 Authentication failed - check EMAIL_USER and EMAIL_PASS');
        } else if (error.code === 'ESOCKET') {
            console.error('🌐 Network connection failed - check internet connection');
        } else if (error.responseCode === 535) {
            console.error('🔑 Invalid credentials - make sure you\'re using an App Password for Gmail');
        }
        
        return {
            success: false,
            error: error.message
        };
    }
}

function generateInviteEmailHTML({ 
    organizationName, 
    inviterName, 
    inviterEmail, 
    role, 
    inviteUrl, 
    expiresIn, 
    projectIds = [] 
}) {
    const projectsSection = projectIds.length > 0 ? `
        <div class="projects-section">
            <p><strong>You'll have access to these projects:</strong></p>
            <ul class="projects-list">
                ${projectIds.map(projectId => `<li>${projectId}</li>`).join('')}
            </ul>
        </div>
    ` : '';

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>You're invited to join ${organizationName}</title>
            <style>
                body { 
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                    line-height: 1.6; 
                    color: #333; 
                    margin: 0; 
                    padding: 0;
                    background-color: #f4f4f4;
                }
                .container { 
                    max-width: 600px; 
                    margin: 20px auto; 
                    background-color: white;
                    border-radius: 8px;
                    overflow: hidden;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                }
                .header { 
                    background-color: #0d9488; 
                    color: white; 
                    padding: 40px 20px; 
                    text-align: center; 
                }
                .header h1 {
                    margin: 0;
                    font-size: 28px;
                    font-weight: 600;
                }
                .content { 
                    padding: 40px 30px; 
                }
                .content p {
                    margin: 0 0 20px 0;
                    font-size: 16px;
                }
                .invite-details {
                    background-color: #f8fafc;
                    border-left: 4px solid #0d9488;
                    padding: 20px;
                    margin: 30px 0;
                }
                .invite-details p {
                    margin: 0 0 10px 0;
                }
                .invite-details p:last-child {
                    margin-bottom: 0;
                }
                .projects-section {
                    margin: 20px 0;
                }
                .projects-list {
                    margin: 10px 0;
                    padding-left: 20px;
                }
                .projects-list li {
                    margin: 5px 0;
                    color: #475569;
                }
                .button-container {
                    text-align: center;
                    margin: 40px 0;
                }
                .button { 
                    display: inline-block; 
                    padding: 16px 32px; 
                    background-color: #0d9488; 
                    color: white !important;
                    text-decoration: none; 
                    border-radius: 6px; 
                    font-weight: 600;
                    font-size: 16px;
                    transition: background-color 0.2s;
                }
                .button:hover {
                    background-color: #0f766e;
                }
                .url-fallback {
                    background-color: #f1f5f9;
                    padding: 15px;
                    border-radius: 6px;
                    word-break: break-all;
                    font-size: 14px;
                    color: #64748b;
                    margin: 20px 0;
                }
                .footer { 
                    padding: 30px; 
                    text-align: center; 
                    color: #64748b; 
                    font-size: 14px; 
                    background-color: #f8fafc;
                    border-top: 1px solid #e2e8f0;
                }
                .warning {
                    color: #dc2626;
                    font-weight: 500;
                }
                .from-email {
                    color: #64748b;
                    font-size: 14px;
                }
                @media (max-width: 600px) {
                    .container {
                        margin: 10px;
                        border-radius: 4px;
                    }
                    .content {
                        padding: 30px 20px;
                    }
                    .header {
                        padding: 30px 20px;
                    }
                    .button {
                        padding: 14px 28px;
                        font-size: 15px;
                    }
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>You're Invited!</h1>
                </div>
                <div class="content">
                    <p>Hi there,</p>
                    <p><strong>${inviterName}</strong> has invited you to join <strong>${organizationName}</strong>.</p>
                    
                    <div class="invite-details">
                        <p><strong>Organization:</strong> ${organizationName}</p>
                        <p><strong>Role:</strong> ${role}</p>
                        <p><strong>Invited by:</strong> ${inviterName}</p>
                        ${inviterEmail ? `<p class="from-email">${inviterEmail}</p>` : ''}
                    </div>

                    ${projectsSection}

                    <p>Click the button below to accept your invitation and get started:</p>
                    
                    <div class="button-container">
                        <a href="${inviteUrl}" class="button">Accept Invitation</a>
                    </div>

                    <p><span class="warning">Important:</span> This invitation will expire in ${expiresIn}.</p>
                    
                    <p>If the button doesn't work, copy and paste this link into your browser:</p>
                    <div class="url-fallback">${inviteUrl}</div>
                </div>
                <div class="footer">
                    <p>If you didn't expect this invitation, you can safely ignore this email.</p>
                    <p>This invitation was sent by ${inviterName}${inviterEmail ? ` (${inviterEmail})` : ''} from ${organizationName}.</p>
                </div>
            </div>
        </body>
        </html>
    `;
}

function generateInviteEmailText({ 
    organizationName, 
    inviterName, 
    inviterEmail, 
    role, 
    inviteUrl, 
    expiresIn, 
    projectIds = [] 
}) {
    const projectsText = projectIds.length > 0 ? `

You'll have access to these projects:
${projectIds.map(projectId => `- ${projectId}`).join('\n')}
` : '';

    return `
You're invited to join ${organizationName}!

${inviterName} has invited you to join ${organizationName} as a ${role}.${projectsText}

To accept your invitation, click this link:
${inviteUrl}

This invitation will expire in ${expiresIn}.

If you didn't expect this invitation, you can safely ignore this email.

---
This invitation was sent by ${inviterName}${inviterEmail ? ` (${inviterEmail})` : ''} from ${organizationName}.
    `.trim();
}

// Test email function for development
export async function testEmailConnection() {
    try {
        await transporter.verify();
        console.log('✅ Email connection test: SUCCESS');
        return { success: true, message: 'Email service is working correctly' };
    } catch (error) {
        console.error('❌ Email connection test: FAILED', error);
        return { success: false, error: error.message };
    }
}