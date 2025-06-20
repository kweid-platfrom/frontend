// components/UserManagement/UserStats.jsx
import React from 'react';
import { Users, UserCheck, Mail, Crown } from 'lucide-react';

const UserStats = ({ users = [] }) => {
    const stats = [
        {
            name: 'Total Users',
            value: users.length,
            icon: Users,
            color: 'text-teal-600',
            bgColor: 'bg-teal-50',
            borderColor: 'border-teal-200'
        },
        {
            name: 'Active Users',
            value: users.filter(u => u.status === 'active').length,
            icon: UserCheck,
            color: 'text-green-600',
            bgColor: 'bg-green-50',
            borderColor: 'border-green-200'
        },
        {
            name: 'Pending Invites',
            value: users.filter(u => u.status === 'pending').length,
            icon: Mail,
            color: 'text-yellow-600',
            bgColor: 'bg-yellow-50',
            borderColor: 'border-yellow-200'
        },
        {
            name: 'Admins',
            value: users.filter(u => u.role === 'admin').length,
            icon: Crown,
            color: 'text-purple-600',
            bgColor: 'bg-purple-50',
            borderColor: 'border-purple-200'
        }
    ];

    return (
        <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat) => {
                const Icon = stat.icon;
                return (
                    <div
                        key={stat.name}
                        className={`bg-white rounded-lg border ${stat.borderColor} p-4 shadow-sm hover:shadow-md transition-shadow`}
                    >
                        <div className="flex items-center">
                            <div className={`${stat.bgColor} p-2 rounded-lg`}>
                                <Icon className={`w-6 h-6 ${stat.color}`} />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-500">{stat.name}</p>
                                <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default UserStats;