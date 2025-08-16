import React, { useState } from 'react';
import { Eye, EyeOff, ArrowLeft, User, Building, ChevronDown, CheckCircle } from 'lucide-react';
import { useRegistration } from '../hooks/useRegistration';
import { isCustomDomain, isCommonEmailProvider } from '../utils/domainValidation';
import { toast } from 'sonner';
import DomainSuggestion from './DomainSuggestion';
import GoogleSSO from './GoogleSSO';

const MultiStepRegistrationForm = ({ onSuccess, onSwitchToLogin }) => {
    const {
        loading,
        error,
        startIndividualRegistration,
        completeIndividualRegistration,
        startOrganizationRegistration,
        createOrganization,
        linkUserToOrganization,
        completeOrganizationRegistration,
        clearError    } = useRegistration();

    const [currentStep, setCurrentStep] = useState(1);
    const [registrationState, setRegistrationState] = useState(null);
    
    const [formData, setFormData] = useState({
        accountType: '',
        email: '',
        displayName: '',
        organizationName: '',
        organizationIndustry: '',
        organizationSize: 'small',
        password: '',
        agreeToTerms: false,
        preferences: {}
    });

    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState({});
    const [isIndustryDropdownOpen, setIsIndustryDropdownOpen] = useState(false);
    const [isSizeDropdownOpen, setIsSizeDropdownOpen] = useState(false);
    const [emailError, setEmailError] = useState('');
    const [showDomainSuggestion, setShowDomainSuggestion] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [stepLoading, setStepLoading] = useState(false);

    React.useEffect(() => {
        if (error) {
            toast.error(error);
            clearError();
        }
    }, [error, clearError]);

    const handleAccountTypeChange = (accountType) => {
        handleInputChange('accountType', accountType);

        // Re-validate email with new account type
        if (formData.email) {
            if (accountType === 'organization' && isCommonEmailProvider(formData.email)) {
                setEmailError('Organization accounts require a custom domain email (e.g., name@yourcompany.com)');
                setShowDomainSuggestion(false);
            } else if (accountType === 'individual' && isCustomDomain(formData.email)) {
                setEmailError('');
                setShowDomainSuggestion(true);
            } else {
                setEmailError('');
                setShowDomainSuggestion(false);
            }
        }
    };

    const handleSuggestUpgrade = () => {
        handleAccountTypeChange('organization');
        setShowDomainSuggestion(false);
    };

    const handleDismissSuggestion = () => {
        setShowDomainSuggestion(false);
    };

    const handleGoogleAuth = async (googleUserData, credential) => {
        try {
            setGoogleLoading(true);
            
            // Auto-detect account type based on email domain if not selected
            let accountType = formData.accountType;
            if (!accountType) {
                accountType = isCustomDomain(googleUserData.email) ? 'organization' : 'individual';
            }

            // Start registration flow based on account type
            let result;
            if (accountType === 'individual') {
                result = await startIndividualRegistration({
                    email: googleUserData.email,
                    name: googleUserData.name,
                    googleCredential: credential
                });

                if (result.success) {
                    // Complete individual registration immediately for Google users
                    const completeResult = await completeIndividualRegistration(
                        result.registrationState.userId,
                        {
                            firstName: googleUserData.name.split(' ')[0] || '',
                            lastName: googleUserData.name.split(' ').slice(1).join(' ') || '',
                            displayName: googleUserData.name,
                            preferences: formData.preferences || {},
                            agreedToTerms: true
                        }
                    );
                    result = completeResult;
                }
            } else {
                result = await startOrganizationRegistration({
                    email: googleUserData.email,
                    name: googleUserData.name,
                    googleCredential: credential
                });

                if (result.success) {
                    setRegistrationState(result.registrationState);
                    setFormData(prev => ({
                        ...prev,
                        email: googleUserData.email,
                        displayName: googleUserData.name,
                        accountType: 'organization'
                    }));
                    setCurrentStep(3); // Skip to organization setup
                }
            }

            if (result?.success) {
                if (result.completed) {
                    toast.success('Registration successful! Please check your email for a confirmation link to verify your account.');
                    onSuccess(result);
                } else {
                    toast.success(result.message);
                }
            } else {
                const errorMsg = result?.error || 'Google registration failed';
                toast.error(errorMsg);
                setErrors({ submit: errorMsg });
            }
        } catch (error) {
            console.error('Google auth error:', error);
            const errorMsg = error.message || 'Google authentication failed. Please try again.';
            toast.error(errorMsg);
            setErrors({ submit: errorMsg });
        } finally {
            setGoogleLoading(false);
        }
    };

    const accountTypes = [
        {
            value: 'individual',
            label: 'Individual Account',
            description: 'For personal projects and individual testing',
            icon: User
        },
        {
            value: 'organization',
            label: 'Organization Account',
            description: 'For teams, companies, and collaborative testing',
            icon: Building
        }
    ];

    const industries = [
        { value: 'technology', label: 'Technology' },
        { value: 'healthcare', label: 'Healthcare' },
        { value: 'finance', label: 'Finance' },
        { value: 'education', label: 'Education' },
        { value: 'retail', label: 'Retail' },
        { value: 'manufacturing', label: 'Manufacturing' },
        { value: 'consulting', label: 'Consulting' },
        { value: 'media', label: 'Media & Entertainment' },
        { value: 'nonprofit', label: 'Non-profit' },
        { value: 'government', label: 'Government' },
        { value: 'other', label: 'Other' }
    ];

    const organizationSizes = [
        { value: 'small', label: '1-10 employees' },
        { value: 'medium', label: '11-50 employees' },
        { value: 'large', label: '51-200 employees' },
        { value: 'enterprise', label: '200+ employees' }
    ];

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));

        // Clear specific error when user starts typing
        if (errors[field]) {
            setErrors(prev => ({
                ...prev,
                [field]: ''
            }));
        }

        // Clear general error
        if (error) {
            clearError();
        }

        // Validate organization email requirement in real-time
        if (field === 'email' && value) {
            if (formData.accountType === 'organization' && isCommonEmailProvider(value)) {
                setEmailError('Organization accounts require a custom domain email (e.g., name@yourcompany.com)');
                setShowDomainSuggestion(false);
            } else if (formData.accountType === 'individual' && isCustomDomain(value)) {
                setEmailError('');
                setShowDomainSuggestion(true);
            } else {
                setEmailError('');
                setShowDomainSuggestion(false);
            }
        } else if (field === 'email') {
            setEmailError('');
            setShowDomainSuggestion(false);
        }
    };

    const validateStep = (step) => {
        const newErrors = {};

        switch (step) {
            case 1: // Account Type
                if (!formData.accountType) {
                    newErrors.accountType = 'Please select an account type';
                }
                break;

            case 2: // Basic Info
                if (!formData.email) {
                    newErrors.email = 'Email is required';
                } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
                    newErrors.email = 'Please enter a valid email address';
                } else if (formData.accountType === 'organization' && isCommonEmailProvider(formData.email)) {
                    newErrors.email = 'Organization accounts require a custom domain email';
                }

                if (emailError) {
                    newErrors.email = emailError;
                }

                if (!formData.displayName) {
                    newErrors.displayName = 'Full name is required';
                } else if (formData.displayName.trim().length < 2) {
                    newErrors.displayName = 'Full name must be at least 2 characters';
                } else if (formData.displayName.trim().length > 100) {
                    newErrors.displayName = 'Full name must be less than 100 characters';
                }
                break;

            case 3: // Organization Info (only for org accounts)
                if (formData.accountType === 'organization') {
                    if (!formData.organizationName) {
                        newErrors.organizationName = 'Organization name is required';
                    } else if (formData.organizationName.trim().length < 2) {
                        newErrors.organizationName = 'Organization name must be at least 2 characters';
                    } else if (formData.organizationName.trim().length > 100) {
                        newErrors.organizationName = 'Organization name must be less than 100 characters';
                    }

                    if (!formData.organizationIndustry) {
                        newErrors.organizationIndustry = 'Industry is required';
                    }
                }
                break;

            case 4: // Password & Terms
                if (!formData.password) {
                    newErrors.password = 'Password is required';
                } else if (formData.password.length < 8) {
                    newErrors.password = 'Password must be at least 8 characters';
                }

                if (!formData.agreeToTerms) {
                    newErrors.agreeToTerms = 'You must agree to the terms and conditions';
                }
                break;
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const nextStep = async () => {
        if (!validateStep(currentStep)) return;

        setStepLoading(true);
        try {
            // Handle registration steps
            if (currentStep === 2 && !registrationState) {
                // Start registration after basic info is collected
                let result;
                
                if (formData.accountType === 'individual') {
                    result = await startIndividualRegistration({
                        email: formData.email,
                        name: formData.displayName
                    });
                } else {
                    result = await startOrganizationRegistration({
                        email: formData.email,
                        name: formData.displayName
                    });
                }

                if (result.success) {
                    setRegistrationState(result.registrationState);
                    toast.success(result.message);
                } else {
                    toast.error(result.error);
                    return;
                }
            }

            // Skip organization step for individual accounts
            if (currentStep === 2 && formData.accountType === 'individual') {
                setCurrentStep(4);
            } else {
                setCurrentStep(currentStep + 1);
            }
        } finally {
            setStepLoading(false);
        }
    };

    const prevStep = () => {
        // Skip organization step when going back for individual accounts
        if (currentStep === 4 && formData.accountType === 'individual') {
            setCurrentStep(2);
        } else {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleSubmit = async () => {
        if (!validateStep(currentStep)) return;

        setStepLoading(true);
        try {
            let result;

            if (currentStep === 3 && formData.accountType === 'organization') {
                // Create organization step
                result = await createOrganization(registrationState.userId, {
                    name: formData.organizationName,
                    industry: formData.organizationIndustry,
                    size: formData.organizationSize
                });

                if (result.success) {
                    setRegistrationState(result.registrationState);
                    toast.success(result.message);
                    
                    // Link user to organization
                    const linkResult = await linkUserToOrganization(
                        registrationState.userId,
                        result.registrationState.organizationId
                    );
                    
                    if (linkResult.success) {
                        setRegistrationState(linkResult.registrationState);
                        setCurrentStep(4);
                    } else {
                        toast.error(linkResult.error);
                    }
                }
                return;
            }

            // Final step - complete registration
            const profileData = {
                firstName: formData.displayName.split(' ')[0] || '',
                lastName: formData.displayName.split(' ').slice(1).join(' ') || '',
                displayName: formData.displayName,
                finalPassword: formData.password,
                preferences: formData.preferences || {},
                agreedToTerms: formData.agreeToTerms
            };

            if (formData.accountType === 'individual') {
                result = await completeIndividualRegistration(
                    registrationState.userId,
                    profileData
                );
            } else {
                result = await completeOrganizationRegistration(
                    registrationState.userId,
                    profileData
                );
            }

            if (result?.success) {
                toast.success('Registration successful! Please check your email for a confirmation link to verify your account.');
                onSuccess(result);
            } else {
                const errorMsg = result?.error || 'Registration failed';
                toast.error(errorMsg);
                setErrors({ submit: errorMsg });
            }
        } catch (error) {
            console.error('Registration error:', error);
            const errorMsg = error.message || 'Registration failed. Please try again.';
            toast.error(errorMsg);
            setErrors({ submit: errorMsg });
        } finally {
            setStepLoading(false);
        }
    };

    const getStepCount = () => {
        return formData.accountType === 'individual' ? 3 : 4; 
    };

    const getCurrentStepForDisplay = () => {
        if (formData.accountType === 'individual' && currentStep === 4) {
            return 3;
        }
        return currentStep;
    };

    // Step 1: Account Type Selection
    const renderAccountTypeStep = () => (
        <div className="space-y-6">
            <div className="text-center">
                <GoogleSSO 
                    loading={googleLoading} 
                    onGoogleAuth={handleGoogleAuth}
                />

                <div className="flex items-center my-6">
                    <div className="flex-grow border-t border-slate-300"></div>
                    <span className="px-4 text-sm text-slate-500 font-medium bg-white">or</span>
                    <div className="flex-grow border-t border-slate-300"></div>
                </div>
                <p className="text-slate-600">Select the option that best fits your testing needs</p>
            </div>

            <div className="space-y-4">
                {accountTypes.map((type) => (
                    <div
                        key={type.value}
                        onClick={() => handleAccountTypeChange(type.value)}
                        className={`relative p-6 rounded-xl border-2 cursor-pointer transition-all duration-200 ${formData.accountType === type.value
                            ? 'border-teal-500 bg-teal-50'
                            : 'border-slate-200 hover:border-slate-300 hover:shadow-md'
                            }`}
                    >
                        <div className="flex items-start gap-4">
                            <div className="p-3 rounded-lg bg-slate-100">
                                <type.icon className="w-6 h-6 text-slate-600" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold text-slate-900 mb-1">{type.label}</h3>
                                <p className="text-slate-600 text-sm">{type.description}</p>
                            </div>
                            <div className={`w-5 h-5 rounded-full border-2 ${formData.accountType === type.value
                                ? 'border-teal-500 bg-teal-500'
                                : 'border-slate-300'
                                }`}>
                                {formData.accountType === type.value && (
                                    <CheckCircle className="w-5 h-5 text-white -m-0.5" />
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {errors.accountType && (
                <p className="text-sm text-red-500 text-center">{errors.accountType}</p>
            )}
        </div>
    );

    // Step 2: Basic Info (Email & Name)
    const renderBasicInfoStep = () => (
        <div className="space-y-6">
            <div className="text-center">
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Basic Information</h2>
                <p className="text-slate-600">Tell us a bit about yourself</p>
            </div>

            <div className="space-y-4">
                <div>
                    <label htmlFor="email" className="text-sm font-medium text-slate-700 block mb-2">
                        Email Address
                    </label>
                    <input
                        type="email"
                        id="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className={`w-full px-4 py-3 border ${errors.email || emailError ? 'border-red-500' : 'border-slate-200'} rounded-lg text-slate-900 placeholder-slate-400 transition-all duration-200 focus:border-teal-500 focus:outline-none focus:ring focus:ring-teal-500/10`}
                        placeholder={formData.accountType === 'organization' ? "name@yourcompany.com" : "name@example.com"}
                        required
                    />
                    {(errors.email || emailError) && (
                        <p className="text-sm text-red-500 mt-1">{errors.email || emailError}</p>
                    )}
                    {showDomainSuggestion && formData.accountType === 'individual' && (
                        <DomainSuggestion
                            email={formData.email}
                            currentAccountType={formData.accountType}
                            onSuggestUpgrade={handleSuggestUpgrade}
                            onDismiss={handleDismissSuggestion}
                        />
                    )}
                </div>

                <div>
                    <label htmlFor="displayName" className="text-sm font-medium text-slate-700 block mb-2">
                        Full Name
                    </label>
                    <input
                        type="text"
                        id="displayName"
                        value={formData.displayName}
                        onChange={(e) => handleInputChange('displayName', e.target.value)}
                        className={`w-full px-4 py-3 border ${errors.displayName ? 'border-red-500' : 'border-slate-200'} rounded-lg text-slate-900 placeholder-slate-400 transition-all duration-200 focus:border-teal-500 focus:outline-none focus:ring focus:ring-teal-500/10`}
                        placeholder="Enter your full name"
                        required
                    />
                    {errors.displayName && (
                        <p className="text-sm text-red-500 mt-1">{errors.displayName}</p>
                    )}
                </div>
            </div>
        </div>
    );

    // Step 3: Organization Info (only for organization accounts)
    const renderOrganizationInfoStep = () => (
        <div className="space-y-6">
            <div className="text-center">
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Organization Details</h2>
                <p className="text-slate-600">Help us set up your organization</p>
            </div>

            <div className="space-y-4">
                <div>
                    <label htmlFor="organizationName" className="text-sm font-medium text-slate-700 block mb-2">
                        Organization Name <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        id="organizationName"
                        value={formData.organizationName}
                        onChange={(e) => handleInputChange('organizationName', e.target.value)}
                        className={`w-full px-4 py-3 border ${errors.organizationName ? 'border-red-500' : 'border-slate-200'} rounded-lg text-slate-900 placeholder-slate-400 transition-all duration-200 focus:border-teal-500 focus:outline-none focus:ring focus:ring-teal-500/10`}
                        placeholder="Enter your organization name"
                        required
                    />
                    {errors.organizationName && (
                        <p className="text-sm text-red-500 mt-1">{errors.organizationName}</p>
                    )}
                </div>

                <div>
                    <label className="text-sm font-medium text-slate-700 block mb-2">
                        Industry <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                        <button
                            type="button"
                            onClick={() => setIsIndustryDropdownOpen(!isIndustryDropdownOpen)}
                            className={`w-full px-4 py-3 border ${errors.organizationIndustry ? 'border-red-500' : 'border-slate-200'} rounded-lg text-slate-900 transition-all duration-200 focus:border-teal-500 focus:outline-none focus:ring focus:ring-teal-500/10 bg-white text-left flex items-center justify-between`}
                        >
                            <span className={formData.organizationIndustry ? 'text-slate-900' : 'text-slate-400'}>
                                {industries.find(ind => ind.value === formData.organizationIndustry)?.label || 'Select your industry'}
                            </span>
                            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isIndustryDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {isIndustryDropdownOpen && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                                {industries.map((industry) => (
                                    <button
                                        key={industry.value}
                                        type="button"
                                        onClick={() => {
                                            handleInputChange('organizationIndustry', industry.value);
                                            setIsIndustryDropdownOpen(false);
                                        }}
                                        className={`w-full px-4 py-2.5 text-left hover:bg-slate-50 transition-colors duration-200 first:rounded-t-lg last:rounded-b-lg ${formData.organizationIndustry === industry.value ? 'bg-teal-50 text-teal-900 font-medium' : 'text-slate-900'
                                            }`}
                                    >
                                        {industry.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    {errors.organizationIndustry && (
                        <p className="text-sm text-red-500 mt-1">{errors.organizationIndustry}</p>
                    )}
                </div>

                <div>
                    <label className="text-sm font-medium text-slate-700 block mb-2">
                        Organization Size
                    </label>
                    <div className="relative">
                        <button
                            type="button"
                            onClick={() => setIsSizeDropdownOpen(!isSizeDropdownOpen)}
                            className="w-full px-4 py-3 border border-slate-200 rounded-lg text-slate-900 transition-all duration-200 focus:border-teal-500 focus:outline-none focus:ring focus:ring-teal-500/10 bg-white text-left flex items-center justify-between"
                        >
                            <span>
                                {organizationSizes.find(size => size.value === formData.organizationSize)?.label}
                            </span>
                            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isSizeDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {isSizeDropdownOpen && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-10">
                                {organizationSizes.map((size) => (
                                    <button
                                        key={size.value}
                                        type="button"
                                        onClick={() => {
                                            handleInputChange('organizationSize', size.value);
                                            setIsSizeDropdownOpen(false);
                                        }}
                                        className={`w-full px-4 py-2.5 text-left hover:bg-slate-50 transition-colors duration-200 first:rounded-t-lg last:rounded-b-lg ${formData.organizationSize === size.value ? 'bg-teal-50 text-teal-900 font-medium' : 'text-slate-900'
                                            }`}
                                    >
                                        {size.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );

    // Step 4: Password & Terms
    const renderPasswordTermsStep = () => (
        <div className="space-y-6">
            <div className="text-center">
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Security & Terms</h2>
                <p className="text-slate-600">Create your password and agree to our terms</p>
            </div>

            <div className="space-y-4">
                <div>
                    <label htmlFor="password" className="text-sm font-medium text-slate-700 block mb-2">
                        Password
                    </label>
                    <div className="relative">
                        <input
                            type={showPassword ? "text" : "password"}
                            id="password"
                            value={formData.password}
                            onChange={(e) => handleInputChange('password', e.target.value)}
                            className={`w-full px-4 py-3 pr-12 border ${errors.password ? 'border-red-500' : 'border-slate-200'} rounded-lg text-slate-900 placeholder-slate-400 transition-all duration-200 focus:border-teal-500 focus:outline-none focus:ring focus:ring-teal-500/10`}
                            placeholder="At least 8 characters"
                            required
                            minLength={8}
                        />
                        <button
                            type="button"
                            className="absolute inset-y-0 right-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                    {errors.password && (
                        <p className="text-sm text-red-500 mt-1">{errors.password}</p>
                    )}
                </div>

                <div className="flex items-start gap-3">
                    <input
                        type="checkbox"
                        id="agreeToTerms"
                        checked={formData.agreeToTerms}
                        onChange={(e) => handleInputChange('agreeToTerms', e.target.checked)}
                        className="mt-1 h-4 w-4 text-teal-600 border-slate-300 rounded focus:ring-teal-500"
                        required
                    />
                    <label htmlFor="agreeToTerms" className="text-sm text-slate-600 cursor-pointer">
                        I agree to the{' '}
                        <a href="/terms" className="text-teal-600 hover:text-teal-700 font-medium">
                            Terms of Service
                        </a>{' '}
                        and{' '}
                        <a href="/privacy" className="text-teal-600 hover:text-teal-700 font-medium">
                            Privacy Policy
                        </a>
                    </label>
                </div>
                {errors.agreeToTerms && (
                    <p className="text-sm text-red-500">{errors.agreeToTerms}</p>
                )}

                {errors.submit && (
                    <div className="p-4 border border-red-200 rounded-lg bg-red-50">
                        <p className="text-sm text-red-700">{errors.submit}</p>
                    </div>
                )}
            </div>
        </div>
    );

    const renderCurrentStep = () => {
        switch (currentStep) {
            case 1:
                return renderAccountTypeStep();
            case 2:
                return renderBasicInfoStep();
            case 3:
                return renderOrganizationInfoStep();
            case 4:
                return renderPasswordTermsStep();
            default:
                return renderAccountTypeStep();
        }
    };

    const isCurrentStepSubmit = () => {
        if (currentStep === 3 && formData.accountType === 'organization') {
            return true; // Organization setup step
        }
        return currentStep === (formData.accountType === 'individual' ? 4 : 4); // Final step
    };

    const getButtonText = () => {
        if (isCurrentStepSubmit()) {
            if (currentStep === 3 && formData.accountType === 'organization') {
                return 'Continue';
            }
            return 'Sign Up';
        }
        return 'Continue';
    };

    return (
        <div className="w-full max-w-md mx-auto">
            {/* Header with Back Button */}
            <div className="relative mb-6">
                {currentStep > 1 && (
                    <button
                        type="button"
                        onClick={prevStep}
                        disabled={loading || googleLoading || stepLoading}
                        className="absolute left-0 top-0 p-2 bg-white border border-slate-200 rounded-lg shadow-md hover:shadow-lg hover:bg-slate-50 text-slate-600 hover:text-slate-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <ArrowLeft size={18} />
                    </button>
                )}
            </div>

            {/* Current Step Content */}
            {renderCurrentStep()}

            {/* Main Action Button */}
            <div className="mt-8">
                <div className="relative flex justify-center">
                    <button
                        type="button"
                        onClick={isCurrentStepSubmit() ? handleSubmit : nextStep}
                        disabled={loading || googleLoading || stepLoading || Object.values(errors).some(error => error)}
                        className={`
                            transition-all duration-300 ease-in-out
                            ${stepLoading 
                                ? 'w-12 h-12 rounded-full bg-[#00897B] shadow-md flex items-center justify-center' 
                                : 'w-full bg-[#00897B] hover:bg-[#00796B] text-white font-medium rounded-lg px-6 py-3 shadow-md hover:-translate-y-0.5'
                            }
                            disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                        `}
                    >
                        {stepLoading ? (
                            <div className="w-6 h-6 relative">
                                <div className="absolute inset-0 rounded-full border-2 border-white/20"></div>
                                <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-white animate-spin"></div>
                            </div>
                        ) : (
                            getButtonText()
                        )}
                    </button>
                </div>
            </div>

            {/* Step Progress Indicators */}
            <div className="flex items-center justify-center mt-6 space-x-2">
                {Array.from({ length: getStepCount() }, (_, i) => i + 1).map((step) => {
                    const isActive = getCurrentStepForDisplay() === step;
                    const isCompleted = getCurrentStepForDisplay() > step;
                    
                    return (
                        <div
                            key={step}
                            className={`w-2 h-2 rounded-full transition-all duration-200 ${
                                isActive
                                    ? 'bg-teal-600 scale-125'
                                    : isCompleted
                                    ? 'bg-teal-400'
                                    : 'bg-slate-300'
                            }`}
                        />
                    );
                })}
            </div>

            {/* Sign In Link */}
            <p className="text-center text-slate-600 mt-6 text-sm">
                Already have an account?{' '}
                <button
                    type="button"
                    onClick={onSwitchToLogin}
                    className="text-teal-600 font-medium hover:text-teal-700 hover:underline transition-colors"
                >
                    Sign In
                </button>
            </p>

            {/* Dropdown overlay */}
            {(isIndustryDropdownOpen || isSizeDropdownOpen) && (
                <div
                    className="fixed inset-0 z-0"
                    onClick={() => {
                        setIsIndustryDropdownOpen(false);
                        setIsSizeDropdownOpen(false);
                    }}
                />
            )}
        </div>
    );
};

export default MultiStepRegistrationForm;