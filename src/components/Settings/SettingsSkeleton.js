
export default function SettingsSkeleton() {
    // Common skeleton section
    const SkeletonSection = () => (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 animate-pulse">
            <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-6"></div>

            <div className="space-y-6">
                <div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-2"></div>
                    <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                </div>

                <div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-2"></div>
                    <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                </div>

                <div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-2"></div>
                    <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                </div>

                <div className="flex justify-end">
                    <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                </div>
            </div>
        </div>
    );

    // Create sidebar menu items
    const SidebarItem = () => (
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-md mb-2 w-full"></div>
    );

    return (
        <div className="container mx-auto px-4 py-8 max-w-6xl">
            <div className="h-9 bg-gray-200 dark:bg-gray-700 rounded w-1/6 mb-8"></div>

            <div className="flex flex-col md:flex-row gap-8">
                {/* Sidebar skeleton */}
                <div className="w-full md:w-64 shrink-0">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
                        <div className="space-y-2">
                            <SidebarItem />
                            <SidebarItem />
                            <SidebarItem />
                            <SidebarItem />
                            <SidebarItem />
                            <SidebarItem />
                            <SidebarItem />
                        </div>
                    </div>
                </div>

                {/* Main content skeleton */}
                <div className="flex-1">
                    <div className="space-y-8">
                        <SkeletonSection />
                    </div>
                </div>
            </div>
        </div>
    );
}