"use client";

import dynamic from "next/dynamic";

const DocsPage = dynamic(() => import("../../components/DocsPage"), { ssr: false });

export default DocsPage;