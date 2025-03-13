"use client";
import React, { useState } from "react";
import Image from "next/image";
import { Filter, Users, Calendar, ChevronDown, X } from "lucide-react";

const statusColors = {
    "To Do": "text-gray-600",
    "Invalidated": "text-red-500",
    "Done": "text-green-500",
    "In Progress": "text-blue-500",
    "Reopened": "text-orange-500"
};

const teamMembers = [
    { firstName: "John", avatar: "https://i.pravatar.cc/40?img=1" },
    { firstName: "Jane", avatar: "https://i.pravatar.cc/40?img=2" },
    { firstName: "Alice", avatar: "https://i.pravatar.cc/40?img=3" },
    { firstName: "Bob", avatar: "https://i.pravatar.cc/40?img=4" },
    { firstName: "Carla", avatar: "https://i.pravatar.cc/40?img=5" }
];

const statuses = ["To Do", "Invalidated", "Done", "In Progress", "Reopened"];

const SecondaryHeader = ({ title }) => {
    const [openDropdown, setOpenDropdown] = useState(null);
    const [selectedPerson, setSelectedPerson] = useState(null);
    const [selectedStatus, setSelectedStatus] = useState(null);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    const toggleDropdown = (dropdown) => {
        setOpenDropdown(openDropdown === dropdown ? null : dropdown);
    };

    return (
        <div className="flex justify-between items-center bg-white p-3 shadow-md mb-9 sticky top-0 z-10">
            <div className="flex flex-col">
                <h1 className="text-xl font-bold">{title}</h1>

                {/* Selected Filters - Now Appended Properly */}
                <div className="flex space-x-3 mt-1 items-center">
                    {startDate && endDate && (
                        <div className="flex items-center bg-gray-100 px-3 py-1 rounded">
                            <Calendar size={14} className="mr-1" />
                            {startDate} - {endDate}
                            <X size={14} className="ml-2 cursor-pointer text-gray-600 hover:text-gray-900" onClick={() => {
                                setStartDate("");
                                setEndDate("");
                            }} />
                        </div>
                    )}
                    {selectedPerson && (
                        <div className="flex items-center bg-gray-100 px-3 py-1 rounded">
                            <Image src={selectedPerson.avatar} alt="Avatar" width={20} height={20} className="rounded-full mr-2" />
                            {selectedPerson.firstName}
                            <X size={14} className="ml-2 cursor-pointer text-gray-600 hover:text-gray-900" onClick={() => setSelectedPerson(null)} />
                        </div>
                    )}
                    {selectedStatus && (
                        <div className={`flex items-center bg-gray-100 px-3 py-1 rounded ${statusColors[selectedStatus]}`}>
                            {selectedStatus}
                            <X size={14} className="ml-2 cursor-pointer hover:text-gray-900" onClick={() => setSelectedStatus(null)} />
                        </div>
                    )}
                </div>
            </div>

            {/* Filters */}
            <div className="flex space-x-2 relative">
                {/* Date Filter - Moved to First */}
                <div className="relative">
                    <button className="bg-gray-200 px-4 py-2 rounded flex items-center hover:bg-gray-300 transition-colors" onClick={() => toggleDropdown("date")}> 
                        <Calendar size={16} className="mr-2" /> Date Filter
                    </button>
                    {openDropdown === "date" && (
                        <div className="absolute right-0 mt-2 w-64 bg-white border shadow-lg rounded-lg p-3 z-50">
                            <label className="block text-sm font-medium">From:</label>
                            <input type="date" className="w-full p-2 border rounded mb-2" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                            <label className="block text-sm font-medium">To:</label>
                            <input type="date" className="w-full p-2 border rounded" value={endDate} onChange={(e) => { setEndDate(e.target.value); setOpenDropdown(null); }} />
                        </div>
                    )}
                </div>

                {/* Person Filter */}
                <div className="relative">
                    <button className="bg-gray-200 px-4 py-2 rounded flex items-center hover:bg-gray-300 transition-colors" onClick={() => toggleDropdown("persons")}> 
                        <Users size={16} className="mr-2" /> Filter Persons
                    </button>
                    {openDropdown === "persons" && (
                        <div className="absolute right-0 mt-2 w-56 bg-white border shadow-lg rounded-lg z-50">
                            <ul className="p-2">
                                {teamMembers.map((person) => (
                                    <li key={person.firstName} onClick={() => { setSelectedPerson(person); setOpenDropdown(null); }} className="flex items-center p-2 border-b hover:bg-gray-100 cursor-pointer">
                                        <Image src={person.avatar} alt="Avatar" width={24} height={24} className="rounded-full mr-2" />
                                        {person.firstName}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                {/* Status Filter */}
                <div className="relative">
                    <button className="bg-gray-200 px-4 py-2 rounded flex items-center hover:bg-gray-300 transition-colors" onClick={() => toggleDropdown("status")}> 
                        <Filter size={16} className="mr-2" />
                        <span className="truncate w-20 text-center">{selectedStatus || "Status"}</span>
                        <ChevronDown size={16} className="ml-2" />
                    </button>
                    {openDropdown === "status" && (
                        <div className="absolute right-0 mt-2 w-44 bg-white border shadow-lg rounded-lg z-50">
                            <ul className="p-2">
                                {statuses.map((status) => (
                                    <li key={status} onClick={() => { setSelectedStatus(status); setOpenDropdown(null); }} className="p-2 border-b hover:bg-gray-100 cursor-pointer">
                                        {status}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SecondaryHeader;
