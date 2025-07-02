// utils/emailDomainValidator.js - Fixed email domain validation utility

/**
 * Comprehensive list of public email domains that should not be used for organization accounts
 */
const PUBLIC_EMAIL_DOMAINS = new Set([
    // Major providers
    'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com', 'icloud.com',
    'live.com', 'msn.com', 'mail.com', 'protonmail.com', 'tutanota.com',
    
    // International Gmail variants
    'googlemail.com', 'gmail.co.uk', 'gmail.ca', 'gmail.de', 'gmail.fr',
    'gmail.it', 'gmail.es', 'gmail.com.au', 'gmail.com.br', 'gmail.co.in',
    
    // Yahoo variants
    'yahoo.co.uk', 'yahoo.ca', 'yahoo.de', 'yahoo.fr', 'yahoo.it',
    'yahoo.es', 'yahoo.com.au', 'yahoo.com.br', 'yahoo.co.in', 'yahoo.co.jp',
    'ymail.com', 'rocketmail.com',
    
    // Microsoft variants
    'hotmail.co.uk', 'hotmail.ca', 'hotmail.de', 'hotmail.fr', 'hotmail.it',
    'hotmail.es', 'hotmail.com.au', 'hotmail.com.br', 'hotmail.co.in',
    'live.co.uk', 'live.ca', 'live.de', 'live.fr', 'live.it', 'live.com.au',
    'outlook.de', 'outlook.fr', 'outlook.it', 'outlook.es', 'outlook.co.uk',
    
    // Other major providers
    'zoho.com', 'fastmail.com', 'gmx.com', 'gmx.de', 'web.de', 't-online.de',
    'freenet.de', '1und1.de', 'arcor.de', 'alice.it', 'libero.it', 'virgilio.it',
    'orange.fr', 'laposte.net', 'free.fr', 'wanadoo.fr', 'sfr.fr',
    'rediffmail.com', 'indiatimes.com', 'sify.com', 'vsnl.net',
    'naver.com', 'daum.net', 'hanmail.net', 'nate.com',
    'qq.com', '163.com', '126.com', 'sina.com', 'sohu.com',
    'mail.ru', 'yandex.ru', 'rambler.ru', 'list.ru',
    
    // Temporary/disposable email providers
    '10minutemail.com', 'guerrillamail.com', 'mailinator.com', 'tempmail.org',
    'throwawaymailcom', 'yopmail.com', 'temp-mail.org', 'sharklasers.com',
    
    // Free hosting email services
    'mail.com', 'email.com', 'usa.com', 'myself.com', 'consultant.com',
    'post.com', 'europe.com', 'writeme.com', 'iname.com'
]);

/**
 * Additional patterns to identify public domains
 */
const PUBLIC_DOMAIN_PATTERNS = [
    /^.*\.gmail\.com$/i,
    /^.*\.yahoo\..*$/i,
    /^.*\.hotmail\..*$/i,
    /^.*\.outlook\..*$/i,
    /^.*\.live\..*$/i,
    /^.*\.msn\..*$/i,
    /^.*\.googlemail\..*$/i,
    /^.*\.ymail\..*$/i,
    /^.*\.rocketmail\..*$/i,
    // Temporary email patterns
    /^.*temp.*mail.*$/i,
    /^.*\.10minutemail\..*$/i,
    /^.*disposable.*$/i
];

/**
 * Check if a domain is a public email provider
 * @param {string} domain - Email domain to check
 * @returns {boolean} True if domain is public
 */
export const isPublicEmailDomain = (domain) => {
    if (!domain || typeof domain !== 'string') return false;
    
    const normalizedDomain = domain.toLowerCase().trim();
    
    // Check against known public domains first
    if (PUBLIC_EMAIL_DOMAINS.has(normalizedDomain)) {
        return true;
    }
    
    // Check against patterns
    return PUBLIC_DOMAIN_PATTERNS.some(pattern => pattern.test(normalizedDomain));
};

/**
 * Check if a domain appears to be a custom/organizational domain
 * @param {string} domain - Email domain to check
 * @returns {boolean} True if domain appears to be custom
 */
export const isCustomDomain = (domain) => {
    if (!domain || typeof domain !== 'string') return false;
    
    const normalizedDomain = domain.toLowerCase().trim();
    
    // FIXED: Check public domains first - if public, it's definitely not custom
    if (isPublicEmailDomain(normalizedDomain)) {
        return false;
    }
    
    // Basic domain validation
    const domainRegex = /^[a-z0-9][a-z0-9-]*[a-z0-9]*\.[a-z]{2,}$/i;
    if (!domainRegex.test(normalizedDomain)) {
        return false;
    }
    
    // Exclude localhost and development domains
    if (/^(localhost|127\.0\.0\.1|.*\.local|.*\.test|.*\.dev)$/i.test(normalizedDomain)) {
        return false;
    }
    
    // Must have reasonable length
    if (normalizedDomain.length < 4) {
        return false;
    }
    
    // If it passes all checks and isn't public, it's custom
    return true;
};

/**
 * Get comprehensive email domain information
 * @param {string} email - Email address
 * @returns {Object} Domain classification details
 */
export const getEmailDomainInfo = (email) => {
    if (!email || typeof email !== 'string' || !email.includes('@')) {
        return {
            domain: null,
            isValid: false,
            isPublic: false,
            isCustom: false,
            classification: 'invalid',
            recommendedAccountType: 'individual'
        };
    }
    
    const domain = email.split('@')[1];
    if (!domain) {
        return {
            domain: null,
            isValid: false,
            isPublic: false,
            isCustom: false,
            classification: 'invalid',
            recommendedAccountType: 'individual'
        };
    }
    
    const isPublic = isPublicEmailDomain(domain);
    const isCustom = isCustomDomain(domain);
    
    let classification = 'unknown';
    let recommendedAccountType = 'individual';
    
    if (isPublic) {
        classification = 'public';
        recommendedAccountType = 'individual';
    } else if (isCustom) {
        classification = 'custom';
        recommendedAccountType = 'organization';
    } else {
        classification = 'other';
        recommendedAccountType = 'individual';
    }
    
    return {
        domain,
        isValid: true,
        isPublic,
        isCustom,
        classification,
        recommendedAccountType
    };
};

/**
 * Check if email domain suggests showing organization account prompt
 * @param {string} email - Email address
 * @param {string} currentAccountType - Current selected account type
 * @returns {boolean} True if should show organization prompt
 */
export const shouldShowOrganizationPrompt = (email, currentAccountType) => {
    // Only show for individual accounts
    if (currentAccountType !== 'individual') {
        return false;
    }
    
    if (!email || !email.includes('@')) {
        return false;
    }
    
    const domainInfo = getEmailDomainInfo(email);
    
    // Show prompt only for custom domains (not public providers)
    return domainInfo.isCustom && !domainInfo.isPublic;
};

/**
 * Validate email domain for account registration
 * @param {string} email - Full email address
 * @param {string} accountType - 'individual' or 'organization'
 * @returns {Object} Validation result with suggestions
 */
export const validateEmailForAccountType = (email, accountType) => {
    if (!email || typeof email !== 'string') {
        return {
            isValid: false,
            error: 'Email is required',
            suggestion: null,
            domainInfo: null
        };
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return {
            isValid: false,
            error: 'Please enter a valid email address',
            suggestion: null,
            domainInfo: null
        };
    }
    
    const domainInfo = getEmailDomainInfo(email);
    
    if (accountType === 'organization') {
        if (domainInfo.isPublic) {
            return {
                isValid: false,
                error: 'Organization accounts require a custom company domain email. Public email providers like Gmail, Yahoo, and Outlook are not allowed.',
                suggestion: `Please use your company email address (e.g., yourname@yourcompany.com) or switch to Individual account type if you don't have a company email.`,
                domainInfo
            };
        }
        
        if (!domainInfo.isCustom) {
            return {
                isValid: false,
                error: 'Please use a valid company domain email address',
                suggestion: 'Organization accounts require a professional email address from your company domain.',
                domainInfo
            };
        }
        
        return {
            isValid: true,
            message: `Great! Using custom domain: ${domainInfo.domain}`,
            domainInfo
        };
    }
    
    if (accountType === 'individual') {
        // Individual accounts accept any valid email
        return {
            isValid: true,
            domainInfo
        };
    }
    
    return {
        isValid: true,
        domainInfo
    };
};

/**
 * Suggest account type based on email domain
 * @param {string} email - Email address
 * @returns {string} Suggested account type ('individual' or 'organization')
 */
export const suggestAccountType = (email) => {
    const domainInfo = getEmailDomainInfo(email);
    return domainInfo.recommendedAccountType;
};