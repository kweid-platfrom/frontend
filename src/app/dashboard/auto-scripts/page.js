// app/dashboard/settings/page.js
'use client'
import DashboardLayout from '../../../components/layout/DashboardLayout';
import AutoScriptsPage from '../../../pages/dashboard/AutoScriptsPage';

export default function AutoScriptsPage() {
    return (
        <DashboardLayout activePage="settings">
            <AutoScriptsPage />
        </DashboardLayout>
    );
}