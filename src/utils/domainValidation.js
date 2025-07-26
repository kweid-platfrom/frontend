// utils/domainValidation.js
export const COMMON_EMAIL_PROVIDERS = [
    'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com',
    'icloud.com', 'live.com', 'msn.com', 'ymail.com', 'protonmail.com',
    'mail.com', 'zoho.com', 'fastmail.com', 'tutanota.com'
];

export const isCommonEmailProvider = (email) => {
    if (!email || typeof email !== 'string') return false;
    
    const domain = email.split('@')[1]?.toLowerCase();
    return COMMON_EMAIL_PROVIDERS.includes(domain);
};

export const isCustomDomain = (email) => {
    return !isCommonEmailProvider(email);
};

export const extractDomain = (email) => {
    if (!email || typeof email !== 'string') return '';
    return email.split('@')[1]?.toLowerCase() || '';
};

export const validateEmailFormat = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};