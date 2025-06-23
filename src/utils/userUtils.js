// userUtils.js - Pure utility functions with no dependencies

/**
 * Extract name from email as fallback
 */
export const extractNameFromEmail = (email) => {
    if (!email) return "";
    const emailPrefix = email.split('@')[0];
    return emailPrefix
        .replace(/[._0-9]/g, ' ')
        .split(' ')
        .filter(word => word.length > 0)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
};

/**
 * Parse display name into first/last name
 */
export const parseDisplayName = (displayName) => {
    if (!displayName || !displayName.trim()) {
        return { firstName: "", lastName: "" };
    }
    const nameParts = displayName.trim().split(' ');
    return {
        firstName: nameParts[0] || "",
        lastName: nameParts.slice(1).join(' ') || ""
    };
};

/**
 * Normalize user data for consistency
 */
export const normalizeUserData = (userData) => {
    if (!userData) return null;

    return {
        ...userData,
        email: userData.email?.toLowerCase().trim() || "",
        firstName: userData.firstName?.trim() || "",
        lastName: userData.lastName?.trim() || "",
        displayName: userData.displayName?.trim() || "",
        bio: userData.bio?.trim() || "",
        location: userData.location?.trim() || "",
        phone: userData.phone?.trim() || "",
    };
};

/**
 * Sanitize user input to prevent XSS and other issues
 */
export const sanitizeUserInput = (input) => {
    if (typeof input !== 'string') return input;

    return input
        .trim()
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<[^>]*>/g, '');
};

/**
 * Validate user data against business rules
 */
export const validateUserData = (userData, isCreate = false) => {
    const errors = [];

    if (isCreate) {
        if (!userData.uid) errors.push('uid is required');
        if (!userData.email) errors.push('email is required');
        if (!userData.firstName) errors.push('firstName is required');
    }

    if (userData.uid && typeof userData.uid !== 'string') errors.push('uid must be string');
    if (userData.email && typeof userData.email !== 'string') errors.push('email must be string');
    if (userData.firstName && typeof userData.firstName !== 'string') errors.push('firstName must be string');
    if (userData.lastName && typeof userData.lastName !== 'string') errors.push('lastName must be string');
    if (userData.emailVerified && typeof userData.emailVerified !== 'boolean') errors.push('emailVerified must be boolean');
    if (userData.displayName && typeof userData.displayName !== 'string') errors.push('displayName must be string');
    if (userData.avatarURL && userData.avatarURL !== null && typeof userData.avatarURL !== 'string') errors.push('avatarURL must be string or null');
    if (userData.accountType && !['individual', 'organization'].includes(userData.accountType)) errors.push('accountType must be individual or organization');
    if (userData.userType && !['individual', 'organization'].includes(userData.userType)) errors.push('userType must be individual or organization');
    if (userData.organizationId && userData.organizationId !== null && typeof userData.organizationId !== 'string') errors.push('organizationId must be string or null');
    if (userData.setupCompleted && typeof userData.setupCompleted !== 'boolean') errors.push('setupCompleted must be boolean');

    return {
        isValid: errors.length === 0,
        errors
    };
};