'use client';

import BugTracePage from '@/components/pages/BugTracePage'; // adjust path as needed
import { useBugs } from '@/hooks/useBugs';

export default function BugTracePageWrapper() {
    const { bugs, testCases, relationships } = useBugs();
    
    return (
        <BugTracePage 
            bugs={bugs || []} 
            testCases={testCases || []} 
            relationships={relationships || { bugToTestCases: {} }} 
        />
    );
}