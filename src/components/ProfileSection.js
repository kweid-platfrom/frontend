"use client"; // Ensure this runs on the client side

import React, { useEffect, useState } from "react";
import { auth, db } from "../config/firebase";
import { onAuthStateChanged, updateProfile } from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";

const ProfileSection = () => {
    const [user, setUser] = useState(null);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        bio: "",
        location: "",
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ text: "", type: "" });

    // Listen for authentication changes and fetch user data
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                
                // Set basic info from auth
                const initialData = {
                    name: currentUser.displayName || "",
                    email: currentUser.email || "",
                    phone: currentUser.phoneNumber || "",
                    bio: "",
                    location: "",
                };
                
                // Fetch additional data from Firestore
                try {
                    const userDocRef = doc(db, "users", currentUser.uid);
                    const userDoc = await getDoc(userDocRef);
                    
                    if (userDoc.exists()) {
                        // Merge Firestore data with auth data
                        const firestoreData = userDoc.data();
                        setFormData({
                            ...initialData,
                            ...firestoreData,
                        });
                    } else {
                        // If no Firestore document exists yet, set initial data
                        setFormData(initialData);
                        
                        // Create initial user document in Firestore
                        await setDoc(userDocRef, initialData);
                    }
                } catch (error) {
                    console.error("Error fetching user data:", error);
                    setMessage({
                        text: "Error loading profile data. Please try again.",
                        type: "error"
                    });
                    setFormData(initialData);
                }
            } else {
                setUser(null);
                setFormData({
                    name: "",
                    email: "",
                    phone: "",
                    bio: "",
                    location: "",
                });
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
            setLoading(true);
            setMessage({ text: "", type: "" });
            
            if (user) {
                // Update displayName in Firebase Auth
                await updateProfile(user, {
                    displayName: formData.name,
                });
                
                // Update user data in Firestore
                const userDocRef = doc(db, "users", user.uid);
                await updateDoc(userDocRef, {
                    name: formData.name,
                    phone: formData.phone,
                    bio: formData.bio,
                    location: formData.location,
                });
                
                setMessage({
                    text: "Profile updated successfully!",
                    type: "success"
                });
            }
        } catch (error) {
            console.error("Error updating profile:", error);
            setMessage({
                text: "Error updating profile. Please try again.",
                type: "error"
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <section id="profile" className="mb-8">
            <h3 className="text-lg font-medium mb-4">Profile Information</h3>
            
            {message.text && (
                <div className={`p-3 mb-4 rounded ${message.type === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                    {message.text}
                </div>
            )}
            
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
                    disabled={loading}
                    className={`px-4 py-2 bg-[#00897B] text-white rounded hover:bg-[#006f5f] transition ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                    {loading ? 'Updating...' : 'Update Profile'}
                </button>
            </div>
        </section>
    );
};

export default ProfileSection;