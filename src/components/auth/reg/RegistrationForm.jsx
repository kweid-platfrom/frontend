import { Loader2 } from "lucide-react";
import Link from "next/link";
import FormInput from "./FormInput";
import UserTypeSelector from "./UserTypeSelector";
import TermsCheckbox from "./TermsCheckbox";

const RegistrationForm = ({ 
    formData, 
    errors, 
    loading, 
    onInputChange, 
    onSubmit 
}) => {
    return (
        <form onSubmit={onSubmit} className="space-y-5">
            {/* Name Fields Row */}
            <div className="grid grid-cols-2 gap-4">
                <FormInput
                    // label="First name"
                    type="text"
                    placeholder="Firstname  "
                    value={formData.firstName}
                    error={errors.firstName}
                    onChange={(value) => onInputChange('firstName', value)}
                />
                <FormInput
                    // label="Last name"
                    type="text"
                    placeholder="Lastname"
                    value={formData.lastName}
                    error={errors.lastName}
                    onChange={(value) => onInputChange('lastName', value)}
                />
            </div>

            {/* User Type Selector */}
            <UserTypeSelector
                value={formData.userType}
                onChange={(value) => onInputChange('userType', value)}
            />

            {/* Email Input */}
            <FormInput
                // label={formData.userType === "organization" ? "Company Email" : "Email"}
                type="email"
                placeholder={formData.userType === "organization" ? "name@yourcompany.com" : "name@example.com"}
                value={formData.email}
                error={errors.email}
                onChange={(value) => onInputChange('email', value)}
                helperText={formData.userType === "organization" ? "Must use your company's custom domain" : ""}
            />

            {/* Password Fields */}
            <FormInput
                // label="Password"
                type="password"
                placeholder="Enter your password"
                value={formData.password}
                error={errors.password}
                onChange={(value) => onInputChange('password', value)}
                helperText="Must be at least 8 characters"
            />

            <FormInput
                // label="Confirm password"
                type="password"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                error={errors.confirmPassword}
                onChange={(value) => onInputChange('confirmPassword', value)}
            />

            {/* Terms Checkbox */}
            <TermsCheckbox
                checked={formData.termsAccepted}
                error={errors.termsAccepted}
                onChange={(checked) => onInputChange('termsAccepted', checked)}
            />

            {/* Submit Button */}
            <button
                type="submit"
                className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded px-4 py-2 transition-all duration-200 flex justify-center items-center gap-2 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                disabled={loading}
            >
                {loading ? (
                    <>
                        <Loader2 className="animate-spin h-5 w-5" />
                        <span>Creating account...</span>
                    </>
                ) : (
                    'Create Account'
                )}
            </button>

            {/* Login Link */}
            <p className="text-center text-slate-600 mt-6 text-sm">
                Already have an account?{" "}
                <Link href="/login" className="text-teal-600 font-semibold hover:text-teal-700 hover:underline transition-colors">
                    Sign in
                </Link>
            </p>
        </form>
    );
};

export default RegistrationForm;