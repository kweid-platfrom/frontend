// components/settings/OrganizationSection.tsx
import { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../context/AuthProvider';

export default function OrganizationSection({ orgData }) {
    const { user } = useAuth();
    const [name, setName] = useState(orgData?.name || '');
    const [industry, setIndustry] = useState(orgData?.industry || '');
    const [size, setSize] = useState(orgData?.size || '');
    const [website, setWebsite] = useState(orgData?.website || '');
    const [saving, setSaving] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setSuccessMessage('');
        setErrorMessage('');

        try {
            await updateDoc(doc(db, 'organizations', orgData.id), {
                name,
                industry,
                size,
                website,
                updatedAt: new Date(),
                updatedBy: user.uid
            });

            setSuccessMessage('Organization settings updated successfully');
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (error) {
            console.error('Error updating organization:', error);
            setErrorMessage('Failed to update organization settings. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold mb-6">Organization Settings</h2>

            {successMessage && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                    {successMessage}
                </div>
            )}

            {errorMessage && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {errorMessage}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div className="space-y-6">
                    <div>
                        <label htmlFor="org-name" className="block text-sm font-medium mb-1">
                            Organization Name
                        </label>
                        <input
                            id="org-name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="industry" className="block text-sm font-medium mb-1">
                            Industry
                        </label>
                        <select
                            id="industry"
                            value={industry}
                            onChange={(e) => setIndustry(e.target.value)}
                            className="w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="">Select an Industry</option>
                            <option value="technology">Technology</option>
                            <option value="healthcare">Healthcare</option>
                            <option value="finance">Finance</option>
                            <option value="education">Education</option>
                            <option value="retail">Retail</option>
                            <option value="manufacturing">Manufacturing</option>
                            <option value="other">Other</option>
                        </select>
                    </div>

                    <div>
                        <label htmlFor="size" className="block text-sm font-medium mb-1">
                            Company Size
                        </label>
                        <select
                            id="size"
                            value={size}
                            onChange={(e) => setSize(e.target.value)}
                            className="w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="">Select Company Size</option>
                            <option value="1-10">1-10 employees</option>
                            <option value="11-50">11-50 employees</option>
                            <option value="51-200">51-200 employees</option>
                            <option value="201-500">201-500 employees</option>
                            <option value="501-1000">501-1000 employees</option>
                            <option value="1000+">1000+ employees</option>
                        </select>
                    </div>

                    <div>
                        <label htmlFor="website" className="block text-sm font-medium mb-1">
                            Website
                        </label>
                        <input
                            id="website"
                            type="url"
                            value={website}
                            onChange={(e) => setWebsite(e.target.value)}
                            className="w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                            placeholder="https://example.com"
                        />
                    </div>

                    <div className="flex items-center justify-end">
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                        >
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}