import React from 'react';
import "../../app/globals.css"
import { Card, CardContent } from '@/components/ui/card';

const MetricCard = ({ title, value, change, icon, iconColor, iconBgColor }) => {
    const isPositive = change.startsWith('+');
    const color = title === 'Open Defects' ?
        (isPositive ? 'text-red-500' : 'text-green-500') :
        (isPositive ? 'text-green-500' : 'text-red-500');

    return (
        <Card className="shadow-sm">
            <CardContent className="p-4">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-xs text-gray-500">{title}</p>
                        <h3 className="text-xl font-bold">{value}</h3>
                        <p className={`text-xs ${color}`}>{change}</p>
                    </div>
                    <div className={`${iconBgColor} p-1.5 rounded-full`}>
                        {React.cloneElement(icon, { className: iconColor, size: 16 })}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default MetricCard;