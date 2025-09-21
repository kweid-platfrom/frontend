import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

const HeaderSearch = ({ disabled = false }) => {
    return (
        <>
            {/* Mobile Layout (xs) - Icon only */}
            <div className="relative flex-1 max-w-[120px] sm:hidden">
                <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                    <MagnifyingGlassIcon className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <input
                    type="text"
                    className={`block w-full pl-8 pr-2 py-1.5 h-8 rounded border border-border text-xs text-foreground placeholder-muted-foreground/70 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary bg-background ${
                        disabled ? 'cursor-not-allowed opacity-50' : ''
                    }`}
                    placeholder="Search..."
                    disabled={disabled}
                />
            </div>

            {/* Small Tablet Layout (sm to md) */}
            <div className="hidden sm:block md:hidden relative flex-1 max-w-[200px]">
                <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                    <MagnifyingGlassIcon className="h-4 w-4 text-muted-foreground" />
                </div>
                <input
                    type="text"
                    className={`block w-full pl-9 pr-3 py-2 h-8 rounded border border-border text-sm text-foreground placeholder-muted-foreground/80 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary bg-background ${
                        disabled ? 'cursor-not-allowed opacity-50' : ''
                    }`}
                    placeholder="Search tests..."
                    disabled={disabled}
                />
            </div>

            {/* Medium Tablet Layout (md to lg) */}
            <div className="hidden md:block lg:hidden relative flex-1 max-w-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MagnifyingGlassIcon className="h-4 w-4 text-muted-foreground" />
                </div>
                <input
                    type="text"
                    className={`block w-full pl-10 pr-3 py-2 h-9 rounded-md border border-border text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background ${
                        disabled ? 'cursor-not-allowed opacity-50' : ''
                    }`}
                    placeholder="Search test cases, bugs..."
                    disabled={disabled}
                />
            </div>

            {/* Desktop Layout (lg+) */}
            <div className="hidden lg:block relative flex-1 max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MagnifyingGlassIcon className="h-4 w-4 text-muted-foreground" />
                </div>
                <input
                    type="text"
                    className={`block w-full pl-10 pr-3 py-2 h-10 rounded-md border border-border text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background ${
                        disabled ? 'cursor-not-allowed opacity-50' : ''
                    }`}
                    placeholder="Search test cases, bugs, reports..."
                    disabled={disabled}
                />
            </div>
        </>
    );
};

export default HeaderSearch;