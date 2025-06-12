import { Mail, ArrowRight } from "lucide-react";

const RegistrationSuccess = ({
    email,
    onGoToLogin
}) => {
    return (
        <div className="text-center space-y-6">
            <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                <Mail className="w-8 h-8 text-green-600" />
            </div>
            <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Check Your Email</h2>
                <p className="text-gray-600 mb-4">
                    We&apos;ve sent a verification link to{" "}
                    <span className="font-semibold text-gray-900">{email}</span>
                </p>
                <p className="text-sm text-gray-500 mb-6">
                    Click the link in the email to verify your account and complete registration.
                </p>
            </div>
            <div className="space-y-4">
                <button
                    onClick={onGoToLogin}
                    className="w-full bg-teal-600 text-white py-2 px-4 rounded hover:bg-teal-700 transition-colors font-medium flex items-center justify-center space-x-2"
                >
                    <span>Go to Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                </button>
            </div>
            <div className="text-xs text-gray-500 space-y-1">
                <p>Didn&apos;t receive the email?</p>
                <p>• Check your spam/junk folder</p>
                <p>• Make sure the email address is correct</p>
                <p className="text-teal-600 cursor-pointer hover:text-teal-700">
                    Having trouble? Contact support
                </p>
            </div>
        </div>
    );
};

export default RegistrationSuccess;