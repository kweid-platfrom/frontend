import React, { useState } from 'react';
import { Eye, EyeOff, ArrowRight, ArrowLeft, User, Building, ChevronDown, CheckCircle, Loader2 } from 'lucide-react';
import { useRegistration } from '../hooks/useRegistration';
import { isCustomDomain, isCommonEmailProvider } from '../utils/domainValidation';
import { toast } from 'sonner';
import DomainSuggestion from './DomainSuggestion';
import GoogleSSO from './GoogleSSO';

const MultiStepRegistrationForm = ({ onSuccess, onSwitchToLogin }) => {
    const {
        loading,
        error,
        registerWithEmail,
        registerWithGoogle,
        clearError,
        validateRegistrationData,
    } = useRegistration();

    const [currentStep, setCurrentStep] = useState(1);

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
            
            // If user hasn't selected account type yet, we might need to prompt them
            // or automatically detect based on email domain
            let accountType = formData.accountType;
            
            if (!accountType) {
                // Auto-detect account type based on email domain
                accountType = isCustomDomain(googleUserData.email) ? 'organization' : 'individual';
            }

            const googleRegistrationData = {
                ...formData,
                email: googleUserData.email,
                displayName: googleUserData.name,
                accountType: accountType,
                googleId: googleUserData.googleId,
                picture: googleUserData.picture,
                emailVerified: googleUserData.emailVerified
            };

            const result = await registerWithGoogle(googleRegistrationData, credential);

            if (result.success) {
                toast.success(result.message || 'Account created successfully!');
                onSuccess(result);
            } else {
                toast.error(result.error || 'Google registration failed');
                setErrors({ submit: result.error || 'Google registration failed' });
            }
        } catch (error) {
            console.error('Google auth error:', error);
            toast.error(error.message || 'Google authentication failed. Please try again.');
            setErrors({ submit: error.message || 'Google authentication failed' });
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

        // Clear general error from useRegistration hook
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

                // Use emailError state as well for real-time validation
                if (emailError) {
                    newErrors.email = emailError;
                }

                if (!formData.displayName) {
                    newErrors.displayName = 'Full name is required';
                }
                break;

            case 3: // Organization Info (only for org accounts)
                if (formData.accountType === 'organization') {
                    if (!formData.organizationName) {
                        newErrors.organizationName = 'Organization name is required';
                    }
                    if (!formData.organizationIndustry) {
                        newErrors.organizationIndustry = 'Industry is required';
                    }
                }
                break;

            case 4: // Password & Terms
                if (!formData.password) {
                    newErrors.password = 'Password is required';
                } else if (formData.password.length < 6) {
                    newErrors.password = 'Password must be at least 6 characters';
                }

                if (!formData.agreeToTerms) {
                    newErrors.agreeToTerms = 'You must agree to the terms and conditions';
                }
                break;
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const nextStep = () => {
        if (validateStep(currentStep)) {
            // Skip organization step for individual accounts
            if (currentStep === 2 && formData.accountType === 'individual') {
                setCurrentStep(4);
            } else {
                setCurrentStep(currentStep + 1);
            }
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
        if (!validateStep(4)) return;

        console.log('📝 Form submission started with data:', formData);

        // Validate organization email requirement
        if (formData.accountType === 'organization' && isCommonEmailProvider(formData.email)) {
            toast.error('Organization accounts require a custom domain email');
            return;
        }

        // Validate organization fields
        if (formData.accountType === 'organization') {
            if (!formData.organizationName) {
                toast.error('Organization name is required');
                return;
            }
            if (!formData.organizationIndustry) {
                toast.error('Industry selection is required');
                return;
            }
        }

        // Final validation using the registration hook
        const validation = validateRegistrationData(formData);
        if (!validation.isValid) {
            const firstError = Object.values(validation.errors)[0];
            toast.error(firstError);
            return;
        }

        try {
            const result = await registerWithEmail(formData);

            console.log('📧 Registration result:', result);

            if (result.success) {
                toast.success(result.message);
                onSuccess(result);
            } else {
                toast.error(result.error || 'Registration failed');
                setErrors({ submit: result.error || 'Registration failed' });
            }
        } catch (error) {
            console.error('❌ Registration error:', error);
            toast.error(error.message || 'Registration failed. Please try again.');
            setErrors({ submit: error.message || 'Registration failed' });
        }
    };

    const getStepCount = () => {
        return formData.accountType === 'individual' ? 3 : 4; 
    };

    const getCurrentStepForDisplay = () => {
        if (formData.accountType === 'individual' && currentStep === 4) {
            return 3; // Display as step 3 for individuals
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
                            placeholder="At least 6 characters"
                            required
                            minLength={6}
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

                {formData.accountType === 'organization' && (
                    <div className="p-4 border border-teal-200 rounded-lg bg-teal-50/50">
                        <div className="flex items-start gap-3">
                            <Building className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
                            <div className="text-sm text-teal-800">
                                <p className="font-medium mb-1">Organization Account</p>
                                <p>Your organization will be set up after email verification and sign-in.</p>
                            </div>
                        </div>
                    </div>
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

    return (
        <div className="w-full max-w-md mx-auto">
            {/* Current Step Content */}
            {renderCurrentStep()}

            {/* Navigation Buttons */}
            <div className="flex gap-4 mt-8">
                {currentStep > 1 && (
                    <button
                        type="button"
                        onClick={prevStep}
                        disabled={loading || googleLoading}
                        className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg px-6 py-3 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <ArrowLeft size={18} />
                        Back
                    </button>
                )}

                {currentStep < (formData.accountType === 'individual' ? 4 : 4) ? (
                    <button
                        type="button"
                        onClick={nextStep}
                        disabled={loading || googleLoading}
                        className="flex-1 bg-[#00897B] hover:bg-[#00796B] text-white font-medium rounded-lg px-6 py-3 transition-all duration-200 flex items-center justify-center gap-2 shadow-md hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    >
                        Next
                        <ArrowRight size={18} />
                    </button>
                ) : (
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={loading || googleLoading || Object.values(errors).some(error => error)}
                        className="flex-1 bg-[#00897B] hover:bg-[#00796B] text-white font-medium rounded-lg px-6 py-3 transition-all duration-200 flex items-center justify-center gap-2 shadow-md hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="animate-spin h-5 w-5" />
                                Creating Account...
                            </>
                        ) : (
                            'Create Account'
                        )}
                    </button>
                )}
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