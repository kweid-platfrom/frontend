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
import Image from "next/image";
import { useGlobalTheme } from '../providers/GlobalThemeProvider';
import ThemeToggle from '../components/common/ThemeToggle';

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
        <section id="features" className="py-16 sm:py-20 lg:py-32 bg-muted">
            <div className="max-w-6xl mx-auto px-4 sm:px-6">
                <div className="text-center mb-12 sm:mb-16 lg:mb-20">
                    <div className="inline-flex items-center space-x-2 bg-card rounded-full px-3 sm:px-4 py-1.5 sm:py-2 mb-6 sm:mb-8 shadow-theme-sm border border-border">
                        <Target className="h-3 sm:h-4 w-3 sm:w-4 text-teal-600" />
                        <span className="text-xs sm:text-sm font-medium text-muted-foreground">Features</span>
                    </div>
                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4 sm:mb-6 leading-tight">
                        Everything you need <br className="hidden sm:block" />for quality assurance
                    </h2>
                    <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
                        Advanced tools that adapt to your team&apos;s needs and scale with your growth
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
                    {features.map((feature, index) => (
                        <div key={index} className="group">
                            <div className="bg-card p-6 sm:p-8 rounded-xl border border-border hover:border-orange-200 dark:hover:border-orange-600 transition-all duration-300 hover:shadow-theme-lg">
                                <div className="inline-flex p-3 bg-muted rounded-xl text-muted-foreground mb-4 sm:mb-6 group-hover:bg-orange-50 dark:group-hover:bg-orange-900/20 group-hover:text-orange-700 dark:group-hover:text-orange-300 transition-colors">
                                    {feature.icon}
                                </div>
                                <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-3 sm:mb-4">{feature.title}</h3>
                                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
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
    const { isInitialized } = useGlobalTheme();

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

    // Show loading state until theme is initialized
    if (!isInitialized) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-teal-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background transition-colors duration-200">
            {/* Navigation */}
            <nav className="fixed top-0 w-full bg-background/95 backdrop-blur-sm border-b border-border z-50 transition-colors duration-200">
                <div className="max-w-6xl mx-auto px-4 sm:px-6">
                    <div className="flex justify-between items-center h-14 sm:h-16">
                        <div className="flex items-center">
                            <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 flex items-center justify-center rounded-xl p-1">
                                <Image src="/logo.svg" alt="Assura Logo" width={128} height={128} className="w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32" />
                            </div>
                        </div>

                        <div className="hidden md:flex items-center space-x-6 lg:space-x-8">
                            {[
                                { id: 'home', label: 'Home' },
                                { id: 'features', label: 'Features' },
                                { id: 'pricing', label: 'Pricing' },
                                { id: 'testimonials', label: 'Reviews' }
                            ].map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => scrollToSection(item.id)}
                                    className={`relative font-medium transition-all duration-300 px-3 py-2 text-sm lg:text-base ${activeSection === item.id
                                        ? 'text-teal-600 font-semibold'
                                        : 'text-muted-foreground hover:text-foreground'
                                        }`}
                                >
                                    {activeSection === item.id && (
                                        <span className="absolute -left-2 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-orange-500 rounded-full transition-all duration-300 ease-in-out"></span>
                                    )}
                                    {item.label}
                                </button>
                            ))}
                        </div>

                        <div className="hidden md:flex items-center space-x-2 lg:space-x-4">
                            <ThemeToggle className="text-muted-foreground hover:text-foreground" />
                            <button
                                onClick={handleSignIn}
                                className="text-muted-foreground hover:text-foreground font-medium transition-colors px-3 lg:px-4 py-2 rounded-lg hover:bg-muted text-sm lg:text-base"
                            >
                                Sign In
                            </button>
                            <button
                                onClick={handleStartTrial}
                                className="bg-teal-600 hover:bg-teal-700 text-white px-4 lg:px-6 py-2 rounded-lg font-medium transition-all duration-200 hover:shadow-theme-lg text-sm lg:text-base"
                            >
                                Start Free Trial
                            </button>
                        </div>

                        <button
                            className="md:hidden p-2 rounded-lg hover:bg-muted transition-colors"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        >
                            {mobileMenuOpen ? <X className="h-5 w-5 text-foreground" /> : <Menu className="h-5 w-5 text-foreground" />}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                {mobileMenuOpen && (
                    <div className="md:hidden bg-background border-t border-border transition-colors duration-200">
                        <div className="px-4 sm:px-6 py-4 space-y-3">
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
                                        ? 'text-teal-600 font-semibold bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-600'
                                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                                        }`}
                                >
                                    {activeSection === item.id && (
                                        <span className="absolute left-0 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-orange-500 rounded-full transition-all duration-300 ease-in-out"></span>
                                    )}
                                    <span className={activeSection === item.id ? 'ml-4' : ''}>
                                        {item.label}
                                    </span>
                                </button>
                            ))}
                            <div className="pt-3 space-y-3 border-t border-border">
                                <div className="flex items-center justify-between px-3 py-2">
                                    <span className="text-sm font-medium text-muted-foreground">Theme</span>
                                    <ThemeToggle size="small" />
                                </div>
                                <button
                                    onClick={() => {
                                        handleSignIn();
                                        setMobileMenuOpen(false);
                                    }}
                                    className="block w-full text-left font-medium text-muted-foreground hover:text-foreground py-2 px-3 rounded-lg hover:bg-muted transition-colors"
                                >
                                    Sign In
                                </button>
                                <button
                                    onClick={() => {
                                        handleStartTrial();
                                        setMobileMenuOpen(false);
                                    }}
                                    className="w-full bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 hover:shadow-theme-lg border border-orange-200 hover:border-orange-300"
                                >
                                    Start Free Trial
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </nav>

            {/* Hero Section */}
            <section id="home" className="pt-20 sm:pt-24 lg:pt-32 pb-16 sm:pb-20 lg:pb-24 bg-gradient-to-br from-background to-muted transition-colors duration-200">
                <div className="max-w-6xl mx-auto px-4 sm:px-6">
                    <div className="text-center max-w-4xl mx-auto">
                        <div className="inline-flex items-center space-x-2 bg-card rounded-full px-3 sm:px-4 py-1.5 sm:py-2 mb-6 sm:mb-8 shadow-theme-sm border border-border">
                            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                            <span className="text-xs sm:text-sm font-medium text-muted-foreground">AI-Powered QA Platform</span>
                        </div>

                        <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold mb-6 sm:mb-8 leading-tight">
                            <span className="text-foreground mb-2 sm:mb-4 block">Quality Assurance</span>
                            <span className="bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">Reimagined</span>
                        </h1>

                        <p className="text-base sm:text-lg lg:text-xl text-muted-foreground mb-8 sm:mb-12 max-w-3xl mx-auto leading-relaxed px-4">
                            Transform your testing workflow with AI-powered automation, intelligent bug tracking, and real-time insights that accelerate your development cycle.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center mb-12 sm:mb-16 px-4">
                            <button
                                onClick={handleStartTrial}
                                className="w-full sm:w-auto bg-teal-600 hover:bg-teal-700 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-medium transition-all duration-300 flex items-center justify-center space-x-2 hover:shadow-theme-lg hover:scale-105"
                            >
                                <span>Start Free Trial</span>
                                <ArrowRight className="h-4 w-4" />
                            </button>
                            <button
                                onClick={() => scrollToSection('features')}
                                className="w-full sm:w-auto bg-card text-foreground px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-medium border border-orange-200 dark:border-orange-600 hover:border-orange-300 dark:hover:border-orange-500 transition-all duration-300 flex items-center justify-center space-x-2 hover:shadow-theme-lg hover:bg-orange-50 dark:hover:bg-orange-900/20"
                            >
                                <Play className="h-4 w-4" />
                                <span>Watch Demo</span>
                            </button>
                        </div>

                        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-xs sm:text-sm text-muted-foreground px-4">
                            <div className="flex items-center space-x-2">
                                <CheckCircle className="h-3 sm:h-4 w-3 sm:w-4 text-emerald-500" />
                                <span>14-day free trial</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <CheckCircle className="h-3 sm:h-4 w-3 sm:w-4 text-emerald-500" />
                                <span>No credit card required</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <CheckCircle className="h-3 sm:h-4 w-3 sm:w-4 text-emerald-500" />
                                <span>Cancel anytime</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <Features />

            {/* Pricing Section */}
            <section id="pricing" className="py-16 sm:py-20 lg:py-32 bg-background transition-colors duration-200">
                <div className="max-w-6xl mx-auto px-4 sm:px-6">
                    <div className="text-center mb-12 sm:mb-16 lg:mb-20">
                        <div className="inline-flex items-center space-x-2 bg-muted rounded-full px-3 sm:px-4 py-1.5 sm:py-2 mb-6 sm:mb-8 border border-border">
                            <Star className="h-3 sm:h-4 w-3 sm:w-4 text-teal-600" />
                            <span className="text-xs sm:text-sm font-medium text-muted-foreground">Pricing</span>
                        </div>
                        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6 text-foreground">
                            Choose your plan
                        </h2>
                        <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 sm:mb-12 px-4">
                            Transparent pricing that grows with your team. All plans include our core features and dedicated support.
                        </p>

                        {/* Billing Toggle */}
                        <div className="inline-flex bg-muted rounded-lg p-1 border border-border">
                            <button
                                className={`px-4 sm:px-6 py-2 rounded-lg font-medium transition-colors text-sm sm:text-base ${billingCycle === "monthly"
                                    ? "bg-teal-600 text-white shadow-theme-sm"
                                    : "text-muted-foreground hover:text-foreground"
                                    }`}
                                onClick={() => setBillingCycle("monthly")}
                            >
                                Monthly
                            </button>
                            <button
                                className={`px-4 sm:px-6 py-2 rounded-lg font-medium transition-colors relative text-sm sm:text-base ${billingCycle === "yearly"
                                    ? "bg-teal-600 text-white shadow-theme-sm"
                                    : "text-muted-foreground hover:text-foreground"
                                    }`}
                                onClick={() => setBillingCycle("yearly")}
                            >
                                Yearly
                                <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                                    Save 20%
                                </span>
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                        {pricingPlans.map((plan) => (
                            <div
                                key={plan.name}
                                className={`bg-card rounded-xl p-6 sm:p-8 border transition-all duration-300 ${plan.recommended
                                    ? "border-orange-200 dark:border-orange-600 shadow-theme-xl scale-105 ring-1 ring-orange-100 dark:ring-orange-600"
                                    : "border-border hover:border-orange-200 dark:hover:border-orange-600 hover:shadow-theme-lg"
                                    }`}
                            >
                                {plan.recommended && (
                                    <div className="text-center mb-4">
                                        <span className="bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                                            Most Popular
                                        </span>
                                    </div>
                                )}

                                <div className="text-center mb-8">
                                    <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-2">{plan.name}</h3>
                                    <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6">{plan.description}</p>
                                    <div className="mb-4">
                                        <span className="text-4xl sm:text-5xl font-bold text-foreground">{plan.price[billingCycle]}</span>
                                        {plan.price[billingCycle] !== "Custom" && (
                                            <span className="text-muted-foreground ml-2 text-sm sm:text-base">
                                                {billingCycle === "monthly" ? "/mo" : "/yr"}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <ul className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
                                    {plan.features.map((feature, i) => (
                                        <li key={i} className="flex items-start space-x-3">
                                            <CheckCircle className="h-4 sm:h-5 w-4 sm:w-5 mt-0.5 flex-shrink-0 text-emerald-500" />
                                            <span className="text-sm sm:text-base text-muted-foreground">{feature}</span>
                                        </li>
                                    ))}
                                </ul>

                                <button
                                    onClick={plan.name === "Enterprise" ? () => window.location.href = '/contact' : handleStartTrial}
                                    className={`w-full py-3 px-6 rounded-lg font-medium transition-all duration-300 text-sm sm:text-base ${plan.recommended
                                        ? "bg-teal-600 hover:bg-teal-700 text-white hover:shadow-theme-lg"
                                        : "bg-muted text-foreground hover:bg-orange-50 dark:hover:bg-orange-900/20 border border-border"
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
            <section id="testimonials" className="py-16 sm:py-20 lg:py-32 bg-muted transition-colors duration-200">
                <div className="max-w-6xl mx-auto px-4 sm:px-6">
                    <div className="text-center mb-12 sm:mb-16 lg:mb-20">
                        <div className="inline-flex items-center space-x-2 bg-card rounded-full px-3 sm:px-4 py-1.5 sm:py-2 mb-6 sm:mb-8 shadow-theme-sm border border-border">
                            <Users className="h-3 sm:h-4 w-3 sm:w-4 text-teal-600" />
                            <span className="text-xs sm:text-sm font-medium text-muted-foreground">Testimonials</span>
                        </div>
                        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6 text-foreground">
                            Trusted by teams worldwide
                        </h2>
                        <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
                            See how leading companies are transforming their QA processes with QAID
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                        {testimonials.map((testimonial, index) => (
                            <div key={index} className="bg-card rounded-xl p-6 sm:p-8 border border-border hover:border-orange-200 dark:hover:border-orange-600 transition-all duration-300 hover:shadow-theme-lg">
                                <div className="flex items-center mb-4 sm:mb-6">
                                    <div className="w-10 sm:w-12 h-10 sm:h-12 bg-muted rounded-xl flex items-center justify-center text-muted-foreground font-semibold mr-3 sm:mr-4 text-sm sm:text-base">
                                        {testimonial.avatar}
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-foreground text-sm sm:text-base">{testimonial.name}</h4>
                                        <p className="text-muted-foreground text-xs sm:text-sm">{testimonial.role}</p>
                                        <p className="text-muted-foreground text-xs sm:text-sm">{testimonial.company}</p>
                                    </div>
                                </div>

                                <div className="flex mb-3 sm:mb-4">
                                    {[...Array(testimonial.rating)].map((_, i) => (
                                        <Star key={i} className="h-3 sm:h-4 w-3 sm:w-4 text-amber-400 fill-current" />
                                    ))}
                                </div>

                                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">&quot;{testimonial.content}&quot;</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-16 sm:py-20 lg:py-32 bg-teal-600 dark:bg-teal-700 transition-colors duration-200">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6 sm:mb-8 leading-tight">
                        Ready to transform your QA process?
                    </h2>
                    <p className="text-lg sm:text-xl text-teal-100 mb-8 sm:mb-12 max-w-2xl mx-auto px-4">
                        Join thousands of teams already using QAID to ship better software faster.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
                        <button
                            onClick={handleStartTrial}
                            className="w-full sm:w-auto bg-white text-teal-600 px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-medium hover:bg-gray-50 transition-all duration-300 hover:shadow-theme-lg border hover:border-orange-300"
                        >
                            Start Free Trial
                        </button>
                        <button
                            onClick={() => window.location.href = '/demo'}
                            className="w-full sm:w-auto bg-transparent text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-medium border border-white hover:bg-white hover:text-teal-600 transition-all duration-300"
                        >
                            Schedule Demo
                        </button>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-muted py-12 sm:py-16 transition-colors duration-200">
                <div className="max-w-6xl mx-auto px-4 sm:px-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 sm:gap-8">
                        <div className="col-span-1 md:col-span-2">
                            <div className="flex items-center mb-4 sm:mb-6">
                                <div className="w-24 h-24 sm:w-32 sm:h-32 flex items-center rounded-xl p-1 justify-center">
                                    <Image src="/logo.svg" alt="Assura Logo" width={128} height={128} className="w-24 h-24 sm:w-32 sm:h-32" />
                                </div>
                            </div>
                            <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6 max-w-md">
                                Empowering teams to deliver exceptional software through intelligent quality assurance and testing automation.
                            </p>
                            <div className="flex space-x-4">
                                <button className="bg-background hover:bg-orange-50 dark:hover:bg-orange-900/20 p-2 rounded-lg transition-colors border border-orange-200 dark:border-orange-600 hover:border-orange-300 dark:hover:border-orange-500">
                                    <Mail className="h-4 w-4 text-muted-foreground hover:text-orange-600 dark:hover:text-orange-400" />
                                </button>
                            </div>
                        </div>
                        <div>
                            <h4 className="font-semibold text-foreground mb-3 sm:mb-4 text-sm sm:text-base">Product</h4>
                            <ul className="space-y-2">
                                <li><a href="#" className="text-sm sm:text-base text-muted-foreground hover:text-foreground hover:text-orange-600 dark:hover:text-orange-400 transition-colors">Features</a></li>
                                <li><a href="#" className="text-sm sm:text-base text-muted-foreground hover:text-foreground hover:text-orange-600 dark:hover:text-orange-400 transition-colors">Pricing</a></li>
                                <li><a href="#" className="text-sm sm:text-base text-muted-foreground hover:text-foreground hover:text-orange-600 dark:hover:text-orange-400 transition-colors">Integrations</a></li>
                                <li><a href="#" className="text-sm sm:text-base text-muted-foreground hover:text-foreground hover:text-orange-600 dark:hover:text-orange-400 transition-colors">API</a></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-semibold text-foreground mb-3 sm:mb-4 text-sm sm:text-base">Support</h4>
                            <ul className="space-y-2">
                                <li><a href="#" className="text-sm sm:text-base text-muted-foreground hover:text-foreground hover:text-orange-600 dark:hover:text-orange-400 transition-colors">Documentation</a></li>
                                <li><a href="#" className="text-sm sm:text-base text-muted-foreground hover:text-foreground hover:text-orange-600 dark:hover:text-orange-400 transition-colors">Help Center</a></li>
                                <li><a href="#" className="text-sm sm:text-base text-muted-foreground hover:text-foreground hover:text-orange-600 dark:hover:text-orange-400 transition-colors">Contact</a></li>
                                <li><a href="#" className="text-sm sm:text-base text-muted-foreground hover:text-foreground hover:text-orange-600 dark:hover:text-orange-400 transition-colors">Status</a></li>
                            </ul>
                        </div>
                    </div>

                    <div className="border-t border-border mt-8 sm:mt-12 pt-6 sm:pt-8 flex flex-col md:flex-row justify-between items-center transition-colors">
                        <p className="text-sm sm:text-base text-muted-foreground">© 2025 Assura. All rights reserved.</p>
                        <div className="flex space-x-4 sm:space-x-6 mt-4 md:mt-0">
                            <a href="#" className="text-sm sm:text-base text-muted-foreground hover:text-foreground hover:text-orange-600 dark:hover:text-orange-400 transition-colors">Privacy</a>
                            <a href="#" className="text-sm sm:text-base text-muted-foreground hover:text-foreground hover:text-orange-600 dark:hover:text-orange-400 transition-colors">Terms</a>
                            <a href="#" className="text-sm sm:text-base text-muted-foreground hover:text-foreground hover:text-orange-600 dark:hover:text-orange-400 transition-colors">Security</a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Home;