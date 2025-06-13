// app/dashboard/page.js - Main Dashboard Page
'use client'
import DashboardLayout from '../../components/layout/DashboardLayout';
import Dashboard from '../../components/pages/Dashboard';

export default function DashboardPage() {
    return (
        <DashboardLayout>
            <Dashboard />
        </DashboardLayout>
    );
}