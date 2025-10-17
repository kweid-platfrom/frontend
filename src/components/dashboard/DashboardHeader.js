import * as React from "react";
import { RefreshCw } from 'lucide-react';
import { cn } from "@/lib/utils";

// Updated Morphing Spinner to use white with opacity for visibility on colored bg
const MorphingLoadingSpinner = () => {
  return (
    <div className="w-5 h-5 sm:w-6 sm:h-6 relative">
      <div className="absolute inset-0 rounded-full border-2 border-white/20"></div>
      <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-white animate-spin"></div>
    </div>
  );
};

export const DashboardHeader = ({ activeSuite, loading, onRefresh }) => {
    const [localLoading, setLocalLoading] = React.useState(false);

    const handleRefresh = async () => {
        setLocalLoading(true);
        try {
            await onRefresh?.();
        } finally {
            setLocalLoading(false);
        }
    };

    const isLoading = loading || localLoading;

    // Function to get mobile title (removes "Dashboard" suffix on mobile)
    const getMobileTitle = (title) => {
        if (!title) return 'Dashboard';
        return title.replace(/\s+Dashboard$/i, '').trim() || title;
    };

    const fullTitle = activeSuite ? `${activeSuite.name} Dashboard` : 'Dashboard';
    const mobileTitle = activeSuite ? getMobileTitle(activeSuite.name) : 'Dashboard';

    return (
        <div className="flex items-center justify-between mb-6 gap-2">
            <div className="min-w-0 flex-1">
                <h1 className="text-2xl sm:text-2xl font-bold text-foreground truncate">
                    <span className="hidden sm:inline">{fullTitle}</span>
                    <span className="inline sm:hidden">{mobileTitle}</span>
                </h1>
            </div>
            <button
                onClick={handleRefresh}
                disabled={isLoading}
                className={cn(
                    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded text-sm font-medium transition-all duration-300 ease-in-out disabled:pointer-events-none disabled:opacity-50 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] border border-border bg-background shadow-sm hover:bg-accent hover:text-accent-foreground active:bg-accent/90 dark:bg-input/10 dark:border-input dark:hover:bg-input/30 flex-shrink-0",
                    "h-8 px-3 text-xs has-[>svg]:px-2.5", // sm size
                    isLoading && "w-10 h-10 rounded-full p-0 bg-primary text-primary-foreground hover:bg-primary/90 shadow-md"
                )}
                aria-label="Refresh dashboard"
            >
                {isLoading ? (
                    <MorphingLoadingSpinner />
                ) : (
                    <>
                        <RefreshCw className="w-4 h-4" />
                        <span>Refresh</span>
                    </>
                )}
            </button>
        </div>
    );
};