"use client";

import dynamic from "next/dynamic";

const Checkout = dynamic(() => import("../../components/PricingPage"), { ssr: false });

export default Checkout;