"use client";

export const dynamic = 'force-dynamic';

export default function UpgradePage() {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { currentProject, projects } = useProject(); // ✅ Always works
    
    return (
        <div>
            <h1>Upgrade {currentProject?.name}</h1>
            <p>Current plan: {currentProject?.plan}</p>
            {/* Upgrade UI */}
        </div>
    );
}