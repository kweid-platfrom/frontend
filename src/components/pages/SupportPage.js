/* eslint-disable @typescript-eslint/no-unused-vars */
'use client'
import React, { useState } from 'react';
import { useApp } from '@/context/AppProvider';
import {
    LifebuoyIcon,
    ChatBubbleLeftRightIcon,
    DocumentTextIcon,
    BookOpenIcon,
    BugAntIcon,
    LightBulbIcon,
    EnvelopeIcon,
    PhoneIcon,
    ClockIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon,
    InformationCircleIcon,
    ArrowTopRightOnSquareIcon,
} from '@heroicons/react/24/outline';

// Support Categories Component
const SupportCategories = ({ onCategorySelect }) => {
    const categories = [
        {
            id: 'getting-started',
            title: 'Getting Started',
            description: 'Learn the basics and set up your account',
            icon: BookOpenIcon,
            color: 'text-blue-500',
            bgColor: 'bg-blue-50',
        },
        {
            id: 'technical-issues',
            title: 'Technical Issues',
            description: 'Report bugs and technical problems',
            icon: BugAntIcon,
            color: 'text-red-500',
            bgColor: 'bg-red-50',
        },
        {
            id: 'feature-request',
            title: 'Feature Requests',
            description: 'Suggest new features and improvements',
            icon: LightBulbIcon,
            color: 'text-yellow-500',
            bgColor: 'bg-yellow-50',
        },
        {
            id: 'account-billing',
            title: 'Account & Billing',
            description: 'Subscription, payment, and account issues',
            icon: DocumentTextIcon,
            color: 'text-green-500',
            bgColor: 'bg-green-50',
        },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {categories.map((category) => {
                const IconComponent = category.icon;
                return (
                    <button
                        key={category.id}
                        onClick={() => onCategorySelect(category)}
                        className="p-6 bg-card border border-border rounded-lg hover:shadow-theme-md transition-all duration-200 text-left group"
                    >
                        <div className={`inline-flex p-3 rounded-lg ${category.bgColor} group-hover:scale-110 transition-transform duration-200`}>
                            <IconComponent className={`h-6 w-6 ${category.color}`} />
                        </div>
                        <h3 className="mt-4 text-lg font-semibold text-card-foreground group-hover:text-primary transition-colors">
                            {category.title}
                        </h3>
                        <p className="mt-2 text-sm text-muted-foreground">
                            {category.description}
                        </p>
                    </button>
                );
            })}
        </div>
    );
};

// Contact Form Component
const ContactForm = ({ category, onBack }) => {
    const { actions, currentUser, profileData } = useApp();
    const [formData, setFormData] = useState({
        subject: '',
        message: '',
        priority: 'medium',
        includeSystemInfo: true,
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async () => {
        if (!formData.subject.trim() || !formData.message.trim()) {
            actions.ui.showNotification?.({
                id: 'form-validation-error',
                type: 'error',
                message: 'Please fill in all required fields',
                duration: 3000,
            });
            return;
        }
        setIsSubmitting(true);

        try {
            // Simulate form submission
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            actions.ui.showNotification?.({
                id: 'support-ticket-submitted',
                type: 'success',
                message: 'Support ticket submitted successfully',
                description: 'We\'ll get back to you within 24 hours',
                duration: 5000,
            });

            setSubmitted(true);
        } catch (error) {
            actions.ui.showNotification?.({
                id: 'support-ticket-error',
                type: 'error',
                message: 'Failed to submit support ticket',
                description: 'Please try again or contact us directly',
                duration: 5000,
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (submitted) {
        return (
            <div className="text-center py-12">
                <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-2xl font-semibold text-card-foreground mb-2">
                    Ticket Submitted Successfully
                </h3>
                <p className="text-muted-foreground mb-6">
                    We&apos;ve received your support request and will respond within 24 hours.
                </p>
                <div className="space-x-4">
                    <button
                        onClick={onBack}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-teal-500 transition-colors"
                    >
                        Submit Another Ticket
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="mb-6">
                <button
                    onClick={onBack}
                    className="text-primary hover:text-teal-600 text-sm font-medium"
                >
                    ← Back to Categories
                </button>
                <h2 className="text-2xl font-bold text-card-foreground mt-2">
                    {category.title}
                </h2>
                <p className="text-muted-foreground">{category.description}</p>
            </div>

            <div className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-card-foreground mb-2">
                        Subject *
                    </label>
                    <input
                        type="text"
                        required
                        value={formData.subject}
                        onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                        placeholder="Brief description of your issue"
                        className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-card-foreground mb-2">
                        Priority
                    </label>
                    <select
                        value={formData.priority}
                        onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                        className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                        <option value="low">Low - General question</option>
                        <option value="medium">Medium - Issue affecting work</option>
                        <option value="high">High - Blocking issue</option>
                        <option value="urgent">Urgent - System down</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-card-foreground mb-2">
                        Message *
                    </label>
                    <textarea
                        required
                        rows={6}
                        value={formData.message}
                        onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                        placeholder="Please provide detailed information about your issue, including steps to reproduce if applicable..."
                        className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                    />
                </div>

                <div className="flex items-start">
                    <input
                        type="checkbox"
                        id="includeSystemInfo"
                        checked={formData.includeSystemInfo}
                        onChange={(e) => setFormData(prev => ({ ...prev, includeSystemInfo: e.target.checked }))}
                        className="mt-1 mr-3"
                    />
                    <label htmlFor="includeSystemInfo" className="text-sm text-card-foreground">
                        Include system information (browser, account details) to help us diagnose the issue faster
                    </label>
                </div>

                {formData.includeSystemInfo && (
                    <div className="bg-muted p-4 rounded-md">
                        <h4 className="text-sm font-medium text-card-foreground mb-2">System Information</h4>
                        <div className="text-xs text-muted-foreground space-y-1">
                            <p>User ID: {currentUser?.uid}</p>
                            <p>Email: {profileData?.email || currentUser?.email}</p>
                            <p>Account Type: {profileData?.account_type || 'individual'}</p>
                            <p>Browser: {navigator.userAgent.split(' ').slice(-2).join(' ')}</p>
                            <p>Timestamp: {new Date().toISOString()}</p>
                        </div>
                    </div>
                )}

                    <div className="flex justify-end space-x-4">
                        <button
                            type="button"
                            onClick={onBack}
                            className="px-4 py-2 border border-border rounded-md hover:bg-muted transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-teal-500 transition-colors disabled:opacity-50"
                        >
                            {isSubmitting ? 'Submitting...' : 'Submit Ticket'}
                        </button>
                    </div>
                </div>
        </div>
    );
};

// FAQ Component
const FAQSection = () => {
    const [openItems, setOpenItems] = useState(new Set());

    const faqItems = [
        {
            id: 1,
            question: "How do I create my first test suite?",
            answer: "Navigate to the Suites page and click 'Create New Suite'. Fill in the basic information like name and description, then start adding test cases to your suite."
        },
        {
            id: 2,
            question: "Can I use AI to generate test cases?",
            answer: "Yes! If you have AI configured, you can upload documents or provide requirements, and our AI will generate comprehensive test cases for you."
        },
        {
            id: 3,
            question: "How do I upgrade my subscription?",
            answer: "Go to Settings > Billing to view available plans and upgrade your subscription. Changes take effect immediately."
        },
        {
            id: 4,
            question: "What's the difference between individual and team accounts?",
            answer: "Individual accounts are for personal use, while team accounts allow multiple users to collaborate on test suites with role-based permissions."
        },
        {
            id: 5,
            question: "How do I record and replay tests?",
            answer: "Use the recording feature in your test suite to capture user interactions. Recordings can be linked to bugs and test cases for better tracking."
        },
    ];

    const toggleItem = (id) => {
        const newOpenItems = new Set(openItems);
        if (newOpenItems.has(id)) {
            newOpenItems.delete(id);
        } else {
            newOpenItems.add(id);
        }
        setOpenItems(newOpenItems);
    };

    return (
        <div className="space-y-4">
            {faqItems.map((item) => (
                <div key={item.id} className="bg-card border border-border rounded-lg">
                    <button
                        onClick={() => toggleItem(item.id)}
                        className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-muted transition-colors"
                    >
                        <span className="font-medium text-card-foreground">{item.question}</span>
                        <span className={`transform transition-transform ${openItems.has(item.id) ? 'rotate-180' : ''}`}>
                            ↓
                        </span>
                    </button>
                    {openItems.has(item.id) && (
                        <div className="px-6 pb-4">
                            <p className="text-muted-foreground">{item.answer}</p>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

// Contact Info Component
const ContactInfo = () => {
    const contactMethods = [
        {
            icon: EnvelopeIcon,
            title: 'Email Support',
            description: 'Get help via email',
            value: 'support@testmanager.com',
            action: 'mailto:support@testmanager.com',
        },
        {
            icon: ChatBubbleLeftRightIcon,
            title: 'Live Chat',
            description: 'Chat with our support team',
            value: 'Available 9 AM - 6 PM EST',
            action: '#',
        },
        {
            icon: PhoneIcon,
            title: 'Phone Support',
            description: 'Call us for urgent issues',
            value: '+1 (555) 123-4567',
            action: 'tel:+15551234567',
        },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {contactMethods.map((method, index) => {
                const IconComponent = method.icon;
                return (
                    <div key={index} className="bg-card p-6 rounded-lg border border-border text-center">
                        <div className="inline-flex p-3 rounded-lg bg-primary/10 mb-4">
                            <IconComponent className="h-6 w-6 text-primary" />
                        </div>
                        <h3 className="text-lg font-semibold text-card-foreground mb-2">
                            {method.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-3">
                            {method.description}
                        </p>
                        <a
                            href={method.action}
                            className="text-primary hover:text-teal-600 font-medium text-sm flex items-center justify-center"
                        >
                            {method.value}
                            <ArrowTopRightOnSquareIcon className="h-4 w-4 ml-1" />
                        </a>
                    </div>
                );
            })}
        </div>
    );
};

// Main Support Page
const SupportPage = () => {
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [activeTab, setActiveTab] = useState('categories');

    const tabs = [
        { id: 'categories', label: 'Get Help', icon: LifebuoyIcon },
        { id: 'faq', label: 'FAQ', icon: InformationCircleIcon },
        { id: 'contact', label: 'Contact', icon: EnvelopeIcon },
    ];

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-4xl mx-auto p-6">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-foreground mb-2">Support Center</h1>
                    <p className="text-muted-foreground">
                        Get help, find answers, and contact our support team
                    </p>
                </div>

                {/* Tab Navigation */}
                <div className="border-b border-border mb-8">
                    <nav className="flex space-x-8">
                        {tabs.map((tab) => {
                            const IconComponent = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => {
                                        setActiveTab(tab.id);
                                        setSelectedCategory(null);
                                    }}
                                    className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                                        activeTab === tab.id
                                            ? 'border-primary text-primary'
                                            : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                                    }`}
                                >
                                    <IconComponent className="h-5 w-5 mr-2" />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </nav>
                </div>

                {/* Tab Content */}
                <div className="bg-card p-8 rounded-lg border border-border">
                    {activeTab === 'categories' && (
                        <>
                            {selectedCategory ? (
                                <ContactForm
                                    category={selectedCategory}
                                    onBack={() => setSelectedCategory(null)}
                                />
                            ) : (
                                <SupportCategories onCategorySelect={setSelectedCategory} />
                            )}
                        </>
                    )}

                    {activeTab === 'faq' && (
                        <div>
                            <h2 className="text-2xl font-bold text-card-foreground mb-6">
                                Frequently Asked Questions
                            </h2>
                            <FAQSection />
                        </div>
                    )}

                    {activeTab === 'contact' && (
                        <div>
                            <h2 className="text-2xl font-bold text-card-foreground mb-6">
                                Contact Information
                            </h2>
                            <ContactInfo />
                            
                            <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                <div className="flex items-center">
                                    <ClockIcon className="h-5 w-5 text-blue-500 mr-2" />
                                    <h3 className="font-medium text-blue-900">Support Hours</h3>
                                </div>
                                <p className="text-blue-700 text-sm mt-1">
                                    Monday - Friday: 9:00 AM - 6:00 PM EST<br />
                                    Saturday - Sunday: 10:00 AM - 4:00 PM EST
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SupportPage;