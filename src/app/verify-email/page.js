'use client'
import React from "react";
import { Suspense } from 'react';
import EmailVerification from "../../components/auth/EmailVerification";

export default function EmailVerificationPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <EmailVerification />
        </Suspense>
    );
}
