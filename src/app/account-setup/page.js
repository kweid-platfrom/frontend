"use client";

import dynamic from "next/dynamic";

const AccountSetup = dynamic(() => import("../../components/auth/AccountSetup"), { ssr: false });

export default AccountSetup;