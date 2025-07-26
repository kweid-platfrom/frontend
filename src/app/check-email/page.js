'use client';
import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { sendEmailVerification } from 'firebase/auth';
import { auth } from '../../config/firebase';
import { Mail, ArrowLeft } from 'lucide-react';
import BackgroundDecorations from '../../components/BackgroundDecorations';
import '../globals.css';

const CheckEmail = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const email = searchParams.get('email') || '';
    const [isResending, setIsResending] = useState(false);
    const [toast, setToast] = useState({ type: '', message: '', title: '' });

    const handleResendEmail = async () => {
        setIsResending(true);
        try {
            const user = auth.currentUser;
            if (user) {
                await sendEmailVerification(user, {
                    url: `${window.location.origin}/verify-email`,
                    handleCodeInApp: false,
                });
                setToast({
                    type: 'success',
                    title: 'Email Resent',
                    message: 'Verification email has been resent successfully.',
                });
            } else {
                setToast({
                    type: 'info',
                    title: 'Session Expired',
                    message: 'Please register again to receive a new verification email.',
                });
                setTimeout(() => {
                    router.push('/register');
                }, 2000);
            }
        } catch (error) {
            console.error('Error resending verification email:', error);
            setToast({
                type: 'error',
                title: 'Resend Failed',
                message: 'Failed to resend verification email. Please try again.',
            });
        } finally {
            setIsResending(false);
        }
    };

    const handleBackToRegister = () => {
        router.push('/register');
    };

    const handleGoToLogin = () => {
        router.push('/login');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50 relative overflow-hidden">
            <BackgroundDecorations />
            <div className="flex items-center justify-center min-h-screen px-4 sm:px-6 relative z-10">
                <div className="w-full max-w-md">
                    <div className="text-center mb-8">
                        <div className="inline-block">
                            <div className="font-bold text-3xl sm:text-4xl bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
                                QAID
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-white rounded-xl shadow-2xl border border-white/20 p-8 relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-teal-500/10 to-cyan-500/10 rounded-2xl blur-xl -z-10"></div>
                        
                        <div className="text-center">
                            <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Mail className="w-8 h-8 text-teal-600" />
                            </div>
                            
                            <h1 className="text-2xl font-bold text-slate-900 mb-2">Check Your Email</h1>
                            
                            <p className="text-slate-600 mb-4">
                                We&apos;ve sent a verification email to{' '}
                                <span className="font-semibold text-slate-900">{email}</span>
                            </p>
                            
                            <p className="text-sm text-slate-500 mb-6">
                                Please check your inbox and spam folder, then click the verification link to complete your registration.
                            </p>

                            <div className="bg-teal-50 border border-teal-200 rounded-lg p-4 mb-6">
                                <p className="text-sm text-teal-800 font-medium mb-2">
                                    What happens next:
                                </p>
                                <ol className="text-sm text-teal-700 space-y-1 text-left">
                                    <li>1. Check your email inbox (and spam folder)</li>
                                    <li>2. Click the verification link in the email</li>
                                    <li>3. Complete any additional setup steps</li>
                                    <li>4. Access your dashboard</li>
                                </ol>
                            </div>

                            <div className="space-y-3">
                                <button
                                    onClick={handleResendEmail}
                                    disabled={isResending}
                                    className="w-full text-teal-600 py-3 px-4 text-sm hover:bg-teal-50 rounded-lg transition-colors border border-teal-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
                                >
                                    {isResending ? 'Resending...' : "Didn't receive the email? Resend verification"}
                                </button>
                                
                                <button
                                    onClick={handleGoToLogin}
                                    className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 text-white py-3 px-4 rounded-lg hover:from-teal-700 hover:to-cyan-700 transition-all transform hover:scale-[1.02] font-medium"
                                >
                                    Already verified? Sign In
                                </button>
                                
                                <button
                                    onClick={handleBackToRegister}
                                    className="w-full text-slate-600 py-2 px-4 text-sm hover:bg-slate-50 rounded-lg transition-colors flex items-center justify-center gap-2"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    Back to Registration
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Toast */}
            {toast.message && (
                <div className={`fixed bottom-4 right-4 p-4 rounded-lg text-white max-w-sm ${
                    toast.type === 'success' ? 'bg-green-600' : 
                    toast.type === 'error' ? 'bg-red-600' : 'bg-blue-600'
                }`}>
                    <div className="font-medium">{toast.title}</div>
                    <div className="text-sm opacity-90">{toast.message}</div>
                </div>
            )}
        </div>
    );
};

export default CheckEmail;