"use client"; // Required for Next.js client component

import React from "react";

const ProfileSection = ({ formData = {}, onChange = () => { } }) => {
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
                        value={formData?.name || ""}
                        onChange={onChange}
                        className="w-full px-3 py-2 border bg-[#f2f2f2] rounded focus:outline-none focus:ring-[#00897B]"
                        required
                        disabled
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
                        value={formData?.email || ""}
                        onChange={onChange}
                        className="w-full px-3 py-2 border bg-[#f2f2f2] rounded focus:outline-none focus:ring-[#00897B]"
                        required
                        disabled
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
                        value={formData?.phone || ""}
                        onChange={onChange}
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
                        value={formData?.bio || ""}
                        onChange={onChange}
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
                        value={formData?.website || ""}
                        onChange={onChange}
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
                        value={formData?.location || ""}
                        onChange={onChange}
                        className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-[#00897B]"
                        placeholder="City, State"
                    />
                </div>
            </div>
        </section>
    );
};

export default ProfileSection;
