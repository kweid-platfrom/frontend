'use client'
import React from "react";
import { Suspense } from 'react';
import VerifyEmail from "../../components/auth/reg/VerifyEmail";    

export default function VerifyEmailPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <VerifyEmail />
        </Suspense>
    );
}
