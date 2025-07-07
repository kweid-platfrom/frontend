'use client';

import DashboardLayout from '../../components/layout/AppWrapper';
import Dashboard from '../../components/pages/Dashboard';
import ProtectedRoute from '../../components/auth/protectedRoute';

export default function DashboardPage() {
    return (
        <ProtectedRoute requireEmailVerified>
            <DashboardLayout>
                <Dashboard />
            </DashboardLayout>
        </ProtectedRoute>
    );
}
