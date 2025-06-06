import React from "react";
import { Eye, EyeOff } from "lucide-react";

export const PersonalInfoStep = ({
    formData,
    errors,
    showPassword,
    showConfirmPassword,
    isGoogleAuth,
    onInputChange,
    onTogglePassword,
    onClearError
}) => {
    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-900 border-b border-slate-200 pb-2">
                Personal Information
            </h3>

            <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 block">
                    Full name <span className="text-red-500">*</span>
                </label>
                <input
                    className={`w-full px-4 py-2 border-2 rounded text-slate-900 placeholder-slate-400 bg-slate-50/50 transition-all duration-200 ${
                        errors.name 
                            ? "border-red-300 focus:border-red-500 focus:bg-red-50/50" 
                            : "border-slate-200 focus:border-teal-500 focus:bg-white"
                    } focus:outline-none focus:ring-4 focus:ring-teal-500/10`}
                    type="text"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={(e) => {
                        onInputChange('name', e.target.value);
                        if (errors.name) onClearError('name');
                    }}
                />
                {errors.name && (
                    <p className="text-red-600 text-xs mt-2">{errors.name}</p>
                )}
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 block">
                    Email address <span className="text-red-500">*</span>
                </label>
                <input
                    className={`w-full px-4 py-2 border-2 rounded text-slate-900 placeholder-slate-400 bg-slate-50/50 transition-all duration-200 ${
                        errors.email 
                            ? "border-red-300 focus:border-red-500 focus:bg-red-50/50" 
                            : "border-slate-200 focus:border-teal-500 focus:bg-white"
                    } focus:outline-none focus:ring-4 focus:ring-teal-500/10`}
                    type="email"
                    placeholder="name@company.com"
                    value={formData.email}
                    onChange={(e) => {
                        onInputChange('email', e.target.value);
                        if (errors.email) onClearError('email');
                    }}
                />
                {errors.email && (
                    <p className="text-red-600 text-xs mt-2">{errors.email}</p>
                )}
            </div>

            {!isGoogleAuth && (
                <>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700 block">
                            Password <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <input
                                className={`w-full px-4 py-2 pr-12 border-2 rounded text-slate-900 placeholder-slate-400 bg-slate-50/50 transition-all duration-200 ${
                                    errors.password 
                                        ? "border-red-300 focus:border-red-500 focus:bg-red-50/50" 
                                        : "border-slate-200 focus:border-teal-500 focus:bg-white"
                                } focus:outline-none focus:ring-4 focus:ring-teal-500/10`}
                                type={showPassword ? "text" : "password"}
                                placeholder="Enter a secure password"
                                value={formData.password}
                                onChange={(e) => {
                                    onInputChange('password', e.target.value);
                                    if (errors.password) onClearError('password');
                                }}
                            />
                            <button
                                type="button"
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                                onClick={() => onTogglePassword('showPassword')}
                            >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700 block">
                            Confirm password <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <input
                                className={`w-full px-4 py-2 pr-12 border-2 rounded text-slate-900 placeholder-slate-400 bg-slate-50/50 transition-all duration-200 ${
                                    errors.password 
                                        ? "border-red-300 focus:border-red-500 focus:bg-red-50/50" 
                                        : "border-slate-200 focus:border-teal-500 focus:bg-white"
                                } focus:outline-none focus:ring-4 focus:ring-teal-500/10`}
                                type={showConfirmPassword ? "text" : "password"}
                                placeholder="Confirm your password"
                                value={formData.confirmPassword}
                                onChange={(e) => {
                                    onInputChange('confirmPassword', e.target.value);
                                    if (errors.password) onClearError('password');
                                }}
                            />
                            <button
                                type="button"
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                                onClick={() => onTogglePassword('showConfirmPassword')}
                            >
                                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                        {errors.password && (
                            <p className="text-red-600 text-xs mt-2">{errors.password}</p>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};