"use client";

import React from "react";
import Link from "next/link";

const Home = () => {
    return (
        <div className="min-h-screen flex flex-col">
            {/* Navbar */}
            <nav className="bg-green-700 text-white p-4 flex justify-between items-center">
                <div className="text-xl font-bold">LOGO</div>
                <div className="space-x-4 hidden md:flex">
                    <Link href="/about" className="hover:underline">About</Link>
                    <Link href="/services" className="hover:underline">Services</Link>
                    <Link href="/contact" className="hover:underline">Contact</Link>
                </div>
                <div className="md:hidden">
                    {/* Mobile Menu Button */}
                    <button className="p-2">☰</button>
                </div>
            </nav>

            {/* Main Content */}
            <div className="flex flex-col items-center justify-center flex-1 text-center p-6">
                <h1 className="text-4xl font-bold mb-4">Welcome to Our Platform</h1>
                <p className="text-lg mb-6">Your one-stop solution for test case management and defect tracking.</p>

                <div className="space-x-4">
                    <Link href="/register" className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Register</Link>
                    <Link href="/login" className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">Login</Link>
                    <Link href="/get-started" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Get Started</Link>
                </div>
            </div>
        </div>
    );
};

export default Home;
