"use client"
import React from "react";  
import { BarChart2, Bug, Code, Activity } from "lucide-react";  
import { useRouter } from 'next/navigation'; // Import useRouter  

const metricRoutes = {  
    "Tests Passed": "/tests-passed",  
    "Code Coverage": "/code-coverage",  
    "Open Bugs": "/open-bugs",  
    "Total Test Cases": "/total-test-cases",  
};  

export const KeyMetrics = () => {  
    const metrics = [  
        { title: "Tests Passed", value: "87%", change: "+2%", status: "positive", icon: BarChart2 },  
        { title: "Code Coverage", value: "73%", change: "+5%", status: "positive", icon: Code },  
        { title: "Open Bugs", value: "24", change: "-3 from last week", status: "positive", icon: Bug },  
        { title: "Total Test Cases", value: "437", change: "+12% from last month", status: "positive", icon: Activity },  
    ];  

    const router = useRouter(); // Initialize useRouter  

    const handleClick = (route) => {  
        router.push(route); // Use router.push to navigate  
    };  


    return (  
        <>  
            {metrics.map((metric, index) => {  
                const route = metricRoutes[metric.title] || "/"; // Default route if not found  
                return (  
                    <div  
                        key={index}  
                        className="bg-white rounded-xs shadow p-6 flex items-center justify-between relative hover:shadow-md transition-shadow duration-200 cursor-pointer" // Added cursor-pointer  
                        onClick={() => handleClick(route)} // Call handleClick on click  
                    >  
                        <div>  
                            <div className="text-sm text-gray-500 font-medium">{metric.title}</div>  
                            <div className="flex items-baseline mt-2">  
                                <div className="text-3xl font-bold">{metric.value}</div>  
                                <div className={`ml-2 text-sm ${metric.status === "positive" ? "text-green-600" : "text-red-600"}`}>  
                                    {metric.change}  
                                </div>  
                            </div>  
                        </div>  

                        {/* Icon Container */}  
                        <div className="absolute top-2 right-2">  
                            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center shadow-sm"> {/* Green ellipse with padding */}  
                                <metric.icon className="w-6 h-6 text-green-600" /> {/* Icon color to match the ellipse */}  
                            </div>  
                        </div>  
                    </div>  
                );  
            })}  
        </>  
    );  
};  