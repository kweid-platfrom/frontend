import React, { useState, useEffect } from 'react';
import { 
    X, 
    User, 
    Building2, 
    Mail, 
    Lock, 
    Eye, 
    EyeOff, 
    Loader2, 
    ArrowLeft,
    Check,
    AlertCircle,
    Chrome
} from 'lucide-react';

const AddAccountModal = ({ 
    isOpen, 
    onClose, 
    currentUser, 
    currentAccountType,
    onAccountAdded 
}) => {
    const [step, setStep] = useState('select-type'); // 'select-type', 'register', 'login', 'org-info', 'success'
    const [accountType, setAccountType] = useState('individual');
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        firstName: '',
        lastName: '',
        organizationName: '',
        organizationCode: '',
        organizationSize: 'small'
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [mode, setMode] = useState('register'); // 'register' or 'login'

    const organizationSizes = [
        { value: 'small', label: '1-10 employees', icon: '👥' },
        { value: 'medium', label: '11-50 employees', icon: '🏢' },
        { value: 'large', label: '51-200 employees', icon: '🏬' },
        { value: 'enterprise', label: '200+ employees', icon: '🏭' }
    ];

    // Reset form when modal opens/closes
    useEffect(() => {
        if (isOpen) {
            setStep('select-type');
            setAccountType('individual');
            setFormData({
                email: '',
                password: '',
                confirmPassword: '',
                firstName: '',
                lastName: '',
                organizationName: '',
                organizationCode: '',
                organizationSize: 'small'
            });
            setError('');
            setMode('register');
            // Prevent body scroll when modal is open
            document.body.style.overflow = 'hidden';
        } else {
            // Restore body scroll when modal is closed
            document.body.style.overflow = 'unset';
        }

        // Cleanup function to restore scroll on unmount
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (error) setError(''); // Clear error when user starts typing
    };

    const validateForm = () => {
        const { email, password, confirmPassword, firstName, lastName, organizationName } = formData;
        
        if (!email.trim() || !email.includes('@')) {
            setError('Please enter a valid email address');
            return false;
        }
        
        if (mode === 'register') {
            if (!password || password.length < 6) {
                setError('Password must be at least 6 characters long');
                return false;
            }
            
            if (password !== confirmPassword) {
                setError('Passwords do not match');
                return false;
            }
            
            if (!firstName.trim() || !lastName.trim()) {
                setError('Please enter your first and last name');
                return false;
            }
            
            if (accountType === 'organization' && !organizationName.trim()) {
                setError('Please enter your organization name');
                return false;
            }
        } else {
            if (!password) {
                setError('Please enter your password');
                return false;
            }
        }
        
        return true;
    };

    const handleAccountTypeSelect = (type) => {
        setAccountType(type);
        setStep('register');
    };

    const handleModeSwitch = (newMode) => {
        setMode(newMode);
        setError('');
        setFormData(prev => ({ 
            ...prev, 
            password: '', 
            confirmPassword: '' 
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) return;
        
        setLoading(true);
        setError('');
        
        try {
            // Simulate API call - replace with your actual authentication logic
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            if (mode === 'register' && accountType === 'organization') {
                // Move to organization info step for registration
                setStep('org-info');
            } else {
                // Complete the process
                setStep('success');
                setTimeout(() => {
                    handleSuccess();
                }, 2000);
            }
        } catch (err) {
            setError(err.message || 'An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleOrgInfoSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.organizationName.trim()) {
            setError('Organization name is required');
            return;
        }
        
        setLoading(true);
        setError('');
        
        try {
            // Simulate organization creation - replace with your actual logic
            await new Promise(resolve => setTimeout(resolve, 2000));
            setStep('success');
            setTimeout(() => {
                handleSuccess();
            }, 2000);
        } catch (err) {
            setError(err.message || 'Failed to create organization. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleAuth = async () => {
        setLoading(true);
        setError('');
        
        try {
            // Simulate Google auth - replace with your actual Google auth logic
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            if (accountType === 'organization') {
                setStep('org-info');
            } else {
                setStep('success');
                setTimeout(() => {
                    handleSuccess();
                }, 2000);
            }
        } catch (err) {
            setError(err.message || 'Google authentication failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleSuccess = () => {
        const newAccountData = {
            type: accountType,
            email: formData.email,
            name: accountType === 'individual' 
                ? `${formData.firstName} ${formData.lastName}`
                : formData.organizationName,
            organizationName: accountType === 'organization' ? formData.organizationName : null,
            organizationSize: accountType === 'organization' ? formData.organizationSize : null,
        };
        
        onAccountAdded?.(newAccountData);
        onClose();
    };

    const handleBack = () => {
        if (step === 'register' || step === 'login') {
            setStep('select-type');
        } else if (step === 'org-info') {
            setStep('register');
        }
    };

    // Close modal when clicking on backdrop
    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget && !loading) {
            onClose();
        }
    };

    // Handle escape key
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && !loading) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
        };
    }, [isOpen, loading, onClose]);

    if (!isOpen) return null;

    const renderAccountTypeSelection = () => (
        <div className="p-6">
            <div className="text-center mb-6">
                <h2 className="text-xl font-semibold text-foreground mb-2">
                    Add New Account
                </h2>
                <p className="text-sm text-muted-foreground">
                    Currently signed in as: <span className="font-medium">{currentUser?.email}</span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                    Account type: {currentAccountType === 'individual' ? 'Personal' : 'Organization'}
                </p>
            </div>

            <div className="space-y-3">
                <button
                    onClick={() => handleAccountTypeSelect('individual')}
                    className="w-full p-4 border-2 border-border rounded-lg hover:border-teal-300 hover:bg-teal-50 dark:hover:bg-teal-950 transition-all duration-200 text-left group"
                >
                    <div className="flex items-center">
                        <div className="w-10 h-10 bg-teal-100 dark:bg-teal-900 rounded-lg flex items-center justify-center mr-3 group-hover:bg-teal-200 dark:group-hover:bg-teal-800 transition-colors">
                            <User className="w-5 h-5 text-teal-600" />
                        </div>
                        <div>
                            <div className="font-medium text-foreground">Personal Account</div>
                            <div className="text-sm text-muted-foreground">For individual use and personal projects</div>
                        </div>
                    </div>
                </button>

                <button
                    onClick={() => handleAccountTypeSelect('organization')}
                    className="w-full p-4 border-2 border-border rounded-lg hover:border-teal-300 hover:bg-teal-50 dark:hover:bg-teal-950 transition-all duration-200 text-left group"
                >
                    <div className="flex items-center">
                        <div className="w-10 h-10 bg-teal-100 dark:bg-teal-900 rounded-lg flex items-center justify-center mr-3 group-hover:bg-teal-200 dark:group-hover:bg-teal-800 transition-colors">
                            <Building2 className="w-5 h-5 text-teal-600" />
                        </div>
                        <div>
                            <div className="font-medium text-foreground">Organization Account</div>
                            <div className="text-sm text-muted-foreground">For teams and collaborative work</div>
                        </div>
                    </div>
                </button>
            </div>

            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-start">
                    <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
                    <div className="text-xs text-blue-800 dark:text-blue-200">
                        <p className="font-medium mb-1">Multi-Account Benefits:</p>
                        <ul className="space-y-1 text-blue-700 dark:text-blue-300">
                            <li>• Switch between accounts without logging out</li>
                            <li>• Separate personal and work contexts</li>
                            <li>• Access different organization resources</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderAuthForm = () => (
        <div className="p-6">
            <div className="flex items-center mb-6">
                <button
                    onClick={handleBack}
                    className="mr-3 p-1 hover:bg-secondary rounded-full transition-colors"
                    disabled={loading}
                >
                    <ArrowLeft className="w-4 h-4 text-muted-foreground" />
                </button>
                <div>
                    <h2 className="text-xl font-semibold text-foreground">
                        {mode === 'register' ? 'Create' : 'Sign in to'} {accountType === 'individual' ? 'Personal' : 'Organization'} Account
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        {mode === 'register' 
                            ? `Add a new ${accountType} account to your profile`
                            : `Sign in to an existing ${accountType} account`
                        }
                    </p>
                </div>
            </div>

            {/* Mode Toggle */}
            <div className="flex mb-6 bg-secondary rounded-lg p-1">
                <button
                    onClick={() => handleModeSwitch('register')}
                    disabled={loading}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                        mode === 'register'
                            ? 'bg-background text-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                    }`}
                >
                    Create New
                </button>
                <button
                    onClick={() => handleModeSwitch('login')}
                    disabled={loading}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                        mode === 'login'
                            ? 'bg-background text-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                    }`}
                >
                    Sign In
                </button>
            </div>

            {error && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg flex items-center">
                    <AlertCircle className="w-4 h-4 text-red-600 mr-2 flex-shrink-0" />
                    <span className="text-sm text-red-800 dark:text-red-200">{error}</span>
                </div>
            )}

            <div className="space-y-4">
                {/* Google Auth Button */}
                <button
                    type="button"
                    onClick={handleGoogleAuth}
                    disabled={loading}
                    className="w-full flex items-center justify-center px-4 py-2.5 border border-border rounded-lg hover:bg-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Chrome className="w-4 h-4 mr-2" />
                    <span className="text-sm font-medium text-foreground">
                        {mode === 'register' ? 'Create with Google' : 'Sign in with Google'}
                    </span>
                </button>

                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-background text-muted-foreground">Or continue with email</span>
                    </div>
                </div>

                {/* Name Fields (Register only) */}
                {mode === 'register' && (
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1">
                                First Name
                            </label>
                            <input
                                type="text"
                                value={formData.firstName}
                                onChange={(e) => handleInputChange('firstName', e.target.value)}
                                className="w-full px-3 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors bg-background text-foreground"
                                placeholder="John"
                                disabled={loading}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1">
                                Last Name
                            </label>
                            <input
                                type="text"
                                value={formData.lastName}
                                onChange={(e) => handleInputChange('lastName', e.target.value)}
                                className="w-full px-3 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors bg-background text-foreground"
                                placeholder="Doe"
                                disabled={loading}
                            />
                        </div>
                    </div>
                )}

                {/* Email */}
                <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                        Email Address
                    </label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => handleInputChange('email', e.target.value)}
                            className="w-full pl-10 pr-3 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors bg-background text-foreground"
                            placeholder="your@email.com"
                            disabled={loading}
                        />
                    </div>
                </div>

                {/* Password */}
                <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                        Password
                    </label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            type={showPassword ? 'text' : 'password'}
                            value={formData.password}
                            onChange={(e) => handleInputChange('password', e.target.value)}
                            className="w-full pl-10 pr-10 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors bg-background text-foreground"
                            placeholder={mode === 'register' ? 'Create password' : 'Enter password'}
                            disabled={loading}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            disabled={loading}
                        >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                    </div>
                </div>

                {/* Confirm Password (Register only) */}
                {mode === 'register' && (
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1">
                            Confirm Password
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                                type={showConfirmPassword ? 'text' : 'password'}
                                value={formData.confirmPassword}
                                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                                className="w-full pl-10 pr-10 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors bg-background text-foreground"
                                placeholder="Confirm password"
                                disabled={loading}
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                disabled={loading}
                            >
                                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>
                )}

                {/* Organization Code (Optional for org accounts) */}
                {accountType === 'organization' && (
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1">
                            Organization Code <span className="text-muted-foreground">(Optional)</span>
                        </label>
                        <input
                            type="text"
                            value={formData.organizationCode}
                            onChange={(e) => handleInputChange('organizationCode', e.target.value)}
                            className="w-full px-3 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors bg-background text-foreground"
                            placeholder="Enter organization invite code"
                            disabled={loading}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                            If you have an invite code, enter it to join an existing organization
                        </p>
                    </div>
                )}

                <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={loading}
                    className="w-full bg-teal-600 hover:bg-teal-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                    {loading ? (
                        <>
                            <Loader2 className="animate-spin w-4 h-4 mr-2" />
                            {mode === 'register' 
                                ? (accountType === 'organization' ? 'Creating Account...' : 'Creating Account...')
                                : 'Signing In...'
                            }
                        </>
                    ) : (
                        mode === 'register' ? 'Create Account' : 'Sign In'
                    )}
                </button>
            </div>
        </div>
    );

    const renderOrgInfo = () => (
        <div className="p-6">
            <div className="flex items-center mb-6">
                <button
                    onClick={handleBack}
                    className="mr-3 p-1 hover:bg-secondary rounded-full transition-colors"
                    disabled={loading}
                >
                    <ArrowLeft className="w-4 h-4 text-muted-foreground" />
                </button>
                <div>
                    <h2 className="text-xl font-semibold text-foreground">
                        Organization Details
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        Complete your organization setup
                    </p>
                </div>
            </div>

            {error && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg flex items-center">
                    <AlertCircle className="w-4 h-4 text-red-600 mr-2 flex-shrink-0" />
                    <span className="text-sm text-red-800 dark:text-red-200">{error}</span>
                </div>
            )}

            <div className="space-y-4">
                {/* Organization Name */}
                <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                        Organization Name *
                    </label>
                    <input
                        type="text"
                        value={formData.organizationName}
                        onChange={(e) => handleInputChange('organizationName', e.target.value)}
                        className="w-full px-3 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors bg-background text-foreground"
                        placeholder="Your company name"
                        disabled={loading}
                    />
                </div>

                {/* Organization Size */}
                <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                        Organization Size
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                        {organizationSizes.map((size) => (
                            <button
                                key={size.value}
                                type="button"
                                onClick={() => handleInputChange('organizationSize', size.value)}
                                className={`p-3 border rounded-lg text-left transition-all ${
                                    formData.organizationSize === size.value
                                        ? 'border-teal-500 bg-teal-50 dark:bg-teal-950/50 text-teal-900 dark:text-teal-100'
                                        : 'border-border hover:border-muted-foreground text-foreground'
                                }`}
                                disabled={loading}
                            >
                                <div className="flex items-center gap-2">
                                    <span className="text-lg">{size.icon}</span>
                                    <div>
                                        <div className="font-medium text-sm">{size.label}</div>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                <button
                    type="button"
                    onClick={handleOrgInfoSubmit}
                    disabled={loading || !formData.organizationName.trim()}
                    className="w-full bg-teal-600 hover:bg-teal-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                    {loading ? (
                        <>
                            <Loader2 className="animate-spin w-4 h-4 mr-2" />
                            Creating Organization...
                        </>
                    ) : (
                        'Complete Setup'
                    )}
                </button>
            </div>
        </div>
    );

    const renderSuccess = () => (
        <div className="p-6 text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">
                Account Added Successfully!
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
                Your new {accountType} account has been created and linked to your profile.
            </p>
            <div className="bg-secondary rounded-lg p-3 mb-4">
                <div className="text-sm">
                    <div className="font-medium text-foreground">
                        {accountType === 'individual' 
                            ? `${formData.firstName} ${formData.lastName}`
                            : formData.organizationName
                        }
                    </div>
                    <div className="text-muted-foreground">{formData.email}</div>
                </div>
            </div>
            <p className="text-xs text-muted-foreground">
                You can now switch between your accounts from the account selector.
            </p>
        </div>
    );

    return (
        <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4"
            onClick={handleBackdropClick}
        >
            <div className="bg-background border border-border rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden animate-in fade-in-0 zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-border">
                    <div className="flex items-center">
                        {step !== 'select-type' && step !== 'success' && (
                            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                                <div className={`w-2 h-2 rounded-full ${
                                    step === 'select-type' ? 'bg-teal-500' : 'bg-teal-500'
                                }`} />
                                <div className={`w-2 h-2 rounded-full ${
                                    step === 'register' || step === 'login' ? 'bg-teal-500' : 'bg-muted'
                                }`} />
                                {accountType === 'organization' && (
                                    <div className={`w-2 h-2 rounded-full ${
                                        step === 'org-info' ? 'bg-teal-500' : 'bg-muted'
                                    }`} />
                                )}
                                <div className={`w-2 h-2 rounded-full ${
                                    step === 'success' ? 'bg-teal-500' : 'bg-muted'
                                }`} />
                            </div>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-secondary rounded-full transition-colors"
                        disabled={loading}
                    >
                        <X className="w-5 h-5 text-muted-foreground" />
                    </button>
                </div>

                {/* Content */}
                <div className="overflow-y-auto max-h-[calc(90vh-4rem)]">
                    {step === 'select-type' && renderAccountTypeSelection()}
                    {(step === 'register' || step === 'login') && renderAuthForm()}
                    {step === 'org-info' && renderOrgInfo()}
                    {step === 'success' && renderSuccess()}
                </div>
            </div>
        </div>
    );
}

export default AddAccountModal;