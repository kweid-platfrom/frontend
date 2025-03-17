"use client";

import { useEffect, useState } from "react";
import { auth } from "../../firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import ProfileSection from "../../components/ProfileSection";
import { useRouter } from "next/navigation";

const ProfileSection = () => {
    const [user, setUser] = useState(null);
    const router = useRouter();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (!currentUser) {
                router.push("/login"); // Redirect to login if not authenticated
            } else {
                setUser(currentUser);
            }
        });

        return () => unsubscribe();
    }, [router]);

    if (!user) {
        return <p>Loading...</p>;
    }

    return <ProfileSection />;
};

export default ProfileSection;
