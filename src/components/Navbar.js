// components/Navbar.jsx
"use client";

import React, { useState } from 'react';
import Link from 'next/link';

const Navbar = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    return (
        <nav className="bg-white shadow-sm sticky top-0 z-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex items-center">
                        <Link href="/" className="text-2xl font-bold text-[#00897B] hover:text-[#00796B] transition-colors">
                            LOGO
                        </Link>
                    </div>
                    
                    {/* Desktop Menu */}
                    <div className="hidden md:flex items-center space-x-8">
                        <Link href="/features" className="text-[#4A4B53] hover:text-[#00897B] transition-colors">
                            Features
                        </Link>
                        <Link href="/pricing" className="text-[#4A4B53] hover:text-[#00897B] transition-colors">
                            Pricing
                        </Link>
                        <Link href="/docs" className="text-[#4A4B53] hover:text-[#00897B] transition-colors">
                            Documentation
                        </Link>
                        <Link href="/login" className="text-[#00897B] font-medium hover:text-[#00796B] transition-colors">
                            Login
                        </Link>
                        <Link href="/register" className="bg-[#00897B] text-white px-4 py-2 rounded-xs hover:bg-[#00796B] transition-colors">
                            Sign Up Free
                        </Link>
                    </div>
                    
                    {/* Mobile Menu Button */}
                    <div className="md:hidden flex items-center">
                        <button 
                            className="text-[#4A4B53] hover:text-[#00897B]"
                            onClick={toggleMenu}
                            aria-label="Toggle menu"
                        >
                            {isMenuOpen ? (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>
            </div>
            
            {/* Mobile Menu */}
            {isMenuOpen && (
                <div className="md:hidden bg-white border-t border-gray-100 py-2">
                    <div className="flex flex-col space-y-2 px-4 pb-3 pt-2">
                        <Link 
                            href="/features" 
                            className="text-[#4A4B53] hover:text-[#00897B] transition-colors py-2"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            Features
                        </Link>
                        <Link 
                            href="/pricing" 
                            className="text-[#4A4B53] hover:text-[#00897B] transition-colors py-2"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            Pricing
                        </Link>
                        <Link 
                            href="/docs" 
                            className="text-[#4A4B53] hover:text-[#00897B] transition-colors py-2"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            Documentation
                        </Link>
                        <Link 
                            href="/login" 
                            className="text-[#00897B] font-medium hover:text-[#00796B] transition-colors py-2"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            Login
                        </Link>
                        <Link 
                            href="/register" 
                            className="bg-[#00897B] text-white px-4 py-2 rounded hover:bg-[#00796B] transition-colors text-center mt-2"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            Sign Up Free
                        </Link>
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;