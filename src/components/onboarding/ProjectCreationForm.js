// components/onboarding/CreateProjectOnboarding.js
'use client'
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useProject } from '../../context/ProjectContext';
import { db } from '../../config/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import {
    RocketLaunchIcon,
    DocumentTextIcon,
    BugAntIcon,
    ChartBarIcon,
    BeakerIcon
} from '@heroicons/react/24/outline';

const ProjectCreationForm = () => {
    const router = useRouter();
    const { user, userProfile, refetchProjects, setNeedsOnboarding } = useProject();
    const [projectName, setProjectName] = useState('');
    const [description, setDescription] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const features = [
        {
            icon: DocumentTextIcon,
            title: 'Test Case Management',
            description: 'Create, organize, and manage test cases with AI-powered generation'
        },
        {
            icon: BugAntIcon,
            title: 'Bug Reporting',
            description: 'Capture detailed bug reports with screen recordings and context'
        },
        {
            icon: BeakerIcon,
            title: 'Automated Testing',
            description: 'Generate Cypress scripts and manage automation metadata'
        },
        {
            icon: ChartBarIcon,
            title: 'QA Dashboard',
            description: 'Visualize test coverage, bug trends, and execution metrics'
        }
    ];

    const handleCreateProject = async (e) => {
        e.preventDefault();
        if (!projectName.trim()) {
            setError('Project name is required');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const projectData = {
                name: projectName.trim(),
                description: description.trim(),
                createdBy: user.uid,
                organizationId: userProfile?.organizationId || null,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                settings: {
                    defaultAssignee: user.uid,
                    testCasePrefix: 'TC',
                    bugReportPrefix: 'BUG',
                    enableAIGeneration: true,
                    enableScreenRecording: true
                },
                stats: {
                    totalTestCases: 0,
                    totalBugReports: 0,
                    automatedTests: 0,
                    lastActivity: serverTimestamp()
                }
            };

            await addDoc(collection(db, 'projects'), projectData);
            
            // Refresh projects list and clear onboarding flag
            await refetchProjects();
            setNeedsOnboarding(false);
            
            // Redirect to dashboard
            router.push('/dashboard');
        } catch (error) {
            console.error('Error creating project:', error);
            setError('Failed to create project. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="flex justify-center mb-6">
                        <div className="p-3 bg-blue-600 rounded-full">
                            <RocketLaunchIcon className="h-8 w-8 text-white" />
                        </div>
                    </div>
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">
                        Welcome to QA Suite!
                    </h1>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        Let&apos;s create your first project to get started. Think of it as your dedicated workspace 
                        for managing test cases, bug reports, and QA activities.
                    </p>
                </div>

                <div className="grid lg:grid-cols-2 gap-12 items-start">
                    {/* Features Showcase */}
                    <div className="space-y-6">
                        <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                            What you&apos;ll get with your project:
                        </h2>
                        <div className="grid gap-6">
                            {features.map((feature, index) => (
                                <div key={index} className="flex items-start space-x-4 p-4 bg-white rounded-lg shadow-sm border border-gray-100">
                                    <div className="flex-shrink-0">
                                        <feature.icon className="h-6 w-6 text-blue-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-gray-900">{feature.title}</h3>
                                        <p className="text-sm text-gray-600 mt-1">{feature.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Project Creation Form */}
                    <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200">
                        <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                            Create Your First Project
                        </h2>
                        
                        <form onSubmit={handleCreateProject} className="space-y-6">
                            <div>
                                <label htmlFor="projectName" className="block text-sm font-medium text-gray-700 mb-2">
                                    Project Name *
                                </label>
                                <input
                                    type="text"
                                    id="projectName"
                                    value={projectName}
                                    onChange={(e) => setProjectName(e.target.value)}
                                    placeholder="e.g., E-commerce App QA"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    disabled={isLoading}
                                />
                            </div>

                            <div>
                                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                                    Description (Optional)
                                </label>
                                <textarea
                                    id="description"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Brief description of what you'll be testing..."
                                    rows={3}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    disabled={isLoading}
                                />
                            </div>

                            {error && (
                                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                                    <p className="text-sm text-red-600">{error}</p>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isLoading || !projectName.trim()}
                                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {isLoading ? (
                                    <div className="flex items-center justify-center">
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                        Creating Project...
                                    </div>
                                ) : (
                                    'Create Project & Continue'
                                )}
                            </button>
                        </form>

                        {/* Subscription Info */}
                        {userProfile && (
                            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                                <p className="text-sm text-gray-600">
                                    <span className="font-medium">Your plan:</span> {userProfile.subscriptionType?.charAt(0).toUpperCase() + userProfile.subscriptionType?.slice(1) || 'Free'}
                                    {userProfile.subscriptionType === 'free' && (
                                        <span className="ml-2 text-amber-600">(1 project limit)</span>
                                    )}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProjectCreationForm;