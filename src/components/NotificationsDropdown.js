"use client"
import { useState, useEffect, useRef } from 'react';
import { collection, query, where, orderBy, limit, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthProvider';
import { Bell, Check, MessageSquare, Clock, AlertCircle, Info } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function NotificationsDropdown() {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const dropdownRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    // Fetch notifications from Firestore
    useEffect(() => {
        if (!user) return;

        setLoading(true);
        
        // Create query for user's notifications, sorted by date
        const notificationsRef = collection(db, 'notifications');
        const q = query(
            notificationsRef,
            where('userId', '==', user.uid),
            orderBy('createdAt', 'desc'),
            limit(10)
        );

        // Listen for real-time updates
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const notificationsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                // Convert Firestore timestamp to JS Date
                createdAt: doc.data().createdAt?.toDate() || new Date()
            }));
            
            setNotifications(notificationsData);
            
            // Count unread notifications
            const unreadNotifications = notificationsData.filter(n => !n.read).length;
            setUnreadCount(unreadNotifications);
            
            setLoading(false);
        }, (error) => {
            console.error("Error fetching notifications:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    // Toggle dropdown open/closed
    const toggleDropdown = () => {
        setIsOpen(!isOpen);
    };

    // Mark a notification as read
    const markAsRead = async (notificationId) => {
        try {
            await updateDoc(doc(db, 'notifications', notificationId), {
                read: true
            });
        } catch (error) {
            console.error("Error marking notification as read:", error);
        }
    };

    // Mark all notifications as read
    const markAllAsRead = async () => {
        try {
            const unreadNotifications = notifications.filter(n => !n.read);
            
            // Update each notification
            const updatePromises = unreadNotifications.map(notification => 
                updateDoc(doc(db, 'notifications', notification.id), { read: true })
            );
            
            await Promise.all(updatePromises);
        } catch (error) {
            console.error("Error marking all notifications as read:", error);
        }
    };

    // Get icon based on notification type
    const getNotificationIcon = (type) => {
        switch(type) {
            case 'comment':
                return <MessageSquare className="h-4 w-4 text-blue-500" />;
            case 'reminder':
                return <Clock className="h-4 w-4 text-yellow-500" />;
            case 'alert':
                return <AlertCircle className="h-4 w-4 text-red-500" />;
            default:
                return <Info className="h-4 w-4 text-gray-500" />;
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Notification Bell Button */}
            <button 
                onClick={toggleDropdown}
                className="p-1 rounded-full text-gray-600 hover:text-gray-800 relative"
                aria-label="Notifications"
            >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs font-medium rounded-full bg-red-500 text-white">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown Content */}
            {isOpen && (
                <div
                className="fixed right-4 top-14 w-80 bg-white rounded-md shadow-lg z-[60] max-h-[calc(100vh-100px)] overflow-hidden flex flex-col border"
                style={{ maxHeight: 'calc(100vh - 100px)' }} // for safety
            >
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-gray-200">
                        <h3 className="text-lg font-medium">Notifications</h3>
                        {unreadCount > 0 && (
                            <button 
                                onClick={markAllAsRead}
                                className="text-xs text-blue-600 hover:text-blue-800"
                            >
                                Mark all as read
                            </button>
                        )}
                    </div>

                    {/* Notifications List */}
                    <div className="overflow-y-auto flex-grow">
                        {loading ? (
                            <div className="p-4 text-center text-gray-500">
                                Loading notifications...
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="p-4 text-center text-gray-500">
                                No notifications yet
                            </div>
                        ) : (
                            <ul>
                                {notifications.map((notification) => (
                                    <li 
                                        key={notification.id}
                                        className={`p-3 border-b border-gray-100 hover:bg-gray-50 ${
                                            !notification.read ? 'bg-blue-50' : ''
                                        }`}
                                    >
                                        <div className="flex items-start">
                                            <div className="mr-3 mt-1">
                                                {getNotificationIcon(notification.type)}
                                            </div>
                                            <div className="flex-grow min-w-0">
                                                <p className="text-sm text-gray-800">
                                                    {notification.message}
                                                </p>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {formatDistanceToNow(notification.createdAt, { addSuffix: true })}
                                                </p>
                                            </div>
                                            {!notification.read && (
                                                <button 
                                                    onClick={() => markAsRead(notification.id)}
                                                    className="ml-2 text-gray-400 hover:text-gray-600"
                                                    aria-label="Mark as read"
                                                >
                                                    <Check className="h-4 w-4" />
                                                </button>
                                            )}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-3 border-t border-gray-200 text-center">
                        <a href="/notifications" className="text-sm text-blue-600 hover:text-blue-800">
                            View all notifications
                        </a>
                    </div>
                </div>
            )}
        </div>
    );
}