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
            
            let accountType = formData.accountType;
            if (!accountType) {
                accountType = isCustomDomain(googleUserData.email) ? 'organization' : 'individual';
            }

            let result;
            if (accountType === 'individual') {
                result = await startIndividualRegistration({
                    email: googleUserData.email,
                    name: googleUserData.name,
                    googleCredential: credential
                });

                if (result.success) {
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
                    setCurrentStep(3);
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

        if (errors[field]) {
            setErrors(prev => ({
                ...prev,
                [field]: ''
            }));
        }

        if (error) {
            clearError();
        }

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
            case 1:
                if (!formData.accountType) {
                    newErrors.accountType = 'Please select an account type';
                }
                break;

            case 2:
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

            case 3:
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

            case 4:
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
            if (currentStep === 2 && !registrationState) {
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
                result = await createOrganization(registrationState.userId, {
                    name: formData.organizationName,
                    industry: formData.organizationIndustry,
                    size: formData.organizationSize
                });

                if (result.success) {
                    setRegistrationState(result.registrationState);
                    toast.success(result.message);
                    
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
                const successMessage = result.data?.message || 'Registration successful! Please check your email for a confirmation link to verify your account.';
                toast.success(successMessage);
                onSuccess(result);
            } else {
                const errorMsg = result?.error?.message || result?.error || 'Registration failed';
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

    const renderAccountTypeStep = () => (
        <div className="space-y-4 sm:space-y-6">
            <div className="text-center px-2">
                <GoogleSSO
                    loading={googleLoading}
                    onGoogleAuth={handleGoogleAuth}
                />

                <div className="flex items-center my-4 sm:my-6">
                    <div className="flex-grow border-t border-border"></div>
                    <span className="px-3 sm:px-4 text-xs sm:text-sm text-muted-foreground font-medium bg-background">or</span>
                    <div className="flex-grow border-t border-border"></div>
                </div>
                <p className="text-sm sm:text-base text-muted-foreground">Select the option that best fits your testing needs</p>
            </div>

            <div className="space-y-3 sm:space-y-4">
                {accountTypes.map((type) => (
                    <div
                        key={type.value}
                        onClick={() => handleAccountTypeChange(type.value)}
                        className={`relative p-4 sm:p-6 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                            formData.accountType === type.value
                                ? 'border-primary bg-teal-50'
                                : 'border-border hover:border-muted-foreground hover:shadow-theme-md'
                        }`}
                    >
                        <div className="flex items-start gap-3 sm:gap-4">
                            <div className="p-2 sm:p-3 rounded bg-muted flex-shrink-0">
                                <type.icon className="w-5 h-5 sm:w-6 sm:h-6 text-muted-foreground" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-base sm:text-lg font-semibold text-foreground mb-0.5 sm:mb-1">{type.label}</h3>
                                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{type.description}</p>
                            </div>
                            <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 ${
                                formData.accountType === type.value
                                    ? 'border-primary bg-primary'
                                    : 'border-border'
                            }`}>
                                {formData.accountType === type.value && (
                                    <CheckCircle className="w-5 h-5 text-primary-foreground -m-0.5" />
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {errors.accountType && (
                <p className="text-xs sm:text-sm text-error text-center px-2">{errors.accountType}</p>
            )}
        </div>
    );

    const renderBasicInfoStep = () => (
        <div className="space-y-4 sm:space-y-6">
            <div className="text-center px-2">
                <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-1 sm:mb-2">Basic Information</h2>
                <p className="text-sm sm:text-base text-muted-foreground">Tell us a bit about yourself</p>
            </div>

            <div className="space-y-3 sm:space-y-4">
                <div>
                    <label htmlFor="email" className="text-xs sm:text-sm font-medium text-foreground block mb-1.5 sm:mb-2 px-1">
                        Email Address
                    </label>
                    <input
                        type="email"
                        id="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 border ${errors.email || emailError ? 'border-error' : 'border-input'} rounded bg-background text-foreground placeholder-muted-foreground transition-all duration-200 focus:border-primary focus:outline-none focus:ring focus:ring-ring/10 text-sm sm:text-base`}
                        placeholder={formData.accountType === 'organization' ? "name@yourcompany.com" : "name@example.com"}
                        required
                    />
                    {(errors.email || emailError) && (
                        <p className="text-xs sm:text-sm text-error mt-1 px-1">{errors.email || emailError}</p>
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
                    <label htmlFor="displayName" className="text-xs sm:text-sm font-medium text-foreground block mb-1.5 sm:mb-2 px-1">
                        Full Name
                    </label>
                    <input
                        type="text"
                        id="displayName"
                        value={formData.displayName}
                        onChange={(e) => handleInputChange('displayName', e.target.value)}
                        className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 border ${errors.displayName ? 'border-error' : 'border-input'} rounded bg-background text-foreground placeholder-muted-foreground transition-all duration-200 focus:border-primary focus:outline-none focus:ring focus:ring-ring/10 text-sm sm:text-base`}
                        placeholder="Enter your full name"
                        required
                    />
                    {errors.displayName && (
                        <p className="text-xs sm:text-sm text-error mt-1 px-1">{errors.displayName}</p>
                    )}
                </div>
            </div>
        </div>
    );

    const renderOrganizationInfoStep = () => (
        <div className="space-y-4 sm:space-y-6">
            <div className="text-center px-2">
                <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-1 sm:mb-2">Organization Details</h2>
                <p className="text-sm sm:text-base text-muted-foreground">Help us set up your organization</p>
            </div>

            <div className="space-y-3 sm:space-y-4">
                <div>
                    <label htmlFor="organizationName" className="text-xs sm:text-sm font-medium text-foreground block mb-1.5 sm:mb-2 px-1">
                        Organization Name <span className="text-error">*</span>
                    </label>
                    <input
                        type="text"
                        id="organizationName"
                        value={formData.organizationName}
                        onChange={(e) => handleInputChange('organizationName', e.target.value)}
                        className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 border ${errors.organizationName ? 'border-error' : 'border-input'} rounded bg-background text-foreground placeholder-muted-foreground transition-all duration-200 focus:border-primary focus:outline-none focus:ring focus:ring-ring/10 text-sm sm:text-base`}
                        placeholder="Enter your organization name"
                        required
                    />
                    {errors.organizationName && (
                        <p className="text-xs sm:text-sm text-error mt-1 px-1">{errors.organizationName}</p>
                    )}
                </div>

                <div>
                    <label className="text-xs sm:text-sm font-medium text-foreground block mb-1.5 sm:mb-2 px-1">
                        Industry <span className="text-error">*</span>
                    </label>
                    <div className="relative">
                        <button
                            type="button"
                            onClick={() => setIsIndustryDropdownOpen(!isIndustryDropdownOpen)}
                            className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 border ${errors.organizationIndustry ? 'border-error' : 'border-input'} rounded text-foreground transition-all duration-200 focus:border-primary focus:outline-none focus:ring focus:ring-ring/10 bg-background text-left flex items-center justify-between text-sm sm:text-base`}
                        >
                            <span className={formData.organizationIndustry ? 'text-foreground' : 'text-muted-foreground'}>
                                {industries.find(ind => ind.value === formData.organizationIndustry)?.label || 'Select your industry'}
                            </span>
                            <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 flex-shrink-0 ml-2 ${isIndustryDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {isIndustryDropdownOpen && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded shadow-theme-lg z-10 max-h-48 sm:max-h-60 overflow-y-auto">
                                {industries.map((industry) => (
                                    <button
                                        key={industry.value}
                                        type="button"
                                        onClick={() => {
                                            handleInputChange('organizationIndustry', industry.value);
                                            setIsIndustryDropdownOpen(false);
                                        }}
                                        className={`w-full px-3 sm:px-4 py-2 sm:py-2.5 text-left hover:bg-muted transition-colors duration-200 first:rounded-t-lg last:rounded-b-lg text-sm sm:text-base ${
                                            formData.organizationIndustry === industry.value ? 'bg-teal-50 text-teal-800 font-medium' : 'text-card-foreground'
                                        }`}
                                    >
                                        {industry.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    {errors.organizationIndustry && (
                        <p className="text-xs sm:text-sm text-error mt-1 px-1">{errors.organizationIndustry}</p>
                    )}
                </div>

                <div>
                    <label className="text-xs sm:text-sm font-medium text-foreground block mb-1.5 sm:mb-2 px-1">
                        Organization Size
                    </label>
                    <div className="relative">
                        <button
                            type="button"
                            onClick={() => setIsSizeDropdownOpen(!isSizeDropdownOpen)}
                            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-input rounded text-foreground transition-all duration-200 focus:border-primary focus:outline-none focus:ring focus:ring-ring/10 bg-background text-left flex items-center justify-between text-sm sm:text-base"
                        >
                            <span>
                                {organizationSizes.find(size => size.value === formData.organizationSize)?.label}
                            </span>
                            <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 flex-shrink-0 ml-2 ${isSizeDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {isSizeDropdownOpen && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded shadow-theme-lg z-10">
                                {organizationSizes.map((size) => (
                                    <button
                                        key={size.value}
                                        type="button"
                                        onClick={() => {
                                            handleInputChange('organizationSize', size.value);
                                            setIsSizeDropdownOpen(false);
                                        }}
                                        className={`w-full px-3 sm:px-4 py-2 sm:py-2.5 text-left hover:bg-muted transition-colors duration-200 first:rounded-t-lg last:rounded-b-lg text-sm sm:text-base ${
                                            formData.organizationSize === size.value ? 'bg-teal-50 text-teal-800 font-medium' : 'text-card-foreground'
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

    const renderPasswordTermsStep = () => (
        <div className="space-y-4 sm:space-y-6">
            <div className="text-center px-2">
                <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-1 sm:mb-2">Security & Terms</h2>
                <p className="text-sm sm:text-base text-muted-foreground">Create your password and agree to our terms</p>
            </div>

            <div className="space-y-3 sm:space-y-4">
                <div>
                    <label htmlFor="password" className="text-xs sm:text-sm font-medium text-foreground block mb-1.5 sm:mb-2 px-1">
                        Password
                    </label>
                    <div className="relative">
                        <input
                            type={showPassword ? "text" : "password"}
                            id="password"
                            value={formData.password}
                            onChange={(e) => handleInputChange('password', e.target.value)}
                            className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 pr-10 sm:pr-12 border ${errors.password ? 'border-red-500' : 'border-slate-200'} rounded text-slate-900 placeholder-slate-400 transition-all duration-200 focus:border-teal-500 focus:outline-none focus:ring focus:ring-teal-500/10 text-sm sm:text-base`}
                            placeholder="At least 8 characters"
                            required
                            minLength={8}
                        />
                        <button
                            type="button"
                            className="absolute inset-y-0 right-3 sm:right-4 flex items-center text-muted-foreground hover:text-foreground transition-colors"
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            {showPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
                        </button>
                    </div>
                    {errors.password && (
                        <p className="text-xs sm:text-sm text-error mt-1 px-1">{errors.password}</p>
                    )}
                </div>

                <div className="flex items-start gap-2 sm:gap-3 px-1">
                    <input
                        type="checkbox"
                        id="agreeToTerms"
                        checked={formData.agreeToTerms}
                        onChange={(e) => handleInputChange('agreeToTerms', e.target.checked)}
                        className="mt-0.5 sm:mt-1 h-4 w-4 text-primary border-border rounded focus:ring-primary flex-shrink-0"
                        required
                    />
                    <label htmlFor="agreeToTerms" className="text-xs sm:text-sm text-muted-foreground cursor-pointer leading-relaxed">
                        I agree to the{' '}
                        <a href="/terms" className="text-primary hover:text-teal-600 font-medium">
                            Terms of Service
                        </a>{' '}
                        and{' '}
                        <a href="/privacy" className="text-primary hover:text-teal-600 font-medium">
                            Privacy Policy
                        </a>
                    </label>
                </div>
                {errors.agreeToTerms && (
                    <p className="text-xs sm:text-sm text-error px-1">{errors.agreeToTerms}</p>
                )}

                {errors.submit && (
                    <div className="p-3 sm:p-4 border border-red-200 rounded bg-red-50">
                        <p className="text-xs sm:text-sm text-red-700">{errors.submit}</p>
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
            return true;
        }
        return currentStep === (formData.accountType === 'individual' ? 4 : 4);
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
        <div className="w-full max-w-md mx-auto px-4 sm:px-6 py-4 sm:py-6">
            {/* Header with Back Button */}
            <div className="relative mb-4 sm:mb-6">
                {currentStep > 1 && (
                    <button
                        type="button"
                        onClick={prevStep}
                        disabled={loading || googleLoading || stepLoading}
                        className="absolute left-0 top-0 p-2 sm:p-2.5 bg-white border border-slate-200 rounded shadow-md hover:shadow-lg hover:bg-slate-50 text-slate-600 hover:text-slate-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                )}
            </div>

            {/* Current Step Content */}
            {renderCurrentStep()}

            {/* Main Action Button */}
            <div className="mt-6 sm:mt-8">
                <div className="relative flex justify-center">
                    <button
                        type="button"
                        onClick={isCurrentStepSubmit() ? handleSubmit : nextStep}
                        disabled={loading || googleLoading || stepLoading || Object.values(errors).some(error => error)}
                        className={`
                            transition-all duration-300 ease-in-out
                            ${stepLoading 
                                ? 'w-12 h-12 rounded-full bg-[#00897B] shadow-md flex items-center justify-center' 
                                : 'w-full bg-[#00897B] hover:bg-[#00796B] text-white font-medium rounded px-4 sm:px-6 py-2.5 sm:py-3 shadow-md hover:-translate-y-0.5 text-sm sm:text-base'
                            }
                            disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                        `}
                    >
                        {stepLoading ? (
                            <div className="w-5 h-5 sm:w-6 sm:h-6 relative">
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
            <div className="flex items-center justify-center mt-4 sm:mt-6 space-x-1.5 sm:space-x-2">
                {Array.from({ length: getStepCount() }, (_, i) => i + 1).map((step) => {
                    const isActive = getCurrentStepForDisplay() === step;
                    const isCompleted = getCurrentStepForDisplay() > step;

                    return (
                        <div
                            key={step}
                            className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-all duration-200 ${
                                isActive
                                    ? 'bg-primary scale-125'
                                    : isCompleted
                                        ? 'bg-teal-300'
                                        : 'bg-border'
                            }`}
                        />
                    );
                })}
            </div>

            {/* Sign In Link */}
            <p className="text-center text-slate-600 mt-4 sm:mt-6 text-xs sm:text-sm px-2">
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