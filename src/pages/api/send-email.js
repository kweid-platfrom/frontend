// api/send-email/route.js (Next.js 13+ App Router)
// OR api/send-email.js (Next.js Pages Router)

import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

// Create reusable transporter object using SMTP transport
const createTransporter = () => {
    return nodemailer.createTransporter({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
        // For development with services like Ethereal Email or MailHog
        ...(process.env.NODE_ENV === 'development' && {
            tls: {
                rejectUnauthorized: false
            }
        })
    });
};

export async function POST(request) {
    try {
        const { to, subject, template, data } = await request.json();

        if (!to || !subject) {
            return NextResponse.json(
                { error: 'Recipient email and subject are required' },
                { status: 400 }
            );
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(to)) {
            return NextResponse.json(
                { error: 'Invalid email format' },
                { status: 400 }
            );
        }

        // Generate email content based on template
        let htmlContent = '';
        let textContent = '';

        if (template === 'user-invitation') {
            htmlContent = generateInvitationEmailHTML(data);
            textContent = generateInvitationEmailText(data);
        } else {
            // Default template
            htmlContent = `<p>${data?.message || 'No content provided'}</p>`;
            textContent = data?.message || 'No content provided';
        }

        // Create transporter
        const transporter = createTransporter();

        // Verify SMTP connection (optional, for debugging)
        if (process.env.NODE_ENV === 'development') {
            try {
                await transporter.verify();
                console.log('SMTP connection verified successfully');
            } catch (verifyError) {
                console.warn('SMTP verification failed:', verifyError.message);
                // Continue anyway - some services don't support verify()
            }
        }

        // Send email
        const emailResult = await transporter.sendMail({
            from: process.env.FROM_EMAIL || 'noreply@yourcompany.com',
            to: to,
            subject: subject,
            text: textContent,
            html: htmlContent,
            // Optional: Add reply-to
            replyTo: process.env.REPLY_TO_EMAIL || process.env.FROM_EMAIL,
        });

        console.log('Email sent successfully:', emailResult.messageId);

        return NextResponse.json({
            success: true,
            messageId: emailResult.messageId,
            message: 'Email sent successfully'
        });

    } catch (error) {
        console.error('Email API Error:', error);
        
        // Provide more specific error messages for common issues
        let errorMessage = 'Failed to send email';
        
        if (error.code === 'EAUTH') {
            errorMessage = 'SMTP authentication failed. Check your credentials.';
        } else if (error.code === 'ECONNECTION') {
            errorMessage = 'Failed to connect to SMTP server. Check your host and port.';
        } else if (error.code === 'EMESSAGE') {
            errorMessage = 'Invalid message content.';
        }

        return NextResponse.json(
            { 
                error: errorMessage,
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            },
            { status: 500 }
        );
    }
}

// Helper function to generate invitation email HTML
function generateInvitationEmailHTML(data) {
    const { inviterName, organizationName, role, inviteUrl, expiresIn } = data;
    
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>You're Invited to Join ${organizationName}</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #2dd4bf; color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px 20px; border-radius: 0 0 8px 8px; }
            .button { 
                display: inline-block; 
                background: #2dd4bf; 
                color: white; 
                padding: 12px 30px; 
                text-decoration: none; 
                border-radius: 6px; 
                margin: 20px 0;
                font-weight: bold;
            }
            .button:hover { background: #14b8a6; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
            .link-box { 
                word-break: break-all; 
                background: #e5e5e5; 
                padding: 10px; 
                border-radius: 4px; 
                border: 1px solid #ccc; 
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>You're Invited!</h1>
            </div>
            <div class="content">
                <p>Hi there!</p>
                
                <p><strong>${inviterName || 'Someone'}</strong> has invited you to join <strong>${organizationName || 'our organization'}</strong>${role ? ` as a <strong>${role}</strong>` : ''}.</p>
                
                <p>Click the button below to accept your invitation and get started:</p>
                
                <div style="text-align: center;">
                    <a href="${inviteUrl}" class="button">Accept Invitation</a>
                </div>
                
                <p>Or copy and paste this link into your browser:</p>
                <p class="link-box">${inviteUrl}</p>
                
                ${expiresIn ? `<p><strong>Note:</strong> This invitation will expire in ${expiresIn}.</p>` : ''}
                
                <p>If you have any questions, feel free to reply to this email.</p>
                
                <p>Welcome to the team!</p>
                <p>The ${organizationName || 'Team'}</p>
            </div>
            <div class="footer">
                <p>If you didn't expect this invitation, you can safely ignore this email.</p>
            </div>
        </div>
    </body>
    </html>
    `;
}

// Helper function to generate invitation email text
function generateInvitationEmailText(data) {
    const { inviterName, organizationName, role, inviteUrl, expiresIn } = data;
    
    return `
You're Invited to Join ${organizationName || 'Our Organization'}!

Hi there!

${inviterName || 'Someone'} has invited you to join ${organizationName || 'our organization'}${role ? ` as a ${role}` : ''}.

To accept your invitation, please visit:
${inviteUrl}

${expiresIn ? `Note: This invitation will expire in ${expiresIn}.` : ''}

If you have any questions, feel free to reply to this email.

Welcome to the team!
The ${organizationName || 'Team'}

---
If you didn't expect this invitation, you can safely ignore this email.
    `.trim();
}

// For Pages Router (if you're using that instead)
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { to, subject, template, data } = req.body;

        if (!to || !subject) {
            return res.status(400).json({
                error: 'Recipient email and subject are required'
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(to)) {
            return res.status(400).json({
                error: 'Invalid email format'
            });
        }

        let htmlContent = '';
        let textContent = '';

        if (template === 'user-invitation') {
            htmlContent = generateInvitationEmailHTML(data);
            textContent = generateInvitationEmailText(data);
        } else {
            htmlContent = `<p>${data?.message || 'No content provided'}</p>`;
            textContent = data?.message || 'No content provided';
        }

        // Create and send email
        const transporter = createTransporter();
        
        const emailResult = await transporter.sendMail({
            from: process.env.FROM_EMAIL || 'noreply@yourcompany.com',
            to: to,
            subject: subject,
            text: textContent,
            html: htmlContent,
            replyTo: process.env.REPLY_TO_EMAIL || process.env.FROM_EMAIL,
        });

        console.log('Email sent successfully:', emailResult.messageId);

        res.status(200).json({
            success: true,
            messageId: emailResult.messageId,
            message: 'Email sent successfully'
        });

    } catch (error) {
        console.error('Email API Error:', error);
        
        let errorMessage = 'Failed to send email';
        
        if (error.code === 'EAUTH') {
            errorMessage = 'SMTP authentication failed. Check your credentials.';
        } else if (error.code === 'ECONNECTION') {
            errorMessage = 'Failed to connect to SMTP server. Check your host and port.';
        }

        res.status(500).json({
            error: errorMessage,
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}