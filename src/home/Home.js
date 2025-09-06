'use client'

import React, { useState, useEffect } from "react";
import '../app/globals.css'
import {
    CheckCircle,
    Users,
    BarChart3,
    FileText,
    Bug,
    Zap,
    ArrowRight,
    Play,
    Star,
    Mail,
    Menu,
    X,
    Shield,
    Rocket,
    Target
} from "lucide-react";

// Features Component
const Features = () => {
    const features = [
        {
            icon: <FileText className="h-6 w-6" />,
            title: "Smart Test Management",
            description: "AI-powered test case creation and organization with intelligent coverage analysis that adapts to your workflow."
        },
        {
            icon: <Bug className="h-6 w-6" />,
            title: "Advanced Bug Tracking",
            description: "Capture, categorize, and resolve issues with automated workflows and visual debugging tools."
        },
        {
            icon: <BarChart3 className="h-6 w-6" />,
            title: "Real-time Analytics",
            description: "Live dashboards with predictive insights and performance metrics that drive decision-making."
        },
        {
            icon: <Zap className="h-6 w-6" />,
            title: "AI Test Generation",
            description: "Automatically generate comprehensive test suites from requirements and user stories using advanced AI."
        },
        {
            icon: <Shield className="h-6 w-6" />,
            title: "Screen Recording Pro",
            description: "Capture bugs with complete context including network logs, console errors, and user interactions."
        },
        {
            icon: <Rocket className="h-6 w-6" />,
            title: "Cypress Automation",
            description: "Generate and maintain automated test scripts with AI-powered optimization and smart maintenance."
        }
    ];

    return (
        <section id="features" className="py-32 bg-slate-50">
            <div className="max-w-6xl mx-auto px-6">
                <div className="text-center mb-20">
                    <div className="inline-flex items-center space-x-2 bg-white rounded-full px-4 py-2 mb-8 shadow-sm">
                        <Target className="h-4 w-4 text-teal-600" />
                        <span className="text-sm font-medium text-slate-700">Features</span>
                    </div>
                    <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6 leading-tight">
                        Everything you need <br />for quality assurance
                    </h2>
                    <p className="text-xl text-slate-600 max-w-2xl mx-auto">
                        Advanced tools that adapt to your team&apos;s needs and scale with your growth
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {features.map((feature, index) => (
                        <div key={index} className="group">
                            <div className="bg-white p-8 rounded-xl border border-slate-200 hover:border-teal-200 transition-all duration-300 hover:shadow-lg">
                                <div className="inline-flex p-3 bg-slate-50 rounded-xl text-slate-700 mb-6 group-hover:bg-teal-50 group-hover:text-teal-700 transition-colors">
                                    {feature.icon}
                                </div>
                                <h3 className="text-xl font-semibold text-slate-900 mb-4">{feature.title}</h3>
                                <p className="text-slate-600 leading-relaxed">
                                    {feature.description}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

// Main Home Component
const Home = () => {
    const [billingCycle, setBillingCycle] = useState("monthly");
    const [activeSection, setActiveSection] = useState("home");
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const pricingPlans = [
        {
            name: "Starter",
            price: { monthly: "$29", yearly: "$290" },
            description: "Perfect for small teams getting started",
            features: ["Up to 5 projects", "50GB storage", "Basic analytics", "Email support", "Team collaboration"],
            recommended: false
        },
        {
            name: "Professional",
            price: { monthly: "$79", yearly: "$790" },
            description: "Best for growing teams and businesses",
            features: [
                "Unlimited projects",
                "500GB storage",
                "Advanced AI features",
                "Priority support",
                "API access",
                "Custom integrations"
            ],
            recommended: true
        },
        {
            name: "Enterprise",
            price: { monthly: "Custom", yearly: "Custom" },
            description: "Tailored solutions for large organizations",
            features: [
                "Unlimited everything",
                "Dedicated support",
                "Custom workflows",
                "SLA guarantees",
                "Training & onboarding",
                "White-label options"
            ],
            recommended: false
        },
    ];

    const testimonials = [
        {
            name: "Sarah Chen",
            role: "QA Director",
            company: "TechFlow",
            content: "QAID transformed our testing workflow completely. We've seen a 78% reduction in bug escapes and our team productivity has doubled.",
            avatar: "SC",
            rating: 5
        },
        {
            name: "Marcus Rodriguez",
            role: "Lead Engineer",
            company: "StartupXYZ",
            content: "The AI-powered test generation is incredible. What used to take us weeks now happens in hours with better coverage.",
            avatar: "MR",
            rating: 5
        },
        {
            name: "Emily Johnson",
            role: "Product Manager",
            company: "ScaleApp",
            content: "Finally, a QA tool that speaks our language. The reporting features have revolutionized our stakeholder communications.",
            avatar: "EJ",
            rating: 5
        }
    ];

    const scrollToSection = (sectionId) => {
        const element = document.getElementById(sectionId);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
            setActiveSection(sectionId);
        }
    };

    const handleSignIn = () => {
        window.location.href = '/login';
    };

    const handleStartTrial = () => {
        window.location.href = '/register';
    };

    useEffect(() => {
        const handleScroll = () => {
            const sections = ['home', 'features', 'pricing', 'testimonials'];
            const scrollPosition = window.scrollY + 100;

            for (const section of sections) {
                const element = document.getElementById(section);
                if (element) {
                    const { offsetTop, offsetHeight } = element;
                    if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
                        setActiveSection(section);
                        break;
                    }
                }
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <div className="min-h-screen bg-white">
            {/* Navigation */}
            <nav className="fixed top-0 w-full bg-white/95 backdrop-blur-sm border-b border-slate-100 z-50">
                <div className="max-w-6xl mx-auto px-6">
                    <div className="flex justify-between items-center h-16">
                         <div className="flex items-center space-x-3">
                                <div className="w-12 h-12 flex items-center justify-center bg-primary/90 rounded-xl p-1">
                                    {/* Inline SVG Logo */}
                                    <img src="logo.svg" alt="FixMate Logo" className="w-12 h-12" />
                                </div>
                                <span className="text-xl font-bold text-slate-900">FixMate</span>
                            </div>


                        <div className="hidden md:flex items-center space-x-8">
                            {[
                                { id: 'home', label: 'Home' },
                                { id: 'features', label: 'Features' },
                                { id: 'pricing', label: 'Pricing' },
                                { id: 'testimonials', label: 'Reviews' }
                            ].map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => scrollToSection(item.id)}
                                    className={`relative font-medium transition-all duration-300 px-3 py-2 ${activeSection === item.id
                                        ? 'text-teal-600 font-semibold'
                                        : 'text-slate-600 hover:text-slate-900'
                                        }`}
                                >
                                    {activeSection === item.id && (
                                        <span className="absolute -left-2 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-teal-600 rounded-full transition-all duration-300 ease-in-out"></span>
                                    )}
                                    {item.label}
                                </button>
                            ))}
                        </div>

                        <div className="hidden md:flex items-center space-x-4">
                            <button
                                onClick={handleSignIn}
                                className="text-slate-700 hover:text-slate-900 font-medium transition-colors px-4 py-2 rounded-lg hover:bg-slate-50"
                            >
                                Sign In
                            </button>
                            <button
                                onClick={handleStartTrial}
                                className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded font-medium transition-all duration-200 hover:shadow-lg"
                            >
                                Start Free Trial
                            </button>
                        </div>

                        <button
                            className="md:hidden p-2 rounded-lg hover:bg-slate-50 transition-colors"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        >
                            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                {mobileMenuOpen && (
                    <div className="md:hidden bg-white border-t border-slate-100">
                        <div className="px-6 py-4 space-y-3">
                            {[
                                { id: 'home', label: 'Home' },
                                { id: 'features', label: 'Features' },
                                { id: 'pricing', label: 'Pricing' },
                                { id: 'testimonials', label: 'Reviews' }
                            ].map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => {
                                        scrollToSection(item.id);
                                        setMobileMenuOpen(false);
                                    }}
                                    className={`relative flex items-center w-full text-left font-medium py-2 px-3 rounded-lg transition-all duration-300 ${activeSection === item.id
                                        ? 'text-teal-600 font-semibold bg-teal-50'
                                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                                        }`}
                                >
                                    {activeSection === item.id && (
                                        <span className="absolute left-0 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-teal-600 rounded-full transition-all duration-300 ease-in-out"></span>
                                    )}
                                    <span className={activeSection === item.id ? 'ml-4' : ''}>
                                        {item.label}
                                    </span>
                                </button>
                            ))}
                            <div className="pt-3 space-y-3 border-t border-slate-100">
                                <button
                                    onClick={() => {
                                        handleSignIn();
                                        setMobileMenuOpen(false);
                                    }}
                                    className="block w-full text-left font-medium text-slate-600 py-2 px-3 rounded-lg hover:bg-slate-50 transition-colors"
                                >
                                    Sign In
                                </button>
                                <button
                                    onClick={() => {
                                        handleStartTrial();
                                        setMobileMenuOpen(false);
                                    }}
                                    className="w-full bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded font-medium transition-all duration-200 hover:shadow-lg"
                                >
                                    Start Free Trial
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </nav>

            {/* Hero Section */}
            <section id="home" className="pt-32 pb-24 bg-gradient-to-br from-slate-50 to-white">
                <div className="max-w-6xl mx-auto px-6">
                    <div className="text-center max-w-4xl mx-auto">
                        <div className="inline-flex items-center space-x-2 bg-white rounded-full px-4 py-2 mb-8 shadow-sm border border-slate-200">
                            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                            <span className="text-sm font-medium text-slate-700">AI-Powered QA Platform</span>
                        </div>

                        <h1 className="text-5xl md:text-7xl font-extrabold mb-8 leading-tight">
                            <span className="text-slate-900 mb-4 block">Quality Assurance</span>
                            <span className="bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">Reimagined</span>
                        </h1>

                        <p className="text-xl text-slate-600 mb-12 max-w-3xl mx-auto leading-relaxed">
                            Transform your testing workflow with AI-powered automation, intelligent bug tracking, and real-time insights that accelerate your development cycle.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
                            <button
                                onClick={handleStartTrial}
                                className="bg-teal-600 hover:bg-teal-700 text-white px-8 py-4 rounded font-medium transition-all duration-300 flex items-center space-x-2 hover:shadow-lg hover:scale-105"
                            >
                                <span>Start Free Trial</span>
                                <ArrowRight className="h-4 w-4" />
                            </button>
                            <button
                                onClick={() => scrollToSection('features')}
                                className="bg-white text-slate-900 px-8 py-4 rounded-lg font-medium border border-slate-300 hover:border-slate-400 transition-all duration-300 flex items-center space-x-2 hover:shadow-lg"
                            >
                                <Play className="h-4 w-4" />
                                <span>Watch Demo</span>
                            </button>
                        </div>

                        <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-slate-500">
                            <div className="flex items-center space-x-2">
                                <CheckCircle className="h-4 w-4 text-emerald-500" />
                                <span>14-day free trial</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <CheckCircle className="h-4 w-4 text-emerald-500" />
                                <span>No credit card required</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <CheckCircle className="h-4 w-4 text-emerald-500" />
                                <span>Cancel anytime</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <Features />

            {/* Pricing Section */}
            <section id="pricing" className="py-32">
                <div className="max-w-6xl mx-auto px-6">
                    <div className="text-center mb-20">
                        <div className="inline-flex items-center space-x-2 bg-slate-50 rounded-full px-4 py-2 mb-8 border border-slate-200">
                            <Star className="h-4 w-4 text-teal-600" />
                            <span className="text-sm font-medium text-slate-700">Pricing</span>
                        </div>
                        <h2 className="text-4xl md:text-5xl font-bold mb-6 text-slate-900">
                            Choose your plan
                        </h2>
                        <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-12">
                            Transparent pricing that grows with your team. All plans include our core features and dedicated support.
                        </p>

                        {/* Billing Toggle */}
                        <div className="inline-flex bg-slate-50 rounded-lg p-1 border border-slate-200">
                            <button
                                className={`px-6 py-2 rounded font-medium transition-colors ${billingCycle === "monthly"
                                    ? "bg-teal-600 text-white shadow-sm"
                                    : "text-slate-600 hover:text-slate-900"
                                    }`}
                                onClick={() => setBillingCycle("monthly")}
                            >
                                Monthly
                            </button>
                            <button
                                className={`px-6 py-2 rounded font-medium transition-colors relative ${billingCycle === "yearly"
                                    ? "bg-teal-600 text-white shadow-sm"
                                    : "text-slate-600 hover:text-slate-900"
                                    }`}
                                onClick={() => setBillingCycle("yearly")}
                            >
                                Yearly
                                <span className="absolute -top-2 -right-2 bg-emerald-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                                    Save 20%
                                </span>
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {pricingPlans.map((plan) => (
                            <div
                                key={plan.name}
                                className={`bg-white rounded-xl p-8 border transition-all duration-300 ${plan.recommended
                                    ? "border-teal-200 shadow-xl scale-105 ring-1 ring-teal-100"
                                    : "border-slate-200 hover:border-slate-300 hover:shadow-lg"
                                    }`}
                            >
                                {plan.recommended && (
                                    <div className="text-center mb-4">
                                        <span className="bg-teal-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                                            Most Popular
                                        </span>
                                    </div>
                                )}

                                <div className="text-center mb-8">
                                    <h3 className="text-2xl font-bold text-slate-900 mb-2">{plan.name}</h3>
                                    <p className="text-slate-600 mb-6">{plan.description}</p>
                                    <div className="mb-4">
                                        <span className="text-5xl font-bold text-slate-900">{plan.price[billingCycle]}</span>
                                        {plan.price[billingCycle] !== "Custom" && (
                                            <span className="text-slate-500 ml-2">
                                                {billingCycle === "monthly" ? "/mo" : "/yr"}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <ul className="space-y-4 mb-8">
                                    {plan.features.map((feature, i) => (
                                        <li key={i} className="flex items-start space-x-3">
                                            <CheckCircle className="h-5 w-5 mt-0.5 flex-shrink-0 text-emerald-500" />
                                            <span className="text-slate-600">{feature}</span>
                                        </li>
                                    ))}
                                </ul>

                                <button
                                    onClick={plan.name === "Enterprise" ? () => window.location.href = '/contact' : handleStartTrial}
                                    className={`w-full py-3 px-6 rounded font-medium transition-all duration-300 ${plan.recommended
                                        ? "bg-teal-600 hover:bg-teal-700 text-white hover:shadow-lg"
                                        : "bg-slate-50 text-slate-900 hover:bg-slate-100 border border-slate-200"
                                        }`}
                                >
                                    {plan.name === "Enterprise" ? "Contact Sales" : "Start Free Trial"}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Testimonials Section */}
            <section id="testimonials" className="py-32 bg-slate-50">
                <div className="max-w-6xl mx-auto px-6">
                    <div className="text-center mb-20">
                        <div className="inline-flex items-center space-x-2 bg-white rounded-full px-4 py-2 mb-8 shadow-sm">
                            <Users className="h-4 w-4 text-teal-600" />
                            <span className="text-sm font-medium text-slate-700">Testimonials</span>
                        </div>
                        <h2 className="text-4xl md:text-5xl font-bold mb-6 text-slate-900">
                            Trusted by teams worldwide
                        </h2>
                        <p className="text-xl text-slate-600 max-w-2xl mx-auto">
                            See how leading companies are transforming their QA processes with QAID
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {testimonials.map((testimonial, index) => (
                            <div key={index} className="bg-white rounded-xl p-8 border border-slate-200 hover:border-slate-300 transition-all duration-300 hover:shadow-lg">
                                <div className="flex items-center mb-6">
                                    <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-700 font-semibold mr-4">
                                        {testimonial.avatar}
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-slate-900">{testimonial.name}</h4>
                                        <p className="text-slate-600 text-sm">{testimonial.role}</p>
                                        <p className="text-slate-500 text-sm">{testimonial.company}</p>
                                    </div>
                                </div>

                                <div className="flex mb-4">
                                    {[...Array(testimonial.rating)].map((_, i) => (
                                        <Star key={i} className="h-4 w-4 text-amber-400 fill-current" />
                                    ))}
                                </div>

                                <p className="text-slate-700 leading-relaxed">&quot;{testimonial.content}&quot;</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-32 bg-teal-600">
                <div className="max-w-4xl mx-auto px-6 text-center">
                    <h2 className="text-4xl md:text-5xl font-bold text-white mb-8 leading-tight">
                        Ready to transform your QA process?
                    </h2>
                    <p className="text-xl text-teal-100 mb-12 max-w-2xl mx-auto">
                        Join thousands of teams already using QAID to ship better software faster.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button
                            onClick={handleStartTrial}
                            className="bg-white text-teal-600 px-8 py-4 rounded font-medium hover:bg-slate-50 transition-all duration-300 hover:shadow-lg"
                        >
                            Start Free Trial
                        </button>
                        <button
                            onClick={() => window.location.href = '/demo'}
                            className="bg-transparent text-white px-8 py-4 rounded-lg font-medium border border-white hover:bg-white hover:text-teal-600 transition-all duration-300"
                        >
                            Schedule Demo
                        </button>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-slate-50 py-16">
                <div className="max-w-6xl mx-auto px-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        <div className="col-span-1 md:col-span-2">
                            <div className="flex items-center space-x-3">
                                <div className="w-12 h-12 flex items-center bg-primary/90 rounded-xl p-1 justify-center">
                                    {/* Inline SVG Logo */}
                                    <img src="logo.svg" alt="FixMate Logo" className="w-12 h-12" />
                                </div>
                                <span className="text-xl font-bold text-slate-900">FixMate</span>
                            </div>
                            <p className="text-slate-600 mb-6 max-w-md">
                                Empowering teams to deliver exceptional software through intelligent quality assurance and testing automation.
                            </p>
                            <div className="flex space-x-4">
                                <button className="bg-slate-200 p-2 rounded-lg hover:bg-slate-300 transition-colors">
                                    <Mail className="h-4 w-4 text-slate-600" />
                                </button>
                            </div>
                        </div>
                        <div>
                            <h4 className="font-semibold text-slate-900 mb-4">Product</h4>
                            <ul className="space-y-2">
                                <li><a href="#" className="text-slate-600 hover:text-slate-900 transition-colors">Features</a></li>
                                <li><a href="#" className="text-slate-600 hover:text-slate-900 transition-colors">Pricing</a></li>
                                <li><a href="#" className="text-slate-600 hover:text-slate-900 transition-colors">Integrations</a></li>
                                <li><a href="#" className="text-slate-600 hover:text-slate-900 transition-colors">API</a></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-semibold text-slate-900 mb-4">Support</h4>
                            <ul className="space-y-2">
                                <li><a href="#" className="text-slate-600 hover:text-slate-900 transition-colors">Documentation</a></li>
                                <li><a href="#" className="text-slate-600 hover:text-slate-900 transition-colors">Help Center</a></li>
                                <li><a href="#" className="text-slate-600 hover:text-slate-900 transition-colors">Contact</a></li>
                                <li><a href="#" className="text-slate-600 hover:text-slate-900 transition-colors">Status</a></li>
                            </ul>
                        </div>
                    </div>

                    <div className="border-t border-slate-200 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
                        <p className="text-slate-500">© 2025 QAID. All rights reserved.</p>
                        <div className="flex space-x-6 mt-4 md:mt-0">
                            <a href="#" className="text-slate-500 hover:text-slate-700 transition-colors">Privacy</a>
                            <a href="#" className="text-slate-500 hover:text-slate-700 transition-colors">Terms</a>
                            <a href="#" className="text-slate-500 hover:text-slate-700 transition-colors">Security</a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Home;