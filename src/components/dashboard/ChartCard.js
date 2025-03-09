import React from 'react';
import "../../app/globals.css";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

const ChartCard = ({ title, description, children, className = "" }) => {
    return (
        <Card className={`shadow-sm rounded-lg border ${className}`}>
            <CardHeader className="p-4 pb-2">
                <CardTitle className="text-base font-semibold text-gray-800">{title}</CardTitle>
                {description && <CardDescription className="text-sm text-gray-600">{description}</CardDescription>}
            </CardHeader>
            <CardContent className="p-4 pt-0">
                {children}
            </CardContent>
        </Card>
    );
};

export default ChartCard;
