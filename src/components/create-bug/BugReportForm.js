import React, { useState } from "react";
import { X, Bug, AlertCircle } from "lucide-react";
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
        { id: "basic", label: "Basic Info", icon: Bug },
        { id: "attachments", label: "Attachments", icon: X }
    ];

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit();
    };

    return (
        <>
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100 flex-shrink-0">
                <div className="flex items-center space-x-3">
                    <div className="p-2 bg-red-50 rounded-lg">
                        <Bug className="h-5 w-5 text-red-600" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900">Report a Bug</h2>
                </div>
                <button
                    onClick={() => !isSubmitting && onClose()}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                    disabled={isSubmitting}
                >
                    <X className="w-5 h-5 text-gray-500" />
                </button>
            </div>

            {/* Tab Navigation */}
            <div className="flex border-b border-gray-200 px-6 flex-shrink-0">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors duration-200 ${
                            activeTab === tab.id
                                ? "border-[#00897B] text-[#00897B]"
                                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="flex flex-col flex-1 min-h-0">
                {/* Scrollable Form Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {error && (
                        <div className="flex items-start space-x-3 p-4 bg-red-50 border border-red-200 rounded-lg mb-6">
                            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                            <p className="text-red-700 text-sm">{error}</p>
                        </div>
                    )}

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

                {/* Fixed Footer */}
                <div className="p-6 border-t border-gray-100 bg-gray-50 flex-shrink-0">
                    <div className="flex justify-between items-center">
                        <div className="flex space-x-2">
                            {activeTab !== "basic" && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        const currentIndex = tabs.findIndex(tab => tab.id === activeTab);
                                        if (currentIndex > 0) {
                                            setActiveTab(tabs[currentIndex - 1].id);
                                        }
                                    }}
                                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                                >
                                    Previous
                                </button>
                            )}
                            {activeTab !== "assignment" && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        const currentIndex = tabs.findIndex(tab => tab.id === activeTab);
                                        if (currentIndex < tabs.length - 1) {
                                            setActiveTab(tabs[currentIndex + 1].id);
                                        }
                                    }}
                                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors duration-200"
                                >
                                    Next
                                </button>
                            )}
                        </div>
                        
                        <button
                            type="submit"
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="bg-[#00897B] hover:bg-[#00796B] disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-2 px-6 rounded-lg font-medium transition-all duration-200"
                        >
                            {isSubmitting ? (
                                <div className="flex items-center space-x-2">
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    <span>Submitting...</span>
                                </div>
                            ) : (
                                "Submit Bug Report"
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default BugReportForm;