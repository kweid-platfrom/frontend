"use client";
import { useState } from "react";
import { useAuth } from "../../context/AuthProvider";
import { LogOut, Loader2 } from "lucide-react";

const SignOutButton = ({ className, variant = "icon" }) => {
    const [loading, setLoading] = useState(false);
    const { signOut } = useAuth();

    const handleSignOut = async () => {
        setLoading(true);
        try {
            await signOut();
            // No need to redirect here as the auth provider handles it
        } catch (error) {
            console.error("Error signing out:", error);
        } finally {
            setLoading(false);
        }
    };

    // Icon-only variant (for sidebar)
    if (variant === "icon") {
        return (
            <button
                onClick={handleSignOut}
                disabled={loading}
                className={`ml-auto text-[#2D3142] hover:text-white ${className}`}
                aria-label="Sign out"
            >
                {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                    <LogOut className="h-5 w-5" />
                )}
            </button>
        );
    }

    // Text variant (for dropdown menu)
    if (variant === "text") {
        return (
            <button
                onClick={handleSignOut}
                disabled={loading}
                className={`flex items-center gap-2 w-full px-2 py-1.5 text-sm text-left text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800 ${className}`}
            >
                {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                    <LogOut className="h-4 w-4" />
                )}
                Sign out
            </button>
        );
    }

    // Full variant (icon + text)
    return (
        <button
            onClick={handleSignOut}
            disabled={loading}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 transition-colors rounded hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800 ${className}`}
        >
            {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
                <LogOut className="h-4 w-4" />
            )}
            Sign out
        </button>
    );
};

export default SignOutButton;