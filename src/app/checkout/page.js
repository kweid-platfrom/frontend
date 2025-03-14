"use client";

import dynamic from "next/dynamic";

const Checkout = dynamic(() => import("../../components/CheckoutPage"), { ssr: false });

export default Checkout;
