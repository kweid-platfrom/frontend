// functions/notifications.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize Firebase Admin if not already initialized elsewhere
if (!admin.apps.length) {
    admin.initializeApp();
}

const db = admin.firestore();

/**
 * Create a notification when a new comment is added
 */
exports.createCommentNotification = functions.firestore
    .document('bugs/{bugId}/comments/{commentId}')
    .onCreate(async (snapshot, context) => {
        const { bugId, commentId } = context.params;

        try {
            // Get the comment data
            const commentData = snapshot.data();
            const authorId = commentData.authorId;
            const authorName = commentData.authorName || 'A user';

            // Get the bug data to find the owner
            const bugDoc = await db.collection('bugs').doc(bugId).get();
            if (!bugDoc.exists) return null;

            const bugData = bugDoc.data();
            const bugOwnerId = bugData.assignedTo || bugData.createdBy;
            const bugTitle = bugData.title || `bug${bugId}`;

            // Don't send notification if the commenter is the bug owner
            if (authorId === bugOwnerId) return null;

            // Create the notification
            await db.collection('notifications').add({
                userId: bugOwnerId,
                message: `${authorName} commented on ${bugTitle}`,
                type: 'comment',
                read: false,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                metadata: {
                    bugId,
                    commentId
                }
            });

            return null;
        } catch (error) {
            console.error('Error creating comment notification:', error);
            return null;
        }
    });

/**
 * Create notifications when a bug status changes
 */
exports.createBugStatusNotification = functions.firestore
    .document('bugs/{bugId}')
    .onUpdate(async (change, context) => {
        const { bugId } = context.params;
        const beforeData = change.before.data();
        const afterData = change.after.data();

        // Only proceed if status changed
        if (beforeData.status === afterData.status) return null;

        try {
            // Get users who should be notified (typically assignee and creator)
            const usersToNotify = new Set();

            if (afterData.assignedTo) usersToNotify.add(afterData.assignedTo);
            if (afterData.createdBy && afterData.createdBy !== afterData.assignedTo) {
                usersToNotify.add(afterData.createdBy);
            }

            // Get the user who changed the status
            const changedBy = afterData.lastUpdatedBy || 'Someone';
            const bugTitle = afterData.title || `bug${bugId}`;

            // Create a notification for each user
            const notificationPromises = Array.from(usersToNotify).map(userId => {
                // Skip if the user is the one who made the change
                if (userId === afterData.lastUpdatedBy) return null;

                return db.collection('notifications').add({
                    userId,
                    message: `${changedBy} changed status of ${bugTitle} to ${afterData.status}`,
                    type: 'alert',
                    read: false,
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                    metadata: {
                        bugId,
                        oldStatus: beforeData.status,
                        newStatus: afterData.status
                    }
                });
            });

            await Promise.all(notificationPromises.filter(Boolean));
            return null;
        } catch (error) {
            console.error('Error creating status change notification:', error);
            return null;
        }
    });

/**
 * Create notifications for due date reminders
 * This runs on a schedule (once a day)
 */
exports.createDueDateReminders = functions.pubsub
    .schedule('0 9 * * *') // Run at 9 AM every day
    .timeZone('UTC')
    .onRun(async () => {
        try {
            // Get current date
            const now = new Date();

            // Get date for tomorrow
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(0, 0, 0, 0);

            // Get end of tomorrow
            const tomorrowEnd = new Date(tomorrow);
            tomorrowEnd.setHours(23, 59, 59, 999);

            // Query for bugs with due dates tomorrow
            const bugsRef = db.collection('bugs');
            const query = bugsRef.where('dueDate', '>=', tomorrow)
                .where('dueDate', '<=', tomorrowEnd)
                .where('status', 'not-in', ['Completed', 'Closed']);

            const snapshot = await query.get();

            // Process each bug with a due date tomorrow
            const notificationPromises = [];

            snapshot.forEach(doc => {
                const bugData = doc.data();

                if (bugData.assignedTo) {
                    notificationPromises.push(
                        db.collection('notifications').add({
                            userId: bugData.assignedTo,
                            message: `Reminder: ${bugData.title || `Bug ${doc.id}`} is due tomorrow`,
                            type: 'reminder',
                            read: false,
                            createdAt: admin.firestore.FieldValue.serverTimestamp(),
                            metadata: {
                                bugId: doc.id
                            }
                        })
                    );
                }
            });

            await Promise.all(notificationPromises);
            return null;
        } catch (error) {
            console.error('Error creating due date reminders:', error);
            return null;
        }
    });