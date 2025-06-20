// components/modals/CreateProjectModal.js
'use client'
import { useState, Fragment } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, Transition } from '@headlessui/react';
import { useProject } from '../../context/ProjectContext';
import { db } from '../../config/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import {
    XMarkIcon,
    RocketLaunchIcon,
    DocumentTextIcon,
    BugAntIcon,
    ChartBarIcon,
    BeakerIcon,
    SparklesIcon
} from '@heroicons/react/24/outline';

const CreateProjectModal = ({ 
    isOpen, 
    onClose, 
    isOnboarding = false,
    onSuccess 
}) => {
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
            
            // Refresh projects list
            await refetchProjects();
            
            if (isOnboarding) {
                setNeedsOnboarding(false);
                router.push('/dashboard');
            } else {
                onSuccess?.();
                onClose();
            }

            // Reset form
            setProjectName('');
            setDescription('');
        } catch (error) {
            console.error('Error creating project:', error);
            setError('Failed to create project. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        if (!isLoading) {
            setProjectName('');
            setDescription('');
            setError('');
            onClose();
        }
    };

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={handleClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black bg-opacity-25 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-5xl transform overflow-hidden rounded-2xl bg-white shadow-xl transition-all">
                                {/* Header */}
                                <div className="relative bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6">
                                    <button
                                        onClick={handleClose}
                                        disabled={isLoading}
                                        className="absolute right-4 top-4 p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <XMarkIcon className="h-5 w-5" />
                                    </button>
                                    
                                    <div className="flex items-center space-x-3 mb-2">
                                        <div className="p-2 bg-white/20 backdrop-blur-sm rounded-xl">
                                            <RocketLaunchIcon className="h-6 w-6 text-white" />
                                        </div>
                                        <Dialog.Title className="text-2xl font-bold text-white">
                                            {isOnboarding ? 'Welcome to QA Suite!' : 'Create New Project'}
                                        </Dialog.Title>
                                    </div>
                                    
                                    <p className="text-blue-100 max-w-2xl">
                                        {isOnboarding 
                                            ? "Let's create your first project to get started. Think of it as your dedicated workspace for managing test cases, bug reports, and QA activities."
                                            : "Set up a new project workspace to organize your QA activities, test cases, and bug reports."
                                        }
                                    </p>
                                </div>

                                <div className="p-8">
                                    <div className="grid lg:grid-cols-2 gap-8 items-start">
                                        {/* Features Showcase */}
                                        <div className="space-y-6">
                                            <div className="flex items-center space-x-2 mb-4">
                                                <SparklesIcon className="h-5 w-5 text-blue-600" />
                                                <h3 className="text-lg font-semibold text-gray-900">
                                                    What you&apos;ll get with your project:
                                                </h3>
                                            </div>
                                            
                                            <div className="grid gap-4">
                                                {features.map((feature, index) => (
                                                    <div key={index} className="flex items-start space-x-3 p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-blue-200 transition-colors">
                                                        <div className="flex-shrink-0 p-2 bg-blue-100 rounded-lg">
                                                            <feature.icon className="h-5 w-5 text-blue-600" />
                                                        </div>
                                                        <div>
                                                            <h4 className="font-medium text-gray-900 text-sm">{feature.title}</h4>
                                                            <p className="text-xs text-gray-600 mt-1">{feature.description}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Subscription Info */}
                                            {userProfile && (
                                                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                                                    <div className="flex items-center space-x-2 mb-2">
                                                        <div className="w-2 h-2 bg-amber-400 rounded-full"></div>
                                                        <p className="text-sm font-medium text-amber-800">
                                                            Current Plan: {userProfile.subscriptionType?.charAt(0).toUpperCase() + userProfile.subscriptionType?.slice(1) || 'Free'}
                                                        </p>
                                                    </div>
                                                    {userProfile.subscriptionType === 'free' && (
                                                        <p className="text-xs text-amber-700">
                                                            Free plan includes 1 project. Upgrade for unlimited projects and premium features.
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* Project Creation Form */}
                                        <div className="bg-white border border-gray-200 rounded-xl p-6">
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
                                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                                        disabled={isLoading}
                                                        autoFocus
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
                                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none"
                                                        disabled={isLoading}
                                                    />
                                                </div>

                                                {error && (
                                                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                                                        <p className="text-sm text-red-600">{error}</p>
                                                    </div>
                                                )}

                                                <div className="flex space-x-3 pt-4">
                                                    {!isOnboarding && (
                                                        <button
                                                            type="button"
                                                            onClick={handleClose}
                                                            disabled={isLoading}
                                                            className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                        >
                                                            Cancel
                                                        </button>
                                                    )}
                                                    
                                                    <button
                                                        type="submit"
                                                        disabled={isLoading || !projectName.trim()}
                                                        className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                    >
                                                        {isLoading ? (
                                                            <div className="flex items-center justify-center">
                                                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                                                Creating...
                                                            </div>
                                                        ) : (
                                                            isOnboarding ? 'Create Project & Continue' : 'Create Project'
                                                        )}
                                                    </button>
                                                </div>
                                            </form>
                                        </div>
                                    </div>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
};

export default CreateProjectModal;