// services/RegistrationService.js - FIXED VERSION with correct account types
import {
    doc,
    getDoc,
    setDoc,
    updateDoc,
    serverTimestamp
} from 'firebase/firestore';
import {
    createUserWithEmailAndPassword,
    updatePassword,
    sendEmailVerification,
    signInWithPopup,
    GoogleAuthProvider
} from 'firebase/auth';
import { db, auth } from '../config/firebase';
import { getFirebaseErrorMessage } from '../utils/firebaseErrorHandler';

export class RegistrationService {
    constructor() {
        this.db = db;
        this.auth = auth;
        this.tempPassword = 'TempPass123!';
    }

    // =================== INDIVIDUAL ACCOUNT FLOW ===================

    async createIndividualStep1(registrationData) {
        const { email, name, provider = 'email', googleCredential = null } = registrationData;

        if (!email || !name) {
            return {
                success: false,
                error: { message: 'Email and name are required' }
            };
        }

        try {
            console.log('🔄 Starting Individual Step 1: Create Auth + Basic Profile');

            let userCredential;
            let user;

            if (provider === 'google' && googleCredential) {
                console.log('📱 Creating user with Google SSO');
                userCredential = googleCredential;
                user = userCredential.user;
            } else {
                console.log('📧 Creating user with email/password');
                userCredential = await createUserWithEmailAndPassword(
                    this.auth,
                    email,
                    this.tempPassword
                );
                user = userCredential.user;
                await sendEmailVerification(user);
            }

            const userId = user.uid;
            const timestamp = serverTimestamp();

            // FIXED: Simplified user document creation
            const userRef = doc(this.db, 'users', userId);
            const userData = {
                email: email,
                name: name,
                accountType: 'individual',
                createdAt: timestamp,
                created_by: userId,
                updated_by: userId,
                registrationStep: 1,
                registrationCompleted: false,
                emailVerified: provider === 'google',
                authProvider: provider
            };

            await setDoc(userRef, userData);
            console.log('✅ Individual Step 1 completed');

            return {
                success: true,
                data: {
                    userId: userId,
                    email: email,
                    name: name,
                    accountType: 'individual',
                    registrationStep: 1,
                    nextStep: 'completeProfile',
                    requiresPasswordUpdate: provider === 'email'
                }
            };

        } catch (error) {
            console.error('❌ Individual Step 1 failed:', error);
            return this.handleRegistrationError(error, 'create individual account step 1');
        }
    }

    async completeIndividualStep2(userId, profileData) {
        const {
            firstName,
            lastName,
            displayName,
            finalPassword,
            preferences = {},
            agreedToTerms = false
        } = profileData;

        if (!userId || !agreedToTerms) {
            return {
                success: false,
                error: { message: 'User ID and terms agreement are required' }
            };
        }

        try {
            console.log('🔄 Starting Individual Step 2: Complete Profile');

            const userRef = doc(this.db, 'users', userId);
            const userDoc = await getDoc(userRef);

            if (!userDoc.exists()) {
                return {
                    success: false,
                    error: { message: 'User profile not found' }
                };
            }

            const timestamp = serverTimestamp();

            if (finalPassword && this.auth.currentUser) {
                console.log('🔐 Updating user password');
                await updatePassword(this.auth.currentUser, finalPassword);
            }

            const profileUpdateData = {
                first_name: firstName,
                last_name: lastName,
                display_name: displayName || `${firstName} ${lastName}`,
                preferences: preferences,
                registrationStep: 2,
                registrationCompleted: true,
                agreedToTerms: true,
                agreedAt: timestamp,
                updated_at: timestamp,
                updated_by: userId
            };

            await updateDoc(userRef, profileUpdateData);
            await this.createUserSubscription(userId, 'individual');
            await this.logRegistrationActivity(userId, 'individual_registration_completed');

            console.log('✅ Individual Step 2 completed');

            return {
                success: true,
                data: {
                    userId: userId,
                    accountType: 'individual',
                    registrationCompleted: true,
                    message: 'Individual account registration completed successfully'
                }
            };

        } catch (error) {
            console.error('❌ Individual Step 2 failed:', error);
            return this.handleRegistrationError(error, 'complete individual account step 2');
        }
    }

    // =================== ORGANIZATION ACCOUNT FLOW - FIXED ===================

    async createOrganizationStep1(registrationData) {
        const { email, name, provider = 'email', googleCredential = null } = registrationData;

        if (!email || !name) {
            return {
                success: false,
                error: { message: 'Email and name are required' }
            };
        }

        try {
            console.log('🔄 Starting Organization Step 1: Create Auth + Basic Profile');

            let userCredential;
            let user;

            if (provider === 'google' && googleCredential) {
                console.log('📱 Creating organization admin with Google SSO');
                userCredential = googleCredential;
                user = userCredential.user;
            } else {
                console.log('📧 Creating organization admin with email/password');
                userCredential = await createUserWithEmailAndPassword(
                    this.auth,
                    email,
                    this.tempPassword
                );
                user = userCredential.user;
                await sendEmailVerification(user);
            }

            const userId = user.uid;
            const timestamp = serverTimestamp();

            // FIXED: Use 'organization' account type only
            const userRef = doc(this.db, 'users', userId);
            const userData = {
                email: email,
                name: name,
                accountType: 'organization',
                createdAt: timestamp,
                created_by: userId,
                updated_by: userId,
                registrationStep: 1,
                registrationCompleted: false,
                emailVerified: provider === 'google',
                authProvider: provider
            };

            await setDoc(userRef, userData);
            console.log('✅ Organization Step 1 completed');

            return {
                success: true,
                data: {
                    userId: userId,
                    email: email,
                    name: name,
                    accountType: 'organization',
                    registrationStep: 1,
                    nextStep: 'createOrganization',
                    requiresPasswordUpdate: provider === 'email'
                }
            };

        } catch (error) {
            console.error('❌ Organization Step 1 failed:', error);
            return this.handleRegistrationError(error, 'create organization account step 1');
        }
    }

    // MAJOR FIX: Completely rewritten organization creation
    async createOrganizationStep2(userId, organizationData) {
        const {
            name,
            industry = 'other',
            size = 'small',
            description = ''
        } = organizationData;

        if (!userId || !name) {
            return {
                success: false,
                error: { message: 'User ID and organization name are required' }
            };
        }

        try {
            console.log('🔄 Starting Organization Step 2: Create Organization');

            // CRITICAL: Verify authentication state first
            const currentUser = this.auth.currentUser;
            if (!currentUser || currentUser.uid !== userId) {
                console.error('❌ Authentication failure');
                return {
                    success: false,
                    error: { message: 'Authentication required. Please sign in again.' }
                };
            }

            // Verify user exists and get their data
            const userRef = doc(this.db, 'users', userId);
            const userDoc = await getDoc(userRef);

            if (!userDoc.exists()) {
                console.error('❌ User document not found');
                return {
                    success: false,
                    error: { message: 'User profile not found' }
                };
            }

            const userData = userDoc.data();
            console.log('📋 User data:', {
                accountType: userData.accountType,
                registrationStep: userData.registrationStep,
                email: userData.email
            });

            // Validate user state - FIXED: only check 'organization'
            if (userData.accountType !== 'organization') {
                console.error('❌ Invalid account type:', userData.accountType);
                return {
                    success: false,
                    error: { message: 'Invalid account type for organization creation' }
                };
            }

            if (userData.registrationStep !== 1) {
                console.error('❌ Invalid registration step:', userData.registrationStep);
                return {
                    success: false,
                    error: { message: 'Invalid registration step' }
                };
            }

            // Use userId as organizationId for simplicity
            const organizationId = userId;
            const timestamp = serverTimestamp();

            // FIXED: Simplified organization document with required fields only
            const orgRef = doc(this.db, 'organizations', organizationId);
            const orgData = {
                // REQUIRED by security rules
                name: name.trim(),
                ownerId: userId,
                created_by: userId,
                createdAt: timestamp,
                
                // OPTIONAL fields
                id: organizationId,
                description: description || `${name.trim()} organization`,
                industry: industry,
                size: size,
                memberCount: 1,
                status: 'active',
                updated_at: timestamp,
                updated_by: userId
            };

            console.log('📝 Creating organization document:', orgData);
            
            // CRITICAL FIX: Create organization document first
            await setDoc(orgRef, orgData);
            console.log('✅ Organization document created successfully');

            // Then update user registration step
            const userUpdateData = {
                registrationStep: 2,
                updated_at: timestamp,
                updated_by: userId
            };

            console.log('📝 Updating user registration step...');
            await updateDoc(userRef, userUpdateData);
            console.log('✅ User registration step updated to 2');

            return {
                success: true,
                data: {
                    userId: userId,
                    organizationId: organizationId,
                    organizationName: name.trim(),
                    registrationStep: 2,
                    nextStep: 'linkUserToOrganization'
                }
            };

        } catch (error) {
            console.error('❌ Organization Step 2 failed:', error);
            
            // Enhanced error handling
            if (error.code === 'permission-denied') {
                return {
                    success: false,
                    error: { 
                        message: 'Permission denied. Please ensure your account is properly authenticated and your security rules are configured correctly.',
                        code: 'permission-denied'
                    }
                };
            }

            if (error.message && error.message.includes('net::ERR_BLOCKED_BY_CLIENT')) {
                return {
                    success: false,
                    error: {
                        message: 'Request blocked by browser. Please disable ad-blockers or try a different browser.',
                        code: 'network-blocked'
                    }
                };
            }

            return this.handleRegistrationError(error, 'create organization step 2');
        }
    }

    // FIXED: Simplified user-organization linking
    async linkUserToOrganizationStep3(userId, organizationId) {
        if (!userId || !organizationId) {
            return {
                success: false,
                error: { message: 'User ID and organization ID are required' }
            };
        }

        try {
            console.log('🔄 Starting Organization Step 3: Link User + Create Membership');

            const userRef = doc(this.db, 'users', userId);
            const orgRef = doc(this.db, 'organizations', organizationId);

            const [userDoc, orgDoc] = await Promise.all([
                getDoc(userRef),
                getDoc(orgRef)
            ]);

            if (!userDoc.exists() || !orgDoc.exists()) {
                return {
                    success: false,
                    error: { message: 'User or organization not found' }
                };
            }

            const userData = userDoc.data();
            const orgData = orgDoc.data();

            if (userData.registrationStep !== 2) {
                return {
                    success: false,
                    error: { message: 'Invalid registration step' }
                };
            }

            if (orgData.ownerId !== userId) {
                return {
                    success: false,
                    error: { message: 'User is not the organization owner' }
                };
            }

            const timestamp = serverTimestamp();

            // FIXED: Simplified member document
            const memberRef = doc(this.db, 'organizations', organizationId, 'members', userId);
            const memberData = {
                uid: userId,
                user_id: userId,
                role: 'owner',
                joinedAt: timestamp,
                addedBy: userId,
                email: userData.email,
                display_name: userData.name,
                name: userData.name,
                status: 'active',
                isOwner: true
            };

            await setDoc(memberRef, memberData);
            console.log('✅ Member document created');

            // Update user with organization reference
            const userUpdateData = {
                organizationId: organizationId,
                orgId: organizationId,
                role: 'owner',
                registrationStep: 3,
                organizationName: orgData.name,
                updated_at: timestamp,
                updated_by: userId
            };

            await updateDoc(userRef, userUpdateData);
            console.log('✅ User linked to organization');

            // Create user membership reference (optional, simplified)
            try {
                const userMembershipRef = doc(this.db, 'userMemberships', userId, 'organizations', organizationId);
                const userMembershipData = {
                    org_id: organizationId,
                    org_name: orgData.name,
                    user_id: userId,
                    role: 'owner',
                    status: 'active',
                    joined_at: timestamp
                };
                await setDoc(userMembershipRef, userMembershipData);
                console.log('✅ User membership reference created');
            } catch (membershipError) {
                console.warn('⚠️ Could not create membership reference (non-critical):', membershipError.message);
            }

            return {
                success: true,
                data: {
                    userId: userId,
                    organizationId: organizationId,
                    role: 'owner',
                    registrationStep: 3,
                    nextStep: 'completeProfile'
                }
            };

        } catch (error) {
            console.error('❌ Organization Step 3 failed:', error);
            return this.handleRegistrationError(error, 'link user to organization step 3');
        }
    }

    async completeOrganizationStep4(userId, profileData) {
        const {
            firstName,
            lastName,
            displayName,
            finalPassword,
            preferences = {},
            agreedToTerms = false
        } = profileData;

        if (!userId || !agreedToTerms) {
            return {
                success: false,
                error: { message: 'User ID and terms agreement are required' }
            };
        }

        try {
            console.log('🔄 Starting Organization Step 4: Complete Profile');

            const userRef = doc(this.db, 'users', userId);
            const userDoc = await getDoc(userRef);

            if (!userDoc.exists()) {
                return {
                    success: false,
                    error: { message: 'User profile not found' }
                };
            }

            const userData = userDoc.data();

            if (userData.registrationStep !== 3) {
                return {
                    success: false,
                    error: { message: 'Invalid registration step' }
                };
            }

            const timestamp = serverTimestamp();

            // CRITICAL FIX: Update password BEFORE updating Firestore
            if (finalPassword && this.auth.currentUser) {
                console.log('🔐 Updating user password');
                try {
                    await updatePassword(this.auth.currentUser, finalPassword);
                    console.log('✅ Password updated successfully');
                } catch (passwordError) {
                    console.error('❌ Password update failed:', passwordError);
                    // Continue with registration even if password update fails
                    console.warn('⚠️ Continuing registration without password update');
                }
            }

            const profileUpdateData = {
                first_name: firstName,
                last_name: lastName,
                display_name: displayName || `${firstName} ${lastName}`,
                preferences: preferences,
                registrationStep: 4,
                registrationCompleted: true,
                agreedToTerms: true,
                agreedAt: timestamp,
                updated_at: timestamp,
                updated_by: userId
            };

            console.log('📝 Updating user profile...');
            await updateDoc(userRef, profileUpdateData);
            console.log('✅ User profile updated successfully');

            // Create subscription and log activity
            await this.createUserSubscription(userId, 'organization', userData.organizationId);
            await this.logRegistrationActivity(
                userId,
                'organization_registration_completed',
                { organizationId: userData.organizationId }
            );

            console.log('✅ Organization Step 4 completed');

            return {
                success: true,
                data: {
                    userId: userId,
                    organizationId: userData.organizationId,
                    accountType: 'organization',
                    registrationCompleted: true,
                    message: 'Organization account registration completed successfully'
                }
            };

        } catch (error) {
            console.error('❌ Organization Step 4 failed:', error);
            return this.handleRegistrationError(error, 'complete organization account step 4');
        }
    }

    // =================== UTILITY METHODS - SIMPLIFIED ===================

    async getRegistrationState(userId) {
        if (!userId) {
            return {
                success: false,
                error: { message: 'User ID is required' }
            };
        }

        try {
            const userRef = doc(this.db, 'users', userId);
            const userDoc = await getDoc(userRef);

            if (!userDoc.exists()) {
                return {
                    success: false,
                    error: { message: 'User not found' }
                };
            }

            const userData = userDoc.data();

            return {
                success: true,
                data: {
                    userId: userId,
                    email: userData.email,
                    name: userData.name,
                    accountType: userData.accountType,
                    registrationStep: userData.registrationStep || 1,
                    registrationCompleted: userData.registrationCompleted || false,
                    organizationId: userData.organizationId || userData.orgId || null,
                    organizationName: userData.organizationName || null,
                    emailVerified: userData.emailVerified || false,
                    authProvider: userData.authProvider || 'email'
                }
            };

        } catch (error) {
            console.error('Failed to get registration state:', error);
            return this.handleRegistrationError(error, 'get registration state');
        }
    }

    async createUserSubscription(userId, accountType, organizationId = null) {
        try {
            console.log('🔄 Creating user subscription...');
            
            const subscriptionRef = doc(this.db, 'subscriptions', userId);
            const trialEndDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
            const timestamp = serverTimestamp();

            const subscriptionData = {
                user_id: userId,
                userId: userId,
                organization_id: organizationId,
                plan: 'trial',
                status: 'trial_active',
                trial_starts_at: new Date().toISOString(),
                trial_ends_at: trialEndDate.toISOString(),
                isTrialActive: true,
                daysRemainingInTrial: 30,
                emailVerified: false,
                createdAt: timestamp,
                updated_at: timestamp,
                created_by: userId,
                updated_by: userId
            };

            await setDoc(subscriptionRef, subscriptionData);
            console.log('✅ Subscription created successfully');

        } catch (error) {
            console.error('❌ Failed to create subscription:', error);
            // Non-critical error - don't fail the registration
        }
    }

    async logRegistrationActivity(userId, action, metadata = {}) {
        try {
            const activityRef = doc(
                this.db,
                'activityLogs',
                userId,
                'logs',
                `${action}_${Date.now()}`
            );

            const activityData = {
                user_id: userId,
                action: action,
                description: `User ${action.replace('_', ' ')}`,
                metadata: metadata,
                timestamp: serverTimestamp(),
                createdAt: serverTimestamp()
            };

            await setDoc(activityRef, activityData);
            console.log('✅ Activity logged successfully');

        } catch (error) {
            console.error('❌ Failed to log activity:', error);
            // Non-critical error
        }
    }

    handleRegistrationError(error, operation = 'registration operation') {
        console.error(`Registration ${operation} error:`, error);

        let userMessage;

        if (error.code) {
            switch (error.code) {
                case 'auth/email-already-in-use':
                    userMessage = 'An account with this email already exists. Please use a different email or try signing in.';
                    break;
                case 'auth/weak-password':
                    userMessage = 'Password is too weak. Please choose a stronger password.';
                    break;
                case 'auth/invalid-email':
                    userMessage = 'Please enter a valid email address.';
                    break;
                case 'permission-denied':
                    userMessage = 'Permission denied. Please ensure you meet the requirements for account creation.';
                    break;
                case 'already-exists':
                    userMessage = 'This account already exists. Please try a different approach.';
                    break;
                case 'auth/requires-recent-login':
                    userMessage = 'For security reasons, please sign out and sign back in before updating your password.';
                    break;
                default:
                    userMessage = getFirebaseErrorMessage(error);
            }
        } else {
            userMessage = error.message || 'An unexpected error occurred during registration.';
        }

        return {
            success: false,
            error: {
                code: error.code || 'unknown',
                message: userMessage,
                operation: operation,
                originalError: process.env.NODE_ENV === 'development' ? error : undefined
            }
        };
    }

    // =================== GOOGLE SSO INTEGRATION ===================

    async handleGoogleSignIn() {
        try {
            const provider = new GoogleAuthProvider();
            provider.addScope('email');
            provider.addScope('profile');

            const result = await signInWithPopup(this.auth, provider);

            return {
                success: true,
                data: {
                    credential: result,
                    user: result.user,
                    email: result.user.email,
                    name: result.user.displayName,
                    provider: 'google'
                }
            };

        } catch (error) {
            console.error('Google Sign-In failed:', error);
            return this.handleRegistrationError(error, 'Google Sign-In');
        }
    }

    // =================== ADDITIONAL UTILITY METHODS ===================

    async resetRegistrationToStep(userId, targetStep) {
        if (!userId || targetStep < 1 || targetStep > 4) {
            return {
                success: false,
                error: { message: 'Invalid user ID or target step' }
            };
        }

        try {
            const userRef = doc(this.db, 'users', userId);
            const userDoc = await getDoc(userRef);

            if (!userDoc.exists()) {
                return {
                    success: false,
                    error: { message: 'User not found' }
                };
            }

            const userData = userDoc.data();
            const currentStep = userData.registrationStep || 1;

            if (currentStep < targetStep) {
                return {
                    success: false,
                    error: { message: 'Cannot reset to a higher step than current' }
                };
            }

            await updateDoc(userRef, {
                registrationStep: targetStep,
                registrationCompleted: false,
                updated_at: serverTimestamp(),
                updated_by: userId
            });

            console.log(`✅ Registration reset to step ${targetStep} for user ${userId}`);

            return {
                success: true,
                data: {
                    userId: userId,
                    registrationStep: targetStep,
                    message: `Registration reset to step ${targetStep}`
                }
            };

        } catch (error) {
            console.error('Failed to reset registration step:', error);
            return this.handleRegistrationError(error, 'reset registration step');
        }
    }

    // =================== REGISTRATION STATE MANAGEMENT ===================

    createRegistrationStateManager(userId) {
        return new RegistrationStateManager(userId, this);
    }
}

// =================== REGISTRATION STATE MANAGER - FIXED ===================

export class RegistrationStateManager {
    constructor(userId, registrationService) {
        this.userId = userId;
        this.service = registrationService;
        this.currentState = null;
    }

    async loadState() {
        const result = await this.service.getRegistrationState(this.userId);
        if (result.success) {
            this.currentState = result.data;
        }
        return result;
    }

    getCurrentState() {
        return this.currentState;
    }

    isCompleted() {
        return this.currentState?.registrationCompleted || false;
    }

    getCurrentStep() {
        return this.currentState?.registrationStep || 1;
    }

    getAccountType() {
        return this.currentState?.accountType || 'individual';
    }

    needsStep(stepNumber) {
        const currentStep = this.getCurrentStep();
        return !this.isCompleted() && currentStep < stepNumber;
    }

    getNextStep() {
        if (this.isCompleted()) {
            return null;
        }

        const currentStep = this.getCurrentStep();
        const accountType = this.getAccountType();

        if (accountType === 'individual') {
            switch (currentStep) {
                case 1:
                    return {
                        step: 2,
                        name: 'completeProfile',
                        description: 'Complete your profile with additional details'
                    };
                default:
                    return null;
            }
        } else if (accountType === 'organization') {
            switch (currentStep) {
                case 1:
                    return {
                        step: 2,
                        name: 'createOrganization',
                        description: 'Create your organization'
                    };
                case 2:
                    return {
                        step: 3,
                        name: 'linkToOrganization',
                        description: 'Link your account to the organization'
                    };
                case 3:
                    return {
                        step: 4,
                        name: 'completeProfile',
                        description: 'Complete your profile with additional details'
                    };
                default:
                    return null;
            }
        }

        return null;
    }

    async executeNextStep(stepData) {
        const nextStep = this.getNextStep();
        if (!nextStep) {
            return {
                success: false,
                error: { message: 'No next step available' }
            };
        }

        const accountType = this.getAccountType();
        let result;

        try {
            if (accountType === 'individual') {
                switch (nextStep.step) {
                    case 2:
                        result = await this.service.completeIndividualStep2(this.userId, stepData);
                        break;
                    default:
                        result = {
                            success: false,
                            error: { message: 'Invalid step for individual account' }
                        };
                }
            } else if (accountType === 'organization') {
                switch (nextStep.step) {
                    case 2:
                        result = await this.service.createOrganizationStep2(this.userId, stepData);
                        break;
                    case 3:
                        result = await this.service.linkUserToOrganizationStep3(
                            this.userId,
                            stepData.organizationId || this.userId
                        );
                        break;
                    case 4:
                        result = await this.service.completeOrganizationStep4(this.userId, stepData);
                        break;
                    default:
                        result = {
                            success: false,
                            error: { message: 'Invalid step for organization account' }
                        };
                }
            }

            if (result.success) {
                await this.loadState();
            }

            return result;

        } catch (error) {
            return this.service.handleRegistrationError(error, `execute step ${nextStep.step}`);
        }
    }

    validateStepData(stepData, stepNumber = null) {
        const targetStep = stepNumber || this.getNextStep()?.step;
        const accountType = this.getAccountType();

        if (!targetStep) {
            return {
                valid: false,
                errors: ['No target step specified']
            };
        }

        const errors = [];

        if (accountType === 'individual') {
            switch (targetStep) {
                case 2:
                    if (!stepData.firstName || stepData.firstName.trim().length < 1) {
                        errors.push('First name is required');
                    }
                    if (!stepData.lastName || stepData.lastName.trim().length < 1) {
                        errors.push('Last name is required');
                    }
                    if (!stepData.agreedToTerms) {
                        errors.push('You must agree to the terms of service');
                    }
                    break;
            }
        } else if (accountType === 'organization') {
            switch (targetStep) {
                case 2:
                    if (!stepData.name || stepData.name.trim().length < 2 || stepData.name.trim().length > 100) {
                        errors.push('Organization name must be between 2 and 100 characters');
                    }
                    break;
                case 3:
                    // No additional validation needed for linking step
                    break;
                case 4:
                    if (!stepData.firstName || stepData.firstName.trim().length < 1) {
                        errors.push('First name is required');
                    }
                    if (!stepData.lastName || stepData.lastName.trim().length < 1) {
                        errors.push('Last name is required');
                    }
                    if (!stepData.agreedToTerms) {
                        errors.push('You must agree to the terms of service');
                    }
                    break;
            }
        }

        return {
            valid: errors.length === 0,
            errors: errors
        };
    }

    async resetToStep(stepNumber) {
        const result = await this.service.resetRegistrationToStep(this.userId, stepNumber);

        if (result.success) {
            await this.loadState();
        }

        return result;
    }

    getProgressPercentage() {
        if (this.isCompleted()) {
            return 100;
        }

        const currentStep = this.getCurrentStep();
        const accountType = this.getAccountType();
        const totalSteps = accountType === 'individual' ? 2 : 4;

        return Math.round((currentStep / totalSteps) * 100);
    }

    getStatusMessage() {
        if (this.isCompleted()) {
            return 'Registration completed successfully!';
        }

        const nextStep = this.getNextStep();
        if (nextStep) {
            return nextStep.description;
        }

        return 'Registration in progress...';
    }
}

// =================== REGISTRATION FLOW HELPERS ===================

export class RegistrationFlowHelpers {
    static validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    static validatePassword(password) {
        const errors = [];

        if (password.length < 8) {
            errors.push('Password must be at least 8 characters long');
        }

        if (!/[A-Z]/.test(password)) {
            errors.push('Password must contain at least one uppercase letter');
        }

        if (!/[a-z]/.test(password)) {
            errors.push('Password must contain at least one lowercase letter');
        }

        if (!/[0-9]/.test(password)) {
            errors.push('Password must contain at least one number');
        }

        if (!/[!@#$%^&*]/.test(password)) {
            errors.push('Password must contain at least one special character (!@#$%^&*)');
        }

        return {
            valid: errors.length === 0,
            errors: errors,
            strength: this.calculatePasswordStrength(password)
        };
    }

    static calculatePasswordStrength(password) {
        let score = 0;

        if (password.length >= 8) score += 25;
        if (password.length >= 12) score += 25;

        if (/[a-z]/.test(password)) score += 10;
        if (/[A-Z]/.test(password)) score += 10;
        if (/[0-9]/.test(password)) score += 10;
        if (/[!@#$%^&*]/.test(password)) score += 20;

        return Math.min(score, 100);
    }

    static validateOrganizationName(name) {
        const errors = [];

        if (!name || name.trim().length === 0) {
            errors.push('Organization name is required');
        } else if (name.trim().length < 2) {
            errors.push('Organization name must be at least 2 characters long');
        } else if (name.trim().length > 100) {
            errors.push('Organization name must not exceed 100 characters');
        }

        if (name && /[<>\"'&]/.test(name)) {
            errors.push('Organization name contains invalid characters');
        }

        return {
            valid: errors.length === 0,
            errors: errors
        };
    }

    static validatePersonalName(name, fieldName = 'Name') {
        const errors = [];

        if (!name || name.trim().length === 0) {
            errors.push(`${fieldName} is required`);
        } else if (name.trim().length < 1) {
            errors.push(`${fieldName} must be at least 1 character long`);
        } else if (name.trim().length > 50) {
            errors.push(`${fieldName} must not exceed 50 characters`);
        }

        if (name && !/^[a-zA-Z\s\-']+$/.test(name)) {
            errors.push(`${fieldName} can only contain letters, spaces, hyphens, and apostrophes`);
        }

        return {
            valid: errors.length === 0,
            errors: errors
        };
    }

    static generateDisplayName(firstName, lastName) {
        const first = (firstName || '').trim();
        const last = (lastName || '').trim();

        if (first && last) {
            return `${first} ${last}`;
        } else if (first) {
            return first;
        } else if (last) {
            return last;
        }

        return '';
    }

    static sanitizeInput(input) {
        if (typeof input !== 'string') {
            return input;
        }

        return input.trim().replace(/[<>\"'&]/g, '');
    }
}

export default RegistrationService;