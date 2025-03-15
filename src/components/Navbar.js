"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const Navbar = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const pathname = usePathname();

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    const navItems = [
        { name: "Features", path: "/features" },
        { name: "Pricing", path: "/pricing" },
        { name: "Documentation", path: "/docs" },
        { name: "Login", path: "/login" },
    ];

    return (
        <nav className="bg-white shadow-sm sticky top-0 z-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16 items-center">
                    <Link
                        href="/"
                        className="text-2xl font-bold text-[#00897B] hover:text-[#00796B] transition-colors"
                    >
                        LOGO
                    </Link>

                    {/* Desktop Menu */}
                    <div className="hidden md:flex items-center space-x-6">
                        {navItems.map(({ name, path }) => (
                            <Link key={path} href={path} className="relative flex items-center">
                                {/* Active Menu Indicator */}
                                {pathname === path && (
                                    <span className="absolute -left-4 w-3 h-3 bg-[#00897B] rounded-full transition-all duration-300 ease-in-out"></span>
                                )}
                                <span
                                    className={`px-4 py-2 transition-all duration-300 font-medium ${
                                        pathname === path
                                            ? "text-[#00897B] font-semibold"
                                            : "text-[#4A4B53] hover:text-[#00897B]"
                                    }`}
                                >
                                    {name}
                                </span>
                            </Link>
                        ))}
                        <Link
                            href="/register"
                            className="bg-[#00897B] text-white px-4 py-2 rounded-xs hover:bg-[#00796B] transition-colors"
                        >
                            Sign Up Free
                        </Link>
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden flex items-center">
                        <button className="text-[#4A4B53] hover:text-[#00897B]" onClick={toggleMenu}>
                            {isMenuOpen ? (
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            ) : (
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                        {navItems.map(({ name, path }) => (
                            <Link key={path} href={path} className="relative flex items-center" onClick={() => setIsMenuOpen(false)}>
                                {/* Active Menu Indicator for Mobile */}
                                {pathname === path && (
                                    <span className="absolute -left-4 w-3 h-3 bg-[#00897B] rounded-full transition-all duration-300 ease-in-out"></span>
                                )}
                                <span
                                    className={`px-4 transition-all duration-300 font-medium ${
                                        pathname === path
                                            ? "text-[#00897B] font-semibold"
                                            : "text-[#4A4B53] hover:text-[#00897B]"
                                    }`}
                                >
                                    {name}
                                </span>
                            </Link>
                        ))}
                        <Link href="/register" className="bg-[#00897B] text-white px-4 py-2 rounded-xs hover:bg-[#00796B] transition-colors text-center mt-2" onClick={() => setIsMenuOpen(false)}>
                            Sign Up Free
                        </Link>
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
