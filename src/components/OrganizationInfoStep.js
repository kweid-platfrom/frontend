// components/OrganizationInfoStep.jsx
import React from "react";

export const OrganizationInfoStep = ({ formData, onInputChange }) => {
    const industries = [
        { value: "", label: "Select your industry" },
        { value: "technology", label: "Technology" },
        { value: "healthcare", label: "Healthcare" },
        { value: "finance", label: "Finance" },
        { value: "education", label: "Education" },
        { value: "retail", label: "Retail" },
        { value: "manufacturing", label: "Manufacturing" },
        { value: "other", label: "Other" }
    ];

    const companySizes = [
        { value: "", label: "Select company size" },
        { value: "1-10", label: "1-10 employees" },
        { value: "11-50", label: "11-50 employees" },
        { value: "51-200", label: "51-200 employees" },
        { value: "201-500", label: "201-500 employees" },
        { value: "500+", label: "500+ employees" }
    ];

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-900 border-b border-slate-200 pb-2">
                Organization Information <span className="text-sm font-normal text-slate-500">(Optional)</span>
            </h3>

            <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 block">
                    Company name
                </label>
                <input
                    className="w-full px-4 py-2 border-2 border-slate-200 rounded text-slate-900 placeholder-slate-400 bg-slate-50/50 transition-all duration-200 focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-teal-500/10"
                    type="text"
                    placeholder="Enter your company name"
                    value={formData.company}
                    onChange={(e) => onInputChange('company', e.target.value)}
                />
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 block">
                    Industry
                </label>
                <select
                    className="w-full px-4 py-2 border-2 border-slate-200 rounded text-slate-900 bg-slate-50/50 transition-all duration-200 focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-teal-500/10"
                    value={formData.industry}
                    onChange={(e) => onInputChange('industry', e.target.value)}
                >
                    {industries.map(industry => (
                        <option key={industry.value} value={industry.value}>
                            {industry.label}
                        </option>
                    ))}
                </select>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 block">
                    Company size
                </label>
                <select
                    className="w-full px-4 py-2 border-2 border-slate-200 rounded text-slate-900 bg-slate-50/50 transition-all duration-200 focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-teal-500/10"
                    value={formData.companySize}
                    onChange={(e) => onInputChange('companySize', e.target.value)}
                >
                    {companySizes.map(size => (
                        <option key={size.value} value={size.value}>
                            {size.label}
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );
};