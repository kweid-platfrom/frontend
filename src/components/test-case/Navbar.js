import React from 'react';

const Navbar = () => {
    return (
        <nav className="bg-gray-800 text-white p-4">
            <div className="container mx-auto flex justify-between items-center">
                <div className="text-xl font-bold">TestCasePro</div>
                <div className="flex space-x-4">
                    <a href="#" className="hover:text-gray-300">Dashboard</a>
                    <a href="#" className="hover:text-gray-300">Test Cases</a>
                    <a href="#" className="hover:text-gray-300">Automation</a>
                    <a href="#" className="hover:text-gray-300">Reports</a>
                    <a href="#" className="hover:text-gray-300">Settings</a>
                </div>
                <div>
                    <span className="mr-2">John Doe</span>
                    <button className="bg-gray-700 p-2 rounded-full">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                        </svg>
                    </button>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;