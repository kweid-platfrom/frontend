"use client"

import React, { useState } from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

const ContactSalesPage = () => {
    const [formData, setFormData] = useState({ name: '', email: '', message: '' });
    const [errors, setErrors] = useState({});

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const validateForm = () => {
        let newErrors = {};
        if (!formData.name) newErrors.name = "Name is required";
        if (!formData.email) newErrors.email = "Email is required";
        else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Invalid email format";
        if (!formData.message) newErrors.message = "Message is required";
        return newErrors;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const newErrors = validateForm();
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
        } else {
            setErrors({});
            console.log("Form Submitted:", formData);
            alert("Your inquiry has been submitted!");
            setFormData({ name: '', email: '', message: '' });
        }
    };

    return (
        <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-grow container mx-auto px-4 py-12">
                <h1 className="text-3xl font-bold mb-4">Contact Sales</h1>
                <p className="mb-6">
                    Please fill out the form below to get in touch with our sales team.
                </p>

                {/* Contact Form */}
                <form onSubmit={handleSubmit} className="max-w-md">
                    <div className="mb-4">
                        <label htmlFor="name" className="block text-gray-700 text-sm font-bold mb-2">
                            Name:
                        </label>
                        <input
                            type="text"
                            id="name"
                            value={formData.name}
                            onChange={handleChange}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            placeholder="Your Name"
                        />
                        {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
                    </div>
                    <div className="mb-4">
                        <label htmlFor="email" className="block text-gray-700 text-sm font-bold mb-2">
                            Email:
                        </label>
                        <input
                            type="email"
                            id="email"
                            value={formData.email}
                            onChange={handleChange}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            placeholder="Your Email"
                        />
                        {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}
                    </div>
                    <div className="mb-4">
                        <label htmlFor="message" className="block text-gray-700 text-sm font-bold mb-2">
                            Message:
                        </label>
                        <textarea
                            id="message"
                            value={formData.message}
                            onChange={handleChange}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            placeholder="Your Message"
                            rows="4"
                        />
                        {errors.message && <p className="text-red-500 text-sm">{errors.message}</p>}
                    </div>
                    <button
                        type="submit"
                        className="bg-[#00897B] hover:bg-[#00695C] text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                    >
                        Submit Inquiry
                    </button>
                </form>
            </main>
            <Footer />
        </div>
    );
};

export default ContactSalesPage;
