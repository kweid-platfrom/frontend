"use client"
import React, { useEffect, useState } from "react";
import { db } from "../config/firebase";
import { collection, query, orderBy, getDocs } from "firebase/firestore";

const BugTracking = () => {
    const [bugs, setBugs] = useState({});

    useEffect(() => {
        const fetchBugs = async () => {
            const q = query(collection(db, "bugs"), orderBy("timestamp", "desc"));
            const querySnapshot = await getDocs(q);
            const groupedBugs = {};

            querySnapshot.forEach((doc) => {
                const data = doc.data();
                const date = new Date(data.timestamp?.seconds * 1000);
                const monthYear = `Defects ${date.getFullYear()} - ${date.toLocaleString("default", { month: "long" })}`;

                if (!groupedBugs[monthYear]) groupedBugs[monthYear] = [];
                groupedBugs[monthYear].push({ id: doc.id, ...data });
            });

            setBugs(groupedBugs);
        };

        fetchBugs();
    }, []);

    return (
        <div className="p-4">
            <h2 className="text-xl font-semibold mb-4">Bug Tracking</h2>
            {Object.keys(bugs).length === 0 ? (
                <p className="text-gray-500">No bugs reported yet.</p>
            ) : (
                Object.keys(bugs).map((monthYear) => (
                    <div key={monthYear} className="mb-6">
                        <h3 className="text-lg font-semibold text-gray-700 border-b pb-1 mb-2">{monthYear}</h3>
                        <ul className="space-y-2">
                            {bugs[monthYear].map((bug) => (
                                <li key={bug.id} className="p-3 bg-gray-100 rounded-md shadow-sm">
                                    <p className="font-medium">{bug.title}</p>
                                    <p className="text-sm text-gray-600">Priority: {bug.priority}</p>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))
            )}
        </div>
    );
};

export default BugTracking;
