"use client";

import dynamic from "next/dynamic";

const Features = dynamic(() => import("../../components/FeaturesPage"), { ssr: false });

export default Features;