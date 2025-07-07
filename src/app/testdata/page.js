// app/testdata/page.js
import React from 'react';
import PageLayout from '@/components/layout/PageLayout';

export default function TestDataPage() {
    return (
        <PageLayout title="Test Data">
            <h1 className="text-xl font-bold">Test Data</h1>
        </PageLayout>
    );
}