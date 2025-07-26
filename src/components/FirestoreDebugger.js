// Add this to your component or create a debug component to test the Firestore service

import { useEffect } from 'react';
import { useApp } from '../context/AppProvider';
import firestoreService from '../services/firestoreService';

const FirestoreDebugger = () => {
    const { state } = useApp();

    useEffect(() => {
        if (state.auth.isAuthenticated && state.auth.currentUser) {
            console.log('🔍 DEBUGGING FIRESTORE SERVICE');
            console.log('firestoreService:', firestoreService);
            console.log('subscribeToUserTestSuites method:', firestoreService.subscribeToUserTestSuites);
            console.log('Current user:', state.auth.currentUser);
            console.log('User UID:', state.auth.currentUser.uid);

            // Test if the method exists and works
            if (typeof firestoreService.subscribeToUserTestSuites === 'function') {
                console.log('✅ subscribeToUserTestSuites method exists');
                
                // Try to call it directly
                try {
                    const unsubscribe = firestoreService.subscribeToUserTestSuites(
                        (suites) => {
                            console.log('🎉 DEBUG: Suites received:', suites);
                        },
                        (error) => {
                            console.error('🚨 DEBUG: Suites error:', error);
                        }
                    );
                    
                    console.log('📡 DEBUG: Subscription created, unsubscribe function:', unsubscribe);
                    
                    // Clean up after 10 seconds
                    setTimeout(() => {
                        if (unsubscribe && typeof unsubscribe === 'function') {
                            unsubscribe();
                            console.log('🧹 DEBUG: Subscription cleaned up');
                        }
                    }, 10000);
                    
                } catch (error) {
                    console.error('💥 DEBUG: Error calling subscribeToUserTestSuites:', error);
                }
            } else {
                console.error('❌ subscribeToUserTestSuites method does not exist or is not a function');
                console.log('Available methods:', Object.keys(firestoreService));
            }
        }
    }, [state.auth.isAuthenticated, state.auth.currentUser]);

    return <div>Check console for Firestore debug logs</div>;
};

export default FirestoreDebugger;