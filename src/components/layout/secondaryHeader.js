"use client";
import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { Filter, Calendar, ChevronDown, XCircle } from "lucide-react";

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

const SecondaryHeader = ({ title: propTitle }) => {
    const [openDropdown, setOpenDropdown] = useState(null);
    const [selectedPerson, setSelectedPerson] = useState(null);
    const [selectedStatus, setSelectedStatus] = useState(null);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    const toggleDropdown = (dropdown) => {
        setOpenDropdown(openDropdown === dropdown ? null : dropdown);
    };

    const clearFilters = () => {
        setSelectedPerson(null);
        setSelectedStatus(null);
        setStartDate("");
        setEndDate("");
    };

    const isFilterApplied = selectedPerson || selectedStatus || startDate || endDate;

    const pathname = usePathname();

    useEffect(() => {
        const fetchTeamMembers = async () => {
            const auth = getAuth();
            const db = getFirestore();
            const user = auth.currentUser;
            if (!user) return;
            
            try {
                const teamCollection = collection(db, "teamMembers");
                const teamSnapshot = await getDocs(teamCollection);
                const members = teamSnapshot.docs.map(doc => doc.data());
                
                setTeamMembers([{ firstName: user.displayName || "You", avatar: user.photoURL }, ...members]);
            } catch (error) {
                console.error("Error fetching team members:", error);
            }
        };

        fetchTeamMembers();
    }, []);

    const pageTitles = {
        "/bug-tracker": "Bug Tracker",
        "/test-scripts": "Test Cases",
        "/auto-scripts": "Automated Scripts",
        "/reports": "Reports",
        "/settings": "Settings",
        "/help": "Help"
    };

    const cleanedPath = pathname ? (pathname.endsWith("/") ? pathname.slice(0, -1) : pathname) : "";
    const pageTitle = pageTitles[cleanedPath] || propTitle || "Welcome";

    return (
        <div className="flex justify-between items-center bg-white p-3 shadow-md mb-9 sticky top-0 z-10">
            <h1 className="text-xl font-bold">{pageTitle}</h1>

            {/* Filters */}
            <div className="flex space-x-2 relative">
                {/* Date Filter */}
                <div className="relative">
                    <button className="bg-gray-200 px-4 py-2 rounded flex items-center hover:bg-gray-300 transition-colors" onClick={() => toggleDropdown("date")}>
                        <Calendar size={16} className="mr-2" />
                        <span className="w-auto text-center">
                            {startDate && endDate ? `${startDate} - ${endDate}` : "Date Filter"}
                        </span>
                        <ChevronDown size={16} className="ml-2" />
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
                        {selectedPerson ? (
                            <>
                                {selectedPerson.avatar ? (
                                    <Image src={selectedPerson.avatar} alt="Avatar" width={20} height={20} className="rounded-full mr-2" />
                                ) : (
                                    <div className="w-8 h-8 bg-gray-400 text-white flex items-center justify-center rounded-full mr-2">
                                        {selectedPerson.initials}
                                    </div>
                                )}
                                <span className="truncate w-20 text-center">{selectedPerson.firstName}</span>
                            </>
                        ) : (
                            <>
                                <div className="w-8 h-8 bg-gray-400 text-white flex items-center justify-center rounded-full mr-2">
                                    ?
                                </div>
                                <span className="truncate w-20 text-center">Person</span>
                            </>
                        )}
                        <ChevronDown size={16} className="ml-2" />
                    </button>
                    {openDropdown === "persons" && (
                        <div className="absolute right-0 mt-2 w-56 bg-white border shadow-lg rounded-lg z-50">
                            <ul className="p-2">
                                {teamMembers.map((person, index) => (
                                    <li key={index} onClick={() => { setSelectedPerson(person); setOpenDropdown(null); }} className="flex items-center p-2 border-b hover:bg-gray-100 cursor-pointer">
                                        {person.avatar ? (
                                            <Image src={person.avatar} alt="Avatar" width={24} height={24} className="rounded-full mr-2" />
                                        ) : (
                                            <div className="w-8 h-8 bg-gray-400 text-white flex items-center justify-center rounded-full mr-2">
                                                {person.initials}
                                            </div>
                                        )}
                                        {person.firstName}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            

                {/* Status Filter */}
                <div className="relative">
                    <button className={`bg-gray-200 px-4 py-2 rounded flex items-center hover:bg-gray-300 transition-colors ${selectedStatus ? statusColors[selectedStatus] : ''}`} onClick={() => toggleDropdown("status")}>
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

                {/* Clear Filters Button (Only Appears When Filter is Applied) */}
                {isFilterApplied && (
                    <button className="bg-gray-300 text-white px-2 py-2 rounded flex items-center hover:bg-gray-700 transition-colors" onClick={clearFilters}>
                        <XCircle size={16} />
                    </button>
                )}
            </div>
        </div>
    );
};

export default SecondaryHeader;
