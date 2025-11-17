import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import admin from '@/config/firebase-admin';

const db = admin.firestore();

let transporter = null;

function getTransporter() {
    if (transporter) return transporter;

    const emailUser = process.env.EMAIL_USER;
    const emailPassword = process.env.EMAIL_PASSWORD;

    if (!emailUser || !emailPassword) {
        console.error('❌ Email credentials not configured');
        return null;
    }

    transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: emailUser,
            pass: emailPassword,
        },
    });

    return transporter;
}

export async function POST(request) {
    try {
        const {
            email,
            organizationId,
            organizationName,
            inviterEmail,
            inviterName,
            role = 'member',
            suiteIds = []
        } = await request.json();

        if (!email || !organizationId || !organizationName) {
            return NextResponse.json(
                { message: 'Missing required fields' },
                { status: 400 }
            );
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json(
                { message: 'Invalid email format' },
                { status: 400 }
            );
        }

        const invitationToken = Buffer.from(Math.random().toString()).toString('hex').slice(0, 32);
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);
        const now = new Date();

        const invitationData = {
            email: email.toLowerCase().trim(),
            organizationId,
            organizationName,
            inviterEmail,
            inviterName,
            token: invitationToken,
            role: role || 'member',
            suiteIds: Array.isArray(suiteIds) ? suiteIds : [],
            status: 'pending',
            createdAt: now,
            expiresAt,
            acceptedAt: null,
            created_at: now,
            updated_at: now
        };

        await db
            .collection('invitations')
            .doc(invitationToken)
            .set({
                ...invitationData,
                organizationId  // Include org ID in doc
            });

        const invitationLink = `${process.env.NEXT_PUBLIC_APP_URL}/invite/${invitationToken}`;

        const emailTransporter = getTransporter();

        if (!emailTransporter) {
            return NextResponse.json(
                {
                    message: 'Invitation created but email not configured',
                    invitationToken,
                    invitationLink: process.env.NODE_ENV === 'development' ? invitationLink : undefined
                },
                { status: 201 }
            );
        }

        try {
            await emailTransporter.sendMail({
                from: process.env.EMAIL_USER,
                to: email,
                subject: `${inviterName} invited you to join ${organizationName}`,
                html: generateInvitationEmail(
                    email,
                    organizationName,
                    inviterName,
                    invitationLink,
                    suiteIds.length > 0
                        ? `You will have access to ${suiteIds.length} suite(s)`
                        : 'You will have full access to the organization'
                )
            });

            console.log('✅ Email sent to:', email);

            return NextResponse.json(
                {
                    message: 'Invitation sent successfully',
                    invitationToken
                },
                { status: 200 }
            );

        } catch (emailError) {
            console.error('⚠️ Email failed but invitation created:', emailError.message);
            return NextResponse.json(
                {
                    message: 'Invitation created but email failed',
                    invitationToken,
                    warning: emailError.message
                },
                { status: 207 }
            );
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
        return NextResponse.json(
            { message: 'Failed to create invitation', error: error.message },
            { status: 500 }
        );
    }
}

function generateInvitationEmail(email, organizationName, inviterName, invitationLink, accessInfo) {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body { font-family: Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 0; }
                .container { max-width: 600px; margin: 20px auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
                .header { background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%); color: white; padding: 32px 24px; text-align: center; }
                .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
                .content { padding: 32px 24px; }
                .message { font-size: 15px; color: #333; margin-bottom: 24px; line-height: 1.6; }
                .access-info { background-color: #f0fdfa; border-left: 4px solid #14b8a6; padding: 12px 16px; margin-bottom: 24px; border-radius: 4px; font-size: 14px; color: #0f766e; }
                .cta-button { display: inline-block; background-color: #14b8a6; color: white; padding: 12px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; }
                .footer { background-color: #f9fafb; padding: 24px; text-align: center; font-size: 12px; color: #999; border-top: 1px solid #e5e7eb; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header"><h1>You're Invited! 🎉</h1></div>
                <div class="content">
                    <div class="message">Hello ${escapeHtml(email)},<br><br><strong>${escapeHtml(inviterName)}</strong> has invited you to join <strong>${escapeHtml(organizationName)}</strong>.</div>
                    <div class="access-info">📋 ${escapeHtml(accessInfo)}</div>
                    <div style="text-align: center;"><a href="${invitationLink}" class="cta-button">Accept Invitation</a></div>
                    <div style="margin-top: 24px; font-size: 12px; color: #999;">⏰ This invitation expires in 7 days.</div>
                </div>
                <div class="footer">
                    <p>If you didn't expect this, you can safely ignore this email.</p>
                </div>
            </div>
        </body>
        </html>
    `;
}

function escapeHtml(text) {
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return text.replace(/[&<>"']/g, m => map[m]);
}