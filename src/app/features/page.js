"use client";

import dynamic from "next/dynamic";

const Checkout = dynamic(() => import("../../components/FeaturesPage"), { ssr: false });

export default Checkout;