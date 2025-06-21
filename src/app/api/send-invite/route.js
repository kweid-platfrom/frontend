// app/api/send-invite/route.js
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { sendInviteEmail } from '../../../lib/email-service';
import crypto from 'crypto';
import { NextResponse } from 'next/server';

// Initialize Firebase Admin (if not already initialized)
if (!getApps().length) {
    // Check if required environment variables are present
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (!projectId || !clientEmail || !privateKey) {
        console.error('Missing Firebase Admin environment variables:');
        console.error('FIREBASE_PROJECT_ID:', projectId ? 'Set' : 'Missing');
        console.error('FIREBASE_CLIENT_EMAIL:', clientEmail ? 'Set' : 'Missing');
        console.error('FIREBASE_PRIVATE_KEY:', privateKey ? 'Set' : 'Missing');
        throw new Error('Firebase Admin environment variables are not configured properly');
    }

    try {
        initializeApp({
            credential: cert({
                projectId: projectId,
                clientEmail: clientEmail,
                privateKey: privateKey.replace(/\\n/g, '\n'),
            }),
        });
        console.log('Firebase Admin initialized successfully');
    } catch (error) {
        console.error('Failed to initialize Firebase Admin:', error);
        throw error;
    }
}

const db = getFirestore();

export async function POST(request) {
    try {
        const body = await request.json();
        const {
            email,
            organizationId,
            organizationName,
            inviterEmail,
            inviterName,
            role = 'member',
            projectIds // Remove default value to handle it properly below
        } = body;

        console.log('Received invite request:', {
            email,
            organizationId,
            organizationName,
            inviterEmail,
            inviterName,
            role,
            projectIds,
            projectIdsType: typeof projectIds,
            projectIdsIsArray: Array.isArray(projectIds)
        });

        // Validate required fields
        if (!email || !organizationId || !organizationName || !inviterEmail) {
            console.error('Missing required fields:', {
                email: !!email,
                organizationId: !!organizationId,
                organizationName: !!organizationName,
                inviterEmail: !!inviterEmail
            });
            return NextResponse.json({
                success: false,
                message: 'Missing required fields: email, organizationId, organizationName, or inviterEmail'
            }, { status: 400 });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json({
                success: false,
                message: 'Invalid email format'
            }, { status: 400 });
        }

        // FIX: Properly handle projectIds validation and normalization
        let normalizedProjectIds = [];
        if (projectIds !== undefined && projectIds !== null) {
            if (Array.isArray(projectIds)) {
                // Filter out any non-string values and empty strings
                normalizedProjectIds = projectIds.filter(id => 
                    typeof id === 'string' && id.trim().length > 0
                ).map(id => id.trim());
            } else if (typeof projectIds === 'string' && projectIds.trim().length > 0) {
                // Handle single project ID as string
                normalizedProjectIds = [projectIds.trim()];
            }
        }

        console.log('Normalized projectIds:', normalizedProjectIds);

        const normalizedEmail = email.toLowerCase().trim();

        // Check if user already exists in organization
        try {
            const usersQuery = db.collection('users')
                .where('email', '==', normalizedEmail)
                .where('organizationId', '==', organizationId);
            const existingUsers = await usersQuery.get();

            if (!existingUsers.empty) {
                return NextResponse.json({
                    success: false,
                    message: 'User already exists in this organization'
                }, { status: 409 });
            }
        } catch (firestoreError) {
            console.error('Error checking existing users:', firestoreError);
            // Continue with invite creation even if user check fails
        }

        // Check if user already has a pending invite
        try {
            const invitesQuery = db.collection('invites')
                .where('email', '==', normalizedEmail)
                .where('organizationId', '==', organizationId)
                .where('status', '==', 'pending');
            const existingInvites = await invitesQuery.get();

            if (!existingInvites.empty) {
                // Get the existing invite ID for the response
                const existingInvite = existingInvites.docs[0];
                return NextResponse.json({
                    success: false,
                    message: 'User already has a pending invitation to this organization',
                    inviteId: existingInvite.id
                }, { status: 409 });
            }
        } catch (firestoreError) {
            console.error('Error checking existing invites:', firestoreError);
            // Continue with invite creation even if invite check fails
        }

        // Generate secure invite token
        const inviteToken = crypto.randomBytes(32).toString('hex');

        // Calculate expiration date (7 days from now)
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

        // Save invite to Firestore using Admin SDK
        const inviteData = {
            email: normalizedEmail,
            organizationId,
            organizationName,
            inviterEmail,
            inviterName: inviterName || inviterEmail.split('@')[0],
            role,
            projectIds: normalizedProjectIds, // Use normalized array
            inviteToken,
            status: 'pending',
            createdAt: new Date(),
            expiresAt,
            acceptedAt: null,
            acceptedBy: null
        };

        console.log('Creating invite with data:', inviteData);

        let inviteRef;
        try {
            inviteRef = await db.collection('invites').add(inviteData);
            console.log('Invite created successfully with ID:', inviteRef.id);
        } catch (firestoreError) {
            console.error('Error creating invite:', firestoreError);
            return NextResponse.json({
                success: false,
                message: 'Failed to create invitation in database',
                details: firestoreError.message
            }, { status: 500 });
        }

        // Send invitation email
        let emailSent = false;
        let emailError = null;
        
        try {
            // 🔧 FIXED: Pass the correct parameters to sendInviteEmail
            const emailResult = await sendInviteEmail({
                to: normalizedEmail,
                subject: `You're invited to join ${organizationName}`,
                organizationName,
                inviterName: inviterName || inviterEmail.split('@')[0],
                inviterEmail,
                role,
                inviteToken, // ✅ Pass inviteToken instead of inviteUrl
                organizationId, // ✅ Pass organizationId 
                expiresIn: '7 days',
                projectIds: normalizedProjectIds // Use normalized array
            });

            emailSent = emailResult.success;
            if (!emailResult.success) {
                emailError = emailResult.error;
                console.error('Email sending failed:', emailError);
            } else {
                console.log('Email sent successfully');
            }
        } catch (error) {
            console.error('Failed to send invitation email:', error);
            emailError = error.message;
            // Don't fail the entire process if email fails - invite is still created
        }

        console.log('Invite process completed successfully');

        // Return success even if email failed (invite was created)
        return NextResponse.json({
            success: true,
            message: emailSent 
                ? 'Invitation created and email sent successfully' 
                : 'Invitation created successfully, but email delivery failed',
            inviteId: inviteRef.id,
            emailSent,
            ...(emailError && { emailError })
        }, { status: 200 });

    } catch (error) {
        console.error('Send invite error:', error);

        return NextResponse.json({
            success: false,
            message: 'Internal server error occurred while processing invitation',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        }, { status: 500 });
    }
}

// Handle other HTTP methods
export async function GET() {
    return NextResponse.json({
        success: false,
        message: 'Method not allowed. Use POST to send invitations.'
    }, { status: 405 });
}

export async function PUT() {
    return NextResponse.json({
        success: false,
        message: 'Method not allowed. Use POST to send invitations.'
    }, { status: 405 });
}

export async function DELETE() {
    return NextResponse.json({
        success: false,
        message: 'Method not allowed. Use POST to send invitations.'
    }, { status: 405 });
}