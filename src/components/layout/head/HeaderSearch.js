import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

const HeaderSearch = ({ disabled = false }) => {
    return (
        <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-4 w-4 text-muted-foreground" />
            </div>
            <input
                type="text"
                className={`block w-full pl-10 pr-3 py-2 rounded-md border border-border text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background ${
                    disabled ? 'cursor-not-allowed opacity-50' : ''
                }`}
                placeholder="Search test cases, bugs, reports..."
                disabled={disabled}
            />
        </div>
    );
};

export default HeaderSearch;