"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import React from "react";

const CheckoutPage = () => {
    const searchParams = useSearchParams();

    const planName = searchParams.get("planName");
    const planPrice = searchParams.get("planPrice");
    const billingCycle = searchParams.get("billingCycle");

    return (
        <div className="container mx-auto py-8">
            <h1 className="text-2xl font-bold mb-4">Checkout</h1>

            {/* Display Plan Details */}
            {planName && (
                <div className="mb-6 p-4 border rounded-md">
                    <h2 className="text-lg font-semibold">You are subscribing to:</h2>
                    <p>Plan: {planName}</p>
                    <p>Price: {planPrice} / {billingCycle === "monthly" ? "month" : "year"}</p>
                </div>
            )}

            {/* Checkout Form */}
            <form className="max-w-md">
                <div className="mb-4">
                    <label htmlFor="name" className="block text-gray-700 text-sm font-bold mb-2">
                        Name:
                    </label>
                    <input
                        type="text"
                        id="name"
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        placeholder="Your Name"
                    />
                </div>
                <div className="mb-4">
                    <label htmlFor="email" className="block text-gray-700 text-sm font-bold mb-2">
                        Email:
                    </label>
                    <input
                        type="email"
                        id="email"
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        placeholder="Your Email"
                    />
                </div>
                <div className="mb-4">
                    <label htmlFor="cardNumber" className="block text-gray-700 text-sm font-bold mb-2">
                        Card Number:
                    </label>
                    <input
                        type="text"
                        id="cardNumber"
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        placeholder="**** **** **** ****"
                    />
                </div>
                <div className="mb-4">
                    <label htmlFor="expiryDate" className="block text-gray-700 text-sm font-bold mb-2">
                        Expiry Date:
                    </label>
                    <input
                        type="text"
                        id="expiryDate"
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        placeholder="MM/YY"
                    />
                </div>
                <div className="mb-4">
                    <label htmlFor="cvv" className="block text-gray-700 text-sm font-bold mb-2">
                        CVV:
                    </label>
                    <input
                        type="text"
                        id="cvv"
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        placeholder="CVV"
                    />
                </div>
                <button
                    type="submit"
                    className="bg-[#00897B] hover:bg-[#00695C] text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                >
                    Complete Purchase
                </button>
            </form>

            {/* Back Button */}
            <Link href="/pricing" className="inline-block mt-4 text-[#00897B] hover:underline">
                &larr; Back to Pricing
            </Link>
        </div>
    );
};

export default CheckoutPage;
