// app/dashboard/page.js
'use client';
import DashboardLayout from '../../components/layout/DashboardLayout';

export default function DashboardPage() {
    return (
        <DashboardLayout>
            <h1 className="text-xl font-semibold">Welcome to your project dashboard</h1>
            {/* other dashboard widgets/components */}
        </DashboardLayout>
    );
}