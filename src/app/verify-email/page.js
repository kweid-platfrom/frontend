'use client'
import React from "react";
import { Suspense } from 'react';
import EmailVerificationSuccess from "../../components/auth/EmailVerificationSuccess";

export default function EmailVerificationPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <EmailVerificationSuccess />
        </Suspense>
    );
}
