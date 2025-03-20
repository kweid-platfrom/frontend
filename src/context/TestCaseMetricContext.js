// context/TestCaseMetricsContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from "../config/firebase";
import { doc, setDoc, onSnapshot } from "firebase/firestore";

// Create the context
const TestCaseMetricsContext = createContext();

// Define the provider component
export const TestCaseMetricsProvider = ({ children }) => {
    const [metricsLastUpdated, setMetricsLastUpdated] = useState(null);
    const [isMetricsUpdating, setIsMetricsUpdating] = useState(false);
    const [updateStatus, setUpdateStatus] = useState(null);

    // Listen for changes to a special document that tracks when metrics were last updated
    useEffect(() => {
        const metricsTrackerRef = doc(db, "system", "metricsTracker");

        const unsubscribe = onSnapshot(metricsTrackerRef, (doc) => {
            if (doc.exists()) {
                const data = doc.data();
                setMetricsLastUpdated(data.lastUpdated?.toDate() || null);
            }
        }, (error) => {
            console.error("Error listening to metrics tracker:", error);
        });

        return () => unsubscribe();
    }, []);

    // Function to notify that metrics have been updated
    const notifyMetricsUpdated = async () => {
        try {
            const metricsTrackerRef = doc(db, "system", "metricsTracker");
            await setDoc(metricsTrackerRef, {
                lastUpdated: new Date()
            }, { merge: true });
            return true;
        } catch (error) {
            console.error("Error updating metrics tracker:", error);
            return false;
        }
    };

    // Provide the context value
    const contextValue = {
        metricsLastUpdated,
        isMetricsUpdating,
        updateStatus,
        notifyMetricsUpdated,
        setIsMetricsUpdating,
        setUpdateStatus
    };

    return (
        <TestCaseMetricsContext.Provider value={contextValue}>
            {children}
        </TestCaseMetricsContext.Provider>
    );
};

// Custom hook to use the context
export const useTestCaseMetricsContext = () => {
    const context = useContext(TestCaseMetricsContext);
    if (!context) {
        throw new Error('useTestCaseMetricsContext must be used within a TestCaseMetricsProvider');
    }
    return context;
};