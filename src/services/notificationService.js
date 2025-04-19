// services/notificationService.js
import { collection, addDoc, serverTimestamp, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * NotificationService handles creating, reading, and managing notifications
 */
export const NotificationService = {
    /**
     * Create a new notification
     * @param {string} userId - The recipient user ID
     * @param {string} message - The notification message
     * @param {string} type - The notification type (comment, reminder, alert, etc.)
     * @param {Object} metadata - Additional metadata for the notification (optional)
     * @returns {Promise<string>} - The new notification ID
     */
    async createNotification(userId, message, type, metadata = {}) {
        try {
            const notificationData = {
                userId,
                message,
                type,
                read: false,
                createdAt: serverTimestamp(),
                metadata
            };

            const docRef = await addDoc(collection(db, 'notifications'), notificationData);
            return docRef.id;
        } catch (error) {
            console.error('Error creating notification:', error);
            throw error;
        }
    },

    /**
     * Get notifications for a user with pagination
     * @param {string} userId - The user ID
     * @param {number} limit - Number of notifications to fetch
     * @param {Document} startAfter - Last document from previous query for pagination (optional)
     * @returns {Promise<Array>} - Array of notification objects
     */
    async getNotifications(userId, limit = 20, startAfter = null) {
        try {
            let notificationsRef = collection(db, 'notifications');
            let q;

            if (startAfter) {
                q = query(
                    notificationsRef,
                    where('userId', '==', userId),
                    orderBy('createdAt', 'desc'),
                    startAfter(startAfter),
                    limit(limit)
                );
            } else {
                q = query(
                    notificationsRef,
                    where('userId', '==', userId),
                    orderBy('createdAt', 'desc'),
                    limit(limit)
                );
            }

            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate() || new Date()
            }));
        } catch (error) {
            console.error('Error fetching notifications:', error);
            throw error;
        }
    },

    /**
     * Mark a specific notification as read
     * @param {string} notificationId - The notification ID to mark as read
     * @returns {Promise<void>}
     */
    async markAsRead(notificationId) {
        try {
            await updateDoc(doc(db, 'notifications', notificationId), {
                read: true
            });
        } catch (error) {
            console.error('Error marking notification as read:', error);
            throw error;
        }
    },

    /**
     * Mark all notifications for a user as read
     * @param {string} userId - The user ID
     * @returns {Promise<void>}
     */
    async markAllAsRead(userId) {
        try {
            const notificationsRef = collection(db, 'notifications');
            const q = query(
                notificationsRef,
                where('userId', '==', userId),
                where('read', '==', false)
            );

            const snapshot = await getDocs(q);

            // Update all unread notifications
            const batch = writeBatch(db);
            snapshot.docs.forEach(docSnapshot => {
                batch.update(docSnapshot.ref, { read: true });
            });

            await batch.commit();
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
            throw error;
        }
    },

    /**
     * Get the unread notification count for a user
     * @param {string} userId - The user ID
     * @returns {Promise<number>} - Number of unread notifications
     */
    async getUnreadCount(userId) {
        try {
            const notificationsRef = collection(db, 'notifications');
            const q = query(
                notificationsRef,
                where('userId', '==', userId),
                where('read', '==', false)
            );

            const snapshot = await getDocs(q);
            return snapshot.size;
        } catch (error) {
            console.error('Error getting unread count:', error);
            throw error;
        }
    }
};

export default NotificationService;