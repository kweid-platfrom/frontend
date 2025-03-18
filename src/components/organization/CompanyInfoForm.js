import React, { useState } from 'react';
import { useOrganization } from '../../context/OrganizationContext';

const CompanyInfoForm = ({ organization }) => {
    const { updateOrganization } = useOrganization();
    const [companyName, setCompanyName] = useState(organization.companyName || '');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [saveStatus, setSaveStatus] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setSaveStatus('saving');

        try {
            await updateOrganization({ companyName });
            setSaveStatus('success');
            setTimeout(() => setSaveStatus(null), 3000);
        } catch (error) {
            console.error('Error updating company info:', error);
            setSaveStatus('error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div>
            <h3 className="text-lg font-medium mb-3">Company Information</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-1">
                        Company Name
                    </label>
                    <input
                        type="text"
                        id="companyName"
                        name="companyName"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#00897b] focus:border-transparent"
                    />
                </div>
                <div className="flex items-center space-x-3">
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-4 py-2 bg-[#00897b] text-white font-medium rounded hover:bg-[#00796B] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00897b] disabled:opacity-50"
                    >
                        {isSubmitting ? 'Saving...' : 'Save Changes'}
                    </button>
                    {saveStatus === 'success' && (
                        <span className="text-green-600 text-sm">Changes saved successfully!</span>
                    )}
                    {saveStatus === 'error' && (
                        <span className="text-red-600 text-sm">Error saving changes</span>
                    )}
                </div>
            </form>
        </div>
    );
};

export default CompanyInfoForm;