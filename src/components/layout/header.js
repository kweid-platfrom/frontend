import React from 'react';
import { Button } from '@/components/ui/button';
import "../../app/globals.css"
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    PlusCircle,
    Search,
    FileText,
    Users,
    Bell,
    Video,
    ChevronDown,
    Clock,
    Bug,
    Activity
} from 'lucide-react';

const Header = ({ searchExpanded, setSearchExpanded }) => {
    return (
        <div className="bg-white border-b p-4 flex justify-between items-center sticky top-0 z-10">
            <div className="flex items-center">
                <h1 className="text-xl font-bold">Dashboard</h1>
                <p className="text-gray-500 text-sm ml-4">Quality Assurance & Testing Management</p>
            </div>
            <div className="flex items-center space-x-3">
                {/* Search */}
                <div className={`flex items-center border rounded-md ${searchExpanded ? 'w-64' : 'w-10'} transition-all duration-300`}>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="p-1 h-8"
                        onClick={() => setSearchExpanded(!searchExpanded)}
                    >
                        <Search size={16} />
                    </Button>
                    {searchExpanded && (
                        <Input
                            placeholder="Search..."
                            className="border-0 focus-visible:ring-0 h-8 text-sm"
                            autoFocus
                        />
                    )}
                </div>

                {/* Add New Button */}
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700 flex items-center gap-1">
                    <PlusCircle size={15} /> Add New
                </Button>

                {/* Generate Report Dropdown */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="flex items-center gap-1">
                            <FileText size={15} /> Generate Report <ChevronDown size={14} />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem className="flex items-center gap-2">
                            <Bug size={14} /> Bug Report
                        </DropdownMenuItem>
                        <DropdownMenuItem className="flex items-center gap-2">
                            <Activity size={14} /> Defects Summary
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* Schedule Report Button */}
                <Button variant="outline" size="sm" className="flex items-center gap-1">
                    <Clock size={15} /> Schedule Report
                </Button>

                {/* Record Screen Button */}
                <Button variant="outline" size="sm" className="flex items-center gap-1">
                    <Video size={15} /> Record Screen
                </Button>

                {/* Add User Button */}
                <Button variant="outline" size="sm" className="flex items-center gap-1">
                    <Users size={15} /> Add User
                </Button>

                {/* Notification Icon */}
                <Button variant="ghost" size="sm" className="relative p-1 h-8 w-8">
                    <Bell size={18} />
                    <div className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></div>
                </Button>

                {/* User Avatar */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Avatar className="h-8 w-8 cursor-pointer">
                            <AvatarImage src="/api/placeholder/40/40" alt="User" />
                            <AvatarFallback>JD</AvatarFallback>
                        </Avatar>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>My Account</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>Profile</DropdownMenuItem>
                        <DropdownMenuItem>Settings</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>Logout</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
};

export default Header;