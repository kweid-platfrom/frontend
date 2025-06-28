// contexts/AppProvider.js - Main provider that combines all contexts
'use client'
import { AuthProvider } from './AuthProvider';
import { UserProfileProvider } from './userProfileContext';
import { SubscriptionProvider } from './subscriptionContext';
import { SuiteProvider } from './SuiteContext';

export const AppProvider = ({ children }) => {
    return (
        <AuthProvider>
            <UserProfileProvider>
                <SubscriptionProvider>
                    <SuiteProvider>
                        {children}
                    </SuiteProvider>
                </SubscriptionProvider>
            </UserProfileProvider>
        </AuthProvider>
    );
};

// Convenience hook to use multiple contexts at once
export const useApp = () => {
    const auth = useAuth();
    const userProfile = useUserProfile();
    const subscription = useSubscription();
    const suite = useSuite();

    return {
        ...auth,
        ...userProfile,
        ...subscription,
        ...suite
    };
};