"use client";

import dynamic from "next/dynamic";

const UserProfile = dynamic(() => import("../../components/Settings/UserProfile"), { ssr: false });

export default UserProfile;