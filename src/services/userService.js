// userService.js - Core user CRUD operations aligned with Register component
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { db, environment } from "../config/firebase";
import {
    extractNameFromEmail,
    parseDisplayName,
} from "../utils/userUtils";


/**
 * Create a new user document in Firestore
 * Aligned with the Register component's data structure
 */
export const createUserDocument = async (firebaseUser, userData = {}, source = 'unknown') => {
    if (!firebaseUser?.uid) {
        throw new Error('Invalid Firebase user provided');
    }

    try {
        console.log('Creating user document with data:', { uid: firebaseUser.uid, source, userData });

        // If userData is already in the new format (from Register component), use it directly
        if (userData.user_id && userData.profile_info) {
            console.log('Using new format user data from Register component');

            // Ensure timestamps are set
            const finalUserData = {
                ...userData,
                profile_info: {
                    ...userData.profile_info,
                    created_at: userData.profile_info.created_at || serverTimestamp(),
                    updated_at: serverTimestamp()
                },
                auth_metadata: {
                    ...userData.auth_metadata,
                    registration_date: userData.auth_metadata.registration_date || serverTimestamp(),
                    last_login: source === 'google' ? serverTimestamp() : null
                }
            };

            const userRef = doc(db, 'users', firebaseUser.uid);
            await setDoc(userRef, finalUserData);
            console.log('User document created successfully with new format');
            return finalUserData;
        }

        // Legacy format - convert to new format for backward compatibility
        console.log('Converting legacy format to new format');

        // Parse display name for Google users or fallback
        const { firstName: parsedFirstName, lastName: parsedLastName } = parseDisplayName(firebaseUser.displayName);

        // Use userData or parsed names, fallback to email extraction
        let firstName = (userData.firstName?.trim() || parsedFirstName || "").trim();
        let lastName = (userData.lastName?.trim() || parsedLastName || "").trim();

        if (!firstName && !lastName) {
            const extractedName = extractNameFromEmail(firebaseUser.email);
            const nameParts = extractedName.split(' ');
            firstName = nameParts[0] || "User";
            lastName = nameParts.slice(1).join(' ') || "";
        }

        // Normalize userType/accountType - default to 'individual'
        const userTypeRaw = userData.userType || userData.accountType || 'individual';
        const userType = ['individual', 'organization'].includes(userTypeRaw) ? userTypeRaw : 'individual';

        // Determine initial setup step based on account type and source
        let initialSetupStep = 'email_verification';
        if (source === 'google') {
            // Google users skip email verification
            initialSetupStep = userType === 'organization' ? 'organization_info' : 'profile_setup';
        }

        // Set role - first organization user becomes admin, individuals are members
        const initialRole = userType === 'organization' ? ['admin'] : ['member'];

        // Initialize consistent onboarding structures
        const onboardingProgress = initializeOnboardingProgress(userType);
        const onboardingStatus = initializeOnboardingStatus(userType);

        // Update progress based on source and email verification
        if (firebaseUser.emailVerified) {
            onboardingProgress.emailVerified = true;
        }

        // Build user data in new format
        const newFormatUserData = {
            user_id: firebaseUser.uid,
            primary_email: firebaseUser.email?.toLowerCase().trim() || "",

            profile_info: {
                name: {
                    first: firstName,
                    last: lastName,
                    display: userData.displayName?.trim() ||
                        firebaseUser.displayName?.trim() ||
                        `${firstName} ${lastName}`.trim() ||
                        extractNameFromEmail(firebaseUser.email) || ""
                },
                timezone: userData.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
                avatar_url: userData.avatarURL || firebaseUser.photoURL || null,
                bio: userData.bio?.trim() || "",
                location: userData.location?.trim() || "",
                phone: userData.phone?.trim() || "",
                created_at: serverTimestamp(),
                updated_at: serverTimestamp()
            },

            account_memberships: userData.account_memberships || [],

            session_context: {
                current_account_id: userData.current_account_id || null,
                current_account_type: userType,
                preferences: {
                    theme: 'light',
                    notifications: true,
                    ...userData.preferences
                }
            },

            auth_metadata: {
                registration_method: source === 'google' ? 'google' : 'email',
                email_verified: firebaseUser.emailVerified || false,
                registration_date: serverTimestamp(),
                last_login: source === 'google' ? serverTimestamp() : null,
                ...(source === 'google' && {
                    google_profile: {
                        id: firebaseUser.uid,
                        photo_url: firebaseUser.photoURL
                    }
                })
            },

            // Onboarding and setup fields (essential for user flow)
            setupCompleted: Boolean(userData.setupCompleted) || false,
            setupStep: userData.setupStep || initialSetupStep,
            role: userData.role || initialRole,

            // Use consistent onboarding progress structure
            onboardingProgress: {
                ...onboardingProgress,
                ...(userData.onboardingProgress || {})
            },

            // Use consistent onboarding status structure  
            onboardingStatus: {
                ...onboardingStatus,
                ...(userData.onboardingStatus || {})
            },

            // Additional legacy fields for backward compatibility
            ...(userData.organizationId && { organizationId: userData.organizationId }),
            ...(userData.lastPasswordChange && { lastPasswordChange: userData.lastPasswordChange }),
            ...(userData.deviceHistory && { deviceHistory: userData.deviceHistory }),

            // Preferences (maintain structure for notifications)
            preferences: {
                notifications: {
                    newMessages: true,
                    productUpdates: false,
                    securityAlerts: true
                },
                pushNotifications: {
                    approvalRequests: true,
                    newMessages: true,
                    productUpdates: true,
                    reminders: false
                },
                ...(userData.preferences || {})
            },

            // Metadata
            environment: environment || 'development',
            source
        };

        const userRef = doc(db, 'users', firebaseUser.uid);
        await setDoc(userRef, newFormatUserData);
        console.log('User document created successfully (converted from legacy format)');
        return newFormatUserData;

    } catch (error) {
        console.error('Error creating user document:', error);
        throw new Error(`Failed to create user profile: ${error.message}`);
    }
};

/**
 * Fetch user data from Firestore
 * Handles both new and legacy formats
 */
export const fetchUserData = async (userId) => {
    if (!userId) return null;

    try {
        const userRef = doc(db, "users", userId);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
            const userData = userSnap.data();

            // Check if it's new format
            if (userData.user_id && userData.profile_info) {
                console.log('Fetched user data in new format');
                return userData;
            }

            // Convert legacy data to new format for consistency
            console.log('Converting legacy user data to new format');

            // Normalize onboarding progress for legacy data
            const normalizedOnboardingProgress = normalizeOnboardingProgress(userData.onboardingProgress);

            const convertedData = {
                user_id: userData.uid || userId,
                primary_email: userData.email || "",

                profile_info: {
                    name: {
                        first: userData.firstName || "",
                        last: userData.lastName || "",
                        display: userData.displayName || ""
                    },
                    timezone: userData.timezone || 'UTC',
                    avatar_url: userData.avatarURL || null,
                    bio: userData.bio || "",
                    location: userData.location || "",
                    phone: userData.phone || "",
                    created_at: userData.createdAt,
                    updated_at: userData.updatedAt
                },

                account_memberships: userData.account_memberships || [],

                session_context: {
                    current_account_id: userData.organizationId || null,
                    current_account_type: userData.accountType || userData.userType || 'individual',
                    preferences: userData.preferences || {
                        theme: 'light',
                        notifications: true
                    }
                },

                auth_metadata: {
                    registration_method: userData.registrationMethod || 'email',
                    email_verified: userData.emailVerified || false,
                    registration_date: userData.createdAt,
                    last_login: userData.lastLogin,
                    ...(userData.registrationMethod === 'google' && {
                        google_profile: {
                            id: userData.uid,
                            photo_url: userData.avatarURL
                        }
                    })
                },

                // Keep all legacy fields for backward compatibility including onboarding
                ...userData,

                // Include normalized onboarding progress for consistent access
                onboardingProgress: normalizedOnboardingProgress
            };

            return convertedData;
        }

        return null;
    } catch (error) {
        console.error('Error fetching user data:', error);
        if (error.code === 'permission-denied') {
            console.error('Permission denied: User may not have access to this profile');
        }
        return null;
    }
};

/**
 * Update user profile (supports both new and legacy formats)
 */
export const updateUserProfile = async (userId, updateData, currentUserUid) => {
    if (!userId) throw new Error('User ID is required');
    if (currentUserUid !== userId) throw new Error('You can only update your own profile');

    try {
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) throw new Error('User profile not found');

        const existingData = userSnap.data();

        // Check if existing data is in new format
        const isNewFormat = existingData.user_id && existingData.profile_info;

        let safeUpdateData;

        if (isNewFormat) {
            // Update new format
            safeUpdateData = {
                user_id: existingData.user_id, // immutable

                // Update primary email if provided
                ...(updateData.email && updateData.email !== existingData.primary_email && {
                    primary_email: updateData.email.toLowerCase().trim()
                }),

                // Update profile info
                profile_info: {
                    ...existingData.profile_info,
                    ...(updateData.firstName && {
                        name: {
                            ...existingData.profile_info.name,
                            first: updateData.firstName.trim(),
                            display: `${updateData.firstName.trim()} ${existingData.profile_info.name.last}`.trim()
                        }
                    }),
                    ...(updateData.lastName && {
                        name: {
                            ...existingData.profile_info.name,
                            last: updateData.lastName.trim(),
                            display: `${existingData.profile_info.name.first} ${updateData.lastName.trim()}`.trim()
                        }
                    }),
                    ...(updateData.displayName && {
                        name: {
                            ...existingData.profile_info.name,
                            display: updateData.displayName.trim()
                        }
                    }),
                    ...(updateData.avatarURL !== undefined && { avatar_url: updateData.avatarURL }),
                    ...(updateData.bio !== undefined && { bio: updateData.bio?.trim() || "" }),
                    ...(updateData.location !== undefined && { location: updateData.location?.trim() || "" }),
                    ...(updateData.phone !== undefined && { phone: updateData.phone?.trim() || "" }),
                    ...(updateData.timezone && { timezone: updateData.timezone }),
                    updated_at: serverTimestamp()
                },

                // Update auth metadata if email verification status changes
                ...(typeof updateData.emailVerified === 'boolean' && {
                    auth_metadata: {
                        ...existingData.auth_metadata,
                        email_verified: updateData.emailVerified
                    }
                }),

                // Update session context preferences
                ...(updateData.preferences && {
                    session_context: {
                        ...existingData.session_context,
                        preferences: {
                            ...existingData.session_context.preferences,
                            ...updateData.preferences
                        }
                    }
                })
            };
        } else {
            // Update legacy format
            safeUpdateData = {
                uid: existingData.uid, // immutable

                ...(updateData.email && updateData.email !== existingData.email && {
                    email: updateData.email.toLowerCase().trim()
                }),
                ...(updateData.firstName && { firstName: updateData.firstName.trim() }),
                ...(updateData.lastName && { lastName: updateData.lastName.trim() }),
                ...(typeof updateData.emailVerified === 'boolean' && { emailVerified: updateData.emailVerified }),
                ...(updateData.displayName && { displayName: updateData.displayName.trim() }),
                ...(updateData.avatarURL !== undefined && { avatarURL: updateData.avatarURL }),
                ...(updateData.bio !== undefined && { bio: updateData.bio?.trim() || "" }),
                ...(updateData.location !== undefined && { location: updateData.location?.trim() || "" }),
                ...(updateData.phone !== undefined && { phone: updateData.phone?.trim() || "" }),
                ...(updateData.preferences && { preferences: updateData.preferences }),

                updatedAt: serverTimestamp()
            };
        }

        await setDoc(userRef, safeUpdateData, { merge: true });

        const updatedDoc = await getDoc(userRef);
        return updatedDoc.data();

    } catch (error) {
        console.error('Error updating user profile:', error);
        if (error.code === 'permission-denied') {
            throw new Error('You do not have permission to update this profile.');
        }
        throw new Error(`Failed to update profile: ${error.message}`);
    }
};

/**
 * Helper function to create individual account document
 * Called from Register component
 */
export const createIndividualAccount = async (userId, accountData) => {
    try {
        const accountRef = doc(db, "individualAccounts", userId);
        const finalAccountData = {
            ...accountData,
            account_profile: {
                ...accountData.account_profile,
                created_at: accountData.account_profile.created_at || serverTimestamp(),
                updated_at: serverTimestamp()
            },
            subscription: {
                ...accountData.subscription,
                started_at: accountData.subscription.started_at || serverTimestamp()
            }
        };

        await setDoc(accountRef, finalAccountData);
        console.log('Individual account created successfully');
        return finalAccountData;
    } catch (error) {
        console.error('Error creating individual account:', error);
        throw new Error(`Failed to create individual account: ${error.message}`);
    }
};

/**
 * Helper function to get user's current account type
 */
export const getUserAccountType = (userData) => {
    if (!userData) return 'individual';

    // New format
    if (userData.session_context?.current_account_type) {
        return userData.session_context.current_account_type;
    }

    // Legacy format
    return userData.accountType || userData.userType || 'individual';
};

/**
 * Helper function to get user's display name
 */
export const getUserDisplayName = (userData) => {
    if (!userData) return '';

    // New format
    if (userData.profile_info?.name?.display) {
        return userData.profile_info.name.display;
    }

    // Legacy format
    return userData.displayName ||
        `${userData.firstName || ''} ${userData.lastName || ''}`.trim() ||
        'User';
};

/**
 * Helper function to get user's email
 */
export const getUserEmail = (userData) => {
    if (!userData) return '';

    // New format
    if (userData.primary_email) {
        return userData.primary_email;
    }

    // Legacy format
    return userData.email || '';
};