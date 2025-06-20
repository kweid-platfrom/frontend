import React, { useState } from "react";
import { X, Bug, AlertCircle, Paperclip } from "lucide-react";
import BugReportBasicInfo from "../../components/create-bug/BugReportBasicInfo";
import BugReportAttachments from "../../components/create-bug/BugReportAttachments";

const BugReportForm = ({
    formData,
    updateFormData,
    attachments,
    setAttachments,
    recordings,
    isLoadingRecordings,
    error,
    setError,
    isSubmitting,
    onSubmit,
    onClose
}) => {
    const [activeTab, setActiveTab] = useState("basic");

    const tabs = [
        { id: "basic", label: "Basic Info", icon: Bug, shortLabel: "Info" },
        { id: "attachments", label: "Attachments", icon: Paperclip, shortLabel: "Files" }
    ];

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit();
    };

    const goToNextTab = () => {
        const currentIndex = tabs.findIndex(tab => tab.id === activeTab);
        if (currentIndex < tabs.length - 1) {
            setActiveTab(tabs[currentIndex + 1].id);
        }
    };

    const goToPreviousTab = () => {
        const currentIndex = tabs.findIndex(tab => tab.id === activeTab);
        if (currentIndex > 0) {
            setActiveTab(tabs[currentIndex - 1].id);
        }
    };

    const isFirstTab = activeTab === tabs[0].id;
    const isLastTab = activeTab === tabs[tabs.length - 1].id;

    return (
        <>
            {/* Header - Responsive */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-100 flex-shrink-0">
                <div className="flex items-center space-x-2 sm:space-x-3">
                    <div className="p-1.5 sm:p-2 bg-red-50 rounded-lg">
                        <Bug className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
                    </div>
                    <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Report a Bug</h2>
                </div>
                <button
                    onClick={() => !isSubmitting && onClose()}
                    className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                    disabled={isSubmitting}
                    aria-label="Close"
                >
                    <X className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
                </button>
            </div>

            {/* Tab Navigation - Mobile Friendly */}
            <div className="flex border-b border-gray-200 px-4 sm:px-6 flex-shrink-0 overflow-x-auto">
                {tabs.map((tab) => {
                    const IconComponent = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center space-x-1.5 sm:space-x-2 px-3 sm:px-4 py-3 text-sm font-medium border-b-2 transition-colors duration-200 whitespace-nowrap ${
                                activeTab === tab.id
                                    ? "border-[#00897B] text-[#00897B]"
                                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                            }`}
                        >
                            <IconComponent className="h-4 w-4" />
                            <span className="hidden sm:inline">{tab.label}</span>
                            <span className="sm:hidden">{tab.shortLabel}</span>
                            {tab.id === "attachments" && attachments.length > 0 && (
                                <span className="bg-[#00897B] text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                                    {attachments.length}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Content - Scrollable with better mobile spacing */}
            <div className="flex flex-col flex-1 min-h-0">
                {/* Error Message */}
                {error && (
                    <div className="mx-4 sm:mx-6 mt-4 sm:mt-6">
                        <div className="flex items-start space-x-3 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg">
                            <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600 mt-0.5 flex-shrink-0" />
                            <p className="text-red-700 text-sm">{error}</p>
                        </div>
                    </div>
                )}

                {/* Scrollable Form Content */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                    {activeTab === "basic" && (
                        <BugReportBasicInfo
                            formData={formData}
                            updateFormData={updateFormData}
                        />
                    )}

                    {activeTab === "attachments" && (
                        <BugReportAttachments
                            attachments={attachments}
                            setAttachments={setAttachments}
                            recordings={recordings}
                            isLoadingRecordings={isLoadingRecordings}
                            error={error}
                            setError={setError}
                            updateFormData={updateFormData}
                        />
                    )}
                </div>

                {/* Fixed Footer - Mobile Responsive */}
                <div className="p-4 sm:p-6 border-t border-gray-100 bg-gray-50 flex-shrink-0">
                    <div className="flex flex-col sm:flex-row justify-between items-center space-y-3 sm:space-y-0">
                        {/* Navigation Buttons */}
                        <div className="flex space-x-2 w-full sm:w-auto">
                            <button
                                type="button"
                                onClick={goToPreviousTab}
                                disabled={isFirstTab || isSubmitting}
                                className={`flex-1 sm:flex-none px-4 py-2 border border-gray-300 text-gray-700 rounded-lg transition-colors duration-200 ${
                                    isFirstTab || isSubmitting
                                        ? "opacity-50 cursor-not-allowed"
                                        : "hover:bg-gray-50"
                                }`}
                            >
                                Previous
                            </button>
                            
                            {!isLastTab && (
                                <button
                                    type="button"
                                    onClick={goToNextTab}
                                    disabled={isSubmitting}
                                    className="flex-1 sm:flex-none px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Next
                                </button>
                            )}
                        </div>
                        
                        {/* Submit Button */}
                        <button
                            type="submit"
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="w-full sm:w-auto bg-[#00897B] hover:bg-[#00796B] disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-2 px-6 rounded-lg font-medium transition-all duration-200"
                        >
                            {isSubmitting ? (
                                <div className="flex items-center justify-center space-x-2">
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    <span className="hidden sm:inline">Submitting...</span>
                                    <span className="sm:hidden">...</span>
                                </div>
                            ) : (
                                <>
                                    <span className="hidden sm:inline">Submit Bug Report</span>
                                    <span className="sm:hidden">Submit</span>
                                </>
                            )}
                        </button>
                    </div>
                    
                    {/* Progress Indicator for Mobile */}
                    <div className="sm:hidden mt-3 flex justify-center space-x-2">
                        {tabs.map((tab) => (
                            <div
                                key={tab.id}
                                className={`h-2 w-8 rounded-full transition-colors duration-200 ${
                                    activeTab === tab.id
                                        ? "bg-[#00897B]"
                                        : "bg-gray-200"
                                }`}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
};

export default BugReportForm;