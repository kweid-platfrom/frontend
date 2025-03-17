"use client"; // Ensure this runs on the client side

import React, { useEffect, useState } from "react";
import { auth } from "../config/firebase";
import { onAuthStateChanged, updateProfile } from "firebase/auth";

const ProfileSection = () => {
    const [user, setUser] = useState(null);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        bio: "",
        website: "",
        location: "",
    });

    // Listen for authentication changes
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                setFormData({
                    name: currentUser.displayName || "",
                    email: currentUser.email || "",
                    phone: currentUser.phoneNumber || "",
                    bio: "", // Can be stored in Firestore
                    website: "",
                    location: "",
                });
            } else {
                setUser(null);
            }
        });

        return () => unsubscribe();
    }, []);

    // Handle form input changes
    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    // Handle profile update in Firebase
    const handleUpdateProfile = async () => {
        try {
            if (user) {
                await updateProfile(user, {
                    displayName: formData.name,
                    phoneNumber: formData.phone,
                });
                alert("Profile updated successfully!");
            }
        } catch (error) {
            console.error("Error updating profile:", error);
        }
    };

    return (
        <section id="profile" className="mb-8">
            <h3 className="text-lg font-medium mb-4">Profile Information</h3>
            <div className="space-y-4">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                        Full Name
                    </label>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border bg-[#f2f2f2] rounded focus:outline-none focus:ring-[#00897B]"
                    />
                </div>
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                        Email Address
                    </label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        disabled
                        className="w-full px-3 py-2 border bg-[#f2f2f2] rounded focus:outline-none focus:ring-[#00897B]"
                    />
                </div>
                <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                        Phone Number
                    </label>
                    <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-[#00897B]"
                        placeholder="(123) 456-7890"
                    />
                </div>
                <div>
                    <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
                        Bio
                    </label>
                    <textarea
                        id="bio"
                        name="bio"
                        value={formData.bio}
                        onChange={handleChange}
                        rows="4"
                        className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-[#00897B]"
                        placeholder="Tell us a bit about yourself..."
                    ></textarea>
                </div>
                <div>
                    <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-1">
                        Website
                    </label>
                    <input
                        type="url"
                        id="website"
                        name="website"
                        value={formData.website}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-[#00897B]"
                        placeholder="https://example.com"
                    />
                </div>
                <div>
                    <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                        Location
                    </label>
                    <input
                        type="text"
                        id="location"
                        name="location"
                        value={formData.location}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-[#00897B]"
                        placeholder="City, State"
                    />
                </div>
                <button
                    onClick={handleUpdateProfile}
                    className="px-4 py-2 bg-[#00897B] text-white rounded hover:bg-[#006f5f] transition"
                >
                    Update Profile
                </button>
            </div>
        </section>
    );
};

export default ProfileSection;
